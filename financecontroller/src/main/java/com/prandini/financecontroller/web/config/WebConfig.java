package com.prandini.financecontroller.web.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String[] allowedOrigins;

    @Value("${app.cors.allow-all-origins:false}")
    private boolean allowAllOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        var corsRegistration = registry.addMapping("/api/**")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);

        if (allowAllOrigins) {
            // Permite qualquer origem (útil para desenvolvimento em rede local)
            // Usa padrão que funciona com IPs e hostnames
            // Quando allowAllOrigins é true, não podemos usar allowCredentials(true)
            // O padrão "*" funciona com http://, https://, IPs e hostnames
            // Adiciona também padrões específicos para IPs comuns
            corsRegistration.allowedOriginPatterns(
                    "*",
                    "http://*",
                    "https://*",
                    "http://*:*",
                    "https://*:*"
            );
        } else {
            // Usa as origens específicas configuradas
            corsRegistration.allowedOrigins(allowedOrigins)
                    .allowCredentials(true);
        }
    }
}

