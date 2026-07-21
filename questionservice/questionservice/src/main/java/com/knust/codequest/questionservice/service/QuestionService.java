package com.knust.codequest.questionservice.service;

import com.knust.codequest.questionservice.dto.CategoryWithCountDTO;
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

    public Question getQuestionById(Long id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found: " + id));
    }

    public List<CategoryWithCountDTO> getAllCategoriesWithCount() {
        return categoryRepository.findAll().stream()
                .map(category -> new CategoryWithCountDTO(
                        category.getId(),
                        category.getName(),
                        category.getDescription(),
                        questionRepository.findByCategoryId(category.getId()).size()
                ))
                .collect(java.util.stream.Collectors.toList());
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
}