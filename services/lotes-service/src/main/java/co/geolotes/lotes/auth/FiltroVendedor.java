package co.geolotes.lotes.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.Optional;
import java.util.Set;

/*
 * Consultar lotes es público (GET). Crear, editar, cambiar estado, borrar o subir videos
 * exige el token del vendedor en la cabecera Authorization.
 */
@Component
public class FiltroVendedor implements HandlerInterceptor {

    private static final Set<String> METODOS_PUBLICOS = Set.of("GET", "HEAD", "OPTIONS");

    private final TokenJwt tokens;

    public FiltroVendedor(TokenJwt tokens) {
        this.tokens = tokens;
    }

    @Override
    public boolean preHandle(HttpServletRequest peticion, HttpServletResponse respuesta, Object manejador)
            throws IOException {
        if (METODOS_PUBLICOS.contains(peticion.getMethod())) return true;

        String cabecera = peticion.getHeader(HttpHeaders.AUTHORIZATION);
        String token = cabecera != null && cabecera.startsWith("Bearer ") ? cabecera.substring(7).trim() : null;
        Optional<String> usuario = tokens.verificar(token);
        if (usuario.isPresent()) {
            peticion.setAttribute("vendedor", usuario.get());
            return true;
        }

        respuesta.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        respuesta.setHeader(HttpHeaders.WWW_AUTHENTICATE, "Bearer");
        respuesta.setContentType("application/json;charset=UTF-8");
        respuesta.getWriter().write("{\"mensaje\":\"Inicia sesión como vendedor para hacer este cambio.\"}");
        return false;
    }
}
