package com.jobprep.practice.service;

import com.jobprep.practice.dto.SubmitAnswerRequest;
import com.jobprep.practice.dto.SubmitAnswerResponse;
import com.jobprep.practice.entity.PracticeSession;
import com.jobprep.practice.entity.SessionAnswer;
import com.jobprep.practice.repository.PracticeSessionRepository;
import com.jobprep.practice.repository.SessionAnswerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Practice session + answer logic.
 *
 * The idempotency wrapping is done by IdempotencyService — this class
 * only contains the business logic that runs once per unique key.
 */
@Service
@RequiredArgsConstructor
public class PracticeSessionService {

    private final PracticeSessionRepository sessionRepo;
    private final SessionAnswerRepository answerRepo;

    /**
     * Submit an answer. Called inside IdempotencyService.execute() so
     * this method only runs once per (userId, idempotencyKey) pair.
     */
    @Transactional
    public SubmitAnswerResponse submitAnswer(String userId, SubmitAnswerRequest req) {
        // Upsert the session (idempotent on sessionId).
        PracticeSession session = sessionRepo.findById(req.sessionId())
            .orElseGet(() -> sessionRepo.save(
                PracticeSession.builder()
                    .id(req.sessionId())
                    .userId(userId)
                    .topic(req.questionId())
                    .streakAtStart(0)
                    .build()
            ));

        // Ownership check.
        if (!session.getUserId().equals(userId)) {
            return null; // controller will return 403
        }

        boolean correct = req.selectedOption().equals(req.correctOption());

        SessionAnswer answer = answerRepo.save(
            SessionAnswer.builder()
                .id(UUID.randomUUID().toString())
                .sessionId(session.getId())
                .questionId(req.questionId())
                .questionText(req.questionText())
                .selectedOption(req.selectedOption())
                .correct(correct)
                .build()
        );

        // Bump streak if correct (very simplified).
        int newStreak = correct ? session.getStreakAtStart() + 1 : session.getStreakAtStart();
        if (correct) {
            session.setStreakAtStart(newStreak);
            sessionRepo.save(session);
        }

        return new SubmitAnswerResponse(
            answer.getId(),
            session.getId(),
            req.questionId(),
            req.selectedOption(),
            req.correctOption(),
            correct,
            newStreak,
            answer.getAnsweredAt()
        );
    }
}
