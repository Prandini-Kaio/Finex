package com.prandini.financecontroller.web.controller;

import com.prandini.financecontroller.domain.service.CreditCardInvoiceService;
import com.prandini.financecontroller.web.dto.CreditCardInvoiceReceiptResponse;
import com.prandini.financecontroller.web.dto.CreditCardInvoiceRequest;
import com.prandini.financecontroller.web.dto.CreditCardInvoiceResponse;
import com.prandini.financecontroller.web.dto.PayAllCreditCardInvoicesRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/credit-card-invoices")
@RequiredArgsConstructor
public class CreditCardInvoiceController {

    private final CreditCardInvoiceService creditCardInvoiceService;

    @GetMapping
    public List<CreditCardInvoiceResponse> listByMonth(@RequestParam("month") String referenceMonth) {
        return creditCardInvoiceService.listByMonth(referenceMonth);
    }

    @GetMapping("/{cardId}/receipt")
    public CreditCardInvoiceReceiptResponse getReceipt(
            @PathVariable Long cardId,
            @RequestParam("month") String referenceMonth) {
        return creditCardInvoiceService.getReceipt(cardId, referenceMonth);
    }

    @PutMapping
    public List<CreditCardInvoiceResponse> updateAll(@RequestBody PayAllCreditCardInvoicesRequest request) {
        return creditCardInvoiceService.updateAllStatus(request);
    }

    @PutMapping("/{cardId}")
    public CreditCardInvoiceResponse updateStatus(@PathVariable Long cardId,
                                                  @RequestBody CreditCardInvoiceRequest request) {
        return creditCardInvoiceService.updateStatus(cardId, request);
    }
}
