package com.prandini.financecontroller.domain.model;

import com.prandini.financecontroller.domain.model.enums.PaymentMethod;
import com.prandini.financecontroller.domain.model.enums.Person;
import com.prandini.financecontroller.domain.model.enums.TransactionType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "recurring_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecurringTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String description;

    @Enumerated(EnumType.STRING)
    private TransactionType type;

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    private Person person;

    private String category;

    private BigDecimal value;

    private LocalDate startDate;

    private LocalDate endDate;

    /**
     * Dia do mês em que a transação deve ser gerada (1-31)
     */
    private Integer dayOfMonth;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_card_id")
    private CreditCard creditCard;

    private Boolean active;

    /**
     * Formato esperado: MM/YYYY - competência base para cálculo
     */
    private String baseCompetency;
}

