package com.tirunelveli.kural.web;

import com.tirunelveli.kural.domain.AppUser;
import com.tirunelveli.kural.dto.Dtos;
import com.tirunelveli.kural.service.ComplaintService;
import com.tirunelveli.kural.service.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ComplaintController {

    private final ComplaintService complaints;
    private final SessionService sessions;

    public ComplaintController(ComplaintService complaints, SessionService sessions) {
        this.complaints = complaints;
        this.sessions = sessions;
    }

    @PostMapping(value = "/complaints", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Dtos.ComplaintDto file(
            @RequestParam("department_id") String departmentId,
            @RequestParam("description") String description,
            @RequestParam("area") String area,
            @RequestParam(value = "landmark", required = false, defaultValue = "") String landmark,
            @RequestParam(value = "reporting_latitude", required = false) Double reportingLatitude,
            @RequestParam(value = "reporting_longitude", required = false) Double reportingLongitude,
            @RequestPart("evidence") MultipartFile evidence,
            @RequestParam(value = "ai_category_match", required = false) Boolean aiCategoryMatch,
            @RequestParam(value = "ai_category_confidence", required = false) Double aiCategoryConfidence,
            @RequestParam(value = "ai_detected_label", required = false) String aiDetectedLabel,
            HttpServletRequest request) {

        AppUser citizen = sessions.requireCitizen(request);
        return complaints.toDto(
                complaints.file(citizen, departmentId, description, area, landmark,
                        reportingLatitude, reportingLongitude, evidence,
                        aiCategoryMatch, aiCategoryConfidence, aiDetectedLabel));
    }

    @GetMapping("/complaints/mine")
    public List<Dtos.ComplaintDto> mine(HttpServletRequest request) {
        AppUser citizen = sessions.requireCitizen(request);
        return complaints.forCitizen(citizen.getId()).stream().map(complaints::toDto).toList();
    }

    @GetMapping("/complaints/mine/stats")
    public Dtos.ComplaintStatsDto myStats(HttpServletRequest request) {
        AppUser citizen = sessions.requireCitizen(request);
        return complaints.statsOf(complaints.forCitizen(citizen.getId()));
    }

    @GetMapping("/complaints/{complaintId}")
    public Dtos.ComplaintDto one(@PathVariable String complaintId, HttpServletRequest request) {
        AppUser user = sessions.requireUser(request);
        return complaints.toDto(complaints.readForUser(complaintId, user));
    }

    /** Streams the stored evidence bytes back out of the database. */
    @GetMapping("/complaints/{complaintId}/evidence")
    public ResponseEntity<Resource> evidence(@PathVariable String complaintId, HttpServletRequest request) {
        AppUser user = sessions.requireUser(request);
        ComplaintService.EvidenceFile file = complaints.evidenceFor(complaintId, user);
        MediaType type;
        try {
            type = MediaType.parseMediaType(file.mimeType());
        } catch (Exception ex) {
            type = MediaType.APPLICATION_OCTET_STREAM;
        }
        // Returning a Resource lets Spring answer HTTP Range requests, which <video> players need.
        return ResponseEntity.ok()
                .contentType(type)
                .header("Cache-Control", "private, max-age=600")
                .header("Accept-Ranges", "bytes")
                .body(new ByteArrayResource(file.data()));
    }
}
