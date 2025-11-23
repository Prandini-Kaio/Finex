package com.prandini.financecontroller.domain.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.prandini.financecontroller.shared.util.EnumUtils;

public enum TransactionType {
    DESPESA("Despesa"),
    RECEITA("Receita");

    private final String label;

    TransactionType(String label) {
        this.label = label;
    }

    @JsonValue
    public String getLabel() {
        return label;
    }

    @JsonCreator
    public static TransactionType fromLabel(String value) {
        return EnumUtils.fromLabel(value, TransactionType.values(), TransactionType::getLabel);
    }
}

