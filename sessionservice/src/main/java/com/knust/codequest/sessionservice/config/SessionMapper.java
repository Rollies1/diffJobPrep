package com.knust.codequest.sessionservice.config;

import com.knust.codequest.sessionservice.dto.SessionDto;
import com.knust.codequest.sessionservice.entity.PracticeSession;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface SessionMapper {
    SessionDto toDto(PracticeSession session);
}
