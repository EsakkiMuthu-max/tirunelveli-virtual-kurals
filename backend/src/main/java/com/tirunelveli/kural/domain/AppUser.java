package com.tirunelveli.kural.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(name = "tvk_users", uniqueConstraints = @UniqueConstraint(columnNames = {"login_id", "role"}))
public class AppUser {

    @Id
    @Column(length = 36)
    private String id;

    /** "citizen" or "officer". */
    @Column(nullable = false, length = 16)
    private String role;

    /** TVK0001 .. TVK9999 for citizens, officer1 .. officer7 for officers. */
    @Column(name = "login_id", nullable = false, length = 32)
    private String loginId;

    @Column(name = "display_name", nullable = false, length = 120)
    private String displayName;

    /** Set for officers only — the single department they are allowed to work in. */
    @Column(name = "department_id", length = 48)
    private String departmentId;

    @Column(length = 120)
    private String ward;

    @Column(length = 160)
    private String designation;

    @Column(name = "password_hash", nullable = false, length = 256)
    private String passwordHash;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getLoginId() {
        return loginId;
    }

    public void setLoginId(String loginId) {
        this.loginId = loginId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(String departmentId) {
        this.departmentId = departmentId;
    }

    public String getWard() {
        return ward;
    }

    public void setWard(String ward) {
        this.ward = ward;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isCitizen() {
        return "citizen".equals(role);
    }

    public boolean isOfficer() {
        return "officer".equals(role);
    }
}
