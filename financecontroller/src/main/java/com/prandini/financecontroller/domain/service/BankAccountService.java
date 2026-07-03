package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.domain.model.BankAccount;
import com.prandini.financecontroller.domain.model.Person;
import com.prandini.financecontroller.domain.model.Transaction;
import com.prandini.financecontroller.domain.model.enums.PaymentMethod;
import com.prandini.financecontroller.domain.model.enums.TransactionType;
import com.prandini.financecontroller.domain.repository.BankAccountRepository;
import com.prandini.financecontroller.domain.repository.PersonRepository;
import com.prandini.financecontroller.web.dto.BankAccountRequest;
import com.prandini.financecontroller.web.exception.BadRequestException;
import com.prandini.financecontroller.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BankAccountService {

    private final BankAccountRepository bankAccountRepository;
    private final PersonRepository personRepository;

    public List<BankAccount> listAll() {
        return bankAccountRepository.findByActiveTrueOrderByNameAsc();
    }

    public List<BankAccount> listByOwner(Long ownerId) {
        return bankAccountRepository.findByOwnerIdAndActiveTrueOrderByNameAsc(ownerId);
    }

    public BankAccount getById(Long id) {
        return bankAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conta bancária não encontrada: " + id));
    }

    @Transactional
    public BankAccount create(BankAccountRequest request) {
        Person owner = personRepository.findById(request.ownerId())
                .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada: " + request.ownerId()));

        BigDecimal initial = request.initialBalance() != null ? request.initialBalance() : BigDecimal.ZERO;

        BankAccount account = BankAccount.builder()
                .name(request.name())
                .institution(request.institution())
                .owner(owner)
                .initialBalance(initial)
                .currentBalance(initial)
                .active(request.active() != null ? request.active() : true)
                .build();

        return bankAccountRepository.save(account);
    }

    @Transactional
    public BankAccount update(Long id, BankAccountRequest request) {
        BankAccount account = getById(id);
        Person owner = personRepository.findById(request.ownerId())
                .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada: " + request.ownerId()));

        BigDecimal oldInitial = account.getInitialBalance() != null ? account.getInitialBalance() : BigDecimal.ZERO;
        BigDecimal newInitial = request.initialBalance() != null ? request.initialBalance() : BigDecimal.ZERO;
        BigDecimal current = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;
        BigDecimal adjustedCurrent = current.subtract(oldInitial).add(newInitial);

        account.setName(request.name());
        account.setInstitution(request.institution());
        account.setOwner(owner);
        account.setInitialBalance(newInitial);
        account.setCurrentBalance(adjustedCurrent);
        if (request.active() != null) {
            account.setActive(request.active());
        }

        return bankAccountRepository.save(account);
    }

    @Transactional
    public void delete(Long id) {
        BankAccount account = getById(id);
        account.setActive(false);
        bankAccountRepository.save(account);
    }

    public boolean affectsBankBalance(Transaction transaction) {
        if (transaction == null || transaction.getPaymentMethod() == PaymentMethod.CREDITO) {
            return false;
        }
        return transaction.getBankAccount() != null;
    }

    @Transactional
    public void applyTransactionMovement(Transaction transaction) {
        if (!affectsBankBalance(transaction)) {
            return;
        }
        BankAccount account = transaction.getBankAccount();
        BigDecimal value = transaction.getValue() != null ? transaction.getValue() : BigDecimal.ZERO;
        BigDecimal delta = transaction.getType() == TransactionType.RECEITA ? value : value.negate();
        account.setCurrentBalance(account.getCurrentBalance().add(delta));
        bankAccountRepository.save(account);
    }

    @Transactional
    public void reverseTransactionMovement(Transaction transaction) {
        if (!affectsBankBalance(transaction)) {
            return;
        }
        BankAccount account = transaction.getBankAccount();
        BigDecimal value = transaction.getValue() != null ? transaction.getValue() : BigDecimal.ZERO;
        BigDecimal delta = transaction.getType() == TransactionType.RECEITA ? value.negate() : value;
        account.setCurrentBalance(account.getCurrentBalance().add(delta));
        bankAccountRepository.save(account);
    }

    public void validateBankAccountRequired(PaymentMethod paymentMethod, Long bankAccountId, TransactionType type) {
        if (paymentMethod == PaymentMethod.CREDITO) {
            return;
        }
        if (bankAccountId == null) {
            throw new BadRequestException("Conta bancária é obrigatória para lançamentos que não são no crédito");
        }
    }

    /**
     * Receitas podem ser lançadas em qualquer conta ativa.
     * Despesas só podem debitar conta cujo titular é a pessoa do lançamento.
     */
    public void validateBankAccountAccess(Person person, BankAccount account, TransactionType type) {
        if (account == null || person == null) {
            return;
        }
        if (!Boolean.TRUE.equals(account.getActive())) {
            throw new BadRequestException("Conta bancária inativa: " + account.getName());
        }
        if (type == TransactionType.DESPESA
                && account.getOwner() != null
                && !account.getOwner().getId().equals(person.getId())) {
            throw new BadRequestException(
                    "Saídas só podem ser feitas pelo titular da conta. Titular: "
                            + account.getOwner().getName());
        }
    }
}
