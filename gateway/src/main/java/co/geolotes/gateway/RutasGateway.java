package co.geolotes.gateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/*
 * Punto único de entrada (puerto 8080). El navegador solo conoce /api/...; el Gateway decide
 * a qué servicio va cada petición y le quita el prefijo /api (StripPrefix=1):
 *
 *   /api/lotes/**   -> lotes-service   (8081)  /lotes/**
 *   /api/auth/**    -> lotes-service   (8081)  /auth/**      inicio de sesión del vendedor
 *   /api/visitas/** -> visitas-service (8082)  /visitas/**
 *
 * El Gateway no valida el token: deja pasar la cabecera Authorization y cada servicio la verifica
 * por su cuenta. Así visitas-service sigue funcionando aunque lotes-service esté caído (AP).
 * La cabecera X-Servicio dice qué servicio respondió (útil para depurar y para la demo).
 */
@Configuration
public class RutasGateway {

    @Bean
    public RouteLocator rutas(RouteLocatorBuilder builder,
                              @Value("${geolotes.servicios.lotes}") String lotes,
                              @Value("${geolotes.servicios.visitas}") String visitas) {
        return builder.routes()
                .route("lotes", r -> r.path("/api/lotes", "/api/lotes/**")
                        .filters(f -> f.stripPrefix(1).addResponseHeader("X-Servicio", "lotes-service"))
                        .uri(lotes))
                .route("auth", r -> r.path("/api/auth/**")
                        .filters(f -> f.stripPrefix(1).addResponseHeader("X-Servicio", "lotes-service"))
                        .uri(lotes))
                .route("visitas", r -> r.path("/api/visitas", "/api/visitas/**")
                        .filters(f -> f.stripPrefix(1).addResponseHeader("X-Servicio", "visitas-service"))
                        .uri(visitas))
                .build();
    }
}
