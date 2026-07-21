package com.knust.codequest.questionservice.service;

import com.knust.codequest.questionservice.entity.Category;
import com.knust.codequest.questionservice.entity.Question;
import com.knust.codequest.questionservice.repository.CategoryRepository;
import com.knust.codequest.questionservice.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final CategoryRepository categoryRepository;
    private final QuestionRepository questionRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
    }

    public List<Question> getQuestionsByCategory(Long categoryId) {
        return questionRepository.findByCategoryId(categoryId);
    }

    public List<Question> getAllQuestions() {
        return questionRepository.findAll();
    }

    public Category addCategory(Category category) {
        return categoryRepository.save(category);
    }

    public Question addQuestion(Question question) {
        return questionRepository.save(question);
    }

    public boolean gradeQuestion(String id, com.knust.codequest.questionservice.dto.GradeRequest request) {
        // Dummy implementation for compilation
        return true;
    }
}