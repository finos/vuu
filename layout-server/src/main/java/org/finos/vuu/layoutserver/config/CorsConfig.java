package org.finos.vuu.layoutserver.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                        "http://127.0.0.1:5173",
                        "https://127.0.0.1:5173",
                        "http://127.0.0.1:8443/",
                        "https://127.0.0.1:8443/"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE");
    }
}
