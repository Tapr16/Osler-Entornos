package com.osler.controller;

import com.osler.dto.PacienteDTO;
import com.osler.entity.Paciente;
import com.osler.repository.PacienteRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * CRUD de Pacientes — Thomas Pérez
 * Base URL: /api/pacientes
 *
 * GET    /api/pacientes          → listar todos (activos)
 * GET    /api/pacientes/{id}     → obtener uno
 * GET    /api/pacientes/buscar?q=texto → buscar
 * POST   /api/pacientes          → crear
 * PUT    /api/pacientes/{id}     → actualizar
 * DELETE /api/pacientes/{id}     → eliminar (soft delete)
 */
@RestController
@RequestMapping("/api/pacientes")
@CrossOrigin(origins = "*")
public class PacienteController {

    @Autowired
    private PacienteRepository pacienteRepo;

    // -------- GET /api/pacientes --------
    @GetMapping
    public ResponseEntity<List<PacienteDTO.Response>> listar() {
        List<PacienteDTO.Response> lista = pacienteRepo.findByActivoTrue()
                .stream()
                .map(PacienteDTO::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }

    // -------- GET /api/pacientes/{id} --------
    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable Long id) {
        return pacienteRepo.findById(id)
                .filter(Paciente::getActivo)
                .map(p -> ResponseEntity.ok(PacienteDTO.toResponse(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    // -------- GET /api/pacientes/buscar?q=... --------
    @GetMapping("/buscar")
    public ResponseEntity<List<PacienteDTO.Response>> buscar(@RequestParam String q) {
        List<PacienteDTO.Response> resultados = pacienteRepo.buscar(q)
                .stream()
                .map(PacienteDTO::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(resultados);
    }

    // -------- GET /api/pacientes/email/{email} --------
    @GetMapping("/email/{email:.+}")
    public ResponseEntity<?> obtenerPorEmail(@PathVariable String email) {
        return pacienteRepo.findByEmail(email)
                .map(p -> ResponseEntity.ok(PacienteDTO.toResponse(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    // -------- POST /api/pacientes --------
    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody PacienteDTO.Request req) {
        if (pacienteRepo.existsByNumeroDocumento(req.numeroDocumento())) {
            return ResponseEntity.badRequest()
                    .body("Ya existe un paciente con ese número de documento");
        }

        Paciente p = new Paciente();
        mapRequestToEntity(req, p);
        Paciente guardado = pacienteRepo.save(p);
        return ResponseEntity.status(HttpStatus.CREATED).body(PacienteDTO.toResponse(guardado));
    }

    // -------- PUT /api/pacientes/{id} --------
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id,
                                        @Valid @RequestBody PacienteDTO.Request req) {
        return pacienteRepo.findById(id)
                .filter(Paciente::getActivo)
                .map(p -> {
                    // Si cambió el documento, verifica unicidad
                    if (!p.getNumeroDocumento().equals(req.numeroDocumento())
                            && pacienteRepo.existsByNumeroDocumento(req.numeroDocumento())) {
                        return ResponseEntity.badRequest()
                                .<Object>body("Ese número de documento ya existe");
                    }
                    mapRequestToEntity(req, p);
                    return ResponseEntity.<Object>ok(PacienteDTO.toResponse(pacienteRepo.save(p)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // -------- DELETE /api/pacientes/{id} (soft delete) --------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        return pacienteRepo.findById(id)
                .filter(Paciente::getActivo)
                .map(p -> {
                    p.setActivo(false);
                    pacienteRepo.save(p);
                    return ResponseEntity.ok().body("Paciente eliminado");
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ---- Helper: mapea DTO → entidad ----
    private void mapRequestToEntity(PacienteDTO.Request req, Paciente p) {
        p.setNombre(req.nombre());
        p.setApellido(req.apellido());
        p.setTipoDocumento(req.tipoDocumento());
        p.setNumeroDocumento(req.numeroDocumento());
        p.setFechaNacimiento(req.fechaNacimiento());
        p.setGenero(req.genero());
        p.setTelefono(req.telefono());
        p.setEmail(req.email());
        p.setDireccion(req.direccion());
        p.setCiudad(req.ciudad());
        p.setTipoSangre(req.tipoSangre());
        p.setContactoEmergenciaNombre(req.contactoEmergenciaNombre());
        p.setContactoEmergenciaTelefono(req.contactoEmergenciaTelefono());
    }
}
