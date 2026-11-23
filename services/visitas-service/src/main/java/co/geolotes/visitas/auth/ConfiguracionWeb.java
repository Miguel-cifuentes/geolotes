package co.geolotes.visitas.auth;

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
        registro.addInterceptor(filtro).addPathPatterns("/visitas", "/visitas/**");
    }
}
