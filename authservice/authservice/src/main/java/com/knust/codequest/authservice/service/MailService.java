package com.knust.codequest.authservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Sends transactional emails (verification + password reset).
 * <p>
 * The base URL for email links is configurable via {@code app.base-url}
 * so it points at the gateway in production (not localhost:8081).
 */
@Service
public class MailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String appBaseUrl;

    public MailService(@Autowired(required = false) JavaMailSender mailSender,
                       @Value("${spring.mail.username:noreply@jobprep.com}") String fromAddress,
                       @Value("${app.base-url:http://localhost:8089}") String appBaseUrl) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.appBaseUrl = appBaseUrl.replaceAll("/$", ""); // strip trailing slash
    }

    @Async
    public void sendVerificationEmail(String to, String token) {
        if (mailSender == null) return;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject("Verify your JobPrep account");
        message.setText("Click the link to verify your email: " +
                appBaseUrl + "/api/auth/verify-email?token=" + token +
                "\n\nThis link expires in 24 hours.");
        mailSender.send(message);
    }

    @Async
    public void sendPasswordResetEmail(String to, String token) {
        if (mailSender == null) return;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject("Reset your JobPrep password");
        message.setText("Click the link to reset your password: " +
                appBaseUrl + "/api/auth/reset-password?token=" + token +
                "\n\nThis link expires in 15 minutes.");
        mailSender.send(message);
    }
}
