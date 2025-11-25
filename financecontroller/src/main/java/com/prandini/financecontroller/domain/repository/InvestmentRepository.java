package com.prandini.financecontroller.domain.repository;

import com.prandini.financecontroller.domain.model.Investment;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InvestmentRepository extends JpaRepository<Investment, Long> {
    List<Investment> findByOwner(com.prandini.financecontroller.domain.model.enums.Person owner, Sort sort);
}

