package com.tirunelveli.kural.domain;

import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** The uploaded photo/video plus everything the local authenticity screening concluded about it. */
@Entity
@Table(name = "tvk_complaint_evidence")
public class ComplaintEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** "photo" or "video". */
    @Column(nullable = false, length = 16)
    private String kind;

    @Column(nullable = false, length = 260)
    private String filename;

    @Column(name = "mime_type", nullable = false, length = 120)
    private String mimeType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "has_geotag", nullable = false)
    private boolean hasGeotag;

    private Double latitude;

    private Double longitude;

    @Column(name = "captured_at")
    private Instant capturedAt;

    @Column(length = 160)
    private String camera;

    @Column(name = "authenticity_score", nullable = false)
    private int authenticityScore;

    /** authentic | needs_review | fake */
    @Column(name = "authenticity_verdict", nullable = false, length = 24)
    private String authenticityVerdict;

    @Column(name = "in_service_area", nullable = false)
    private boolean inServiceArea = true;

    @ElementCollection(fetch = FetchType.EAGER)
    @jakarta.persistence.CollectionTable(
            name = "tvk_evidence_signals",
            joinColumns = @JoinColumn(name = "evidence_id"))
    @Column(name = "signal_text", length = 1000)
    private List<String> signals = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @jakarta.persistence.CollectionTable(
            name = "tvk_evidence_checks",
            joinColumns = @JoinColumn(name = "evidence_id"))
    private List<EvidenceCheck> checks = new ArrayList<>();

    /** The file bytes themselves — the evidence is stored in the database with the report. */
    @Lob
    @Column(name = "file_data", nullable = false, columnDefinition = "LONGBLOB")
    private byte[] fileData;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getKind() {
        return kind;
    }

    public void setKind(String kind) {
        this.kind = kind;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public void setSizeBytes(long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }

    public boolean isHasGeotag() {
        return hasGeotag;
    }

    public void setHasGeotag(boolean hasGeotag) {
        this.hasGeotag = hasGeotag;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Instant getCapturedAt() {
        return capturedAt;
    }

    public void setCapturedAt(Instant capturedAt) {
        this.capturedAt = capturedAt;
    }

    public String getCamera() {
        return camera;
    }

    public void setCamera(String camera) {
        this.camera = camera;
    }

    public int getAuthenticityScore() {
        return authenticityScore;
    }

    public void setAuthenticityScore(int authenticityScore) {
        this.authenticityScore = authenticityScore;
    }

    public String getAuthenticityVerdict() {
        return authenticityVerdict;
    }

    public void setAuthenticityVerdict(String authenticityVerdict) {
        this.authenticityVerdict = authenticityVerdict;
    }

    public boolean isInServiceArea() {
        return inServiceArea;
    }

    public void setInServiceArea(boolean inServiceArea) {
        this.inServiceArea = inServiceArea;
    }

    public List<String> getSignals() {
        return signals;
    }

    public void setSignals(List<String> signals) {
        this.signals = signals;
    }

    public List<EvidenceCheck> getChecks() {
        return checks;
    }

    public void setChecks(List<EvidenceCheck> checks) {
        this.checks = checks;
    }

    public byte[] getFileData() {
        return fileData;
    }

    public void setFileData(byte[] fileData) {
        this.fileData = fileData;
    }
}
