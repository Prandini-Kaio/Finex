package com.prandini.financecontroller.domain.repository;

import com.prandini.financecontroller.domain.model.ClosedMonth;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClosedMonthRepository extends JpaRepository<ClosedMonth, Long> {
    Optional<ClosedMonth> findByCompetency(String competency);
    void deleteByCompetency(String competency);
    boolean existsByCompetency(String competency);
}

