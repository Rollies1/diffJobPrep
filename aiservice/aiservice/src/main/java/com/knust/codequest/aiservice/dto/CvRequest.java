package com.knust.codequest.aiservice.dto;

import lombok.Data;
import java.util.List;

@Data
public class CvRequest {
    private String name;
    private String email;
    private String phone;
    private String university;
    private String program;
    private List<String> skills;
    private List<String> experience;
    private List<String> projects;
    private List<String> certifications;
}