package com.knust.codequest.authservice.controller;

import com.knust.codequest.authservice.dto.PaymentResponse;
import com.knust.codequest.authservice.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initialize")
    public ResponseEntity<PaymentResponse> initializePayment(@RequestParam String email) {
        try {
            PaymentResponse response = paymentService.initializePayment(email);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new PaymentResponse(false, e.getMessage(), null, null));
        }
    }

    @GetMapping("/verify/{reference}")
    public ResponseEntity<PaymentResponse> verifyPayment(@PathVariable String reference) {
        try {
            PaymentResponse response = paymentService.verifyPayment(reference);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new PaymentResponse(false, e.getMessage(), null, null));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<Boolean> checkPremiumStatus(@RequestParam String email) {
        return ResponseEntity.ok(paymentService.checkPremiumStatus(email));
    }
}