package co.geolotes.lotes.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Locale;

/*
 * Al arrancar, crea la cuenta del vendedor si todavía no existe.
 * La contraseña viene de VENDEDOR_CLAVE y se guarda solo como huella PBKDF2.
 * Si la cuenta ya existe no se toca: cambiar VENDEDOR_CLAVE después no cambia la clave guardada.
 */
@Component
public class VendedorInicial implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(VendedorInicial.class);

    private final JdbcTemplate jdbc;
    private final String usuario;
    private final String nombre;
    private final String clave;

    public VendedorInicial(JdbcTemplate jdbc,
                           @Value("${geolotes.vendedor.usuario}") String usuario,
                           @Value("${geolotes.vendedor.nombre}") String nombre,
                           @Value("${geolotes.vendedor.clave}") String clave) {
        this.jdbc = jdbc;
        this.usuario = usuario.trim().toLowerCase(Locale.ROOT);
        if (!this.usuario.matches("[a-z0-9._-]{3,40}")) {
            throw new IllegalStateException("VENDEDOR_USUARIO solo admite letras, números, punto, guion y guion bajo (3 a 40)");
        }
        this.nombre = nombre;
        this.clave = clave;
    }

    @Override
    public void run(ApplicationArguments args) {
        Integer existe = jdbc.queryForObject("SELECT COUNT(*) FROM vendedores WHERE usuario = ?", Integer.class, usuario);
        if (existe != null && existe > 0) return;

        jdbc.update("INSERT INTO vendedores (usuario, nombre, clave_hash) VALUES (?, ?, ?)",
                usuario, nombre, ClaveSegura.cifrar(clave));
        log.info("Cuenta del vendedor creada: {}", usuario);
    }
}
