package com.prandini.financecontroller.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "persons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Person {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private Boolean active;

    @Column(nullable = false)
    private Boolean allowSplit = false;

    @ManyToMany
    @JoinTable(
            name = "person_split_relationships",
            joinColumns = @JoinColumn(name = "person_id"),
            inverseJoinColumns = @JoinColumn(name = "split_with_person_id")
    )
    @Builder.Default
    private Set<Person> splitWithPersons = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        if (active == null) {
            active = true;
        }
        if (allowSplit == null) {
            allowSplit = false;
        }
    }
}

