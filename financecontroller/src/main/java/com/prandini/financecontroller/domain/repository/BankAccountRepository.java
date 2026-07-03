package com.prandini.financecontroller.domain.repository;

import com.prandini.financecontroller.domain.model.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {
    List<BankAccount> findByActiveTrueOrderByNameAsc();
    List<BankAccount> findByOwnerIdAndActiveTrueOrderByNameAsc(Long ownerId);
}
