package com.knust.codequest.authservice.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PaymentResponse {
    private boolean status;
    private String message;
    private String authorizationUrl;
    private String reference;
}