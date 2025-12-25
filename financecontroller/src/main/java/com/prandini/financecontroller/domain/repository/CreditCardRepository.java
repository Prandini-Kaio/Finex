package com.prandini.financecontroller.domain.repository;

import com.prandini.financecontroller.domain.model.CreditCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CreditCardRepository extends JpaRepository<CreditCard, Long> {
    @Modifying
    @Query("UPDATE CreditCard cc SET cc.owner.id = :newPersonId WHERE cc.owner.id = :oldPersonId")
    void updateOwnerId(@Param("oldPersonId") Long oldPersonId, @Param("newPersonId") Long newPersonId);
    
    @Modifying
    @Query("DELETE FROM CreditCard cc WHERE cc.owner.id = :personId")
    void deleteByOwnerId(@Param("personId") Long personId);
}

