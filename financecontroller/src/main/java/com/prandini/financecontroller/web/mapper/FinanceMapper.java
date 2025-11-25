package com.prandini.financecontroller.web.mapper;

import com.prandini.financecontroller.domain.model.*;
import com.prandini.financecontroller.web.dto.*;

import java.util.List;

public final class FinanceMapper {

    private FinanceMapper() {
    }

    public static TransactionResponse toResponse(Transaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getDate(),
                transaction.getType(),
                transaction.getPaymentMethod(),
                transaction.getPerson(),
                transaction.getCategory(),
                transaction.getDescription(),
                transaction.getValue(),
                transaction.getCompetency(),
                transaction.getCreditCard() != null ? transaction.getCreditCard().getId() : null,
                transaction.getCreditCard() != null ? transaction.getCreditCard().getName() : null,
                transaction.getInstallments(),
                transaction.getInstallmentNumber(),
                transaction.getTotalInstallments(),
                transaction.getParentPurchaseId()
        );
    }

    public static BudgetResponse toResponse(Budget budget) {
        return new BudgetResponse(
                budget.getId(),
                budget.getCompetency(),
                budget.getCategory(),
                budget.getPerson(),
                budget.getBudgetType(),
                budget.getAmount(),
                budget.getPercentage()
        );
    }

    public static CreditCardResponse toResponse(CreditCard card) {
        return new CreditCardResponse(
                card.getId(),
                card.getName(),
                card.getOwner(),
                card.getClosingDay(),
                card.getDueDay(),
                card.getLimit()
        );
    }

    public static SavingsDepositResponse toResponse(SavingsDeposit deposit) {
        return new SavingsDepositResponse(
                deposit.getId(),
                deposit.getAmount(),
                deposit.getDate(),
                deposit.getPerson()
        );
    }

    public static SavingsGoalResponse toResponse(SavingsGoal goal) {
        List<SavingsDepositResponse> deposits = goal.getDeposits().stream()
                .map(FinanceMapper::toResponse)
                .toList();
        return new SavingsGoalResponse(
                goal.getId(),
                goal.getName(),
                goal.getTargetAmount(),
                goal.getCurrentAmount(),
                goal.getDeadline(),
                goal.getOwner(),
                goal.getDescription(),
                goal.getCreatedAt(),
                deposits
        );
    }

    public static RecurringTransactionResponse toRecurringTransactionResponse(RecurringTransaction recurring) {
        return new RecurringTransactionResponse(
                recurring.getId(),
                recurring.getDescription(),
                recurring.getType(),
                recurring.getPaymentMethod(),
                recurring.getPerson(),
                recurring.getCategory(),
                recurring.getValue(),
                recurring.getStartDate(),
                recurring.getEndDate(),
                recurring.getDayOfMonth(),
                recurring.getCreditCard() != null ? recurring.getCreditCard().getId() : null,
                recurring.getCreditCard() != null ? recurring.getCreditCard().getName() : null,
                recurring.getActive(),
                recurring.getBaseCompetency()
        );
    }

    public static InvestmentResponse toResponse(Investment investment) {
        return new InvestmentResponse(
                investment.getId(),
                investment.getName(),
                investment.getType(),
                investment.getOwner(),
                investment.getInvestedAmount(),
                investment.getInvestmentDate(),
                investment.getAnnualRate(),
                investment.getCurrentValue(),
                investment.getDescription(),
                investment.getInstitution(),
                investment.getCreatedAt(),
                investment.getUpdatedAt()
        );
    }

    public static CreditCardInvoiceResponse toResponse(CreditCard card, CreditCardInvoice invoice, String referenceMonth) {
        boolean paid = invoice != null && invoice.isPaid();
        return new CreditCardInvoiceResponse(
                card.getId(),
                card.getName(),
                card.getOwner(),
                referenceMonth,
                paid,
                paid ? invoice.getPaidAt() : null
        );
    }
}

