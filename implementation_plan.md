# Daily Activity Tracker — Implementation Plan & Blueprint

## 1. Project Overview & Architecture

The **Daily Activity Tracker** is a full-stack student application designed to plan, track, and analyze daily tasks and routines.

### Architecture Stack
* **Frontend**: HTML5, CSS3, JavaScript (Vanilla ES6+), Bootstrap 5
* **Backend**: Java (JDK 21/26), Spring Boot (3.x), REST API
* **ORM / Data Access**: Spring Data JPA, Hibernate
* **Database**: PostgreSQL (hosted on Supabase or local instance)
* **Build Tool**: Apache Maven (with Maven Wrapper `mvnw`)

---

## 2. Complete Database Schema (PostgreSQL DDL)

Save this to `database/schema.sql` and run it in the Supabase SQL editor:

```sql
-- ==============================================================================
-- 1. EXTENSIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. CATEGORIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS categories (
    category_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#0d6efd', -- Hex color for UI badges
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Pre-seeded standard categories
INSERT INTO categories (name, color, description) VALUES
    ('Study', '#0d6efd', 'Academic studies, homework, revisions'),
    ('College', '#6f42c1', 'Lectures, labs, submissions, college events'),
    ('Exercise', '#198754', 'Gym, workouts, sports, running'),
    ('Personal', '#0dcaf0', 'Habits, chores, reading, errands'),
    ('Work', '#fd7e14', 'Part-time jobs, projects, internships'),
    ('Other', '#6c757d', 'Miscellaneous tasks')
ON CONFLICT (name) DO NOTHING;

-- ==============================================================================
-- 3. ACTIVITIES TABLE (Core Entity)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS activities (
    activity_id BIGSERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    activity_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' 
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    status VARCHAR(15) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'COMPLETED')),
    category_id BIGINT REFERENCES categories(category_id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_time_window CHECK (start_time IS NULL OR end_time IS NULL OR start_time <= end_time)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category_id);
CREATE INDEX IF NOT EXISTS idx_activities_date_status ON activities(activity_date, status);

-- Trigger to automatically update updated_at on record changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_activities_updated_at ON activities;
CREATE TRIGGER trigger_activities_updated_at
BEFORE UPDATE ON activities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 4. RECURRING ACTIVITIES TABLE (Phase 3 Feature)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS recurring_activities (
    recurring_id BIGSERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    start_time TIME,
    end_time TIME,
    priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' 
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    category_id BIGINT REFERENCES categories(category_id) ON DELETE SET NULL,
    frequency VARCHAR(20) NOT NULL DEFAULT 'DAILY' 
        CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY')),
    days_of_week VARCHAR(30), -- e.g. 'MON,WED,FRI'
    start_date DATE NOT NULL,
    end_date DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_recurring_dates CHECK (end_date IS NULL OR start_date <= end_date)
);

CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurring_activities(active);
```

---

## 3. Security & Quality Principles (Must Keep in Mind)

1. **Environment Variables for Secrets**:
   * Never commit credentials to GitHub.
   * Configure `application.properties` with fallback defaults:
     ```properties
     spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/activitytracker}
     spring.datasource.username=${DB_USERNAME:postgres}
     spring.datasource.password=${DB_PASSWORD:postgres}
     ```
2. **SQL Injection Defense**:
   * Use Spring Data JPA method conventions (`findByActivityDate`, etc.) and parameterized `@Query("SELECT a FROM Activity a WHERE a.category.id = :catId")`.
   * Never concatenate user input directly into SQL strings.
3. **CORS (Cross-Origin Resource Sharing)**:
   * Explicitly configure allowed origins (`http://localhost:5500`, `http://127.0.0.1:5500`) and permitted HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
4. **Input Validation**:
   * Use `jakarta.validation` constraints (`@NotBlank`, `@Size`, `@NotNull`).
   * Validate that `start_time` is before `end_time` when both are supplied.
   * Model `Priority` and `Status` as strict Java enums to block illegal values at the controller boundary.
