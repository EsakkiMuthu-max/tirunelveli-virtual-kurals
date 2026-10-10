package com.tirunelveli.kural.domain;

import java.util.Arrays;
import java.util.Optional;

/**
 * The seven — and only seven — civic categories.
 * One category == one department == exactly one officer login.
 */
public enum Department {

    ROADS_POTHOLES(
            "roads_potholes",
            "Roads & Potholes",
            "\u0b9a\u0bbe\u0bb2\u0bc8\u0b95\u0bb3\u0bcd & \u0b95\u0bc1\u0bb4\u0bbf\u0b95\u0bb3\u0bcd",
            "officer1",
            "Potholes, damaged tar, road cuts, speed breakers and paving."),

    WATER_SUPPLY(
            "water_supply",
            "Water Supply",
            "\u0b95\u0bc1\u0b9f\u0bbf\u0ba8\u0bc0\u0bb0\u0bcd \u0bb5\u0bbf\u0ba8\u0bbf\u0baf\u0bcb\u0b95\u0bae\u0bcd",
            "officer2",
            "Pipeline leaks, contaminated water, low pressure, tanker supply."),

    SEWERAGE_DRAINAGE(
            "sewerage_drainage",
            "Sewerage & Drainage",
            "\u0b95\u0bb4\u0bbf\u0bb5\u0bc1\u0ba8\u0bc0\u0bb0\u0bcd & \u0bb5\u0b9f\u0bbf\u0b95\u0bbe\u0bb2\u0bcd",
            "officer3",
            "Clogged storm drains, overflowing manholes, stagnant sewage."),

    STREET_LIGHTS(
            "street_lights",
            "Street Lights",
            "\u0ba4\u0bc6\u0bb0\u0bc1 \u0bb5\u0bbf\u0bb3\u0b95\u0bcd\u0b95\u0bc1\u0b95\u0bb3\u0bcd",
            "officer4",
            "Non-functioning street lamps, damaged poles, dark stretches."),

    SOLID_WASTE(
            "solid_waste",
            "Solid Waste",
            "\u0ba4\u0bbf\u0b9f\u0b95\u0b95\u0bb4\u0bbf\u0bb5\u0bc1 \u0bae\u0bc7\u0bb2\u0bbe\u0ba3\u0bcd\u0bae\u0bc8",
            "officer5",
            "Uncollected garbage bins, open dumping, dead animal clearance."),

    PARKS_PUBLIC_SPACES(
            "parks_public_spaces",
            "Parks & Public Spaces",
            "\u0baa\u0bc2\u0b99\u0bcd\u0b95\u0bbe\u0b95\u0bcd\u0b95\u0bb3\u0bcd & \u0baa\u0bca\u0ba4\u0bc1 \u0b87\u0b9f\u0b99\u0bcd\u0b95\u0bb3\u0bcd",
            "officer6",
            "Park maintenance, broken playground items, overgrown bushes."),

    ENCROACHMENT_BUILDINGS(
            "encroachment_buildings",
            "Encroachment & Buildings",
            "\u0b86\u0b95\u0bcd\u0b95\u0bbf\u0bb0\u0bae\u0bbf\u0baa\u0bcd\u0baa\u0bc1 & \u0b95\u0b9f\u0bcd\u0b9f\u0bbf\u0b9f\u0b99\u0bcd\u0b95\u0bb3\u0bcd",
            "officer7",
            "Footpath encroachments, unauthorised construction, hazardous structures.");

    private final String id;
    private final String displayName;
    private final String tamilName;
    private final String officerId;
    private final String description;

    Department(String id, String displayName, String tamilName, String officerId, String description) {
        this.id = id;
        this.displayName = displayName;
        this.tamilName = tamilName;
        this.officerId = officerId;
        this.description = description;
    }

    public String getId() {
        return id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getTamilName() {
        return tamilName;
    }

    public String getOfficerId() {
        return officerId;
    }

    public String getDescription() {
        return description;
    }

    public static Optional<Department> byId(String id) {
        return Arrays.stream(values()).filter(d -> d.id.equals(id)).findFirst();
    }

    public static Optional<Department> byOfficerId(String officerId) {
        return Arrays.stream(values()).filter(d -> d.officerId.equals(officerId)).findFirst();
    }

    public static String nameOf(String id) {
        return byId(id).map(Department::getDisplayName).orElse(id);
    }
}
