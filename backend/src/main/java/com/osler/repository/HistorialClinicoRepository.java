package com.osler.repository;

import com.osler.entity.HistorialClinico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistorialClinicoRepository extends JpaRepository<HistorialClinico, Long> {
    List<HistorialClinico> findByPacienteId(Long pacienteId);
    List<HistorialClinico> findByDoctorId(Long doctorId);
    List<HistorialClinico> findByCitaId(Long citaId);
}
