package com.prandini.financecontroller.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "person_split_relationships")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonSplit {

    @EmbeddedId
    private PersonSplitId id = new PersonSplitId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("personId")
    @JoinColumn(name = "person_id", nullable = false)
    private Person person;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("splitWithPersonId")
    @JoinColumn(name = "split_with_person_id", nullable = false)
    private Person splitWithPerson;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal percentage;
}

