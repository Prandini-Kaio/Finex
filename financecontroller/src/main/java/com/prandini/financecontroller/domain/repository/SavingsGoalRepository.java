package com.prandini.financecontroller.domain.repository;

import com.prandini.financecontroller.domain.model.SavingsGoal;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavingsGoalRepository extends JpaRepository<SavingsGoal, Long> {
}

