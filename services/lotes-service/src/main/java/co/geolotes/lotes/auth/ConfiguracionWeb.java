package co.geolotes.lotes.auth;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class ConfiguracionWeb implements WebMvcConfigurer {

    private final FiltroVendedor filtro;

    public ConfiguracionWeb(FiltroVendedor filtro) {
        this.filtro = filtro;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registro) {
        // /auth/login no pasa por el filtro: es la puerta de entrada
        registro.addInterceptor(filtro).addPathPatterns("/lotes", "/lotes/**");
    }
}