5. **Centralized Error Handling**:
   * Use a `@RestControllerAdvice` class (`GlobalExceptionHandler`) to output clean JSON error messages rather than leaking stack traces.
6. **Decoupled Business Logic**:
   * Keep all business calculations (e.g. overdue detection, completion percentage) in the Service layer, keeping controllers lean.

---

## 4. What You Need to Code (Layer Breakdown)

### Backend (`backend/`)
* **`model/`**:
  * `Priority.java` (Enum: `LOW`, `MEDIUM`, `HIGH`)
  * `Status.java` (Enum: `PENDING`, `COMPLETED`)
  * `Category.java` (JPA Entity)
  * `Activity.java` (JPA Entity with `@ManyToOne` relationship to `Category`)
* **`dto/`**:
  * `ActivityRequestDTO.java`
  * `ActivityResponseDTO.java`
  * `CategoryDTO.java`
  * `DashboardStatsDTO.java` (total, completed, pending, completionRate, overdueCount)
* **`repository/`**:
  * `CategoryRepository.java`
  * `ActivityRepository.java` (custom queries for date filtering, overdue items)
* **`service/`**:
  * `CategoryService.java`
  * `ActivityService.java` (logic for overdue checks, statistics, CRUD)
* **`controller/`**:
  * `CategoryController.java` (`/api/categories`)
  * `ActivityController.java` (`/api/activities`, `/today`, `/date/{date}`, `/{id}/complete`, `/{id}/pending`)
  * `StatisticsController.java` (`/api/statistics/today`, `/week`, `/overview`)
* **`config/` & `exception/`**:
  * `CorsConfig.java`
  * `ResourceNotFoundException.java`
  * `GlobalExceptionHandler.java`

### Frontend (`frontend/`)
* **Pages**:
  * `index.html` / `dashboard.html`: Today's summary, quick metrics, pending/completed tasks, overdue alert.
  * `activities.html`: Full activity list, search bar, filters (status, category, priority), Add/Edit modal.
  * `calendar.html`: Interactive date picker and scheduled tasks for selected date.
  * `statistics.html`: Completion rates, category distribution.
* **JavaScript & Styles**:
  * `js/api.js`: Reusable fetch helper with error handling.
  * `js/dashboard.js`, `activities.js`, `calendar.js`, `statistics.js`.
  * `css/style.css`: Clean modern UI enhancements on Bootstrap 5.

---

## 5. Step-by-Step Instructions to Give to Antigravity Later

When you are ready to begin implementing, give Antigravity these commands step-by-step:

### Phase 1: Setup & Data Layer
1. **Initialize Project**:
   > *"Set up the Spring Boot Maven project in `backend/` with `pom.xml`, Maven wrapper (`mvnw.cmd`), and `application.properties` configured for PostgreSQL and CORS."*
2. **Entities & Schema**:
   > *"Create the `Priority` and `Status` enums, `Category`, and `Activity` JPA entities, and save the database schema to `database/schema.sql`."*
3. **Repositories & DTOs**:
   > *"Create `CategoryRepository`, `ActivityRepository` with overdue and date search methods, and create the Request/Response DTOs."*

### Phase 2: Business Logic & REST APIs
4. **Service Layer**:
   > *"Implement `CategoryService` and `ActivityService` with CRUD operations, overdue logic (`activityDate < today && status == PENDING`), and completion statistics."*
5. **Controllers & Error Handling**:
   > *"Implement `ActivityController`, `CategoryController`, `StatisticsController`, and a `@RestControllerAdvice` `GlobalExceptionHandler`."*

### Phase 3: Frontend & Verification
6. **Frontend Interface**:
   > *"Create the frontend in `frontend/` using Bootstrap 5 and vanilla JavaScript modules (`api.js`, `dashboard.js`, `activities.js`, `calendar.js`, `statistics.js`, `style.css`)."*
7. **Verification**:
   > *"Build and start the Spring Boot backend, verify API endpoints with sample activities and categories, and test integration with the frontend."*
