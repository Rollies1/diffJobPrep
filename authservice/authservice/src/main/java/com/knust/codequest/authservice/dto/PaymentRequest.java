package com.knust.codequest.authservice.dto;

import lombok.Data;

@Data
public class PaymentRequest {
    private String email;
    private String reference;
}