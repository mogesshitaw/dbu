import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Basic selectors
export const selectInstructors = (state: RootState) => state.instructor.instructors;
export const selectInstructorsLoading = (state: RootState) => state.instructor.loading;
export const selectInstructorsError = (state: RootState) => state.instructor.error;

export const selectActiveSection = (state: RootState) => state.ui.activeSection;
export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpened;

// Memoized selectors
export const selectInstructorsCount = createSelector(
  [selectInstructors],
  (instructors) => instructors.length
);

export const selectActiveInstructors = createSelector(
  [selectInstructors],
  (instructors) => instructors.filter(instructor => instructor.id) // Add actual active filter logic
);

export const selectInstructorsStats = createSelector(
  [selectInstructors],
  (instructors) => ({
    total: instructors.length,
    withEmail: instructors.filter(instructor => instructor.email).length,
    withoutEmail: instructors.filter(instructor => !instructor.email).length,
  })
);

export const selectNavigationInfo = createSelector(
  [selectActiveSection, selectInstructorsCount],
  (activeSection, instructorsCount) => ({
    activeSection,
    instructorsCount,
    sectionsCount: 3, // addCourse, showCourses, showInstructors
  })
);