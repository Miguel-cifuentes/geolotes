package co.geolotes.visitas.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.Optional;

/*
 * Solo pedir una visita es público (POST /visitas, el formulario del comprador).
 * Ver la lista de visitas o cambiar su estado exige el token del vendedor:
 * son datos personales protegidos por la Ley 1581.
 */
@Component
public class FiltroVendedor implements HandlerInterceptor {


    private final VerificadorToken tokens;

    public FiltroVendedor(VerificadorToken tokens) {
        this.tokens = tokens;
    }

    @Override
    public boolean preHandle(HttpServletRequest peticion, HttpServletResponse respuesta, Object manejador)
            throws IOException {
        String metodo = peticion.getMethod();
        boolean pedirVisita = metodo.equals("POST") && peticion.getRequestURI().equals("/visitas");
        if (pedirVisita || metodo.equals("OPTIONS")) return true;

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
        respuesta.getWriter().write("{\"mensaje\":\"Inicia sesión como vendedor para ver las visitas.\"}");
        return false;
    }
}
