package com.knust.codequest.authservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public MailService(JavaMailSender mailSender,
                       @Value("${spring.mail.username:noreply@jobprep.com}") String fromAddress) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
    }

    @Async
    public void sendVerificationEmail(String to, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject("Verify your JobPrep account");
        message.setText("Click the link to verify your email: " +
                "http://localhost:8081/api/auth/verify-email?token=" + token +
                "\n\nThis link expires in 24 hours.");
        mailSender.send(message);
    }

    @Async
    public void sendPasswordResetEmail(String to, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject("Reset your JobPrep password");
        message.setText("Click the link to reset your password: " +
                "http://localhost:8081/api/auth/reset-password?token=" + token +
                "\n\nThis link expires in 15 minutes.");
        mailSender.send(message);
    }
}
