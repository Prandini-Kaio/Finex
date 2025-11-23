package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.domain.model.Category;
import com.prandini.financecontroller.domain.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<String> listAll() {
        return categoryRepository.findAll().stream()
                .map(Category::getName)
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();
    }

    @Transactional
    public List<String> replaceAll(List<String> categories) {
        Set<String> normalized = categories.stream()
                .filter(name -> name != null && !name.isBlank())
                .map(String::trim)
                .collect(Collectors.toSet());

        var existing = categoryRepository.findAll();
        // Remove inexistentes
        existing.stream()
                .filter(category -> !normalized.contains(category.getName()))
                .forEach(categoryRepository::delete);

        normalized.forEach(name -> categoryRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> categoryRepository.save(Category.builder().name(name).build())));

        return listAll();
    }
}

