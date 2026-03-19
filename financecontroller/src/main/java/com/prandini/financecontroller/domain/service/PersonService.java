package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.domain.model.Person;
import com.prandini.financecontroller.domain.model.*;
import com.prandini.financecontroller.domain.repository.*;
import com.prandini.financecontroller.web.dto.DeletePersonRequest;
import com.prandini.financecontroller.web.dto.PersonSplitRequest;
import com.prandini.financecontroller.web.dto.PersonRequest;
import com.prandini.financecontroller.web.exception.BadRequestException;
import com.prandini.financecontroller.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PersonService {

    private final PersonRepository personRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final RecurringTransactionRepository recurringTransactionRepository;
    private final SavingsDepositRepository savingsDepositRepository;
    private final CreditCardRepository creditCardRepository;
    private final SavingsGoalRepository savingsGoalRepository;
    private final InvestmentRepository investmentRepository;

    public List<Person> listAll() {
        return personRepository.findByActiveTrueOrderByName();
    }

    @Transactional
    public Person create(PersonRequest request) {
        if (personRepository.findByName(request.name()).isPresent()) {
            throw new BadRequestException("Já existe uma pessoa com o nome: " + request.name());
        }
        Person person = Person.builder()
                .name(request.name())
                .active(true)
                .allowSplit(request.allowSplit() != null ? request.allowSplit() : false)
                .build();
        person = personRepository.save(person);

        if (Boolean.TRUE.equals(person.getAllowSplit())) {
            if (request.splits() == null || request.splits().isEmpty()) {
                throw new BadRequestException("É necessário informar splits com percentuais que somem 100%");
            }
            Set<PersonSplit> newSplits = buildSplits(person, request.splits());
            person.getSplits().clear();
            person.getSplits().addAll(newSplits);
            person = personRepository.save(person);
        }
        
        return person;
    }

    @Transactional
    public Person update(Long id, PersonRequest request) {
        Person person = personRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada: " + id));
        
        if (!person.getName().equals(request.name()) && personRepository.findByName(request.name()).isPresent()) {
            throw new BadRequestException("Já existe uma pessoa com o nome: " + request.name());
        }
        
        person.setName(request.name());
        if (request.allowSplit() != null) {
            person.setAllowSplit(request.allowSplit());
        }

        if (request.splits() != null) {
            if (!Boolean.TRUE.equals(person.getAllowSplit())) {
                person.getSplits().clear();
            } else {
                Set<PersonSplit> newSplits = buildSplits(person, request.splits());
                person.getSplits().clear();
                person.getSplits().addAll(newSplits);
            }
        }
        
        return personRepository.save(person);
    }

    private Set<PersonSplit> buildSplits(Person person, List<PersonSplitRequest> splitsRequest) {
        if (splitsRequest == null || splitsRequest.isEmpty()) {
            throw new BadRequestException("É necessário informar splits com percentuais que somem 100%");
        }

        Set<Long> recipients = new HashSet<>();
        BigDecimal sum = BigDecimal.ZERO;
        for (PersonSplitRequest splitRequest : splitsRequest) {
            if (splitRequest == null || splitRequest.splitWithPersonId() == null) {
                throw new BadRequestException("splitWithPersonId é obrigatório");
            }
            if (splitRequest.splitWithPersonId().equals(person.getId())) {
                throw new BadRequestException("Uma pessoa não pode dividir contas consigo mesma");
            }
            if (!recipients.add(splitRequest.splitWithPersonId())) {
                throw new BadRequestException("Não é permitido repetir pessoas nos splits");
            }
            if (splitRequest.percentage() == null) {
                throw new BadRequestException("percentage é obrigatório");
            }
            if (splitRequest.percentage().compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException("Percentuais inválidos: deve ser >= 0");
            }
            sum = sum.add(splitRequest.percentage().setScale(2, RoundingMode.HALF_UP));
        }

        BigDecimal target = BigDecimal.valueOf(100).setScale(2, RoundingMode.HALF_UP);
        BigDecimal tolerance = new BigDecimal("0.01").setScale(2, RoundingMode.HALF_UP);
        if (sum.subtract(target).abs().compareTo(tolerance) > 0) {
            throw new BadRequestException("A soma dos percentuais deve ser 100%");
        }

        Set<PersonSplit> splits = new HashSet<>();
        for (PersonSplitRequest splitRequest : splitsRequest) {
            Person splitWithPerson = personRepository.findById(splitRequest.splitWithPersonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada para divisão: " + splitRequest.splitWithPersonId()));

            PersonSplitId splitId = new PersonSplitId();
            splitId.setPersonId(person.getId());
            splitId.setSplitWithPersonId(splitWithPerson.getId());

            PersonSplit personSplit = PersonSplit.builder()
                    .id(splitId)
                    .person(person)
                    .splitWithPerson(splitWithPerson)
                    .percentage(splitRequest.percentage().setScale(2, RoundingMode.HALF_UP))
                    .build();

            splits.add(personSplit);
        }
        return splits;
    }

    @Transactional
    public void delete(Long id, DeletePersonRequest request) {
        Person person = personRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada: " + id));

        if (request.deleteTransactions()) {
            transactionRepository.deleteByPersonId(id);
            budgetRepository.deleteByPersonId(id);
            recurringTransactionRepository.deleteByPersonId(id);
            savingsDepositRepository.deleteByPersonId(id);
            creditCardRepository.deleteByOwnerId(id);
            savingsGoalRepository.deleteByOwnerId(id);
            investmentRepository.deleteByOwnerId(id);
        } else if (request.migrateToPersonId() != null) {
            Person targetPerson = personRepository.findById(request.migrateToPersonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Pessoa de destino não encontrada: " + request.migrateToPersonId()));
            
            transactionRepository.updatePersonId(id, request.migrateToPersonId());
            budgetRepository.updatePersonId(id, request.migrateToPersonId());
            recurringTransactionRepository.updatePersonId(id, request.migrateToPersonId());
            savingsDepositRepository.updatePersonId(id, request.migrateToPersonId());
            creditCardRepository.updateOwnerId(id, request.migrateToPersonId());
            savingsGoalRepository.updateOwnerId(id, request.migrateToPersonId());
            investmentRepository.updateOwnerId(id, request.migrateToPersonId());
        } else {
            throw new BadRequestException("É necessário informar migrateToPersonId ou deleteTransactions=true");
        }

        personRepository.deleteById(id);
    }
}




