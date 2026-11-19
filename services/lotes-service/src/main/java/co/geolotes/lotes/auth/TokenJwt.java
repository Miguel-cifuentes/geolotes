package co.geolotes.lotes.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/*
 * Token JWT firmado con HMAC-SHA256 (HS256), escrito solo con el JDK.
 * lotes-service lo emite al iniciar sesión; lotes-service y visitas-service lo verifican
 * cada uno por su cuenta con el mismo secreto, sin llamarse entre sí.
 */
@Component
public class TokenJwt {

    private static final Base64.Encoder B64 = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder B64_LECTOR = Base64.getUrlDecoder();

    // Solo se acepta esta cabecera exacta: así nadie puede mandar un token con "alg":"none"
    private static final String CABECERA =
            B64.encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));

    private static final Pattern SUB = Pattern.compile("\"sub\":\"([a-z0-9._-]+)\"");
    private static final Pattern EXP = Pattern.compile("\"exp\":(\\d+)");

    private final SecretKeySpec llave;
    private final Duration duracion;

    public TokenJwt(@Value("${geolotes.auth.secreto}") String secreto,
                    @Value("${geolotes.auth.duracion-horas:8}") long horas) {
        byte[] bytes = secreto.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("geolotes.auth.secreto (JWT_SECRETO) debe tener al menos 32 caracteres");
        }
        this.llave = new SecretKeySpec(bytes, "HmacSHA256");
        this.duracion = Duration.ofHours(horas);
    }

    public record Emitido(String token, Instant expira) {}

    public Emitido emitir(String usuario, String nombre) {
        Instant ahora = Instant.now();
        Instant expira = ahora.plus(duracion);
        String datos = "{\"sub\":\"" + aJson(usuario) + "\",\"nombre\":\"" + aJson(nombre)
                + "\",\"rol\":\"VENDEDOR\",\"iat\":" + ahora.getEpochSecond()
                + ",\"exp\":" + expira.getEpochSecond() + "}";
        String cuerpo = CABECERA + "." + B64.encodeToString(datos.getBytes(StandardCharsets.UTF_8));
        return new Emitido(cuerpo + "." + B64.encodeToString(firmar(cuerpo)), expira);
    }

    // Devuelve el usuario si el token es auténtico y no ha vencido
    public Optional<String> verificar(String token) {
        if (token == null) return Optional.empty();
        String[] partes = token.split("\\.", -1);
        if (partes.length != 3 || !partes[0].equals(CABECERA)) return Optional.empty();

        try {
            byte[] recibida = B64_LECTOR.decode(partes[2]);
            // Comparación en tiempo constante: no revela cuántos bytes coinciden
            if (!MessageDigest.isEqual(firmar(partes[0] + "." + partes[1]), recibida)) return Optional.empty();

            String datos = new String(B64_LECTOR.decode(partes[1]), StandardCharsets.UTF_8);
            Matcher exp = EXP.matcher(datos);
            Matcher sub = SUB.matcher(datos);
            if (!exp.find() || !sub.find()) return Optional.empty();
            if (Instant.now().getEpochSecond() >= Long.parseLong(exp.group(1))) return Optional.empty();
            return Optional.of(sub.group(1));
        } catch (IllegalArgumentException e) {
            return Optional.empty(); // Base64 o número mal formado
        }
    }

    private byte[] firmar(String contenido) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(llave);
            return mac.doFinal(contenido.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("No se pudo firmar el token", e);
        }
    }

    private static String aJson(String texto) {
        StringBuilder sb = new StringBuilder();
        for (char c : texto.toCharArray()) {
            if (c == '"' || c == '\\') sb.append('\\').append(c);
            else if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
            else sb.append(c);
        }
        return sb.toString();
    }
}
