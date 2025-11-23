package com.prandini.financecontroller.domain.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.prandini.financecontroller.shared.util.EnumUtils;

public enum Person {
    KAIO("Kaio"),
    GABRIELA("Gabriela"),
    AMBOS("Ambos");

    private final String label;

    Person(String label) {
        this.label = label;
    }

    @JsonValue
    public String getLabel() {
        return label;
    }

    @JsonCreator
    public static Person fromLabel(String value) {
        return EnumUtils.fromLabel(value, Person.values(), Person::getLabel);
    }
}

