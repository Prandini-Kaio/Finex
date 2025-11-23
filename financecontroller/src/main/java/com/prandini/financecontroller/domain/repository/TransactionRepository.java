package com.prandini.financecontroller.domain.repository;

import com.prandini.financecontroller.domain.model.Transaction;
import com.prandini.financecontroller.domain.model.enums.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByCompetencyAndType(String competency, TransactionType type);
    
    @Query("SELECT t FROM Transaction t WHERE t.date >= :startDate AND t.date <= :endDate ORDER BY t.date DESC, t.id DESC")
    List<Transaction> findByDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}

