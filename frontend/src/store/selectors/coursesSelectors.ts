import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

export const selectCourses = (state: RootState) => state.courses.courses;
export const selectCoursesLoading = (state: RootState) => state.courses.loading;
export const selectCoursesError = (state: RootState) => state.courses.error;
export const selectEditingCourse = (state: RootState) => state.courses.editingCourse;
export const selectSubmitting = (state: RootState) => state.courses.submitting;

export const selectCoursesCount = createSelector(
  [selectCourses],
  (courses) => courses.length
);

export const selectCoursesWithDepartments = createSelector(
  [selectCourses, (state: RootState) => state.departments.departments],
  (courses, departments) => 
    courses.map(course => ({
      ...course,
      department_name: departments.find(dept => dept.department_id === course.department_id)?.department_name || "Unknown"
    }))
);