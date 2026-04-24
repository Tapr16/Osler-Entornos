package com.osler.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class HistorialClinicoDTO {

    public record Request(
            @NotNull Long pacienteId,
            Long citaId,
            @NotNull Long doctorId,
            String diagnostico,
            String tratamiento,
            String observaciones
    ) {}

    public record Response(
            Long id,
            Long pacienteId,
            String pacienteNombreCompleto,
            Long citaId,
            Long doctorId,
            String doctorNombreCompleto,
            LocalDateTime fecha,
            String diagnostico,
            String tratamiento,
            String observaciones
    ) {}
}
