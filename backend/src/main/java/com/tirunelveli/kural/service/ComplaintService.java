package com.tirunelveli.kural.service;

import com.tirunelveli.kural.domain.AppUser;
import com.tirunelveli.kural.domain.Complaint;
import com.tirunelveli.kural.domain.ComplaintEvidence;
import com.tirunelveli.kural.domain.ComplaintUpdate;
import com.tirunelveli.kural.domain.Department;
import com.tirunelveli.kural.domain.EvidenceCheck;
import com.tirunelveli.kural.dto.Dtos;
import com.tirunelveli.kural.repository.ComplaintRepository;
import com.tirunelveli.kural.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class ComplaintService {

    public static final Set<String> STATUSES =
            Set.of("submitted", "under_review", "in_progress", "resolved", "rejected");

    private static final DateTimeFormatter REFERENCE_MONTH =
            DateTimeFormatter.ofPattern("yyyyMM").withZone(ZoneOffset.UTC);

    public static final long MAX_UPLOAD_BYTES = 30L * 1024 * 1024;

    /** Bytes + MIME of a stored evidence file, read inside a transaction so lazy rows load. */
    public record EvidenceFile(byte[] data, String mimeType) {
    }

    private final ComplaintRepository complaints;

    public ComplaintService(ComplaintRepository complaints) {
        this.complaints = complaints;
    }

    @Transactional
    public Complaint file(AppUser citizen, String departmentId, String description, String area,
                         String landmark, Double reportingLatitude, Double reportingLongitude,
                         MultipartFile upload, Boolean aiCategoryMatch, Double aiCategoryConfidence,
                         String aiDetectedLabel) {

        Department department = Department.byId(departmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Pick one of the seven categories."));
        if (description == null || description.trim().length() < 15) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Describe the issue in at least 15 characters.");
        }
        if (area == null || area.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Enter the area or ward.");
        }
        if ((reportingLatitude == null) != (reportingLongitude == null)
                || (reportingLatitude != null && (reportingLatitude < -90 || reportingLatitude > 90
                || reportingLongitude < -180 || reportingLongitude > 180))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The detected reporting location is invalid.");
        }
        if (upload == null || upload.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Attach a photo or video as evidence.");
        }
        if (upload.getSize() > MAX_UPLOAD_BYTES) {
            throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, String.format(Locale.ROOT,
                    "Evidence must be under 30 MB. This file is %.1f MB.", upload.getSize() / 1048576.0));
        }

        byte[] data;
        try {
            data = upload.getBytes();
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The upload could not be read. Try again.");
        }

        String mime = upload.getContentType() == null ? "" : upload.getContentType().toLowerCase(Locale.ROOT);
        boolean isVideo = mime.startsWith("video/");
        if (!isVideo && !mime.startsWith("image/")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Capture a photo or video with the camera.");
        }
        if (Boolean.FALSE.equals(aiCategoryMatch)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The captured " + (isVideo ? "video" : "photo")
                    + " does not show a " + department.getDisplayName() + " issue. Capture the problem clearly.");
        }
        int confidence = aiCategoryConfidence == null ? 0
                : (int) Math.round(Math.max(0, Math.min(1, aiCategoryConfidence)) * 100);
        EvidenceCheck categoryCheck = aiCategoryMatch == null
                ? new EvidenceCheck("Category match", "warn",
                        "AI category check could not run on this device. Please confirm visually.")
                : new EvidenceCheck("Category match", "pass",
                        "AI confirmed the " + (isVideo ? "video" : "photo") + " shows " + department.getDisplayName()
                        + " (" + confidence + "% confidence"
                        + (aiDetectedLabel == null || aiDetectedLabel.isBlank() ? "" : ", detected: "
                        + aiDetectedLabel.substring(0, Math.min(120, aiDetectedLabel.length()))) + ").");

        Instant now = Instant.now();
        // Rejected complaints are purged weekly, so the row count can shrink: skip any reference in use.
        long sequence = complaints.count() + 1;
        String reference;
        do {
            reference = "TVK-" + REFERENCE_MONTH.format(now) + "-" + String.format(Locale.ROOT, "%05d", sequence++);
        } while (complaints.findByReference(reference).isPresent());

        String status = "submitted";
        String verificationStatus = "needs_review";
        String verificationNote = "Captured evidence was checked by AI for the selected category. The officer decides the outcome.";
        String firstMessage = "Complaint registered and routed to " + department.getDisplayName()
                + ".";

        Complaint complaint = new Complaint();
        complaint.setId(UUID.randomUUID().toString());
        complaint.setReference(reference);
        complaint.setCitizenId(citizen.getId());
        complaint.setCitizenLoginId(citizen.getLoginId());
        complaint.setCitizenName(citizen.getDisplayName());
        complaint.setDepartmentId(department.getId());
        complaint.setCategory(department.getDisplayName());
        complaint.setDescription(description.trim());
        complaint.setArea(area.trim());
        complaint.setLandmark(landmark == null || landmark.isBlank() ? null : landmark.trim());
        complaint.setReportingLatitude(reportingLatitude);
        complaint.setReportingLongitude(reportingLongitude);
        complaint.setStatus(status);
        complaint.setPriority(
                Set.of("water_supply", "sewerage_drainage").contains(department.getId()) ? "high" : "medium");
        complaint.setVerificationStatus(verificationStatus);
        complaint.setVerificationNote(verificationNote);
        complaint.setRejectionReason(null);
        complaint.setCreatedAt(now);
        complaint.setUpdatedAt(now);

        ComplaintEvidence evidence = new ComplaintEvidence();
        evidence.setKind(isVideo ? "video" : "photo");
        evidence.setFilename(upload.getOriginalFilename() == null ? "capture" : upload.getOriginalFilename());
        evidence.setMimeType(mime.isBlank() ? "application/octet-stream" : mime);
        evidence.setSizeBytes(data.length);
        evidence.setHasGeotag(false);
        evidence.setAuthenticityScore(confidence);
        evidence.setAuthenticityVerdict(aiCategoryMatch == null ? "unchecked" : "category_match");
        evidence.setInServiceArea(true);
        evidence.setSignals(new ArrayList<>());
        evidence.setChecks(new ArrayList<>(List.of(categoryCheck)));
        evidence.setFileData(data);
        complaint.getEvidence().add(evidence);

        complaint.addUpdate(new ComplaintUpdate(status, firstMessage, "System"));

        return complaints.save(complaint);
    }

    @Transactional(readOnly = true)
    public List<Complaint> forCitizen(String citizenId) {
        return complaints.findByCitizenIdOrderByCreatedAtDesc(citizenId);
    }

    @Transactional(readOnly = true)
    public List<Complaint> forDepartment(String departmentId, String status) {
        if (status == null || status.isBlank() || "all".equals(status)) {
            return complaints.findByDepartmentIdOrderByCreatedAtDesc(departmentId);
        }
        if (!STATUSES.contains(status)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unknown status '" + status + "'.");
        }
        return complaints.findByDepartmentIdAndStatusOrderByCreatedAtDesc(departmentId, status);
    }

    /** Department queue mapped to DTOs inside the transaction so rejected (and all) complaints load fully. */
    @Transactional(readOnly = true)
    public List<Dtos.ComplaintDto> queueFor(String departmentId, String status) {
        return forDepartment(departmentId, status).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public Complaint readForUser(String complaintId, AppUser user) {
        Complaint complaint = complaints.findById(complaintId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found."));
        if (user.isCitizen() && !complaint.getCitizenId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This complaint belongs to another citizen.");
        }
        if (user.isOfficer() && !complaint.getDepartmentId().equals(user.getDepartmentId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This complaint belongs to another department.");
        }
        return complaint;
    }

    @Transactional(readOnly = true)
    public EvidenceFile evidenceFor(String complaintId, AppUser user) {
        Complaint complaint = readForUser(complaintId, user);
        ComplaintEvidence evidence = complaint.firstEvidence();
        if (evidence == null || evidence.getFileData() == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Evidence not found.");
        }
        return new EvidenceFile(evidence.getFileData(), evidence.getMimeType());
    }

    @Transactional
    public Complaint changeStatus(String complaintId, AppUser officer, String status, String message) {
        if (!STATUSES.contains(status)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unknown status '" + status + "'.");
        }
        Complaint complaint = complaints.findById(complaintId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found."));
        if (!complaint.getDepartmentId().equals(officer.getDepartmentId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This complaint belongs to another department.");
        }
        if ("rejected".equals(complaint.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "This rejected complaint is retained for history and cannot be changed.");
        }

        complaint.setStatus(status);
        complaint.setUpdatedAt(Instant.now());
        if ("rejected".equals(status)) {
            if (message == null || message.trim().length() < 3) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Give the citizen a reason for rejecting this complaint.");
            }
            complaint.setRejectionReason(message.trim());
            complaint.setVerificationStatus("rejected");
        } else {
            complaint.setRejectionReason(null);
            complaint.setVerificationStatus("verified");
            complaint.setVerificationNote("Complaint reviewed by " + officer.getDisplayName() + ".");
        }
        complaint.addUpdate(new ComplaintUpdate(status, message.trim(), officer.getDisplayName()));
        return complaints.save(complaint);
    }

    public Dtos.ComplaintStatsDto statsOf(List<Complaint> list) {
        return new Dtos.ComplaintStatsDto(
                list.size(),
                list.stream().filter(c -> "submitted".equals(c.getStatus())).count(),
                list.stream().filter(c -> "under_review".equals(c.getStatus())).count(),
                list.stream().filter(c -> "in_progress".equals(c.getStatus())).count(),
                list.stream().filter(c -> "resolved".equals(c.getStatus())).count(),
                list.stream().filter(c -> "rejected".equals(c.getStatus())).count());
    }

    public Dtos.ComplaintDto toDto(Complaint complaint) {
        ComplaintEvidence evidence = complaint.firstEvidence();
        Dtos.EvidenceDto evidenceDto = evidence == null ? null : new Dtos.EvidenceDto(
                evidence.getKind(),
                evidence.getFilename(),
                evidence.getMimeType(),
                evidence.getSizeBytes(),
                evidence.isHasGeotag(),
                evidence.getLatitude(),
                evidence.getLongitude(),
                evidence.getCapturedAt(),
                evidence.getCamera(),
                evidence.getAuthenticityScore(),
                evidence.getAuthenticityVerdict(),
                new ArrayList<>(evidence.getSignals()),
                evidence.getChecks().stream()
                        .map(c -> new Dtos.EvidenceCheckDto(c.getName(), c.getStatus(), c.getDetail()))
                        .toList(),
                evidence.isInServiceArea());

        return new Dtos.ComplaintDto(
                complaint.getId(),
                complaint.getReference(),
                complaint.getCitizenId(),
                complaint.getCitizenName(),
                complaint.getDepartmentId(),
                Department.nameOf(complaint.getDepartmentId()),
                complaint.getCategory(),
                complaint.getDescription(),
                complaint.getArea(),
                complaint.getLandmark(),
                complaint.getReportingLatitude(),
                complaint.getReportingLongitude(),
                complaint.getStatus(),
                complaint.getPriority(),
                complaint.getVerificationStatus(),
                complaint.getVerificationNote(),
                complaint.getRejectionReason(),
                evidenceDto,
                complaint.getUpdates().stream()
                        .map(u -> new Dtos.ComplaintUpdateDto(
                                u.getStatus(), u.getMessage(), u.getActor(), u.getCreatedAt()))
                        .toList(),
                complaint.getCreatedAt(),
                complaint.getUpdatedAt());
    }
}
