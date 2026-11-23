package co.geolotes.gateway;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/*
 * Registra cada petición que pasa por el Gateway (método, ruta, estado y milisegundos)
 * y devuelve el tiempo en la cabecera X-Tiempo-Gateway.
 */
@Component
public class FiltroRegistro implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(FiltroRegistro.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long inicio = System.nanoTime();
        // La cabecera se escribe justo antes de enviar la respuesta, cuando ya se conoce el tiempo
        exchange.getResponse().beforeCommit(() -> {
            long ms = (System.nanoTime() - inicio) / 1_000_000;
            exchange.getResponse().getHeaders().set("X-Tiempo-Gateway", ms + "ms");
            return Mono.empty();
        });
        return chain.filter(exchange).doFinally(senal -> {
            long ms = (System.nanoTime() - inicio) / 1_000_000;
            var peticion = exchange.getRequest();
            log.info("{} {} -> {} ({} ms)", peticion.getMethod(), peticion.getURI().getRawPath(),
                    exchange.getResponse().getStatusCode(), ms);
        });
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE; // primero en entrar, último en salir: mide todo
    }
}
