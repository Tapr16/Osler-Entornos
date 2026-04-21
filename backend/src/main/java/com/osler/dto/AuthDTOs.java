package com.osler.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// ---- Login Request ----
public class AuthDTOs {

    public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
    ) {}

    public record LoginResponse(
        String token,
        String tipo,
        Long userId,
        String nombre,
        String apellido,
        String email,
        String rol
    ) {}

    public record RegisterRequest(
        @NotBlank String nombre,
        @NotBlank String apellido,
        @NotBlank @Email String email,
        @NotBlank String password,
        Long rolId
    ) {}

    public record MessageResponse(String mensaje) {}
}
