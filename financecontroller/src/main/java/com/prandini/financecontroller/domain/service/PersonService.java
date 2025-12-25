package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.domain.model.Person;
import com.prandini.financecontroller.domain.model.*;
import com.prandini.financecontroller.domain.repository.*;
import com.prandini.financecontroller.web.dto.DeletePersonRequest;
import com.prandini.financecontroller.web.dto.PersonRequest;
import com.prandini.financecontroller.web.exception.BadRequestException;
import com.prandini.financecontroller.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        
        if (request.splitWithPersonIds() != null && !request.splitWithPersonIds().isEmpty()) {
            Set<Person> splitWithPersons = new HashSet<>();
            for (Long splitWithId : request.splitWithPersonIds()) {
                if (splitWithId.equals(person.getId())) {
                    throw new BadRequestException("Uma pessoa não pode dividir contas consigo mesma");
                }
                Person splitWithPerson = personRepository.findById(splitWithId)
                        .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada para divisão: " + splitWithId));
                splitWithPersons.add(splitWithPerson);
            }
            person.setSplitWithPersons(splitWithPersons);
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
        
        if (request.splitWithPersonIds() != null) {
            Set<Person> splitWithPersons = new HashSet<>();
            for (Long splitWithId : request.splitWithPersonIds()) {
                if (splitWithId.equals(person.getId())) {
                    throw new BadRequestException("Uma pessoa não pode dividir contas consigo mesma");
                }
                Person splitWithPerson = personRepository.findById(splitWithId)
                        .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada para divisão: " + splitWithId));
                splitWithPersons.add(splitWithPerson);
            }
            person.setSplitWithPersons(splitWithPersons);
        }
        
        return personRepository.save(person);
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

