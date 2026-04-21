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
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired private AuthenticationManager authManager;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private UsuarioRepository usuarioRepo;
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
}
