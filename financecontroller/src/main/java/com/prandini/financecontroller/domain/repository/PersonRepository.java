package com.prandini.financecontroller.domain.repository;

import com.prandini.financecontroller.domain.model.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PersonRepository extends JpaRepository<Person, Long> {
    Optional<Person> findByName(String name);
    
    @EntityGraph(attributePaths = {"splitWithPersons"})
    List<Person> findByActiveTrueOrderByName();
    
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.person.id = :personId")
    long countTransactionsByPersonId(Long personId);
    
    @Query("SELECT COUNT(b) FROM Budget b WHERE b.person.id = :personId")
    long countBudgetsByPersonId(Long personId);
    
    @Query("SELECT COUNT(rt) FROM RecurringTransaction rt WHERE rt.person.id = :personId")
    long countRecurringTransactionsByPersonId(Long personId);
    
    @Query("SELECT COUNT(sd) FROM SavingsDeposit sd WHERE sd.person.id = :personId")
    long countSavingsDepositsByPersonId(Long personId);
    
    @Query("SELECT COUNT(cc) FROM CreditCard cc WHERE cc.owner.id = :personId")
    long countCreditCardsByPersonId(Long personId);
    
    @Query("SELECT COUNT(sg) FROM SavingsGoal sg WHERE sg.owner.id = :personId")
    long countSavingsGoalsByPersonId(Long personId);
    
    @Query("SELECT COUNT(i) FROM Investment i WHERE i.owner.id = :personId")
    long countInvestmentsByPersonId(Long personId);
}

