package com.prandini.financecontroller.domain.repository;

import com.prandini.financecontroller.domain.model.SavingsDeposit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavingsDepositRepository extends JpaRepository<SavingsDeposit, Long> {
}

