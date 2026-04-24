package com.osler.controller;

import com.osler.dto.DoctorDTO;
import com.osler.entity.Doctor;
import com.osler.entity.Especialidad;
import com.osler.repository.DoctorRepository;
import com.osler.repository.EspecialidadRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * CRUD de Doctores — Jesús
 * Base URL: /api/doctores
 *
 * GET    /api/doctores               → listar todos (activos)
 * GET    /api/doctores/{id}          → obtener uno
 * GET    /api/doctores/buscar?q=...  → buscar
 * GET    /api/especialidades         → listar especialidades (para el select)
 * POST   /api/doctores               → crear
 * PUT    /api/doctores/{id}          → actualizar
 * DELETE /api/doctores/{id}          → eliminar (soft delete)
 */
@RestController
@CrossOrigin(origins = "*")
public class DoctorController {

    @Autowired private DoctorRepository doctorRepo;
    @Autowired private EspecialidadRepository especialidadRepo;

    // -------- GET /api/doctores --------
    @GetMapping("/api/doctores")
    public ResponseEntity<List<DoctorDTO.Response>> listar() {
        List<DoctorDTO.Response> lista = doctorRepo.findByActivoTrue()
                .stream()
                .map(DoctorDTO::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }

    // -------- GET /api/doctores/{id} --------
    @GetMapping("/api/doctores/{id}")
    public ResponseEntity<?> obtener(@PathVariable Long id) {
        return doctorRepo.findById(id)
                .filter(Doctor::getActivo)
                .map(d -> ResponseEntity.ok(DoctorDTO.toResponse(d)))
                .orElse(ResponseEntity.notFound().build());
    }

    // -------- GET /api/doctores/buscar?q=... --------
    @GetMapping("/api/doctores/buscar")
    public ResponseEntity<List<DoctorDTO.Response>> buscar(@RequestParam String q) {
        List<DoctorDTO.Response> resultados = doctorRepo.buscar(q)
                .stream()
                .map(DoctorDTO::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(resultados);
    }

    // -------- GET /api/doctores/email/{email} --------
    @GetMapping("/api/doctores/email/{email:.+}")
    public ResponseEntity<?> obtenerPorEmail(@PathVariable String email) {
        return doctorRepo.findByEmail(email)
                .map(d -> ResponseEntity.ok(DoctorDTO.toResponse(d)))
                .orElse(ResponseEntity.notFound().build());
    }

    // -------- GET /api/especialidades --------
    @GetMapping("/api/especialidades")
    public ResponseEntity<?> listarEspecialidades() {
        return ResponseEntity.ok(especialidadRepo.findAllByOrderByNombreAsc());
    }

    // -------- POST /api/especialidades --------
    @PostMapping("/api/especialidades")
    public ResponseEntity<?> crearEspecialidad(@RequestBody Especialidad esp) {
        if (especialidadRepo.findByNombre(esp.getNombre()).isPresent()) {
            return ResponseEntity.badRequest().body("La especialidad ya existe");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(especialidadRepo.save(esp));
    }

    // -------- POST /api/doctores --------
    @PostMapping("/api/doctores")
    public ResponseEntity<?> crear(@Valid @RequestBody DoctorDTO.Request req) {
        if (doctorRepo.existsByNumeroLicencia(req.numeroLicencia())) {
            return ResponseEntity.badRequest()
                    .body("Ya existe un doctor con ese número de licencia");
        }

        Especialidad esp = especialidadRepo.findById(req.especialidadId()).orElse(null);
        if (esp == null) {
            return ResponseEntity.badRequest().body("Especialidad no encontrada");
        }

        Doctor d = new Doctor();
        mapRequestToEntity(req, d, esp);
        Doctor guardado = doctorRepo.save(d);
        return ResponseEntity.status(HttpStatus.CREATED).body(DoctorDTO.toResponse(guardado));
    }

    // -------- PUT /api/doctores/{id} --------
    @PutMapping("/api/doctores/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id,
                                        @Valid @RequestBody DoctorDTO.Request req) {
        Especialidad esp = especialidadRepo.findById(req.especialidadId()).orElse(null);
        if (esp == null) {
            return ResponseEntity.badRequest().body("Especialidad no encontrada");
        }

        return doctorRepo.findById(id)
                .filter(Doctor::getActivo)
                .map(d -> {
                    if (!d.getNumeroLicencia().equals(req.numeroLicencia())
                            && doctorRepo.existsByNumeroLicencia(req.numeroLicencia())) {
                        return ResponseEntity.badRequest()
                                .<Object>body("Ese número de licencia ya existe");
                    }
                    mapRequestToEntity(req, d, esp);
                    return ResponseEntity.<Object>ok(DoctorDTO.toResponse(doctorRepo.save(d)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // -------- DELETE /api/doctores/{id} (soft delete) --------
    @DeleteMapping("/api/doctores/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        return doctorRepo.findById(id)
                .filter(Doctor::getActivo)
                .map(d -> {
                    d.setActivo(false);
                    doctorRepo.save(d);
                    return ResponseEntity.ok().body("Doctor eliminado");
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ---- Helper: mapea DTO → entidad ----
    private void mapRequestToEntity(DoctorDTO.Request req, Doctor d, Especialidad esp) {
        d.setNombre(req.nombre());
        d.setApellido(req.apellido());
        d.setNumeroLicencia(req.numeroLicencia());
        d.setEspecialidad(esp);
        d.setTelefono(req.telefono());
        d.setEmail(req.email());
        d.setTurno(req.turno() != null ? req.turno() : Doctor.Turno.MANANA);
    }
}
