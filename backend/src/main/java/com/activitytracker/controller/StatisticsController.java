package com.activitytracker.controller;

import com.activitytracker.dto.DashboardStatsDTO;
import com.activitytracker.service.ActivityService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private final ActivityService activityService;

    public StatisticsController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @GetMapping("/today")
    public ResponseEntity<DashboardStatsDTO> getTodayStats() {
        return ResponseEntity.ok(activityService.getTodayStats());
    }

    @GetMapping("/week")
    public ResponseEntity<DashboardStatsDTO> getWeekStats() {
        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate endOfWeek = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        return ResponseEntity.ok(activityService.getRangeStats(startOfWeek, endOfWeek));
    }

    @GetMapping("/overview")
    public ResponseEntity<DashboardStatsDTO> getOverviewStats() {
        return ResponseEntity.ok(activityService.getOverallStats());
    }

    @GetMapping("/range")
    public ResponseEntity<DashboardStatsDTO> getCustomRangeStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(activityService.getRangeStats(start, end));
    }
}

