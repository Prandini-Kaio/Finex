package com.prandini.financecontroller.web.dto;

public record DeletePersonRequest(
        Long migrateToPersonId,
        Boolean deleteTransactions
) {
}

