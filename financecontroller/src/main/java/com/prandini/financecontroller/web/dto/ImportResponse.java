package com.prandini.financecontroller.web.dto;

import java.util.List;

public record ImportResponse(
        int totalProcessed,
        int successCount,
        int errorCount,
        List<String> errors
) {
}


