package com.tirunelveli.kural.web;

import org.springframework.http.HttpStatus;

/** A controller-level failure that maps straight to an HTTP status and a {detail: "..."} body. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
