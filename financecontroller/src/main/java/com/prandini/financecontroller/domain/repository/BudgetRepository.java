package com.prandini.financecontroller.domain.repository;

import com.prandini.financecontroller.domain.model.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BudgetRepository extends JpaRepository<Budget, Long> {
    @Modifying
    @Query("UPDATE Budget b SET b.person.id = :newPersonId WHERE b.person.id = :oldPersonId")
    void updatePersonId(@Param("oldPersonId") Long oldPersonId, @Param("newPersonId") Long newPersonId);
    
    @Modifying
    @Query("DELETE FROM Budget b WHERE b.person.id = :personId")
    void deleteByPersonId(@Param("personId") Long personId);
}

