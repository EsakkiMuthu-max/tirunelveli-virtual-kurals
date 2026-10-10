package com.tirunelveli.kural.service;

import com.tirunelveli.kural.domain.AppUser;
import com.tirunelveli.kural.domain.UserSession;
import com.tirunelveli.kural.repository.AppUserRepository;
import com.tirunelveli.kural.repository.UserSessionRepository;
import com.tirunelveli.kural.web.ApiException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Optional;

/** Server-side sessions behind an httpOnly cookie. No token is ever returned in a JSON body. */
@Service
public class SessionService {

    public static final String COOKIE_NAME = "tvk_session";
    private static final int SESSION_DAYS = 7;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserSessionRepository sessions;
    private final AppUserRepository users;
    private final PasswordService passwords;

    public SessionService(UserSessionRepository sessions, AppUserRepository users, PasswordService passwords) {
        this.sessions = sessions;
        this.users = users;
        this.passwords = passwords;
    }

    public void start(HttpServletResponse response, String userId) {
        byte[] raw = new byte[32];
        RANDOM.nextBytes(raw);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);

        sessions.save(new UserSession(
                passwords.sha256Hex(token),
                userId,
                Instant.now().plus(SESSION_DAYS, ChronoUnit.DAYS)));

        Cookie cookie = new Cookie(COOKIE_NAME, token);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(SESSION_DAYS * 24 * 3600);
        response.addCookie(cookie);
    }

    public void end(HttpServletRequest request, HttpServletResponse response) {
        readToken(request).ifPresent(token -> sessions.deleteById(passwords.sha256Hex(token)));
        Cookie cookie = new Cookie(COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    public Optional<AppUser> optionalUser(HttpServletRequest request) {
        return readToken(request)
                .flatMap(token -> sessions.findById(passwords.sha256Hex(token)))
                .filter(session -> {
                    if (session.getExpiresAt().isBefore(Instant.now())) {
                        sessions.delete(session);
                        return false;
                    }
                    return true;
                })
                .flatMap(session -> users.findById(session.getUserId()));
    }

    public AppUser requireUser(HttpServletRequest request) {
        return optionalUser(request)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Please sign in to continue."));
    }

    public AppUser requireCitizen(HttpServletRequest request) {
        AppUser user = requireUser(request);
        if (!user.isCitizen()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This area is for citizens only.");
        }
        return user;
    }

    public AppUser requireOfficer(HttpServletRequest request) {
        AppUser user = requireUser(request);
        if (!user.isOfficer()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This area is for department officers only.");
        }
        return user;
    }

    private Optional<String> readToken(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        for (Cookie cookie : request.getCookies()) {
            if (COOKIE_NAME.equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().isBlank()) {
                return Optional.of(cookie.getValue());
            }
        }
        return Optional.empty();
    }
}
