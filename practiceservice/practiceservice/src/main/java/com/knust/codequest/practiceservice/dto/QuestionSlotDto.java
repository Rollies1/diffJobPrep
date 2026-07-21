package com.knust.codequest.practiceservice.dto;

import java.util.List;
import java.util.UUID;

public class QuestionSlotDto {

    private UUID questionId;
    private String questionText;
    private int sequenceNumber;
    private String userAnswer;
    private List<String> expectedKeywords;

    public UUID getQuestionId() { return questionId; }
    public void setQuestionId(UUID questionId) { this.questionId = questionId; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public int getSequenceNumber() { return sequenceNumber; }
    public void setSequenceNumber(int sequenceNumber) { this.sequenceNumber = sequenceNumber; }

    public String getUserAnswer() { return userAnswer; }
    public void setUserAnswer(String userAnswer) { this.userAnswer = userAnswer; }

    public List<String> getExpectedKeywords() { return expectedKeywords; }
    public void setExpectedKeywords(List<String> expectedKeywords) { this.expectedKeywords = expectedKeywords; }
}
