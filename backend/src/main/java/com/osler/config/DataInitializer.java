package com.osler.config;

import com.osler.entity.Rol;
import com.osler.entity.Usuario;
import com.osler.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EntityManager entityManager;

    @Override
    @Transactional
    public void run(String... args) {
        // Solo crea admin si no existe
        if (!usuarioRepository.existsByEmail("admin@osler.com")) {
            Rol rolAdmin = entityManager.find(Rol.class, 1L);

            Usuario admin = new Usuario();
            admin.setNombre("Admin");
            admin.setApellido("Osler");
            admin.setEmail("admin@osler.com");
            admin.setPasswordHash(passwordEncoder.encode("Admin123!"));
            admin.setRol(rolAdmin);
            admin.setActivo(true);

            usuarioRepository.save(admin);
            System.out.println("✅ Usuario admin creado: admin@osler.com / Admin123!");
        } else {
            // Actualiza el hash si el que está en BD es el placeholder del SQL
            Usuario admin = usuarioRepository.findByEmail("admin@osler.com").get();
            if (admin.getPasswordHash().startsWith("$2a$10$placeholder")) {
                admin.setPasswordHash(passwordEncoder.encode("Admin123!"));
                usuarioRepository.save(admin);
                System.out.println("✅ Hash del admin actualizado");
            }
        }
    }
}
