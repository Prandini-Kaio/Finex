package com.prandini.financecontroller.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "credit_card_invoices",
        uniqueConstraints = @UniqueConstraint(name = "uk_credit_card_month", columnNames = {"credit_card_id", "reference_month"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditCardInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "credit_card_id", nullable = false, foreignKey = @ForeignKey(name = "fk_invoice_credit_card"))
    private CreditCard creditCard;

    @Column(name = "reference_month", nullable = false, length = 7)
    private String referenceMonth;

    @Column(nullable = false)
    private boolean paid;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}


