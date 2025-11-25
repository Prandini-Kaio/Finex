package com.prandini.financecontroller.domain.model;

import com.prandini.financecontroller.domain.model.enums.InvestmentType;
import com.prandini.financecontroller.domain.model.enums.Person;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "investments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Investment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvestmentType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Person owner;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal investedAmount;

    @Column(nullable = false)
    private LocalDate investmentDate;

    @Column(precision = 5, scale = 2)
    private BigDecimal annualRate; // Taxa anual (opcional, para iniciantes pode ser simples)

    @Column(precision = 15, scale = 2)
    private BigDecimal currentValue; // Valor atual estimado (opcional)

    @Column(length = 500)
    private String description;

    @Column(length = 100)
    private String institution; // Banco ou corretora

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

