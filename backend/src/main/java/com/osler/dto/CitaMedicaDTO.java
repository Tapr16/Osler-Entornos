package com.osler.dto;

import com.osler.entity.CitaMedica;
import jakarta.validation.constraints.*;

public class CitaMedicaDTO {

    public record Request(
        @NotNull(message = "El paciente es obligatorio") Long pacienteId,
        @NotNull(message = "El doctor es obligatorio") Long doctorId,
        @NotBlank(message = "La fecha y hora son obligatorias") String fechaHora,
        Integer duracionMin,
        String motivo,
        CitaMedica.Estado estado,
        String notas
    ) {}

    public record Response(
        Long id,
        Long pacienteId,
        String pacienteNombre,
        Long doctorId,
        String doctorNombre,
        String fechaHora,
        Integer duracionMin,
        String motivo,
        CitaMedica.Estado estado,
        String notas,
        String createdAt
    ) {}

    public static Response toResponse(CitaMedica c) {
        return new Response(
            c.getId(),
            c.getPaciente().getId(),
            c.getPaciente().getNombre() + " " + c.getPaciente().getApellido(),
            c.getDoctor().getId(),
            c.getDoctor().getNombre() + " " + c.getDoctor().getApellido(),
            c.getFechaHora() != null ? c.getFechaHora().toString() : null,
            c.getDuracionMin(),
            c.getMotivo(),
            c.getEstado(),
            c.getNotas(),
            c.getCreatedAt() != null ? c.getCreatedAt().toString() : null
        );
    }
}
