package com.prandini.financecontroller.domain.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.prandini.financecontroller.shared.util.EnumUtils;

public enum PaymentMethod {
    CREDITO("Crédito"),
    DEBITO("Débito"),
    DINHEIRO("Dinheiro"),
    PIX("PIX");

    private final String label;

    PaymentMethod(String label) {
        this.label = label;
    }

    @JsonValue
    public String getLabel() {
        return label;
    }

    @JsonCreator
    public static PaymentMethod fromLabel(String value) {
        return EnumUtils.fromLabel(value, PaymentMethod.values(), PaymentMethod::getLabel);
    }
}

