package com.prandini.financecontroller.domain.model;

import com.prandini.financecontroller.domain.model.enums.BudgetType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "budgets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String competency;
    private String category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", nullable = false)
    private Person person;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private BudgetType budgetType = BudgetType.VALUE;

    private BigDecimal amount;

    private BigDecimal percentage;
}

