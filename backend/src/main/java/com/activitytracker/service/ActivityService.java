package com.activitytracker.service;

import com.activitytracker.dto.ActivityRequestDTO;
import com.activitytracker.dto.ActivityResponseDTO;
import com.activitytracker.dto.DashboardStatsDTO;
import com.activitytracker.exception.BadRequestException;
import com.activitytracker.exception.ResourceNotFoundException;
import com.activitytracker.model.Activity;
import com.activitytracker.model.Category;
import com.activitytracker.model.Priority;
import com.activitytracker.model.Status;
import com.activitytracker.repository.ActivityRepository;
import com.activitytracker.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService;

    public ActivityService(ActivityRepository activityRepository,
                           CategoryRepository categoryRepository,
                           CategoryService categoryService) {
        this.activityRepository = activityRepository;
        this.categoryRepository = categoryRepository;
        this.categoryService = categoryService;
    }

    @Transactional(readOnly = true)
    public List<ActivityResponseDTO> getActivities(LocalDate date, Status status, Priority priority, Long categoryId, String search) {
        return activityRepository.filterActivities(date, status, priority, categoryId, search).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ActivityResponseDTO getActivityById(Long id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found with id: " + id));
        return mapToResponseDTO(activity);
    }

    @Transactional(readOnly = true)
    public List<ActivityResponseDTO> getActivitiesForDate(LocalDate date) {
        return activityRepository.findByActivityDateOrderByStartTimeAsc(date).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ActivityResponseDTO> getOverdueActivities() {
        return activityRepository.findOverdueActivities(LocalDate.now(), Status.PENDING).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ActivityResponseDTO createActivity(ActivityRequestDTO dto) {
        validateTimeWindow(dto);

        Activity activity = new Activity();
        applyDtoToActivity(dto, activity);

        Activity saved = activityRepository.save(activity);
        return mapToResponseDTO(saved);
    }

    @Transactional
    public ActivityResponseDTO updateActivity(Long id, ActivityRequestDTO dto) {
        validateTimeWindow(dto);

        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found with id: " + id));

        applyDtoToActivity(dto, activity);

        Activity updated = activityRepository.save(activity);
        return mapToResponseDTO(updated);
    }

    @Transactional
    public ActivityResponseDTO updateStatus(Long id, Status status) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found with id: " + id));
        activity.setStatus(status);
        Activity updated = activityRepository.save(activity);
        return mapToResponseDTO(updated);
    }

    @Transactional
    public void deleteActivity(Long id) {
        if (!activityRepository.existsById(id)) {
            throw new ResourceNotFoundException("Activity not found with id: " + id);
        }
        activityRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public DashboardStatsDTO getTodayStats() {
        LocalDate today = LocalDate.now();
        long total = activityRepository.countByActivityDate(today);
        long completed = activityRepository.countByActivityDateAndStatus(today, Status.COMPLETED);
        long pending = activityRepository.countByActivityDateAndStatus(today, Status.PENDING);
        long overdue = activityRepository.countOverdueActivities(today, Status.PENDING);

        double rate = (total > 0) ? Math.round(((double) completed / total) * 1000.0) / 10.0 : 0.0;
        return new DashboardStatsDTO(total, completed, pending, rate, overdue);
    }

    @Transactional(readOnly = true)
    public DashboardStatsDTO getRangeStats(LocalDate start, LocalDate end) {
        long total = activityRepository.countByActivityDateBetween(start, end);
        long completed = activityRepository.countByActivityDateBetweenAndStatus(start, end, Status.COMPLETED);
        long pending = activityRepository.countByActivityDateBetweenAndStatus(start, end, Status.PENDING);
        long overdue = activityRepository.countOverdueActivities(LocalDate.now(), Status.PENDING);

        double rate = (total > 0) ? Math.round(((double) completed / total) * 1000.0) / 10.0 : 0.0;
        return new DashboardStatsDTO(total, completed, pending, rate, overdue);
    }

    @Transactional(readOnly = true)
    public DashboardStatsDTO getOverallStats() {
        long total = activityRepository.count();
        long completed = activityRepository.countByStatus(Status.COMPLETED);
        long pending = activityRepository.countByStatus(Status.PENDING);
        long overdue = activityRepository.countOverdueActivities(LocalDate.now(), Status.PENDING);

        double rate = (total > 0) ? Math.round(((double) completed / total) * 1000.0) / 10.0 : 0.0;
        return new DashboardStatsDTO(total, completed, pending, rate, overdue);
    }

    private void validateTimeWindow(ActivityRequestDTO dto) {
        if (dto.getStartTime() != null && dto.getEndTime() != null) {
            if (dto.getStartTime().isAfter(dto.getEndTime())) {
                throw new BadRequestException("Start time (" + dto.getStartTime() + ") must not be after end time (" + dto.getEndTime() + ")");
            }
        }
    }

    private void applyDtoToActivity(ActivityRequestDTO dto, Activity activity) {
        activity.setTitle(dto.getTitle().trim());
        activity.setDescription(dto.getDescription());
        activity.setActivityDate(dto.getActivityDate());
        activity.setStartTime(dto.getStartTime());
        activity.setEndTime(dto.getEndTime());
        activity.setPriority(dto.getPriority() != null ? dto.getPriority() : Priority.MEDIUM);
        activity.setStatus(dto.getStatus() != null ? dto.getStatus() : Status.PENDING);
        activity.setNotes(dto.getNotes());

        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + dto.getCategoryId()));
            activity.setCategory(category);
        } else {
            activity.setCategory(null);
        }
    }

    public ActivityResponseDTO mapToResponseDTO(Activity activity) {
        if (activity == null) return null;
        ActivityResponseDTO dto = new ActivityResponseDTO();
        dto.setId(activity.getId());
        dto.setTitle(activity.getTitle());
        dto.setDescription(activity.getDescription());
        dto.setActivityDate(activity.getActivityDate());
        dto.setStartTime(activity.getStartTime());
        dto.setEndTime(activity.getEndTime());
        dto.setPriority(activity.getPriority());
        dto.setStatus(activity.getStatus());
        dto.setNotes(activity.getNotes());
        dto.setCategory(categoryService.mapToDTO(activity.getCategory()));
        dto.setCreatedAt(activity.getCreatedAt());
        dto.setUpdatedAt(activity.getUpdatedAt());

        // Overdue condition: activityDate is strictly before today and status is PENDING
        boolean isOverdue = activity.getStatus() == Status.PENDING && activity.getActivityDate().isBefore(LocalDate.now());
        dto.setOverdue(isOverdue);

        return dto;
    }
}

