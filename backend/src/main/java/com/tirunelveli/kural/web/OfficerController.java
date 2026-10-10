package com.tirunelveli.kural.web;

import com.tirunelveli.kural.domain.AppUser;
import com.tirunelveli.kural.dto.Dtos;
import com.tirunelveli.kural.service.ComplaintService;
import com.tirunelveli.kural.service.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Officer workspace — every query is scoped to the officer's own department. */
@RestController
@RequestMapping("/api/officer")
public class OfficerController {

    private final ComplaintService complaints;
    private final SessionService sessions;

    public OfficerController(ComplaintService complaints, SessionService sessions) {
        this.complaints = complaints;
        this.sessions = sessions;
    }

    @GetMapping("/complaints")
    public List<Dtos.ComplaintDto> queue(
            @RequestParam(value = "status", required = false) String status, HttpServletRequest request) {

        AppUser officer = sessions.requireOfficer(request);
        return complaints.queueFor(officer.getDepartmentId(), status);
    }

    @GetMapping("/stats")
    public Dtos.ComplaintStatsDto stats(HttpServletRequest request) {
        AppUser officer = sessions.requireOfficer(request);
        return complaints.statsOf(complaints.forDepartment(officer.getDepartmentId(), null));
    }

    @PatchMapping("/complaints/{complaintId}/status")
    public Dtos.ComplaintDto changeStatus(
            @PathVariable String complaintId,
            @Valid @RequestBody Dtos.StatusChangeRequest body,
            HttpServletRequest request) {

        AppUser officer = sessions.requireOfficer(request);
        return complaints.toDto(
                complaints.changeStatus(complaintId, officer, body.status(), body.message()));
    }
}
