package co.geolotes.lotes.auth;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    // Después de 5 intentos fallidos, el usuario queda bloqueado 5 minutos (frena a quien adivina claves)
    private static final int MAXIMO_FALLOS = 5;
    private static final Duration BLOQUEO = Duration.ofMinutes(5);

    // Si el usuario no existe se compara contra esta huella, para tardar lo mismo
    // y no revelar qué usuarios existen
    private static final String HUELLA_FICTICIA = ClaveSegura.cifrar("clave-ficticia-geolotes");

    private record Intentos(int fallos, Instant bloqueadoHasta) {}

    private final JdbcTemplate jdbc;
    private final TokenJwt tokens;
    private final Map<String, Intentos> intentos = new ConcurrentHashMap<>();

    public AuthService(JdbcTemplate jdbc, TokenJwt tokens) {
        this.jdbc = jdbc;
        this.tokens = tokens;
    }

    public LoginResponse iniciarSesion(LoginRequest datos) {
        String usuario = datos.usuario().trim().toLowerCase(Locale.ROOT);

        Intentos previos = intentos.get(usuario);
        if (previos != null && previos.bloqueadoHasta() != null && Instant.now().isBefore(previos.bloqueadoHasta())) {
            long minutos = Duration.between(Instant.now(), previos.bloqueadoHasta()).toMinutes() + 1;
            throw new AutenticacionException(HttpStatus.TOO_MANY_REQUESTS,
                    "Demasiados intentos fallidos. Espera " + minutos + " min e intenta de nuevo.");
        }

        List<Map<String, Object>> filas =
                jdbc.queryForList("SELECT nombre, clave_hash FROM vendedores WHERE usuario = ?", usuario);
        String huella = filas.isEmpty() ? HUELLA_FICTICIA : (String) filas.get(0).get("clave_hash");
        boolean correcta = ClaveSegura.coincide(datos.clave(), huella) && !filas.isEmpty();

        if (!correcta) {
            registrarFallo(usuario);
            // El mismo mensaje para usuario o clave: no se revela cuál de los dos falló
            throw new AutenticacionException(HttpStatus.UNAUTHORIZED, "Usuario o contraseña incorrectos.");
        }

        intentos.remove(usuario);
        String nombre = (String) filas.get(0).get("nombre");
        TokenJwt.Emitido emitido = tokens.emitir(usuario, nombre);
        return new LoginResponse(emitido.token(), usuario, nombre, emitido.expira().toEpochMilli());
    }

    private void registrarFallo(String usuario) {
        intentos.compute(usuario, (clave, previos) -> {
            boolean reiniciar = previos == null
                    || (previos.bloqueadoHasta() != null && Instant.now().isAfter(previos.bloqueadoHasta()));
            int fallos = reiniciar ? 1 : previos.fallos() + 1;
            return new Intentos(fallos, fallos >= MAXIMO_FALLOS ? Instant.now().plus(BLOQUEO) : null);
        });
    }
}
