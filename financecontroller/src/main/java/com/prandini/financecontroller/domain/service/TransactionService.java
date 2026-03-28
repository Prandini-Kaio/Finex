package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.domain.model.CreditCard;
import com.prandini.financecontroller.domain.model.Person;
import com.prandini.financecontroller.domain.model.Transaction;
import com.prandini.financecontroller.domain.model.enums.PaymentMethod;
import com.prandini.financecontroller.domain.repository.ClosedMonthRepository;
import com.prandini.financecontroller.domain.repository.CreditCardRepository;
import com.prandini.financecontroller.domain.repository.PersonRepository;
import com.prandini.financecontroller.domain.repository.TransactionRepository;
import com.prandini.financecontroller.web.dto.AnticipateInstallmentsRequest;
import com.prandini.financecontroller.web.dto.TransactionRequest;
import com.prandini.financecontroller.web.dto.UpdateInstallmentsRequest;
import com.prandini.financecontroller.web.exception.BadRequestException;
import com.prandini.financecontroller.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CreditCardRepository creditCardRepository;
    private final PersonRepository personRepository;
    private final ClosedMonthRepository closedMonthRepository;

    public List<Transaction> listAll() {
        return transactionRepository.findAll(Sort.by(Sort.Direction.DESC, "date", "id"));
    }

    @Transactional
    public Transaction create(TransactionRequest request) {
        Person person = personRepository.findById(request.personId())
                .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada: " + request.personId()));
        
        Transaction transaction = Transaction.builder()
                .date(request.date())
                .type(request.type())
                .paymentMethod(request.paymentMethod())
                .person(person)
                .category(request.category())
                .description(request.description())
                .value(request.value())
                .competency(request.competency())
                .installments(request.installments())
                .installmentNumber(request.installmentNumber())
                .totalInstallments(request.totalInstallments())
                .parentPurchaseId(request.parentPurchaseId())
                .build();

        if (request.creditCardId() != null) {
            CreditCard creditCard = creditCardRepository.findById(request.creditCardId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado: " + request.creditCardId()));
            transaction.setCreditCard(creditCard);
        }
        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction update(Long id, TransactionRequest request) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada: " + id));

        Person person = personRepository.findById(request.personId())
                .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada: " + request.personId()));

        transaction.setDate(request.date());
        transaction.setType(request.type());
        transaction.setPaymentMethod(request.paymentMethod());
        transaction.setPerson(person);
        transaction.setCategory(request.category());
        transaction.setDescription(request.description());
        transaction.setValue(request.value());
        transaction.setCompetency(request.competency());
        transaction.setInstallments(request.installments());
        transaction.setInstallmentNumber(request.installmentNumber());
        transaction.setTotalInstallments(request.totalInstallments());
        transaction.setParentPurchaseId(request.parentPurchaseId());

        if (request.creditCardId() != null) {
            CreditCard creditCard = creditCardRepository.findById(request.creditCardId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado: " + request.creditCardId()));
            transaction.setCreditCard(creditCard);
        } else {
            transaction.setCreditCard(null);
        }

        return transactionRepository.save(transaction);
    }

    @Transactional
    public void delete(Long id) {
        if (!transactionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Transação não encontrada: " + id);
        }
        transactionRepository.deleteById(id);
    }

    public List<Transaction> listByDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return listAll();
        }
        if (startDate == null) {
            startDate = LocalDate.of(1900, 1, 1);
        }
        if (endDate == null) {
            endDate = LocalDate.of(9999, 12, 31);
        }
        return transactionRepository.findByDateBetween(startDate, endDate);
    }

    public List<Transaction> getInstallmentsByParentPurchaseId(Long parentPurchaseId) {
        return transactionRepository.findByParentPurchaseId(parentPurchaseId);
    }

    @Transactional
    public void deleteAllInstallments(Long parentPurchaseId) {
        if (parentPurchaseId == null) {
            throw new IllegalArgumentException("parentPurchaseId não pode ser nulo");
        }
        transactionRepository.deleteByParentPurchaseId(parentPurchaseId);
    }

    @Transactional
    public List<Transaction> updateInstallments(Long parentPurchaseId, UpdateInstallmentsRequest request) {
        List<Transaction> installments = transactionRepository.findByParentPurchaseId(parentPurchaseId);
        if (installments.isEmpty()) {
            throw new ResourceNotFoundException("Nenhuma parcela encontrada para parentPurchaseId: " + parentPurchaseId);
        }

        Transaction firstInstallment = installments.get(0);
        int totalInstallments = installments.size();
        
        BigDecimal newTotalValue = request.newTotalValue() != null 
            ? request.newTotalValue() 
            : installments.stream()
                .map(Transaction::getValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        LocalDate newPurchaseDate = request.newPurchaseDate() != null 
            ? request.newPurchaseDate() 
            : firstInstallment.getDate();

        BigDecimal installmentValue = newTotalValue.divide(BigDecimal.valueOf(totalInstallments), 2, RoundingMode.HALF_UP);

        for (int i = 0; i < installments.size(); i++) {
            Transaction installment = installments.get(i);
            LocalDate installmentDate = newPurchaseDate.plusMonths(i);
            String competency = String.format("%02d/%d", installmentDate.getMonthValue(), installmentDate.getYear());
            
            installment.setValue(installmentValue);
            installment.setDate(installmentDate);
            installment.setCompetency(competency);
            
            transactionRepository.save(installment);
        }

        return transactionRepository.findByParentPurchaseId(parentPurchaseId);
    }

    @Transactional
    public List<Transaction> anticipateInstallments(Long parentPurchaseId, AnticipateInstallmentsRequest request) {
        if (parentPurchaseId == null) {
            throw new IllegalArgumentException("parentPurchaseId não pode ser nulo");
        }
        int from = request.fromInstallmentNumber();
        int to = request.toInstallmentNumber();
        if (from >= to) {
            throw new BadRequestException("Antecipação exige fromInstallmentNumber menor que toInstallmentNumber");
        }

        List<Transaction> sorted = new ArrayList<>(transactionRepository.findByParentPurchaseId(parentPurchaseId));
        if (sorted.isEmpty()) {
            throw new ResourceNotFoundException("Nenhuma parcela encontrada para parentPurchaseId: " + parentPurchaseId);
        }
        sorted.sort(Comparator.comparing(Transaction::getInstallmentNumber));
        for (int i = 0; i < sorted.size(); i++) {
            Integer num = sorted.get(i).getInstallmentNumber();
            if (num == null || num != i + 1) {
                throw new BadRequestException("Parcelas com numeração inconsistente");
            }
        }

        int total = sorted.size();
        Integer declaredTotal = sorted.getFirst().getTotalInstallments();
        if (declaredTotal != null && declaredTotal != total) {
            throw new BadRequestException("Quantidade de parcelas inconsistente com totalInstallments cadastrado");
        }
        if (from < 1 || to > total) {
            throw new BadRequestException("Intervalo de parcelas inválido para esta compra");
        }

        Long expectedCardId = null;
        for (Transaction t : sorted) {
            if (t.getPaymentMethod() != PaymentMethod.CREDITO) {
                throw new BadRequestException("Antecipação permitida apenas para transações no crédito");
            }
            Long cid = t.getCreditCard() != null ? t.getCreditCard().getId() : null;
            if (expectedCardId == null) {
                expectedCardId = cid;
            } else if (!Objects.equals(expectedCardId, cid)) {
                throw new BadRequestException("Todas as parcelas devem usar o mesmo cartão de crédito");
            }
        }

        Transaction firstByNumber = sorted.stream()
                .filter(t -> t.getInstallmentNumber() != null && t.getInstallmentNumber() == 1)
                .findFirst()
                .orElse(sorted.getFirst());
        LocalDate baseDate = firstByNumber.getDate();

        int removedSlots = to - from;
        int newTotal = total - removedSlots;

        BigDecimal mergedSum = BigDecimal.ZERO;
        Transaction keeper = null;
        List<Transaction> toDelete = new ArrayList<>();
        for (Transaction t : sorted) {
            int n = t.getInstallmentNumber();
            if (n >= from && n <= to) {
                mergedSum = mergedSum.add(t.getValue() != null ? t.getValue() : BigDecimal.ZERO);
                if (n == from) {
                    keeper = t;
                } else {
                    toDelete.add(t);
                }
            }
        }
        if (keeper == null) {
            throw new BadRequestException("Parcela inicial do intervalo não encontrada");
        }

        for (Transaction t : toDelete) {
            assertCompetencyOpen(t.getCompetency());
        }
        for (Transaction t : sorted) {
            if (!toDelete.contains(t)) {
                assertCompetencyOpen(t.getCompetency());
            }
        }

        LocalDate mergedDateOverride = null;
        String mergedCompetencyOverride = null;
        if (request.targetCompetency() != null && !request.targetCompetency().isBlank()) {
            mergedCompetencyOverride = normalizeCompetency(request.targetCompetency().trim());
            mergedDateOverride = competencyToFirstDay(mergedCompetencyOverride);
        }

        for (Transaction t : sorted) {
            if (toDelete.contains(t)) {
                continue;
            }
            int oldN = t.getInstallmentNumber();
            int newN = oldN > to ? oldN - removedSlots : oldN;
            LocalDate newDate = baseDate.plusMonths(newN - 1L);
            String newCompetency = formatCompetency(newDate);
            if (Objects.equals(t.getId(), keeper.getId())) {
                if (mergedDateOverride != null) {
                    newDate = mergedDateOverride;
                    newCompetency = mergedCompetencyOverride;
                }
            }
            assertCompetencyOpen(newCompetency);
        }

        for (Transaction t : toDelete) {
            transactionRepository.delete(t);
        }

        keeper.setValue(mergedSum);
        keeper.setInstallmentNumber(from);
        keeper.setTotalInstallments(newTotal);
        keeper.setInstallments(newTotal);
        if (mergedDateOverride != null) {
            keeper.setDate(mergedDateOverride);
            keeper.setCompetency(mergedCompetencyOverride);
        } else {
            LocalDate d = baseDate.plusMonths(from - 1L);
            keeper.setDate(d);
            keeper.setCompetency(formatCompetency(d));
        }
        transactionRepository.save(keeper);

        for (Transaction t : sorted) {
            if (toDelete.contains(t) || Objects.equals(t.getId(), keeper.getId())) {
                continue;
            }
            int oldN = t.getInstallmentNumber();
            int newN = oldN - removedSlots;
            t.setInstallmentNumber(newN);
            t.setTotalInstallments(newTotal);
            t.setInstallments(newTotal);
            LocalDate d = baseDate.plusMonths(newN - 1L);
            t.setDate(d);
            t.setCompetency(formatCompetency(d));
            transactionRepository.save(t);
        }

        return transactionRepository.findByParentPurchaseId(parentPurchaseId);
    }

    private void assertCompetencyOpen(String competency) {
        if (competency != null && closedMonthRepository.existsByCompetency(competency)) {
            throw new BadRequestException("Mês fechado não permite alteração: " + competency);
        }
    }

    private static String formatCompetency(LocalDate date) {
        return String.format("%02d/%d", date.getMonthValue(), date.getYear());
    }

    private static String normalizeCompetency(String input) {
        String[] parts = input.split("/");
        if (parts.length != 2) {
            throw new BadRequestException("Competência inválida. Use MM/yyyy");
        }
        try {
            int month = Integer.parseInt(parts[0].trim());
            int year = Integer.parseInt(parts[1].trim());
            if (month < 1 || month > 12) {
                throw new BadRequestException("Competência inválida. Mês deve ser entre 1 e 12");
            }
            return String.format("%02d/%d", month, year);
        } catch (NumberFormatException e) {
            throw new BadRequestException("Competência inválida. Use MM/yyyy");
        }
    }

    private static LocalDate competencyToFirstDay(String competency) {
        String[] parts = competency.split("/");
        int month = Integer.parseInt(parts[0].trim());
        int year = Integer.parseInt(parts[1].trim());
        return LocalDate.of(year, month, 1);
    }
}

