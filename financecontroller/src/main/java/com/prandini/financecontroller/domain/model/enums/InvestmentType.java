package com.prandini.financecontroller.domain.model.enums;

import lombok.Getter;

@Getter
public enum InvestmentType {
    TESOURO_DIRETO("Tesouro Direto", "Investimento em títulos públicos"),
    CDB("CDB", "Certificado de Depósito Bancário"),
    POUPANCA("Poupança", "Caderneta de poupança"),
    LCI("LCI", "Letra de Crédito Imobiliário"),
    LCA("LCA", "Letra de Crédito do Agronegócio"),
    FUNDO_INVESTIMENTO("Fundo de Investimento", "Fundo de investimento conservador"),
    ACAO("Ação", "Ações na bolsa de valores"),
    FII("FII", "Fundos Imobiliários"),
    OUTROS("Outros", "Outros tipos de investimento");

    private final String label;
    private final String description;

    InvestmentType(String label, String description) {
        this.label = label;
        this.description = description;
    }
}

