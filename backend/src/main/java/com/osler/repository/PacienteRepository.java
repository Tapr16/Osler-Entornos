package com.osler.repository;

import com.osler.entity.Paciente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PacienteRepository extends JpaRepository<Paciente, Long> {

    Optional<Paciente> findByNumeroDocumento(String numeroDocumento);

    boolean existsByNumeroDocumento(String numeroDocumento);

    List<Paciente> findByActivoTrue();

    // Búsqueda por nombre, apellido o documento (para el buscador del frontend)
    @Query("SELECT p FROM Paciente p WHERE p.activo = true AND (" +
           "LOWER(p.nombre) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(p.apellido) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "p.numeroDocumento LIKE CONCAT('%',:q,'%'))")
    List<Paciente> buscar(@Param("q") String query);

    Page<Paciente> findByActivoTrue(Pageable pageable);
}
