package com.jobprep.notification.dto;

import jakarta.validation.constraints.Size;

public record SendTestPushRequest(
    @Size(max = 256) String title,
    @Size(max = 1024) String body
) {}
