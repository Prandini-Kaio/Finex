package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.domain.model.Investment;
import com.prandini.financecontroller.domain.model.Person;
import com.prandini.financecontroller.domain.repository.InvestmentRepository;
import com.prandini.financecontroller.domain.repository.PersonRepository;
import com.prandini.financecontroller.web.dto.InvestmentRequest;
import com.prandini.financecontroller.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InvestmentService {

    private final InvestmentRepository investmentRepository;
    private final PersonRepository personRepository;

    public List<Investment> listAll() {
        return investmentRepository.findAll(Sort.by(Sort.Direction.DESC, "investmentDate", "id"));
    }

    @Transactional
    public Investment create(InvestmentRequest request) {
        Person owner = personRepository.findById(request.ownerId())
                .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada: " + request.ownerId()));
        
        Investment investment = Investment.builder()
                .name(request.name())
                .type(request.type())
                .owner(owner)
                .investedAmount(request.investedAmount())
                .investmentDate(request.investmentDate())
                .annualRate(request.annualRate())
                .currentValue(request.currentValue())
                .description(request.description())
                .institution(request.institution())
                .build();
        return investmentRepository.save(investment);
    }

    @Transactional
    public Investment update(Long id, InvestmentRequest request) {
        Investment investment = investmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Investimento não encontrado: " + id));

        Person owner = personRepository.findById(request.ownerId())
                .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada: " + request.ownerId()));

        investment.setName(request.name());
        investment.setType(request.type());
        investment.setOwner(owner);
        investment.setInvestedAmount(request.investedAmount());
        investment.setInvestmentDate(request.investmentDate());
        investment.setAnnualRate(request.annualRate());
        investment.setCurrentValue(request.currentValue());
        investment.setDescription(request.description());
        investment.setInstitution(request.institution());

        return investmentRepository.save(investment);
    }

    @Transactional
    public void delete(Long id) {
        if (!investmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Investimento não encontrado: " + id);
        }
        investmentRepository.deleteById(id);
    }
}

