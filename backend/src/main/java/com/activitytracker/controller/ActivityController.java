package com.activitytracker.controller;

import com.activitytracker.dto.ActivityRequestDTO;
import com.activitytracker.dto.ActivityResponseDTO;
import com.activitytracker.model.Priority;
import com.activitytracker.model.Status;
import com.activitytracker.service.ActivityService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @GetMapping
    public ResponseEntity<List<ActivityResponseDTO>> getActivities(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Status status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(activityService.getActivities(date, status, priority, categoryId, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActivityResponseDTO> getActivityById(@PathVariable Long id) {
        return ResponseEntity.ok(activityService.getActivityById(id));
    }

    @GetMapping("/today")
    public ResponseEntity<List<ActivityResponseDTO>> getTodayActivities() {
        return ResponseEntity.ok(activityService.getActivitiesForDate(LocalDate.now()));
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<ActivityResponseDTO>> getActivitiesByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(activityService.getActivitiesForDate(date));
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<ActivityResponseDTO>> getOverdueActivities() {
        return ResponseEntity.ok(activityService.getOverdueActivities());
    }

    @PostMapping
    public ResponseEntity<ActivityResponseDTO> createActivity(@Valid @RequestBody ActivityRequestDTO dto) {
        ActivityResponseDTO created = activityService.createActivity(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ActivityResponseDTO> updateActivity(
            @PathVariable Long id,
            @Valid @RequestBody ActivityRequestDTO dto) {
        ActivityResponseDTO updated = activityService.updateActivity(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ActivityResponseDTO> markAsCompleted(@PathVariable Long id) {
        ActivityResponseDTO updated = activityService.updateStatus(id, Status.COMPLETED);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/pending")
    public ResponseEntity<ActivityResponseDTO> markAsPending(@PathVariable Long id) {
        ActivityResponseDTO updated = activityService.updateStatus(id, Status.PENDING);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteActivity(@PathVariable Long id) {
        activityService.deleteActivity(id);
        return ResponseEntity.noContent().build();
    }
}

