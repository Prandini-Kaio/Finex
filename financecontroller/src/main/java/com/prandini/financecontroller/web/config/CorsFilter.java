package com.prandini.financecontroller.web.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsFilter implements Filter {

    @Value("${app.cors.allow-all-origins:false}")
    private boolean allowAllOrigins;

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        // Obtém a origem da requisição
        String origin = request.getHeader("Origin");

        // Se allowAllOrigins estiver ativo, permite qualquer origem
        if (allowAllOrigins) {
            if (origin != null) {
                response.setHeader("Access-Control-Allow-Origin", origin);
            } else {
                // Se não houver origem (requisição direta), permite qualquer origem
                response.setHeader("Access-Control-Allow-Origin", "*");
            }
        } else if (origin != null) {
            // Caso contrário, usa a origem da requisição
            response.setHeader("Access-Control-Allow-Origin", origin);
        }

        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "*");
        response.setHeader("Access-Control-Max-Age", "3600");
        
        // Só permite credentials se não for allowAllOrigins
        if (!allowAllOrigins) {
            response.setHeader("Access-Control-Allow-Credentials", "true");
        }

        // Se for uma requisição OPTIONS (preflight), retorna imediatamente
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        chain.doFilter(req, res);
    }

    @Override
    public void init(FilterConfig filterConfig) {
        // Não precisa de inicialização
    }

    @Override
    public void destroy() {
        // Não precisa de limpeza
    }
}

