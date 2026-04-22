package com.osler.dto;

import com.osler.entity.Paciente;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public class PacienteDTO {

    public record Request(
        @NotBlank(message = "Nombre obligatorio") String nombre,
        @NotBlank(message = "Apellido obligatorio") String apellido,
        @NotNull(message = "Tipo de documento obligatorio") Paciente.TipoDocumento tipoDocumento,
        @NotBlank(message = "Número de documento obligatorio") String numeroDocumento,
        @NotNull(message = "Fecha de nacimiento obligatoria")
        @Past(message = "Fecha debe ser en el pasado") LocalDate fechaNacimiento,
        @NotNull(message = "Género obligatorio") Paciente.Genero genero,
        String telefono,
        @Email(message = "Email inválido") String email,
        String direccion,
        String ciudad,
        Paciente.TipoSangre tipoSangre
    ) {}

    public record Response(
        Long id,
        String nombre,
        String apellido,
        Paciente.TipoDocumento tipoDocumento,
        String numeroDocumento,
        LocalDate fechaNacimiento,
        Paciente.Genero genero,
        String telefono,
        String email,
        String direccion,
        String ciudad,
        Paciente.TipoSangre tipoSangre,
        Boolean activo,
        String createdAt
    ) {}

    // Convierte entidad → DTO response
    public static Response toResponse(Paciente p) {
        return new Response(
            p.getId(), p.getNombre(), p.getApellido(),
            p.getTipoDocumento(), p.getNumeroDocumento(),
            p.getFechaNacimiento(), p.getGenero(),
            p.getTelefono(), p.getEmail(),
            p.getDireccion(), p.getCiudad(),
            p.getTipoSangre(), p.getActivo(),
            p.getCreatedAt() != null ? p.getCreatedAt().toString() : null
        );
    }
}
