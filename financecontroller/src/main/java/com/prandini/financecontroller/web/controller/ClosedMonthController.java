package com.prandini.financecontroller.web.controller;

import com.prandini.financecontroller.domain.service.ClosedMonthService;
import com.prandini.financecontroller.web.dto.CloseMonthRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/closed-months")
@RequiredArgsConstructor
public class ClosedMonthController {

    private final ClosedMonthService closedMonthService;

    @GetMapping
    public List<String> listClosedMonths() {
        return closedMonthService.listAll();
    }

    @PostMapping
    public List<String> closeMonth(@RequestBody CloseMonthRequest request) {
        return closedMonthService.closeMonth(request.month());
    }

    @DeleteMapping
    public List<String> reopenMonth(@RequestParam("month") String month) {
        return closedMonthService.reopenMonth(month);
    }
}

