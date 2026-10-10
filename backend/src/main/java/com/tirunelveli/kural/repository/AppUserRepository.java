package com.tirunelveli.kural.repository;

import com.tirunelveli.kural.domain.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, String> {

    Optional<AppUser> findByLoginIdAndRole(String loginId, String role);

    long countByRole(String role);
}
