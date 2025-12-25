package com.prandini.financecontroller.domain.repository;

import com.prandini.financecontroller.domain.model.SavingsGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SavingsGoalRepository extends JpaRepository<SavingsGoal, Long> {
    @Modifying
    @Query("UPDATE SavingsGoal sg SET sg.owner.id = :newPersonId WHERE sg.owner.id = :oldPersonId")
    void updateOwnerId(@Param("oldPersonId") Long oldPersonId, @Param("newPersonId") Long newPersonId);
    
    @Modifying
    @Query("DELETE FROM SavingsGoal sg WHERE sg.owner.id = :personId")
    void deleteByOwnerId(@Param("personId") Long personId);
}

