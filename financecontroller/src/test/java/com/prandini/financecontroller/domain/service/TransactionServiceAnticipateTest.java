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
import com.prandini.financecontroller.web.dto.AnticipateInstallmentsRequest;
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
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionServiceAnticipateTest {

    private static final long PARENT_ID = 99L;

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
    private Transaction t1;
    private Transaction t2;
    private Transaction t3;
    private Transaction t4;
    private Transaction t5;
    private Transaction t6;

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

        t1 = tx(1L, 1, new BigDecimal("100"), LocalDate.of(2025, 1, 10), "01/2025");
        t2 = tx(2L, 2, new BigDecimal("100"), LocalDate.of(2025, 2, 10), "02/2025");
        t3 = tx(3L, 3, new BigDecimal("100"), LocalDate.of(2025, 3, 10), "03/2025");
        t4 = tx(4L, 4, new BigDecimal("100"), LocalDate.of(2025, 4, 10), "04/2025");
        t5 = tx(5L, 5, new BigDecimal("100"), LocalDate.of(2025, 5, 10), "05/2025");
        t6 = tx(6L, 6, new BigDecimal("100"), LocalDate.of(2025, 6, 10), "06/2025");

        when(closedMonthRepository.existsByCompetency(any())).thenReturn(false);
    }

    private Transaction tx(Long id, int num, BigDecimal value, LocalDate date, String competency) {
        return Transaction.builder()
                .id(id)
                .date(date)
                .type(TransactionType.DESPESA)
                .paymentMethod(PaymentMethod.CREDITO)
                .person(person)
                .category("C")
                .description("D")
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
    void anticipateMerge2Through4_reducesToFourInstallmentsAndSumsValues() {
        List<Transaction> initial = new ArrayList<>(List.of(t1, t2, t3, t4, t5, t6));
        AtomicInteger calls = new AtomicInteger(0);
        when(transactionRepository.findByParentPurchaseId(PARENT_ID)).thenAnswer(inv -> {
            if (calls.getAndIncrement() == 0) {
                return new ArrayList<>(initial);
            }
            return List.of(t1, t2, t5, t6);
        });

        List<Transaction> result = transactionService.anticipateInstallments(
                PARENT_ID,
                new AnticipateInstallmentsRequest(2, 4, null));

        assertThat(result).hasSize(4);
        assertThat(t2.getValue()).isEqualByComparingTo(new BigDecimal("300"));
        assertThat(t2.getInstallmentNumber()).isEqualTo(2);
        assertThat(t2.getTotalInstallments()).isEqualTo(4);
        assertThat(t2.getDate()).isEqualTo(LocalDate.of(2025, 2, 10));
        assertThat(t2.getCompetency()).isEqualTo("02/2025");

        assertThat(t1.getTotalInstallments()).isEqualTo(4);
        assertThat(t1.getInstallments()).isEqualTo(4);

        assertThat(t5.getInstallmentNumber()).isEqualTo(3);
        assertThat(t5.getDate()).isEqualTo(LocalDate.of(2025, 3, 10));
        assertThat(t5.getCompetency()).isEqualTo("03/2025");

        assertThat(t6.getInstallmentNumber()).isEqualTo(4);
        assertThat(t6.getDate()).isEqualTo(LocalDate.of(2025, 4, 10));
        assertThat(t6.getCompetency()).isEqualTo("04/2025");

        verify(transactionRepository).delete(t3);
        verify(transactionRepository).delete(t4);
        ArgumentCaptor<Transaction> saveCaptor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, org.mockito.Mockito.times(4)).save(saveCaptor.capture());
    }
}
