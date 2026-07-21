package com.knust.codequest.sessionservice.config;

import com.knust.codequest.sessionservice.dto.AnswerDto;
import com.knust.codequest.sessionservice.model.SessionAnswer;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AnswerMapper {
    
    @Mapping(source = "userAnswer", target = "userAnswer")
    AnswerDto toDto(SessionAnswer answer);
    
    List<AnswerDto> toDtoList(List<SessionAnswer> answers);
}
