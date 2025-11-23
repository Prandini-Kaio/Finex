package com.prandini.financecontroller.domain.model;

import com.prandini.financecontroller.domain.model.enums.Person;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "credit_cards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Enumerated(EnumType.STRING)
    private Person owner;

    private Integer closingDay;
    private Integer dueDay;

    @Column(name = "limit_amount")
    private BigDecimal limit;
}

