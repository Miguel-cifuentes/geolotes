package co.geolotes.lotes.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Escribe tu usuario")
        @Size(max = 40, message = "Máximo 40 caracteres")
        String usuario,

        @NotBlank(message = "Escribe tu contraseña")
        @Size(max = 100, message = "Máximo 100 caracteres")
        String clave
) {}
