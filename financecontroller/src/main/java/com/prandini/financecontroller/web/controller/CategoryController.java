package com.prandini.financecontroller.web.controller;

import com.prandini.financecontroller.domain.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public List<String> listCategories() {
        return categoryService.listAll();
    }

    @PutMapping
    public List<String> replaceCategories(@RequestBody List<String> categories) {
        return categoryService.replaceAll(categories);
    }
}

