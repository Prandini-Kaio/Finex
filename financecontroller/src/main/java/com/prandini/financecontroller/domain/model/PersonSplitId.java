package com.prandini.financecontroller.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@EqualsAndHashCode
public class PersonSplitId implements Serializable {

    @Column(name = "person_id")
    private Long personId;

    @Column(name = "split_with_person_id")
    private Long splitWithPersonId;
}

