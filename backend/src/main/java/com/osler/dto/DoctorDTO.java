package com.osler.dto;

import com.osler.entity.Doctor;
import jakarta.validation.constraints.*;

public class DoctorDTO {

    public record Request(
        @NotBlank(message = "Nombre obligatorio") String nombre,
        @NotBlank(message = "Apellido obligatorio") String apellido,
        @NotBlank(message = "Número de licencia obligatorio") String numeroLicencia,
        @NotNull(message = "Especialidad obligatoria") Long especialidadId,
        String telefono,
        @Email(message = "Email inválido") String email,
        Doctor.Turno turno
    ) {}

    public record Response(
        Long id,
        String nombre,
        String apellido,
        String numeroLicencia,
        Long especialidadId,
        String especialidadNombre,
        String telefono,
        String email,
        Doctor.Turno turno,
        Boolean activo,
        String createdAt
    ) {}

    public static Response toResponse(Doctor d) {
        return new Response(
            d.getId(),
            d.getNombre(),
            d.getApellido(),
            d.getNumeroLicencia(),
            d.getEspecialidad().getId(),
            d.getEspecialidad().getNombre(),
            d.getTelefono(),
            d.getEmail(),
            d.getTurno(),
            d.getActivo(),
            d.getCreatedAt() != null ? d.getCreatedAt().toString() : null
        );
    }
}
