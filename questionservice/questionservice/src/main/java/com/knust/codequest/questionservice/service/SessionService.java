package com.knust.codequest.questionservice.service;

import com.knust.codequest.questionservice.dto.PracticeSessionDTO;
import com.knust.codequest.questionservice.dto.ReadinessDTO;
import com.knust.codequest.questionservice.dto.UserProgressDTO;
import com.knust.codequest.questionservice.entity.PracticeSession;
import com.knust.codequest.questionservice.entity.Question;
import com.knust.codequest.questionservice.entity.Topic;
import com.knust.codequest.questionservice.entity.User;
import com.knust.codequest.questionservice.entity.UserTopicReadiness;
import com.knust.codequest.questionservice.exception.ResourceNotFoundException;
import com.knust.codequest.questionservice.repository.PracticeSessionRepository;
import com.knust.codequest.questionservice.repository.QuestionRepository;
import com.knust.codequest.questionservice.repository.TopicRepository;
import com.knust.codequest.questionservice.repository.UserRepository;
import com.knust.codequest.questionservice.repository.UserTopicReadinessRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class SessionService {

    private final PracticeSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final TopicRepository topicRepository;
    private final UserTopicReadinessRepository userTopicReadinessRepository;
    private final int readinessThreshold;

    public SessionService(PracticeSessionRepository sessionRepository,
                        UserRepository userRepository,
                        QuestionRepository questionRepository,
                        TopicRepository topicRepository,
                        UserTopicReadinessRepository userTopicReadinessRepository,
                        @Value("${readiness.threshold:70}") int readinessThreshold) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.questionRepository = questionRepository;
        this.topicRepository = topicRepository;
        this.userTopicReadinessRepository = userTopicReadinessRepository;
        this.readinessThreshold = readinessThreshold;
    }

    @Transactional(readOnly = true)
    public List<UserProgressDTO> getUserProgress(UUID userId) {
        List<Object[]> results = sessionRepository.getProgressByTopic(userId);
        return results.stream()
                .map(r -> new UserProgressDTO(
                        (String) r[0],
                        (Long) r[1],
                        (Double) r[2],
                        (Double) r[3]
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReadinessDTO> getReadinessChecklist(UUID userId) {
        // Get all topics
        List<Topic> allTopics = topicRepository.findAll();

        // Get user-declared readiness
        Map<Integer, Boolean> userReadiness = userTopicReadinessRepository.findByUserUserId(userId)
                .stream()
                .collect(Collectors.toMap(
                        r -> r.getTopic().getTopicId(),
                        r -> r.getIsReady() != null ? r.getIsReady() : false
                ));

        // Get calculated progress from sessions
        List<Object[]> progressResults = sessionRepository.getProgressByTopic(userId);
        Map<String, Object[]> progressByTopic = progressResults.stream()
                .collect(Collectors.toMap(
                        r -> (String) r[0],
                        r -> r
                ));

        return allTopics.stream().map(topic -> {
            String topicName = topic.getName();
            Integer topicId = topic.getTopicId();

            boolean isUserReady = userReadiness.getOrDefault(topicId, false);

            Object[] progress = progressByTopic.get(topicName);
            int calculatedProgress = 0;
            Long attempted = 0L;
            if (progress != null && progress[2] != null) {
                calculatedProgress = ((Double) progress[2]).intValue();
                attempted = (Long) progress[1];
            }

            long totalQuestions = topic.getQuestions().stream().filter(q -> q.getIsActive()).count();

            // Final status: user-declared OR calculated threshold met
            String status = (isUserReady || calculatedProgress >= readinessThreshold) ? "ready" : "not_ready";

            return new ReadinessDTO(
                    topicName,
                    status,
                    calculatedProgress,
                    readinessThreshold,
                    attempted,
                    totalQuestions
            );
        }).collect(Collectors.toList());
    }

    @Transactional
    public void toggleTopicReadiness(UUID userId, Integer topicId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic", "id", topicId));

        UserTopicReadiness readiness = userTopicReadinessRepository
                .findByUserUserIdAndTopicTopicId(userId, topicId)
                .orElse(new UserTopicReadiness(user, topic));

        readiness.setIsReady(!Boolean.TRUE.equals(readiness.getIsReady()));
        userTopicReadinessRepository.save(readiness);
    }

    @Transactional(readOnly = true)
    public List<PracticeSessionDTO> getRecentSessions(UUID userId) {
        return sessionRepository.findByUserUserIdAndStatusOrderByCompletedAtDesc(userId, "completed")
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public PracticeSessionDTO startSession(UUID userId, UUID questionId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", questionId));

        PracticeSession session = new PracticeSession(user, question);
        sessionRepository.save(session);
        return toDTO(session);
    }

    public PracticeSessionDTO completeSession(UUID sessionId, String answer, Integer score,
                                               String feedback, Integer timeSpent) {
        PracticeSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));
        session.complete(answer, score, feedback, timeSpent);
        return toDTO(session);
    }

    private PracticeSessionDTO toDTO(PracticeSession s) {
        return new PracticeSessionDTO(
                s.getSessionId(),
                s.getUser().getUserId(),
                s.getQuestion().getQuestionId(),
                s.getQuestion().getContent(),
                s.getStartedAt(),
                s.getCompletedAt(),
                s.getScore(),
                s.getTimeSpentSec(),
                s.getStatus()
        );
    }
}
