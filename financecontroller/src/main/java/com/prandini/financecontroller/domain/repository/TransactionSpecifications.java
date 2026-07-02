package com.prandini.financecontroller.domain.repository;

import com.prandini.financecontroller.domain.model.Transaction;
import com.prandini.financecontroller.web.dto.TransactionFilterCriteria;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class TransactionSpecifications {

    private TransactionSpecifications() {
    }

    public static Specification<Transaction> withFilters(TransactionFilterCriteria criteria) {
        return (root, query, cb) -> {
            if (criteria == null || !criteria.hasAnyFilter()) {
                return cb.conjunction();
            }

            List<Predicate> predicates = new ArrayList<>();

            if (criteria.competencies() != null && !criteria.competencies().isEmpty()) {
                predicates.add(root.get("competency").in(criteria.competencies()));
            }

            if (criteria.persons() != null && !criteria.persons().isEmpty()) {
                predicates.add(root.join("person").get("name").in(criteria.persons()));
            }

            if (criteria.categories() != null && !criteria.categories().isEmpty()) {
                predicates.add(root.get("category").in(criteria.categories()));
            }

            if (criteria.paymentMethods() != null && !criteria.paymentMethods().isEmpty()) {
                predicates.add(root.get("paymentMethod").in(criteria.paymentMethods()));
            }

            boolean hasCardIds = criteria.creditCardIds() != null && !criteria.creditCardIds().isEmpty();
            boolean withoutCard = Boolean.TRUE.equals(criteria.withoutCreditCard());

            if (hasCardIds && withoutCard) {
                predicates.add(cb.or(
                        root.get("creditCard").get("id").in(criteria.creditCardIds()),
                        cb.isNull(root.get("creditCard"))
                ));
            } else if (hasCardIds) {
                predicates.add(root.get("creditCard").get("id").in(criteria.creditCardIds()));
            } else if (withoutCard) {
                predicates.add(cb.isNull(root.get("creditCard")));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
