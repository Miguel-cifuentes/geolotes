package co.geolotes.visitas.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/*
 * Verifica el token JWT (HS256) que emite lotes-service al iniciar sesión.
 * Se valida aquí mismo con el secreto compartido: visitas-service no llama a lotes-service,
 * así sigue recibiendo y mostrando visitas aunque lotes-service esté caído (AP).
 */
@Component
public class VerificadorToken {

    private static final Base64.Encoder B64 = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder B64_LECTOR = Base64.getUrlDecoder();

    // Solo se acepta esta cabecera exacta: así nadie puede mandar un token con "alg":"none"
    private static final String CABECERA =
            B64.encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));

    private static final Pattern SUB = Pattern.compile("\"sub\":\"([a-z0-9._-]+)\"");
    private static final Pattern EXP = Pattern.compile("\"exp\":(\\d+)");

    private final SecretKeySpec llave;

    public VerificadorToken(@Value("${geolotes.auth.secreto}") String secreto) {
        byte[] bytes = secreto.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("geolotes.auth.secreto (JWT_SECRETO) debe tener al menos 32 caracteres");
        }
        this.llave = new SecretKeySpec(bytes, "HmacSHA256");
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

}
