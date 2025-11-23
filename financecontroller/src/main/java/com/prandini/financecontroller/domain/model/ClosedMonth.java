package com.prandini.financecontroller.domain.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "closed_months")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClosedMonth {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String competency;
}

