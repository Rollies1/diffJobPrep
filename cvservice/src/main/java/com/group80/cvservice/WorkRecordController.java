package com.group80.cvservice;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/work-records")
@RequiredArgsConstructor
public class WorkRecordController {

    private final WorkRecordService service;

    @PostMapping
    public ResponseEntity<WorkRecord> createWorkRecord(@RequestBody WorkRecord workRecord) {
        return ResponseEntity.ok(service.createWorkRecord(workRecord));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<WorkRecord>> getWorkRecords(@PathVariable Long userId) {
        return ResponseEntity.ok(service.getWorkRecordsByUserId(userId));
    }
}