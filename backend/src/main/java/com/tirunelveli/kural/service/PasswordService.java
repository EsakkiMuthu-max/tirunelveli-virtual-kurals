package com.tirunelveli.kural.service;

import org.springframework.stereotype.Service;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;

/**
 * PBKDF2-HMAC-SHA256 password hashing. The stored format is
 * {@code pbkdf2_sha256$rounds$salt$hex-digest}.
 */
@Service
public class PasswordService {

    private static final int ROUNDS = 120_000;
    private static final int KEY_BITS = 256;
    private static final SecureRandom RANDOM = new SecureRandom();

    public String hash(String password) {
        byte[] saltBytes = new byte[16];
        RANDOM.nextBytes(saltBytes);
        String salt = HexFormat.of().formatHex(saltBytes);
        return "pbkdf2_sha256$" + ROUNDS + "$" + salt + "$" + derive(password, salt, ROUNDS);
    }

    public boolean verify(String password, String stored) {
        if (stored == null) {
            return false;
        }
        String[] parts = stored.split("\\$");
        if (parts.length != 4) {
            return false;
        }
        String candidate = derive(password, parts[2], Integer.parseInt(parts[1]));
        return MessageDigest.isEqual(
                candidate.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                parts[3].getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    private String derive(String password, String salt, int rounds) {
        try {
            PBEKeySpec spec = new PBEKeySpec(
                    password.toCharArray(),
                    salt.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                    rounds,
                    KEY_BITS);
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            return HexFormat.of().formatHex(factory.generateSecret(spec).getEncoded());
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to hash the password", ex);
        }
    }

    public String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of()
                    .formatHex(digest.digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }
}
