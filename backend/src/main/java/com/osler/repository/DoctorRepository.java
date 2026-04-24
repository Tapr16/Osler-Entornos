package com.osler.repository;

import com.osler.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    boolean existsByNumeroLicencia(String numeroLicencia);
    java.util.Optional<Doctor> findByEmail(String email);

    List<Doctor> findByActivoTrue();

    @Query("SELECT d FROM Doctor d WHERE d.activo = true AND (" +
           "LOWER(d.nombre) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(d.apellido) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(d.numeroLicencia) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(d.especialidad.nombre) LIKE LOWER(CONCAT('%',:q,'%')))")
    List<Doctor> buscar(@Param("q") String query);
}
