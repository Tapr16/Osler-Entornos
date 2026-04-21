package com.osler.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "doctores")
@Data
@NoArgsConstructor
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String nombre;

    @NotBlank(message = "El apellido es obligatorio")
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String apellido;

    @NotBlank(message = "El número de licencia es obligatorio")
    @Column(name = "numero_licencia", nullable = false, unique = true, length = 50)
    private String numeroLicencia;

    @NotNull(message = "La especialidad es obligatoria")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "especialidad_id", nullable = false)
    private Especialidad especialidad;

    @Column(length = 20)
    private String telefono;

    @Email(message = "Email no válido")
    @Column(length = 150)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Turno turno = Turno.MANANA;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum Turno { MANANA, TARDE, NOCHE }
}
