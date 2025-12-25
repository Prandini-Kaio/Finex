package com.prandini.financecontroller.domain.repository;

import com.prandini.financecontroller.domain.model.Investment;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InvestmentRepository extends JpaRepository<Investment, Long> {
    @Modifying
    @Query("UPDATE Investment i SET i.owner.id = :newPersonId WHERE i.owner.id = :oldPersonId")
    void updateOwnerId(@Param("oldPersonId") Long oldPersonId, @Param("newPersonId") Long newPersonId);
    
    @Modifying
    @Query("DELETE FROM Investment i WHERE i.owner.id = :personId")
    void deleteByOwnerId(@Param("personId") Long personId);
}

