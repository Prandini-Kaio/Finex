package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.domain.model.CreditCard;
import com.prandini.financecontroller.domain.model.CreditCardInvoice;
import com.prandini.financecontroller.domain.repository.CreditCardInvoiceRepository;
import com.prandini.financecontroller.domain.repository.CreditCardRepository;
import com.prandini.financecontroller.web.dto.CreditCardInvoiceRequest;
import com.prandini.financecontroller.web.dto.CreditCardInvoiceResponse;
import com.prandini.financecontroller.web.exception.BadRequestException;
import com.prandini.financecontroller.web.exception.ResourceNotFoundException;
import com.prandini.financecontroller.web.mapper.FinanceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CreditCardInvoiceService {

    private final CreditCardInvoiceRepository invoiceRepository;
    private final CreditCardRepository creditCardRepository;

    @Transactional(readOnly = true)
    public List<CreditCardInvoiceResponse> listByMonth(String referenceMonth) {
        if (referenceMonth == null || referenceMonth.isBlank()) {
            throw new BadRequestException("O mês de referência é obrigatório");
        }

        List<CreditCard> cards = creditCardRepository.findAll(Sort.by("name"));
        Map<Long, CreditCardInvoice> invoicesByCard = invoiceRepository.findByReferenceMonth(referenceMonth).stream()
                .collect(Collectors.toMap(invoice -> invoice.getCreditCard().getId(), Function.identity()));

        return cards.stream()
                .map(card -> FinanceMapper.toResponse(card, invoicesByCard.get(card.getId()), referenceMonth))
                .toList();
    }

    @Transactional
    public CreditCardInvoiceResponse updateStatus(Long cardId, CreditCardInvoiceRequest request) {
        if (request.referenceMonth() == null || request.referenceMonth().isBlank()) {
            throw new BadRequestException("O mês de referência é obrigatório");
        }
        if (request.paid() == null) {
            throw new BadRequestException("O indicador de pagamento é obrigatório");
        }

        CreditCard card = creditCardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado: " + cardId));

        CreditCardInvoice invoice = invoiceRepository.findByCreditCardIdAndReferenceMonth(cardId, request.referenceMonth())
                .orElseGet(() -> CreditCardInvoice.builder()
                        .creditCard(card)
                        .referenceMonth(request.referenceMonth())
                        .build());

        invoice.setPaid(request.paid());
        invoice.setPaidAt(request.paid() ? LocalDateTime.now() : null);

        CreditCardInvoice saved = invoiceRepository.save(invoice);
        return FinanceMapper.toResponse(card, saved, request.referenceMonth());
    }

    @Transactional
    public List<CreditCardInvoiceResponse> updateAllStatus(CreditCardInvoiceRequest request) {
        if (request.referenceMonth() == null || request.referenceMonth().isBlank()) {
            throw new BadRequestException("O mês de referência é obrigatório");
        }
        if (request.paid() == null) {
            throw new BadRequestException("O indicador de pagamento é obrigatório");
        }

        List<CreditCard> cards = creditCardRepository.findAll(Sort.by("name"));
        if (cards.isEmpty()) {
            return List.of();
        }

        Map<Long, CreditCardInvoice> invoicesByCard = invoiceRepository.findByReferenceMonth(request.referenceMonth()).stream()
                .collect(Collectors.toMap(invoice -> invoice.getCreditCard().getId(), Function.identity()));

        LocalDateTime paidAt = request.paid() ? LocalDateTime.now() : null;

        List<CreditCardInvoice> toSave = cards.stream()
                .map(card -> {
                    CreditCardInvoice invoice = invoicesByCard.get(card.getId());
                    if (invoice == null) {
                        invoice = CreditCardInvoice.builder()
                                .creditCard(card)
                                .referenceMonth(request.referenceMonth())
                                .build();
                    }
                    invoice.setPaid(request.paid());
                    invoice.setPaidAt(paidAt);
                    return invoice;
                })
                .toList();

        List<CreditCardInvoice> saved = invoiceRepository.saveAll(toSave);
        return saved.stream()
                .map(invoice -> FinanceMapper.toResponse(invoice.getCreditCard(), invoice, invoice.getReferenceMonth()))
                .toList();
    }
}


