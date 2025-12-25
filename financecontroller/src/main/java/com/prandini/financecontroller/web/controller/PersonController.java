package com.prandini.financecontroller.web.controller;

import com.prandini.financecontroller.domain.service.PersonService;
import com.prandini.financecontroller.web.dto.DeletePersonRequest;
import com.prandini.financecontroller.web.dto.PersonRequest;
import com.prandini.financecontroller.web.dto.PersonResponse;
import com.prandini.financecontroller.web.mapper.FinanceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/persons")
@RequiredArgsConstructor
public class PersonController {

    private final PersonService personService;

    @GetMapping
    public List<PersonResponse> listAll() {
        return personService.listAll().stream()
                .map(FinanceMapper::toResponse)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PersonResponse create(@RequestBody PersonRequest request) {
        return FinanceMapper.toResponse(personService.create(request));
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public PersonResponse update(@PathVariable Long id, @RequestBody PersonRequest request) {
        return FinanceMapper.toResponse(personService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @RequestBody DeletePersonRequest request) {
        personService.delete(id, request);
    }
}

