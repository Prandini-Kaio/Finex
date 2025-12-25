package com.prandini.financecontroller.domain.repository;

import com.prandini.financecontroller.domain.model.SavingsDeposit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SavingsDepositRepository extends JpaRepository<SavingsDeposit, Long> {
    
    @Query("SELECT sd FROM SavingsDeposit sd ORDER BY sd.date DESC")
    List<SavingsDeposit> findAllOrderByDateDesc();
    @Modifying
    @Query("UPDATE SavingsDeposit sd SET sd.person.id = :newPersonId WHERE sd.person.id = :oldPersonId")
    void updatePersonId(@Param("oldPersonId") Long oldPersonId, @Param("newPersonId") Long newPersonId);
    
    @Modifying
    @Query("DELETE FROM SavingsDeposit sd WHERE sd.person.id = :personId")
    void deleteByPersonId(@Param("personId") Long personId);
}

