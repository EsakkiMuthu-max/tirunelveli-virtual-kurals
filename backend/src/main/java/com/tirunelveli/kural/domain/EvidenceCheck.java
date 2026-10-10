package com.tirunelveli.kural.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/** One line of the authenticity audit trail shown to citizens and officers. */
@Embeddable
public class EvidenceCheck {

    @Column(name = "check_name", length = 120)
    private String name;

    /** pass | warn | fail */
    @Column(name = "check_status", length = 16)
    private String status;

    @Column(name = "check_detail", length = 600)
    private String detail;

    public EvidenceCheck() {
    }

    public EvidenceCheck(String name, String status, String detail) {
        this.name = name;
        this.status = status;
        this.detail = detail;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDetail() {
        return detail;
    }

    public void setDetail(String detail) {
        this.detail = detail;
    }
}
