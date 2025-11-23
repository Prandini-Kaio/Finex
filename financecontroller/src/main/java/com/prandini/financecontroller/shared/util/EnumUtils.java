package com.prandini.financecontroller.shared.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Function;

public final class EnumUtils {

    private EnumUtils() {
    }

    public static <T extends Enum<T>> T fromLabel(String label, T[] values, Function<T, String> labelExtractor) {
        if (label == null) {
            throw new IllegalArgumentException("Valor não pode ser nulo");
        }
        String normalizedTarget = normalize(label);
        for (T value : values) {
            if (normalize(labelExtractor.apply(value)).equals(normalizedTarget)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Valor inválido: " + label);
    }

    private static String normalize(String input) {
        return Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toUpperCase(Locale.ROOT);
    }
}

