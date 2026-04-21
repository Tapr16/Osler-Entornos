package com.osler.controller;

import com.osler.dto.CitaMedicaDTO;
import com.osler.entity.CitaMedica;
import com.osler.entity.Doctor;
import com.osler.entity.Paciente;
import com.osler.repository.CitaMedicaRepository;
import com.osler.repository.DoctorRepository;
import com.osler.repository.PacienteRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * CRUD de Citas Médicas
 * Base URL: /api/citas
 *
 * GET    /api/citas               → listar todas
 * GET    /api/citas/{id}          → obtener una
 * GET    /api/citas/buscar?q=...  → buscar
 * POST   /api/citas               → crear
 * PUT    /api/citas/{id}          → actualizar
 * DELETE /api/citas/{id}          → eliminar
 */
@RestController
@RequestMapping("/api/citas")
@CrossOrigin(origins = "*")
public class CitaMedicaController {

    @Autowired private CitaMedicaRepository citaRepo;
    @Autowired private PacienteRepository pacienteRepo;
    @Autowired private DoctorRepository doctorRepo;

    // -------- GET /api/citas --------
    @GetMapping
    public ResponseEntity<List<CitaMedicaDTO.Response>> listar() {
        List<CitaMedicaDTO.Response> lista = citaRepo.findAllByOrderByFechaHoraDesc()
                .stream()
                .map(CitaMedicaDTO::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }

    // -------- GET /api/citas/{id} --------
    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable Long id) {
        return citaRepo.findById(id)
                .map(c -> ResponseEntity.ok(CitaMedicaDTO.toResponse(c)))
                .orElse(ResponseEntity.notFound().build());
    }

    // -------- GET /api/citas/buscar?q=... --------
    @GetMapping("/buscar")
    public ResponseEntity<List<CitaMedicaDTO.Response>> buscar(@RequestParam String q) {
        List<CitaMedicaDTO.Response> resultados = citaRepo.buscar(q)
                .stream()
                .map(CitaMedicaDTO::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(resultados);
    }

    // -------- POST /api/citas --------
    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody CitaMedicaDTO.Request req) {
        Paciente paciente = pacienteRepo.findById(req.pacienteId()).orElse(null);
        if (paciente == null) return ResponseEntity.badRequest().body("Paciente no encontrado");

        Doctor doctor = doctorRepo.findById(req.doctorId()).orElse(null);
        if (doctor == null) return ResponseEntity.badRequest().body("Doctor no encontrado");

        CitaMedica cita = new CitaMedica();
        mapRequestToEntity(req, cita, paciente, doctor);
        CitaMedica guardada = citaRepo.save(cita);
        return ResponseEntity.status(HttpStatus.CREATED).body(CitaMedicaDTO.toResponse(guardada));
    }

    // -------- PUT /api/citas/{id} --------
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id,
                                        @Valid @RequestBody CitaMedicaDTO.Request req) {
        Paciente paciente = pacienteRepo.findById(req.pacienteId()).orElse(null);
        if (paciente == null) return ResponseEntity.badRequest().body("Paciente no encontrado");

        Doctor doctor = doctorRepo.findById(req.doctorId()).orElse(null);
        if (doctor == null) return ResponseEntity.badRequest().body("Doctor no encontrado");

        return citaRepo.findById(id)
                .map(c -> {
                    mapRequestToEntity(req, c, paciente, doctor);
                    return ResponseEntity.<Object>ok(CitaMedicaDTO.toResponse(citaRepo.save(c)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // -------- DELETE /api/citas/{id} --------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        return citaRepo.findById(id)
                .map(c -> {
                    citaRepo.deleteById(id);
                    return ResponseEntity.ok().body("Cita eliminada");
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private void mapRequestToEntity(CitaMedicaDTO.Request req, CitaMedica c,
                                    Paciente paciente, Doctor doctor) {
        c.setPaciente(paciente);
        c.setDoctor(doctor);
        c.setFechaHora(LocalDateTime.parse(req.fechaHora()));
        c.setDuracionMin(req.duracionMin() != null ? req.duracionMin() : 30);
        c.setMotivo(req.motivo());
        c.setEstado(req.estado() != null ? req.estado() : CitaMedica.Estado.PROGRAMADA);
        c.setNotas(req.notas());
    }
}
