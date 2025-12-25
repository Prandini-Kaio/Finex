package com.prandini.financecontroller.web.dto;

import java.util.List;

public record PersonRequest(
        String name,
        Boolean allowSplit,
        List<Long> splitWithPersonIds
) {
}

