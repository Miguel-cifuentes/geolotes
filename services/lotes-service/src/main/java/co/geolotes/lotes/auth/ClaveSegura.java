package co.geolotes.lotes.auth;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/*
 * Las contraseñas nunca se guardan: se guarda su huella PBKDF2-SHA256 con sal aleatoria.
 * Formato en la base: pbkdf2$iteraciones$sal$huella (sal y huella en Base64)
 */
public final class ClaveSegura {

    private static final int ITERACIONES = 210_000; // recomendación OWASP para PBKDF2-SHA256
    private static final int BITS = 256;
    private static final SecureRandom AZAR = new SecureRandom();

    private ClaveSegura() {}

    public static String cifrar(String clave) {
        byte[] sal = new byte[16];
        AZAR.nextBytes(sal);
        byte[] huella = pbkdf2(clave, sal, ITERACIONES, BITS);
        return "pbkdf2$" + ITERACIONES + "$" + Base64.getEncoder().encodeToString(sal)
                + "$" + Base64.getEncoder().encodeToString(huella);
    }

    public static boolean coincide(String clave, String guardada) {
        String[] partes = guardada.split("\\$");
        if (partes.length != 4 || !partes[0].equals("pbkdf2")) return false;
        try {
            int iteraciones = Integer.parseInt(partes[1]);
            byte[] sal = Base64.getDecoder().decode(partes[2]);
            byte[] esperada = Base64.getDecoder().decode(partes[3]);
            byte[] calculada = pbkdf2(clave, sal, iteraciones, esperada.length * 8);
            return MessageDigest.isEqual(esperada, calculada);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private static byte[] pbkdf2(String clave, byte[] sal, int iteraciones, int bits) {
        PBEKeySpec especificacion = new PBEKeySpec(clave.toCharArray(), sal, iteraciones, bits);
        try {
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(especificacion).getEncoded();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("PBKDF2 no está disponible", e);
        } finally {
            especificacion.clearPassword();
        }
    }
}
