package com.activitytracker.repository;

import com.activitytracker.model.Activity;
import com.activitytracker.model.Priority;
import com.activitytracker.model.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {

    List<Activity> findByActivityDateOrderByStartTimeAsc(LocalDate activityDate);

    List<Activity> findByActivityDateBetweenOrderByActivityDateAscStartTimeAsc(LocalDate startDate, LocalDate endDate);

    List<Activity> findByStatus(Status status);

    List<Activity> findByCategoryId(Long categoryId);

    // Overdue items: date before today and status PENDING
    @Query("SELECT a FROM Activity a WHERE a.activityDate < :today AND a.status = :status ORDER BY a.activityDate ASC, a.startTime ASC")
    List<Activity> findOverdueActivities(@Param("today") LocalDate today, @Param("status") Status status);

    long countByActivityDate(LocalDate activityDate);

    long countByActivityDateAndStatus(LocalDate activityDate, Status status);

    long countByActivityDateBetween(LocalDate startDate, LocalDate endDate);

    long countByActivityDateBetweenAndStatus(LocalDate startDate, LocalDate endDate, Status status);

    long countByStatus(Status status);

    @Query("SELECT COUNT(a) FROM Activity a WHERE a.activityDate < :today AND a.status = :status")
    long countOverdueActivities(@Param("today") LocalDate today, @Param("status") Status status);

    @Query("SELECT a FROM Activity a WHERE " +
           "(:date IS NULL OR a.activityDate = :date) AND " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:priority IS NULL OR a.priority = :priority) AND " +
           "(:categoryId IS NULL OR a.category.id = :categoryId) AND " +
           "(CAST(:search AS string) IS NULL OR LOWER(a.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(a.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) " +
           "ORDER BY a.activityDate DESC, a.startTime ASC")
    List<Activity> filterActivities(@Param("date") LocalDate date,
                                    @Param("status") Status status,
                                    @Param("priority") Priority priority,
                                    @Param("categoryId") Long categoryId,
                                    @Param("search") String search);
}

