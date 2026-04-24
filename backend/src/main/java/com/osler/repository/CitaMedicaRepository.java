package com.osler.repository;

import com.osler.entity.CitaMedica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CitaMedicaRepository extends JpaRepository<CitaMedica, Long> {

    List<CitaMedica> findAllByOrderByFechaHoraDesc();

    @Query("SELECT c FROM CitaMedica c WHERE " +
           "LOWER(c.paciente.nombre) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(c.paciente.apellido) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(c.doctor.nombre) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(c.doctor.apellido) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(c.motivo) LIKE LOWER(CONCAT('%',:q,'%'))")
    List<CitaMedica> buscar(@Param("q") String query);

    List<CitaMedica> findByPacienteEmailOrderByFechaHoraDesc(String email);
    List<CitaMedica> findByDoctorEmailOrderByFechaHoraDesc(String email);
}
