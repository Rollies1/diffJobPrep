package com.knust.codequest.authservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.knust.codequest.authservice.dto.PaymentResponse;
import com.knust.codequest.authservice.entity.User;
import com.knust.codequest.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentService {

    @Value("${paystack.secret.key}")
    private String paystackSecretKey;

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final int PREMIUM_PRICE_PESEWAS = 1500; // GHS 15 in pesewas (100 pesewas = 1 GHS)

    public PaymentResponse initializePayment(String email) throws Exception {
        Map<String, Object> requestBody = Map.of(
                "email", email,
                "amount", PREMIUM_PRICE_PESEWAS,
                "currency", "GHS",
                "metadata", Map.of(
                        "email", email,
                        "plan", "JobPrep Premium Monthly"
                )
        );

        String body = objectMapper.writeValueAsString(requestBody);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.paystack.co/transaction/initialize"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + paystackSecretKey)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        HttpResponse<String> response = client.send(request,
                HttpResponse.BodyHandlers.ofString());

        JsonNode root = objectMapper.readTree(response.body());

        if (root.path("status").asBoolean()) {
            JsonNode data = root.path("data");
            return new PaymentResponse(
                    true,
                    "Payment initialized successfully",
                    data.path("authorization_url").asText(),
                    data.path("reference").asText()
            );
        } else {
            return new PaymentResponse(
                    false,
                    root.path("message").asText(),
                    null,
                    null
            );
        }
    }

    public PaymentResponse verifyPayment(String reference) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.paystack.co/transaction/verify/" + reference))
                .header("Authorization", "Bearer " + paystackSecretKey)
                .GET()
                .build();

        HttpResponse<String> response = client.send(request,
                HttpResponse.BodyHandlers.ofString());

        JsonNode root = objectMapper.readTree(response.body());

        if (root.path("status").asBoolean()) {
            JsonNode data = root.path("data");
            String status = data.path("status").asText();

            if ("success".equals(status)) {
                String email = data.path("customer").path("email").asText();
                activatePremium(email);
                return new PaymentResponse(true, "Payment verified. Premium activated!", null, reference);
            } else {
                return new PaymentResponse(false, "Payment not completed", null, reference);
            }
        }

        return new PaymentResponse(false, "Verification failed", null, reference);
    }

    private void activatePremium(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setIsPremium(true);
            user.setPremiumExpiry(LocalDateTime.now().plusMonths(1));
            userRepository.save(user);
        });
    }

    public boolean checkPremiumStatus(String email) {
        return userRepository.findByEmail(email)
                .map(user -> user.getIsPremium() &&
                        (user.getPremiumExpiry() == null ||
                                user.getPremiumExpiry().isAfter(LocalDateTime.now())))
                .orElse(false);
    }
}