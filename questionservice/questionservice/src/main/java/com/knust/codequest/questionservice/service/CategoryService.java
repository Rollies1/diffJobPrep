package com.knust.codequest.questionservice.service;

import com.knust.codequest.questionservice.model.Category;
import com.knust.codequest.questionservice.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public Optional<Category> findById(UUID id) {
        return categoryRepository.findById(id);
    }
}
