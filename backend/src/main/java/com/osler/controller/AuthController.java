package com.osler.controller;

import com.osler.dto.AuthDTOs;
import com.osler.entity.Rol;
import com.osler.entity.Usuario;
import com.osler.repository.UsuarioRepository;
import com.osler.security.JwtUtil;
import jakarta.persistence.EntityManager;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import com.osler.repository.DoctorRepository;
import com.osler.repository.PacienteRepository;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired private AuthenticationManager authManager;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private UsuarioRepository usuarioRepo;
    @Autowired private DoctorRepository doctorRepo;
    @Autowired private PacienteRepository pacienteRepo;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EntityManager entityManager;

    /**
     * POST /api/auth/login
     * Body: { "email": "...", "password": "..." }
     * Retorna el JWT si las credenciales son correctas
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthDTOs.LoginRequest req) {
        try {
            Authentication auth = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.email(), req.password()));

            String token = jwtUtil.generateToken(auth);

            Usuario usuario = usuarioRepo.findByEmail(req.email()).orElseThrow();

            return ResponseEntity.ok(new AuthDTOs.LoginResponse(
                    token, "Bearer",
                    usuario.getId(),
                    usuario.getNombre(), usuario.getApellido(),
                    usuario.getEmail(),
                    usuario.getRol().getNombre()
            ));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401)
                    .body(new AuthDTOs.MessageResponse("Credenciales inválidas"));
        }
    }

    /**
     * POST /api/auth/register
     * Crea un nuevo usuario (solo admin debería poder hacer esto en producción)
     */
    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> register(@Valid @RequestBody AuthDTOs.RegisterRequest req) {
        if (usuarioRepo.existsByEmail(req.email())) {
            return ResponseEntity.badRequest()
                    .body(new AuthDTOs.MessageResponse("El email ya está registrado"));
        }

        Long rolId = req.rolId() != null ? req.rolId() : 3L; // RECEPCIONISTA por defecto
        Rol rol = entityManager.find(Rol.class, rolId);
        if (rol == null) {
            return ResponseEntity.badRequest()
                    .body(new AuthDTOs.MessageResponse("Rol no encontrado"));
        }

        Usuario nuevo = new Usuario();
        nuevo.setNombre(req.nombre());
        nuevo.setApellido(req.apellido());
        nuevo.setEmail(req.email());
        nuevo.setPasswordHash(passwordEncoder.encode(req.password()));
        nuevo.setRol(rol);
        nuevo.setActivo(true);

        usuarioRepo.save(nuevo);
        return ResponseEntity.ok(new AuthDTOs.MessageResponse("Usuario registrado exitosamente"));
    }

    @PostMapping("/register-paciente")
    @Transactional
    public ResponseEntity<?> registerPaciente(@Valid @RequestBody AuthDTOs.RegisterPacienteRequest req) {
        if (usuarioRepo.existsByEmail(req.email())) {
            return ResponseEntity.badRequest()
                    .body(new AuthDTOs.MessageResponse("El email ya está registrado"));
        }

        // Rol de Paciente es ID 4 en nuestra BD modificada
        Rol rol = entityManager.find(Rol.class, 4L);
        if (rol == null) {
            return ResponseEntity.status(500).body(new AuthDTOs.MessageResponse("Rol PACIENTE no configurado en BD"));
        }

        // Crear el Usuario
        Usuario nuevoUsuario = new Usuario();
        nuevoUsuario.setNombre(req.nombre());
        nuevoUsuario.setApellido(req.apellido());
        nuevoUsuario.setEmail(req.email());
        nuevoUsuario.setPasswordHash(passwordEncoder.encode(req.password()));
        nuevoUsuario.setRol(rol);
        nuevoUsuario.setActivo(true);
        usuarioRepo.save(nuevoUsuario);

        // Crear el Paciente
        com.osler.entity.Paciente nuevoPaciente = new com.osler.entity.Paciente();
        nuevoPaciente.setNombre(req.nombre());
        nuevoPaciente.setApellido(req.apellido());
        nuevoPaciente.setEmail(req.email());
        try {
            nuevoPaciente.setTipoDocumento(com.osler.entity.Paciente.TipoDocumento.valueOf(req.tipoDocumento()));
            nuevoPaciente.setGenero(com.osler.entity.Paciente.Genero.valueOf(req.genero()));
            nuevoPaciente.setFechaNacimiento(java.time.LocalDate.parse(req.fechaNacimiento()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthDTOs.MessageResponse("Datos inválidos (tipoDocumento, genero, fechaNacimiento)"));
        }
        nuevoPaciente.setNumeroDocumento(req.numeroDocumento());
        nuevoPaciente.setTelefono(req.telefono());
        nuevoPaciente.setDireccion(req.direccion());
        nuevoPaciente.setCiudad(req.ciudad());
        nuevoPaciente.setContactoEmergenciaNombre(req.contactoEmergenciaNombre());
        nuevoPaciente.setContactoEmergenciaTelefono(req.contactoEmergenciaTelefono());
        nuevoPaciente.setActivo(true);
        
        entityManager.persist(nuevoPaciente);

        return ResponseEntity.ok(new AuthDTOs.MessageResponse("Paciente registrado exitosamente. Ya puede iniciar sesión."));
    }

    @PostMapping("/change-password")
    @Transactional
    public ResponseEntity<?> changePassword(@Valid @RequestBody AuthDTOs.ChangePasswordRequest req) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = usuarioRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!passwordEncoder.matches(req.oldPassword(), usuario.getPasswordHash())) {
            return ResponseEntity.badRequest().body(new AuthDTOs.MessageResponse("La contraseña actual es incorrecta"));
        }

        usuario.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        usuarioRepo.save(usuario);

        return ResponseEntity.ok(new AuthDTOs.MessageResponse("Contraseña actualizada exitosamente"));
    }

    @PutMapping("/update-profile")
    @Transactional
    public ResponseEntity<?> updateProfile(@Valid @RequestBody AuthDTOs.UpdateProfileRequest req) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = usuarioRepo.findByEmail(email)
                .orElse(null);
        if (usuario == null) throw new RuntimeException("Usuario no encontrado");

        // Actualizar datos en la entidad Usuario (nombre/apellido)
        if (req.nombre() != null) usuario.setNombre(req.nombre());
        if (req.apellido() != null) usuario.setApellido(req.apellido());
        usuarioRepo.save(usuario);

        // Actualizar datos específicos según el rol
        String rol = usuario.getRol().getNombre();
        if ("DOCTOR".equals(rol)) {
            doctorRepo.findByEmail(email).ifPresent(d -> {
                if (d != null) {
                    if (req.nombre() != null) d.setNombre(req.nombre());
                    if (req.apellido() != null) d.setApellido(req.apellido());
                    if (req.telefono() != null) d.setTelefono(req.telefono());
                    doctorRepo.save(d);
                }
            });
        } else if ("PACIENTE".equals(rol)) {
            pacienteRepo.findByEmail(email).ifPresent(p -> {
                if (p != null) {
                    if (req.nombre() != null) p.setNombre(req.nombre());
                    if (req.apellido() != null) p.setApellido(req.apellido());
                    if (req.telefono() != null) p.setTelefono(req.telefono());
                    if (req.direccion() != null) p.setDireccion(req.direccion());
                    if (req.ciudad() != null) p.setCiudad(req.ciudad());
                    if (req.contactoEmergenciaNombre() != null) p.setContactoEmergenciaNombre(req.contactoEmergenciaNombre());
                    if (req.contactoEmergenciaTelefono() != null) p.setContactoEmergenciaTelefono(req.contactoEmergenciaTelefono());
                    pacienteRepo.save(p);
                }
            });
        }

        return ResponseEntity.ok(new AuthDTOs.MessageResponse("Perfil actualizado exitosamente"));
    }
}
