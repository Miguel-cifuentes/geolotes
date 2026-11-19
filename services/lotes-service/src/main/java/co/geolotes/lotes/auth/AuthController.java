package co.geolotes.lotes.auth;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

// Ruta /auth (sin /api): el Gateway recibirá /api/auth y quitará el prefijo
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService servicio;

    public AuthController(AuthService servicio) {
        this.servicio = servicio;
    }

    // Público: devuelve el token que el panel del vendedor manda en "Authorization: Bearer ..."
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest datos) {
        return servicio.iniciarSesion(datos);
    }
}
