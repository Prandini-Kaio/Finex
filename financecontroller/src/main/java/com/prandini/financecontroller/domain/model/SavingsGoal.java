package com.prandini.financecontroller.domain.model;

import com.prandini.financecontroller.domain.model.enums.Person;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "savings_goals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavingsGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private BigDecimal targetAmount;

    private BigDecimal currentAmount;

    private LocalDate deadline;

    @Enumerated(EnumType.STRING)
    private Person owner;

    @Column(length = 500)
    private String description;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SavingsDeposit> deposits = new ArrayList<>();

    public void addDeposit(SavingsDeposit deposit) {
        deposits.add(deposit);
        deposit.setGoal(this);
        if (currentAmount == null) {
            currentAmount = BigDecimal.ZERO;
        }
        currentAmount = currentAmount.add(deposit.getAmount());
    }
}

