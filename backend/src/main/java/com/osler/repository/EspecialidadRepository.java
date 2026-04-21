package com.osler.repository;

import com.osler.entity.Especialidad;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EspecialidadRepository extends JpaRepository<Especialidad, Long> {
    List<Especialidad> findAllByOrderByNombreAsc();
}
