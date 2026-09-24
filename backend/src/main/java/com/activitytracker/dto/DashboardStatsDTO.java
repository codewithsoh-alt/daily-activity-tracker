package com.activitytracker.dto;

public class DashboardStatsDTO {

    private long total;
    private long completed;
    private long pending;
    private double completionRate;
    private long overdueCount;

    public DashboardStatsDTO() {
    }

    public DashboardStatsDTO(long total, long completed, long pending, double completionRate, long overdueCount) {
        this.total = total;
        this.completed = completed;
        this.pending = pending;
        this.completionRate = completionRate;
        this.overdueCount = overdueCount;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public long getCompleted() {
        return completed;
    }

    public void setCompleted(long completed) {
        this.completed = completed;
    }

    public long getPending() {
        return pending;
    }

    public void setPending(long pending) {
        this.pending = pending;
    }

    public double getCompletionRate() {
        return completionRate;
    }

    public void setCompletionRate(double completionRate) {
        this.completionRate = completionRate;
    }

    public long getOverdueCount() {
        return overdueCount;
    }

    public void setOverdueCount(long overdueCount) {
        this.overdueCount = overdueCount;
    }
}

