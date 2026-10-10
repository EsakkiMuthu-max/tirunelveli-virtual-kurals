package com.tirunelveli.kural.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * A filed grievance. The evidence file is persisted on {@link ComplaintEvidence} so the proof is
 * never separated from the report it was filed with.
 */
@Entity
@Table(name = "tvk_complaints")
public class Complaint {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, unique = true, length = 32)
    private String reference;

    @Column(name = "citizen_id", nullable = false, length = 36)
    private String citizenId;

    @Column(name = "citizen_login_id", nullable = false, length = 32)
    private String citizenLoginId;

    @Column(name = "citizen_name", nullable = false, length = 120)
    private String citizenName;

    @Column(name = "department_id", nullable = false, length = 48)
    private String departmentId;

    @Column(nullable = false, length = 120)
    private String category;

    @Lob
    @Column(nullable = false, length = 4000, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 160)
    private String area;

    @Column(length = 200)
    private String landmark;

    /** Browser-detected reporting location; independent from optional media EXIF GPS. */
    @Column(name = "reporting_latitude")
    private Double reportingLatitude;

    @Column(name = "reporting_longitude")
    private Double reportingLongitude;

    /** submitted | under_review | in_progress | resolved | rejected */
    @Column(nullable = false, length = 24)
    private String status;

    @Column(nullable = false, length = 16)
    private String priority = "medium";

    /** verified | needs_review | rejected */
    @Column(name = "verification_status", nullable = false, length = 24)
    private String verificationStatus;

    @Lob
    @Column(name = "verification_note", nullable = false, length = 1000, columnDefinition = "TEXT")
    private String verificationNote;

    @Lob
    @Column(name = "rejection_reason", length = 2000, columnDefinition = "TEXT")
    private String rejectionReason;

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    private List<ComplaintUpdate> updates = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id")
    private List<ComplaintEvidence> evidence = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public void addUpdate(ComplaintUpdate update) {
        update.setComplaint(this);
        this.updates.add(update);
    }

    public ComplaintEvidence firstEvidence() {
        return evidence.isEmpty() ? null : evidence.get(0);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public String getCitizenId() {
        return citizenId;
    }

    public void setCitizenId(String citizenId) {
        this.citizenId = citizenId;
    }

    public String getCitizenLoginId() {
        return citizenLoginId;
    }

    public void setCitizenLoginId(String citizenLoginId) {
        this.citizenLoginId = citizenLoginId;
    }

    public String getCitizenName() {
        return citizenName;
    }

    public void setCitizenName(String citizenName) {
        this.citizenName = citizenName;
    }

    public String getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(String departmentId) {
        this.departmentId = departmentId;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getArea() {
        return area;
    }

    public void setArea(String area) {
        this.area = area;
    }

    public String getLandmark() {
        return landmark;
    }

    public void setLandmark(String landmark) {
        this.landmark = landmark;
    }

    public Double getReportingLatitude() {
        return reportingLatitude;
    }

    public void setReportingLatitude(Double reportingLatitude) {
        this.reportingLatitude = reportingLatitude;
    }

    public Double getReportingLongitude() {
        return reportingLongitude;
    }

    public void setReportingLongitude(Double reportingLongitude) {
        this.reportingLongitude = reportingLongitude;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(String verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public String getVerificationNote() {
        return verificationNote;
    }

    public void setVerificationNote(String verificationNote) {
        this.verificationNote = verificationNote;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public List<ComplaintUpdate> getUpdates() {
        return updates;
    }

    public void setUpdates(List<ComplaintUpdate> updates) {
        this.updates = updates;
    }

    public List<ComplaintEvidence> getEvidence() {
        return evidence;
    }

    public void setEvidence(List<ComplaintEvidence> evidence) {
        this.evidence = evidence;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
