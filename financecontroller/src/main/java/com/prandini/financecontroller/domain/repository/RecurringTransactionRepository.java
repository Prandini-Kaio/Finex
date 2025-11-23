package com.prandini.financecontroller.domain.repository;

import com.prandini.financecontroller.domain.model.RecurringTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecurringTransactionRepository extends JpaRepository<RecurringTransaction, Long> {
    List<RecurringTransaction> findByActiveTrue();
}

