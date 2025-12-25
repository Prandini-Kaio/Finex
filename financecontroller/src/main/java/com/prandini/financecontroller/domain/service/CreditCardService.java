package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.domain.model.CreditCard;
import com.prandini.financecontroller.domain.model.Person;
import com.prandini.financecontroller.domain.repository.CreditCardRepository;
import com.prandini.financecontroller.domain.repository.PersonRepository;
import com.prandini.financecontroller.web.dto.CreditCardRequest;
import com.prandini.financecontroller.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CreditCardService {

    private final CreditCardRepository creditCardRepository;
    private final PersonRepository personRepository;

    public List<CreditCard> listAll() {
        return creditCardRepository.findAll(Sort.by("name"));
    }

    @Transactional
    public CreditCard create(CreditCardRequest request) {
        Person owner = personRepository.findById(request.ownerId())
                .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada: " + request.ownerId()));
        
        CreditCard card = CreditCard.builder()
                .name(request.name())
                .owner(owner)
                .closingDay(request.closingDay())
                .dueDay(request.dueDay())
                .limit(request.limit())
                .build();
        return creditCardRepository.save(card);
    }

    @Transactional
    public void delete(Long id) {
        if (!creditCardRepository.existsById(id)) {
            throw new ResourceNotFoundException("Cartão não encontrado: " + id);
        }
        creditCardRepository.deleteById(id);
    }
}

