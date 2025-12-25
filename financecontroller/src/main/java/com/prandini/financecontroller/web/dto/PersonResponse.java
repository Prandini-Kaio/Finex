package com.prandini.financecontroller.web.dto;

import java.util.List;

public record PersonResponse(
        Long id,
        String name,
        Boolean active,
        Boolean allowSplit,
        List<Long> splitWithPersonIds
) {
}

