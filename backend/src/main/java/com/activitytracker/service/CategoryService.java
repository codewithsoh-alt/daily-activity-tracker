package com.activitytracker.service;

import com.activitytracker.dto.CategoryDTO;
import com.activitytracker.exception.BadRequestException;
import com.activitytracker.exception.ResourceNotFoundException;
import com.activitytracker.model.Category;
import com.activitytracker.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryDTO getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        return mapToDTO(category);
    }

    @Transactional
    public CategoryDTO createCategory(CategoryDTO categoryDTO) {
        if (categoryRepository.existsByNameIgnoreCase(categoryDTO.getName())) {
            throw new BadRequestException("Category with name '" + categoryDTO.getName() + "' already exists");
        }
        Category category = new Category();
        category.setName(categoryDTO.getName().trim());
        category.setColor(categoryDTO.getColor() != null ? categoryDTO.getColor().trim() : "#0d6efd");
        category.setDescription(categoryDTO.getDescription());

        Category saved = categoryRepository.save(category);
        return mapToDTO(saved);
    }

    @Transactional
    public CategoryDTO updateCategory(Long id, CategoryDTO categoryDTO) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        // Check unique name if altered
        categoryRepository.findByNameIgnoreCase(categoryDTO.getName().trim())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new BadRequestException("Category with name '" + categoryDTO.getName() + "' already exists");
                    }
                });

        category.setName(categoryDTO.getName().trim());
        if (categoryDTO.getColor() != null && !categoryDTO.getColor().isBlank()) {
            category.setColor(categoryDTO.getColor().trim());
        }
        category.setDescription(categoryDTO.getDescription());

        Category updated = categoryRepository.save(category);
        return mapToDTO(updated);
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category not found with id: " + id);
        }
        categoryRepository.deleteById(id);
    }

    public CategoryDTO mapToDTO(Category category) {
        if (category == null) return null;
        return new CategoryDTO(
                category.getId(),
                category.getName(),
                category.getColor(),
                category.getDescription()
        );
    }
}

