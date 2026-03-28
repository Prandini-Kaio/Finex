package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.domain.model.CreditCard;
import com.prandini.financecontroller.domain.model.Person;
import com.prandini.financecontroller.domain.model.Transaction;
import com.prandini.financecontroller.domain.model.enums.PaymentMethod;
import com.prandini.financecontroller.domain.model.enums.TransactionType;
import com.prandini.financecontroller.domain.repository.ClosedMonthRepository;
import com.prandini.financecontroller.domain.repository.CreditCardRepository;
import com.prandini.financecontroller.domain.repository.PersonRepository;
import com.prandini.financecontroller.domain.repository.TransactionRepository;
import com.prandini.financecontroller.web.dto.UpdateInstallmentsRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionServiceInstallmentResizeTest {

    private static final long PARENT_ID = 77L;

    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private CreditCardRepository creditCardRepository;
    @Mock
    private PersonRepository personRepository;
    @Mock
    private ClosedMonthRepository closedMonthRepository;

    @InjectMocks
    private TransactionService transactionService;

    private Person person;
    private CreditCard card;

    @BeforeEach
    void setUp() {
        person = Person.builder().id(1L).name("P").active(true).allowSplit(false).build();
        card = CreditCard.builder()
                .id(10L)
                .name("Visa")
                .owner(person)
                .closingDay(10)
                .dueDay(15)
                .limit(new BigDecimal("5000"))
                .build();
        when(closedMonthRepository.existsByCompetency(any())).thenReturn(false);
        when(personRepository.findById(1L)).thenReturn(Optional.of(person));
        when(creditCardRepository.findById(10L)).thenReturn(Optional.of(card));
    }

    private Transaction tx(Long id, int num, BigDecimal value, LocalDate date, String competency) {
        return Transaction.builder()
                .id(id)
                .date(date)
                .type(TransactionType.DESPESA)
                .paymentMethod(PaymentMethod.CREDITO)
                .person(person)
                .category("Cat")
                .description("Desc")
                .value(value)
                .competency(competency)
                .creditCard(card)
                .installments(6)
                .installmentNumber(num)
                .totalInstallments(6)
                .parentPurchaseId(PARENT_ID)
                .build();
    }

    @Test
    void resizeFromSixToFour_redistributesTotalAndKeepsParentPurchaseId() {
        List<Transaction> initial = new ArrayList<>(List.of(
                tx(1L, 1, new BigDecimal("100"), LocalDate.of(2025, 1, 10), "01/2025"),
                tx(2L, 2, new BigDecimal("100"), LocalDate.of(2025, 2, 10), "02/2025"),
                tx(3L, 3, new BigDecimal("100"), LocalDate.of(2025, 3, 10), "03/2025"),
                tx(4L, 4, new BigDecimal("100"), LocalDate.of(2025, 4, 10), "04/2025"),
                tx(5L, 5, new BigDecimal("100"), LocalDate.of(2025, 5, 10), "05/2025"),
                tx(6L, 6, new BigDecimal("100"), LocalDate.of(2025, 6, 10), "06/2025")));

        List<Transaction> savedBatch = new ArrayList<>();
        AtomicInteger findCalls = new AtomicInteger(0);
        when(transactionRepository.findByParentPurchaseId(PARENT_ID)).thenAnswer(inv -> {
            if (findCalls.getAndIncrement() == 0) {
                return new ArrayList<>(initial);
            }
            return new ArrayList<>(savedBatch);
        });
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> {
            Transaction t = inv.getArgument(0);
            savedBatch.add(t);
            return t;
        });

        List<Transaction> result = transactionService.updateInstallments(
                PARENT_ID,
                new UpdateInstallmentsRequest(null, null, 4));

        verify(transactionRepository).deleteByParentPurchaseId(eq(PARENT_ID));
        assertThat(result).hasSize(4);

        BigDecimal sum = result.stream().map(Transaction::getValue).reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(sum).isEqualByComparingTo(new BigDecimal("600.00"));

        assertThat(result.get(0).getInstallmentNumber()).isEqualTo(1);
        assertThat(result.get(0).getDate()).isEqualTo(LocalDate.of(2025, 1, 10));
        assertThat(result.get(0).getCompetency()).isEqualTo("01/2025");
        assertThat(result.get(0).getValue()).isEqualByComparingTo(new BigDecimal("150.00"));

        assertThat(result.get(1).getCompetency()).isEqualTo("02/2025");
        assertThat(result.get(2).getCompetency()).isEqualTo("03/2025");
        assertThat(result.get(3).getCompetency()).isEqualTo("04/2025");
        assertThat(result.get(3).getValue()).isEqualByComparingTo(new BigDecimal("150.00"));

        for (Transaction t : result) {
            assertThat(t.getParentPurchaseId()).isEqualTo(PARENT_ID);
            assertThat(t.getTotalInstallments()).isEqualTo(4);
            assertThat(t.getInstallments()).isEqualTo(4);
        }

        ArgumentCaptor<Transaction> saveCaptor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, org.mockito.Mockito.times(4)).save(saveCaptor.capture());
    }

    @Test
    void resize_adjustsLastInstallmentSoSumMatchesTotalWithRounding() {
        List<Transaction> initial = new ArrayList<>(List.of(
                tx(1L, 1, new BigDecimal("33.34"), LocalDate.of(2025, 1, 5), "01/2025"),
                tx(2L, 2, new BigDecimal("33.33"), LocalDate.of(2025, 2, 5), "02/2025"),
                tx(3L, 3, new BigDecimal("33.33"), LocalDate.of(2025, 3, 5), "03/2025")));

        List<Transaction> savedBatch = new ArrayList<>();
        AtomicInteger findCalls = new AtomicInteger(0);
        when(transactionRepository.findByParentPurchaseId(PARENT_ID)).thenAnswer(inv -> {
            if (findCalls.getAndIncrement() == 0) {
                return new ArrayList<>(initial);
            }
            return new ArrayList<>(savedBatch);
        });
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> {
            Transaction t = inv.getArgument(0);
            savedBatch.add(t);
            return t;
        });

        List<Transaction> result = transactionService.updateInstallments(
                PARENT_ID,
                new UpdateInstallmentsRequest(null, null, 4));

        BigDecimal sum = result.stream().map(Transaction::getValue).reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(sum).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(result).hasSize(4);
    }
}
