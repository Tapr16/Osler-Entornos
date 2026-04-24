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
    
    public record RegisterPacienteRequest(
        @NotBlank String nombre,
        @NotBlank String apellido,
        @NotBlank @Email String email,
        @NotBlank String password,
        @NotBlank String tipoDocumento,
        @NotBlank String numeroDocumento,
        @NotBlank String fechaNacimiento,
        @NotBlank String genero,
        String telefono,
        String direccion,
        String ciudad,
        String contactoEmergenciaNombre,
        String contactoEmergenciaTelefono
    ) {}

    public record ChangePasswordRequest(
        @NotBlank String oldPassword,
        @NotBlank String newPassword
    ) {}

    public record UpdateProfileRequest(
        String nombre,
        String apellido,
        String telefono,
        String direccion,
        String ciudad,
        String contactoEmergenciaNombre,
        String contactoEmergenciaTelefono
    ) {}
}
