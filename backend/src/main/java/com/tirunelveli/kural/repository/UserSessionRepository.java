package com.tirunelveli.kural.repository;

import com.tirunelveli.kural.domain.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSessionRepository extends JpaRepository<UserSession, String> {
}
