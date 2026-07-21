package com.knust.codequest.questionservice.config;

import com.knust.codequest.questionservice.dto.CategoryDto;
import com.knust.codequest.questionservice.model.Category;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    CategoryDto toDto(Category entity);
    List<CategoryDto> toDtoList(List<Category> entities);

    Category toEntity(CategoryDto dto);
}
