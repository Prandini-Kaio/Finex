package com.prandini.financecontroller.domain.repository;

import com.prandini.financecontroller.domain.model.RecurringTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RecurringTransactionRepository extends JpaRepository<RecurringTransaction, Long> {
    List<RecurringTransaction> findByActiveTrue();
    
    @Modifying
    @Query("UPDATE RecurringTransaction rt SET rt.person.id = :newPersonId WHERE rt.person.id = :oldPersonId")
    void updatePersonId(@Param("oldPersonId") Long oldPersonId, @Param("newPersonId") Long newPersonId);
    
    @Modifying
    @Query("DELETE FROM RecurringTransaction rt WHERE rt.person.id = :personId")
    void deleteByPersonId(@Param("personId") Long personId);
}

