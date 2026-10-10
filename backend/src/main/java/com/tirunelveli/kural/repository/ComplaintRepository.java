package com.tirunelveli.kural.repository;

import com.tirunelveli.kural.domain.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ComplaintRepository extends JpaRepository<Complaint, String> {

    List<Complaint> findByCitizenIdOrderByCreatedAtDesc(String citizenId);

    List<Complaint> findByDepartmentIdOrderByCreatedAtDesc(String departmentId);

    List<Complaint> findByDepartmentIdAndStatusOrderByCreatedAtDesc(String departmentId, String status);

    Optional<Complaint> findByReference(String reference);
}
