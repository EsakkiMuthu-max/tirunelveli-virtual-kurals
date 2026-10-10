package com.tirunelveli.kural.service;

import com.tirunelveli.kural.domain.AppUser;
import com.tirunelveli.kural.domain.Department;
import com.tirunelveli.kural.repository.AppUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Provisions the fixed account pool on first boot: 9999 citizen logins (TVK0001 .. TVK9999) and
 * exactly seven officer logins (officer1 .. officer7), one per department. The app has no
 * self-registration, so these rows are the only way in.
 */
@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private static final String[] FIRST_NAMES = {
            "Arun", "Bala", "Chitra", "Deepa", "Ezhil", "Gokul", "Hari", "Indhu", "Jeeva", "Kavya",
            "Lakshmi", "Murugan", "Nithya", "Oviya", "Prakash", "Ramya", "Saravanan", "Tamil", "Uma", "Vijay",
            "Yazhini", "Anbu", "Kalai", "Malar", "Nila", "Pavithra", "Selvi", "Thenmozhi", "Vani", "Karthik"};

    private static final String[] LAST_NAMES = {
            "Subramanian", "Pandian", "Nadar", "Iyer", "Thevar", "Raj", "Krishnan", "Murthy", "Sundaram",
            "Velu", "Ganesan", "Arumugam", "Chellappan", "Dhanapal", "Esakkimuthu", "Palanivel", "Rajendran"};

    private static final String[] WARDS = {
            "Palayamkottai", "Tirunelveli Town", "Melapalayam", "Vannarpettai", "Pettai", "Thachanallur",
            "Perumalpuram", "Maharaja Nagar", "Reddiarpatti", "Gandhi Nagar", "Murugankurichi", "Tharuvai"};

    private final AppUserRepository users;
    private final PasswordService passwords;

    @Value("${app.seed.citizen-count:9999}")
    private int citizenCount;

    @Value("${app.seed.citizen-password:citizen@123}")
    private String citizenPassword;

    @Value("${app.seed.officer-password:officer@123}")
    private String officerPassword;

    public DataSeeder(AppUserRepository users, PasswordService passwords) {
        this.users = users;
        this.passwords = passwords;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedOfficers();
        seedCitizens();
    }

    private void seedOfficers() {
        String hash = passwords.hash(officerPassword);
        int index = 1;
        for (Department department : Department.values()) {
            String loginId = department.getOfficerId();
            AppUser officer = users.findByLoginIdAndRole(loginId, "officer").orElseGet(() -> {
                AppUser fresh = new AppUser();
                fresh.setId(UUID.randomUUID().toString());
                fresh.setRole("officer");
                fresh.setLoginId(loginId);
                fresh.setPasswordHash(hash);
                return fresh;
            });
            officer.setDisplayName("Officer " + index + " \u2014 " + department.getDisplayName());
            officer.setDepartmentId(department.getId());
            officer.setDesignation("Assistant Engineer, " + department.getDisplayName());
            users.save(officer);
            index++;
        }
        log.info("Officers ready: {}", Department.values().length);
    }

    private void seedCitizens() {
        long existing = users.countByRole("citizen");
        if (existing >= citizenCount) {
            log.info("Citizens already seeded: {}", existing);
            return;
        }

        // Every demo citizen shares the same password, so the expensive KDF runs exactly once.
        String hash = passwords.hash(citizenPassword);
        List<AppUser> batch = new ArrayList<>();
        int created = 0;

        for (int number = 1; number <= citizenCount; number++) {
            String loginId = String.format("TVK%04d", number);
            if (users.findByLoginIdAndRole(loginId, "citizen").isPresent()) {
                continue;
            }
            AppUser citizen = new AppUser();
            citizen.setId(UUID.randomUUID().toString());
            citizen.setRole("citizen");
            citizen.setLoginId(loginId);
            citizen.setDisplayName(FIRST_NAMES[number % FIRST_NAMES.length]
                    + " " + LAST_NAMES[(number / 7) % LAST_NAMES.length]);
            citizen.setWard(WARDS[number % WARDS.length]);
            citizen.setPasswordHash(hash);
            batch.add(citizen);

            if (batch.size() >= 1000) {
                users.saveAll(batch);
                created += batch.size();
                batch.clear();
            }
        }
        if (!batch.isEmpty()) {
            users.saveAll(batch);
            created += batch.size();
        }
        log.info("Citizens created: {} (total {})", created, users.countByRole("citizen"));
    }
}
