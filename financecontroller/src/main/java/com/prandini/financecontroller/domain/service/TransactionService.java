package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.domain.model.BankAccount;
import com.prandini.financecontroller.domain.model.CreditCard;
import com.prandini.financecontroller.domain.model.Person;
import com.prandini.financecontroller.domain.model.Transaction;
import com.prandini.financecontroller.domain.model.enums.PaymentMethod;
import com.prandini.financecontroller.domain.model.enums.TransactionType;
import com.prandini.financecontroller.domain.repository.BankAccountRepository;
import com.prandini.financecontroller.domain.repository.ClosedMonthRepository;
import com.prandini.financecontroller.domain.repository.CreditCardRepository;
import com.prandini.financecontroller.domain.repository.PersonRepository;
import com.prandini.financecontroller.domain.repository.TransactionRepository;
import com.prandini.financecontroller.web.dto.AnticipateInstallmentsRequest;
import com.prandini.financecontroller.web.dto.InstallmentGroupCommonFieldsRequest;
import com.prandini.financecontroller.web.dto.InstallmentGroupRequest;
import com.prandini.financecontroller.web.dto.InstallmentPreviewItem;
import com.prandini.financecontroller.web.dto.TransactionFilterCriteria;
import com.prandini.financecontroller.web.dto.TransactionPreviewRequest;
import com.prandini.financecontroller.web.dto.TransactionPreviewResponse;
import com.prandini.financecontroller.web.dto.TransactionRequest;
import com.prandini.financecontroller.web.dto.UpdateInstallmentsRequest;
import com.prandini.financecontroller.domain.repository.TransactionSpecifications;
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
    private final BankAccountRepository bankAccountRepository;
    private final BankAccountService bankAccountService;
    private final CreditCardBillingService creditCardBillingService;

    public List<Transaction> listAll() {
        return transactionRepository.findAll(Sort.by(Sort.Direction.DESC, "date", "id"));
    }

    public List<Transaction> listFiltered(TransactionFilterCriteria criteria) {
        if (criteria == null || !criteria.hasAnyFilter()) {
            return listAll();
        }
        return transactionRepository.findAll(
                TransactionSpecifications.withFilters(criteria),
                Sort.by(Sort.Direction.DESC, "date", "id"));
    }

    @Transactional
    public Transaction create(TransactionRequest request) {
        Person person = personRepository.findById(request.personId())
                .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada: " + request.personId()));

        bankAccountService.validateBankAccountRequired(request.paymentMethod(), request.bankAccountId(), request.type());

        String competency = resolveCompetencyForCreate(request);
        assertCompetencyOpen(competency);

        int totalInstallments = request.totalInstallments() != null ? request.totalInstallments() : 1;
        int installmentNumber = request.installmentNumber() != null ? request.installmentNumber() : 1;

        Transaction transaction = Transaction.builder()
                .date(request.date())
                .type(request.type())
                .paymentMethod(request.paymentMethod())
                .person(person)
                .category(request.category())
                .description(request.description())
                .value(request.value())
                .competency(competency)
                .installments(totalInstallments)
                .installmentNumber(installmentNumber)
                .totalInstallments(totalInstallments)
                .parentPurchaseId(request.parentPurchaseId())
                .build();

        if (request.creditCardId() != null) {
            CreditCard creditCard = creditCardRepository.findById(request.creditCardId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado: " + request.creditCardId()));
            transaction.setCreditCard(creditCard);
        }

        if (request.bankAccountId() != null) {
            BankAccount bankAccount = bankAccountRepository.findById(request.bankAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Conta bancária não encontrada: " + request.bankAccountId()));
            bankAccountService.validateBankAccountAccess(person, bankAccount, request.type());
            transaction.setBankAccount(bankAccount);
        }

        Transaction saved = transactionRepository.save(transaction);
        bankAccountService.applyTransactionMovement(saved);
        return saved;
    }

    @Transactional
    public List<Transaction> createInstallmentGroup(InstallmentGroupRequest request) {
        if (request.paymentMethod() != PaymentMethod.CREDITO) {
            throw new BadRequestException("Grupo parcelado permitido apenas para crédito");
        }
        if (request.creditCardId() == null) {
            throw new BadRequestException("Cartão de crédito é obrigatório");
        }
        int totalInstallments = request.totalInstallments() != null ? request.totalInstallments() : 1;
        if (totalInstallments < 2) {
            throw new BadRequestException("Grupo parcelado exige pelo menos 2 parcelas");
        }

        Person person = personRepository.findById(request.personId())
                .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada: " + request.personId()));
        CreditCard creditCard = creditCardRepository.findById(request.creditCardId())
                .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado: " + request.creditCardId()));

        List<InstallmentPreviewItem> preview = creditCardBillingService.previewInstallments(
                request.date(), request.value(), totalInstallments, creditCard.getClosingDay());
        for (InstallmentPreviewItem item : preview) {
            assertCompetencyOpen(item.competency());
        }

        Long parentPurchaseId = nextParentPurchaseId();
        List<Transaction> created = new ArrayList<>();
        for (InstallmentPreviewItem item : preview) {
            Transaction tx = Transaction.builder()
                    .date(item.date())
                    .type(request.type())
                    .paymentMethod(request.paymentMethod())
                    .person(person)
                    .category(request.category())
                    .description(request.description())
                    .value(item.value())
                    .competency(item.competency())
                    .creditCard(creditCard)
                    .installments(totalInstallments)
                    .installmentNumber(item.installmentNumber())
                    .totalInstallments(totalInstallments)
                    .parentPurchaseId(parentPurchaseId)
                    .build();
            created.add(transactionRepository.save(tx));
        }
        return created;
    }

    public TransactionPreviewResponse preview(TransactionPreviewRequest request) {
        int totalInstallments = request.totalInstallments() != null ? request.totalInstallments() : 1;
        List<InstallmentPreviewItem> installments = List.of();
        String invoiceCompetency = null;
        Integer dueDay = null;

        if (request.paymentMethod() == PaymentMethod.CREDITO) {
            if (request.creditCardId() == null) {
                throw new BadRequestException("Cartão de crédito é obrigatório para preview de crédito");
            }
            CreditCard card = creditCardRepository.findById(request.creditCardId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado: " + request.creditCardId()));
            dueDay = card.getDueDay();
            installments = creditCardBillingService.previewInstallments(
                    request.date(), request.value(), totalInstallments, card.getClosingDay());
            invoiceCompetency = installments.isEmpty() ? null : installments.getFirst().competency();
        } else {
            invoiceCompetency = creditCardBillingService.resolveNonCreditCompetency(request.date());
        }

        BigDecimal currentBalance = null;
        BigDecimal balanceAfter = null;
        String bankAccountName = null;
        if (request.bankAccountId() != null && request.paymentMethod() != PaymentMethod.CREDITO) {
            BankAccount account = bankAccountRepository.findById(request.bankAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Conta bancária não encontrada: " + request.bankAccountId()));
            currentBalance = account.getCurrentBalance();
            bankAccountName = account.getName();
            BigDecimal value = request.value() != null ? request.value() : BigDecimal.ZERO;
            BigDecimal delta = request.type() == TransactionType.RECEITA ? value : value.negate();
            balanceAfter = currentBalance.add(delta);
        }

        return new TransactionPreviewResponse(
                invoiceCompetency,
                dueDay,
                installments,
                currentBalance,
                balanceAfter,
                bankAccountName
        );
    }

    @Transactional
    public Transaction update(Long id, TransactionRequest request) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada: " + id));

        if (transaction.getCompetency() != null) {
            assertCompetencyOpen(transaction.getCompetency());
        }
        if (request.competency() != null) {
            assertCompetencyOpen(request.competency());
        }

        bankAccountService.reverseTransactionMovement(transaction);

        Person person = personRepository.findById(request.personId())
                .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada: " + request.personId()));

        bankAccountService.validateBankAccountRequired(request.paymentMethod(), request.bankAccountId(), request.type());

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

        if (request.bankAccountId() != null) {
            BankAccount bankAccount = bankAccountRepository.findById(request.bankAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Conta bancária não encontrada: " + request.bankAccountId()));
            bankAccountService.validateBankAccountAccess(person, bankAccount, request.type());
            transaction.setBankAccount(bankAccount);
        } else {
            transaction.setBankAccount(null);
        }

        Transaction saved = transactionRepository.save(transaction);
        bankAccountService.applyTransactionMovement(saved);
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada: " + id));
        if (transaction.getCompetency() != null) {
            assertCompetencyOpen(transaction.getCompetency());
        }
        bankAccountService.reverseTransactionMovement(transaction);
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
    public List<Transaction> updateInstallmentGroupCommonFields(
            Long parentPurchaseId,
            InstallmentGroupCommonFieldsRequest req) {
        if (parentPurchaseId == null) {
            throw new IllegalArgumentException("parentPurchaseId não pode ser nulo");
        }
        List<Transaction> list = new ArrayList<>(transactionRepository.findByParentPurchaseId(parentPurchaseId));
        if (list.isEmpty()) {
            throw new ResourceNotFoundException("Nenhuma parcela encontrada para parentPurchaseId: " + parentPurchaseId);
        }
        Person person = personRepository.findById(req.personId())
                .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada: " + req.personId()));
        CreditCard card = null;
        if (req.creditCardId() != null) {
            card = creditCardRepository.findById(req.creditCardId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado: " + req.creditCardId()));
        }
        for (Transaction t : list) {
            t.setPerson(person);
            t.setType(req.type());
            t.setPaymentMethod(req.paymentMethod());
            t.setCategory(req.category());
            t.setDescription(req.description());
            t.setCreditCard(card);
            transactionRepository.save(t);
        }
        return transactionRepository.findByParentPurchaseId(parentPurchaseId);
    }

    @Transactional
    public List<Transaction> updateInstallments(Long parentPurchaseId, UpdateInstallmentsRequest request) {
        List<Transaction> installments = new ArrayList<>(transactionRepository.findByParentPurchaseId(parentPurchaseId));
        if (installments.isEmpty()) {
            throw new ResourceNotFoundException("Nenhuma parcela encontrada para parentPurchaseId: " + parentPurchaseId);
        }
        installments.sort(Comparator.comparing(Transaction::getInstallmentNumber));
        for (int i = 0; i < installments.size(); i++) {
            Integer num = installments.get(i).getInstallmentNumber();
            if (num == null || num != i + 1) {
                throw new BadRequestException("Parcelas com numeração inconsistente");
            }
        }

        Transaction firstInstallment = installments.stream()
                .filter(t -> t.getInstallmentNumber() != null && t.getInstallmentNumber() == 1)
                .findFirst()
                .orElse(installments.getFirst());

        Integer newN = request.newTotalInstallments();
        if (newN != null && !newN.equals(installments.size())) {
            return replaceInstallmentGroupWithNewCount(parentPurchaseId, installments, firstInstallment, request, newN);
        }

        int totalInstallments = installments.size();

        BigDecimal newTotalValue = request.newTotalValue() != null
                ? request.newTotalValue()
                : installments.stream()
                        .map(Transaction::getValue)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDate newPurchaseDate = request.newPurchaseDate() != null
                ? request.newPurchaseDate()
                : firstInstallment.getDate();

        List<BigDecimal> parts = splitTotalAcrossInstallments(newTotalValue, totalInstallments);

        for (int i = 0; i < installments.size(); i++) {
            Transaction installment = installments.get(i);
            LocalDate installmentDate = newPurchaseDate.plusMonths(i);
            String competency = formatCompetency(installmentDate);
            assertCompetencyOpen(installment.getCompetency());
            assertCompetencyOpen(competency);
            installment.setValue(parts.get(i));
            installment.setDate(installmentDate);
            installment.setCompetency(competency);
            transactionRepository.save(installment);
        }

        return transactionRepository.findByParentPurchaseId(parentPurchaseId);
    }

    private List<Transaction> replaceInstallmentGroupWithNewCount(
            Long parentPurchaseId,
            List<Transaction> sortedOld,
            Transaction templateRow,
            UpdateInstallmentsRequest request,
            int newCount) {
        if (newCount < 1) {
            throw new BadRequestException("Quantidade de parcelas deve ser pelo menos 1");
        }

        for (Transaction t : sortedOld) {
            assertCompetencyOpen(t.getCompetency());
        }

        BigDecimal total = request.newTotalValue() != null
                ? request.newTotalValue()
                : sortedOld.stream().map(Transaction::getValue).reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDate baseDate = request.newPurchaseDate() != null
                ? request.newPurchaseDate()
                : templateRow.getDate();

        List<BigDecimal> values = splitTotalAcrossInstallments(total, newCount);
        for (int i = 0; i < newCount; i++) {
            assertCompetencyOpen(formatCompetency(baseDate.plusMonths(i)));
        }

        Long personId = templateRow.getPerson().getId();
        TransactionType type = templateRow.getType();
        PaymentMethod paymentMethod = templateRow.getPaymentMethod();
        String category = templateRow.getCategory();
        String description = templateRow.getDescription();
        Long creditCardId = templateRow.getCreditCard() != null ? templateRow.getCreditCard().getId() : null;

        transactionRepository.deleteByParentPurchaseId(parentPurchaseId);

        Person person = personRepository.findById(personId)
                .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada: " + personId));
        CreditCard card = null;
        if (creditCardId != null) {
            card = creditCardRepository.findById(creditCardId)
                    .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado: " + creditCardId));
        }

        for (int i = 0; i < newCount; i++) {
            LocalDate d = baseDate.plusMonths(i);
            String competency = formatCompetency(d);
            Transaction tx = Transaction.builder()
                    .date(d)
                    .type(type)
                    .paymentMethod(paymentMethod)
                    .person(person)
                    .category(category)
                    .description(description)
                    .value(values.get(i))
                    .competency(competency)
                    .creditCard(card)
                    .installments(newCount)
                    .installmentNumber(i + 1)
                    .totalInstallments(newCount)
                    .parentPurchaseId(parentPurchaseId)
                    .build();
            transactionRepository.save(tx);
        }

        return transactionRepository.findByParentPurchaseId(parentPurchaseId);
    }

    private static List<BigDecimal> splitTotalAcrossInstallments(BigDecimal total, int n) {
        if (n < 1) {
            throw new BadRequestException("Quantidade de parcelas deve ser pelo menos 1");
        }
        BigDecimal scaled = total != null ? total.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        if (scaled.signum() < 0) {
            throw new BadRequestException("Valor total inválido");
        }
        List<BigDecimal> parts = new ArrayList<>();
        if (n == 1) {
            parts.add(scaled);
            return parts;
        }
        BigDecimal each = scaled.divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP);
        BigDecimal allocated = BigDecimal.ZERO;
        for (int i = 0; i < n - 1; i++) {
            parts.add(each);
            allocated = allocated.add(each);
        }
        parts.add(scaled.subtract(allocated).setScale(2, RoundingMode.HALF_UP));
        return parts;
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

    private String resolveCompetencyForCreate(TransactionRequest request) {
        if (request.competency() != null && !request.competency().isBlank()) {
            return normalizeCompetency(request.competency().trim());
        }
        if (request.paymentMethod() == PaymentMethod.CREDITO) {
            if (request.creditCardId() == null) {
                throw new BadRequestException("Cartão de crédito é obrigatório");
            }
            CreditCard card = creditCardRepository.findById(request.creditCardId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado: " + request.creditCardId()));
            return creditCardBillingService.resolveInvoiceCompetency(request.date(), card.getClosingDay());
        }
        return creditCardBillingService.resolveNonCreditCompetency(request.date());
    }

    private Long nextParentPurchaseId() {
        return System.currentTimeMillis();
    }
}

