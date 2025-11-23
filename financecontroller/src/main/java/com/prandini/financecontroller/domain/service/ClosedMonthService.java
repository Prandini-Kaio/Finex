package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.domain.model.ClosedMonth;
import com.prandini.financecontroller.domain.repository.ClosedMonthRepository;
import com.prandini.financecontroller.web.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClosedMonthService {

    private final ClosedMonthRepository closedMonthRepository;

    public List<String> listAll() {
        return closedMonthRepository.findAll().stream()
                .map(ClosedMonth::getCompetency)
                .sorted()
                .toList();
    }

    @Transactional
    public List<String> closeMonth(String competency) {
        if (closedMonthRepository.existsByCompetency(competency)) {
            throw new BadRequestException("Mês já fechado: " + competency);
        }
        closedMonthRepository.save(ClosedMonth.builder().competency(competency).build());
        return listAll();
    }

    @Transactional
    public List<String> reopenMonth(String competency) {
        closedMonthRepository.deleteByCompetency(competency);
        return listAll();
    }
}

