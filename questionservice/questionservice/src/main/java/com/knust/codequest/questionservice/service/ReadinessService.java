package com.knust.codequest.questionservice.service;

import com.knust.codequest.questionservice.dto.TopicReadinessDTO;
import com.knust.codequest.questionservice.dto.UserProgressDTO;
import com.knust.codequest.questionservice.entity.Topic;
import com.knust.codequest.questionservice.entity.User;
import com.knust.codequest.questionservice.entity.UserTopicReadiness;
import com.knust.codequest.questionservice.repository.TopicRepository;
import com.knust.codequest.questionservice.repository.UserRepository;
import com.knust.codequest.questionservice.repository.UserTopicReadinessRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReadinessService {

    private final UserTopicReadinessRepository readinessRepository;
    private final SessionService sessionService;
    private final UserRepository userRepository;
    private final TopicRepository topicRepository;

    public ReadinessService(UserTopicReadinessRepository readinessRepository, 
                            SessionService sessionService,
                            UserRepository userRepository,
                            TopicRepository topicRepository) {
        this.readinessRepository = readinessRepository;
        this.sessionService = sessionService;
        this.userRepository = userRepository;
        this.topicRepository = topicRepository;
    }

    public List<TopicReadinessDTO> getUserReadinessChecklist(UUID userId) {
        List<UserProgressDTO> progressList = sessionService.getUserProgress(userId);
        Map<String, UserProgressDTO> progressMap = progressList.stream()
                .collect(Collectors.toMap(UserProgressDTO::topic, p -> p));

        List<UserTopicReadiness> readinessList = readinessRepository.findByUserUserId(userId);
        Map<Integer, Boolean> readinessMap = readinessList.stream()
                .collect(Collectors.toMap(r -> r.getTopic().getTopicId(), UserTopicReadiness::getIsReady));

        List<Topic> allTopics = topicRepository.findAll();
        
        return allTopics.stream().map(topic -> {
            Boolean isReady = readinessMap.getOrDefault(topic.getTopicId(), false);
            UserProgressDTO progress = progressMap.get(topic.getName());
            
            Long attempted = progress != null ? progress.questionsAttempted() : 0L;
            Double score = progress != null ? progress.avgScore() : 0.0;
            Double time = progress != null ? progress.avgTime() : 0.0;

            return new TopicReadinessDTO(topic.getTopicId(), topic.getName(), isReady, attempted, score, time);
        }).collect(Collectors.toList());
    }

    public void toggleReadiness(UUID userId, Integer topicId, Boolean isReady) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new IllegalArgumentException("Topic not found"));

        UserTopicReadiness readiness = readinessRepository.findByUserUserIdAndTopicTopicId(userId, topicId)
                .orElse(new UserTopicReadiness(user, topic));
        
        readiness.setIsReady(isReady);
        readinessRepository.save(readiness);
    }
}
