package com.tirunelveli.kural.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

/** Every wire shape in one place — these mirror the TypeScript interfaces in frontend/src/lib/types.ts. */
public final class Dtos {

    private Dtos() {
    }

    public record DepartmentDto(
            String id,
            String name,
            String tamilName,
            String icon,
            String description,
            String officerId) {
    }

    public record SessionUserDto(
            String id,
            String role,
            String displayName,
            String loginId,
            String departmentId,
            String departmentName) {
    }

    public record CitizenLoginRequest(
            @NotBlank String citizenId,
            @NotBlank String password) {
    }

    public record OfficerLoginRequest(
            @NotBlank String officerId,
            @NotBlank String password,
            @NotBlank String departmentId) {
    }

    public record EvidenceCheckDto(String name, String status, String detail) {
    }

    public record EvidenceDto(
            String kind,
            String filename,
            String mimeType,
            long sizeBytes,
            boolean hasGeotag,
            Double latitude,
            Double longitude,
            Instant capturedAt,
            String camera,
            int authenticityScore,
            String authenticityVerdict,
            List<String> signals,
            List<EvidenceCheckDto> checks,
            boolean inServiceArea) {
    }

    public record ComplaintUpdateDto(String status, String message, String actor, Instant createdAt) {
    }

    public record ComplaintDto(
            String id,
            String reference,
            String citizenId,
            String citizenName,
            String departmentId,
            String departmentName,
            String category,
            String description,
            String area,
            String landmark,
            Double reportingLatitude,
            Double reportingLongitude,
            String status,
            String priority,
            String verificationStatus,
            String verificationNote,
            String rejectionReason,
            EvidenceDto evidence,
            List<ComplaintUpdateDto> updates,
            Instant createdAt,
            Instant updatedAt) {
    }

    public record ComplaintStatsDto(
            long total,
            long submitted,
            long underReview,
            long inProgress,
            long resolved,
            long rejected) {
    }

    public record StatusChangeRequest(
            @NotBlank String status,
            @NotBlank @Size(min = 3, max = 600) String message) {
    }

    public record ApiMessage(String detail) {
    }
}
