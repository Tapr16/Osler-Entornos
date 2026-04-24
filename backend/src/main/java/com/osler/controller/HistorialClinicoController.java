package com.osler.controller;

import com.osler.dto.HistorialClinicoDTO;
import com.osler.entity.HistorialClinico;
import com.osler.entity.Paciente;
import com.osler.entity.CitaMedica;
import com.osler.entity.Doctor;
import com.osler.repository.HistorialClinicoRepository;
import com.osler.repository.PacienteRepository;
import com.osler.repository.CitaMedicaRepository;
import com.osler.repository.DoctorRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/historial-clinico")
@CrossOrigin(origins = "*")
public class HistorialClinicoController {

    @Autowired private HistorialClinicoRepository historialRepo;
    @Autowired private PacienteRepository pacienteRepo;
    @Autowired private CitaMedicaRepository citaRepo;
    @Autowired private DoctorRepository doctorRepo;

    @GetMapping("/paciente/{pacienteId}")
    public ResponseEntity<List<HistorialClinicoDTO.Response>> obtenerPorPaciente(@PathVariable Long pacienteId) {
        List<HistorialClinico> historial = historialRepo.findByPacienteId(pacienteId);
        return ResponseEntity.ok(historial.stream().map(this::mapToResponse).collect(Collectors.toList()));
    }

    @PostMapping
    public ResponseEntity<?> crearHistorial(@Valid @RequestBody HistorialClinicoDTO.Request req) {
        if (req.pacienteId() == null || req.doctorId() == null) {
            return ResponseEntity.badRequest().body("ID de paciente o doctor faltante");
        }
        Paciente paciente = pacienteRepo.findById((long) req.pacienteId()).orElse(null);
        Doctor doctor = doctorRepo.findById((long) req.doctorId()).orElse(null);
        if (paciente == null || doctor == null) {
            return ResponseEntity.badRequest().body("Paciente o Doctor no encontrados");
        }
        CitaMedica cita = null;
        if (req.citaId() != null) {
            cita = citaRepo.findById((long) req.citaId()).orElse(null);
        }

        HistorialClinico nuevo = new HistorialClinico();
        nuevo.setPaciente(paciente);
        nuevo.setDoctor(doctor);
        nuevo.setCita(cita);
        nuevo.setFecha(LocalDateTime.now());
        nuevo.setDiagnostico(req.diagnostico());
        nuevo.setTratamiento(req.tratamiento());
        nuevo.setObservaciones(req.observaciones());

        historialRepo.save(nuevo);
        return ResponseEntity.ok(mapToResponse(nuevo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarHistorial(@PathVariable Long id, @RequestBody HistorialClinicoDTO.Request req) {
        if (id == null) return ResponseEntity.badRequest().build();
        HistorialClinico existente = historialRepo.findById(id).orElse(null);
        if (existente == null) return ResponseEntity.notFound().build();

        existente.setDiagnostico(req.diagnostico());
        existente.setTratamiento(req.tratamiento());
        existente.setObservaciones(req.observaciones());
        historialRepo.save(existente);
        return ResponseEntity.ok(mapToResponse(existente));
    }

    private HistorialClinicoDTO.Response mapToResponse(HistorialClinico h) {
        return new HistorialClinicoDTO.Response(
                h.getId(),
                h.getPaciente().getId(),
                h.getPaciente().getNombre() + " " + h.getPaciente().getApellido(),
                h.getCita() != null ? h.getCita().getId() : null,
                h.getDoctor().getId(),
                h.getDoctor().getNombre() + " " + h.getDoctor().getApellido(),
                h.getFecha(),
                h.getDiagnostico(),
                h.getTratamiento(),
                h.getObservaciones()
        );
    }
}
