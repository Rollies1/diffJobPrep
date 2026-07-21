package com.knust.codequest.questionservice.controller;

import com.knust.codequest.questionservice.dto.CategoryDto;
import com.knust.codequest.questionservice.model.Category;
import com.knust.codequest.questionservice.service.CategoryService;
import com.knust.codequest.questionservice.config.CategoryMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/practice/categories")
@CrossOrigin(origins = "*")
public class CategoryController {

    private final CategoryService categoryService;
    private final CategoryMapper categoryMapper;

    public CategoryController(CategoryService categoryService, CategoryMapper categoryMapper) {
        this.categoryService = categoryService;
        this.categoryMapper = categoryMapper;
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryDto> getCategoryById(@PathVariable UUID id) {
        return categoryService.findById(id)
            .map(categoryMapper::toDto)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
