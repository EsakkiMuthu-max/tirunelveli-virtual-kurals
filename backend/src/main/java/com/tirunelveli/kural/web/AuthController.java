package com.tirunelveli.kural.web;

import com.tirunelveli.kural.domain.AppUser;
import com.tirunelveli.kural.domain.Department;
import com.tirunelveli.kural.dto.Dtos;
import com.tirunelveli.kural.repository.AppUserRepository;
import com.tirunelveli.kural.service.PasswordService;
import com.tirunelveli.kural.service.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

/**
 * Login only. There is deliberately NO registration endpoint — the citizen and officer
 * account pools are provisioned by {@code DataSeeder}.
 */
@RestController
@RequestMapping("/api")
public class AuthController {

    private final AppUserRepository users;
    private final PasswordService passwords;
    private final SessionService sessions;

    public AuthController(AppUserRepository users, PasswordService passwords, SessionService sessions) {
        this.users = users;
        this.passwords = passwords;
        this.sessions = sessions;
    }

    @GetMapping("/departments")
    public List<Dtos.DepartmentDto> departments() {
        String[] icons = {"Car", "Droplets", "Waves", "Lightbulb", "Trash2", "Trees", "Building2"};
        Department[] values = Department.values();
        return Arrays.stream(values)
                .map(d -> new Dtos.DepartmentDto(
                        d.getId(),
                        d.getDisplayName(),
                        d.getTamilName(),
                        icons[Arrays.asList(values).indexOf(d)],
                        d.getDescription(),
                        d.getOfficerId()))
                .toList();
    }

    @PostMapping("/auth/citizen/login")
    public Dtos.SessionUserDto citizenLogin(
            @Valid @RequestBody Dtos.CitizenLoginRequest body, HttpServletResponse response) {

        String loginId = body.citizenId().trim().toUpperCase();
        AppUser user = users.findByLoginIdAndRole(loginId, "citizen")
                .filter(candidate -> passwords.verify(body.password(), candidate.getPasswordHash()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid citizen ID or password."));

        sessions.start(response, user.getId());
        return toDto(user);
    }

    @PostMapping("/auth/officer/login")
    public Dtos.SessionUserDto officerLogin(
            @Valid @RequestBody Dtos.OfficerLoginRequest body, HttpServletResponse response) {

        Department department = Department.byId(body.departmentId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Pick one of the seven departments."));

        String loginId = body.officerId().trim().toLowerCase();
        AppUser user = users.findByLoginIdAndRole(loginId, "officer")
                .filter(candidate -> passwords.verify(body.password(), candidate.getPasswordHash()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid officer ID or password."));

        if (!department.getId().equals(user.getDepartmentId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, loginId + " is the officer for "
                    + Department.nameOf(user.getDepartmentId()) + ", not the department you selected.");
        }

        sessions.start(response, user.getId());
        return toDto(user);
    }

    @GetMapping("/auth/me")
    public Dtos.SessionUserDto me(HttpServletRequest request) {
        return toDto(sessions.requireUser(request));
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        sessions.end(request, response);
        return ResponseEntity.noContent().build();
    }

    private Dtos.SessionUserDto toDto(AppUser user) {
        return new Dtos.SessionUserDto(
                user.getId(),
                user.getRole(),
                user.getDisplayName(),
                user.getLoginId(),
                user.getDepartmentId(),
                user.getDepartmentId() == null ? null : Department.nameOf(user.getDepartmentId()));
    }
}
