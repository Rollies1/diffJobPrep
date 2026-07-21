package com.group80.cvservice;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkRecordService {

    private final WorkRecordRepository repository;

    public WorkRecord createWorkRecord(WorkRecord workRecord) {
        return repository.save(workRecord);
    }

    public List<WorkRecord> getWorkRecordsByUserId(Long userId) {
        return repository.findByUserId(userId);
    }
}