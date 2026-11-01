/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Existing selectors
export const selectSchedules = (state: RootState) => state.schedule.schedules;
export const selectCurrentSchedule = (state: RootState) => state.schedule.currentSchedule;
export const selectInstructors = (state: RootState) => state.schedule.instructors;
export const selectCourses = (state: RootState) => state.schedule.courses;
export const selectRooms = (state: RootState) => state.schedule.rooms;
export const selectBatches = (state: RootState) => state.schedule.batches;
export const selectSemesters = (state: RootState) => state.schedule.semesters;
export const selectSemesterLoading = (state: RootState) => state.schedule.semesterLoading;
  
export const selectLoading = (state: RootState) => state.schedule.loading;
export const selectSubmitting = (state: RootState) => state.schedule.submitting;
export const selectError = (state: RootState) => state.schedule.error;
export const selectSession = (state: RootState) => state.schedule.session;

// NEW: Selectors for BatchSemesterSelector
export const selectBatchSchedules = (state: RootState) => state.schedule.batchSchedules;
export const selectDepartments = (state: RootState) => state.schedule.departments;
export const selectDeptLoading = (state: RootState) => state.schedule.deptLoading;
export const selectBatchFilters = (state: RootState) => state.schedule.selectedFilters;

// New selectors for room hierarchy and today's schedule
export const selectRoomHierarchy = (state: RootState) => state.schedule.roomHierarchy;
export const selectTodaySchedules = (state: RootState) => state.schedule.todaySchedules;
export const selectTodayLoading = (state: RootState) => state.schedule.todayLoading;
export const selectRoomHierarchyLoading = (state: RootState) => state.schedule.roomHierarchyLoading;

// 🤖 AI Selectors
export const selectAiSuggestions = (state: RootState) => state.schedule.aiSuggestions || {};
export const selectAiLoading = (state: RootState) => state.schedule.aiLoading;
export const selectAiError = (state: RootState) => state.schedule.aiError;
export const selectAiConflictPlan = (state: RootState) => state.schedule.aiConflictPlan;
export const selectAiConflictLoading = (state: RootState) => state.schedule.aiConflictLoading;
export const selectAiConflictError = (state: RootState) => state.schedule.aiConflictError;
export const selectAiSuggestionForSchedule = (scheduleId: string | number) => (state: RootState) =>
  state.schedule.aiSuggestions ? state.schedule.aiSuggestions[String(scheduleId)] : undefined;

// Memoized selectors for existing functionality
export const selectSchedulesCount = createSelector(
  [selectSchedules],
  (schedules) => schedules.length
);

export const selectAvailableDays = createSelector(
  [selectCurrentSchedule],
  (currentSchedule) => {
    const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return allDays.filter(d => !currentSchedule.days.some((s: { day_of_week: string; }) => s.day_of_week === d));
  }
);

export const selectInstructorOptions = createSelector(
  [selectInstructors],
  (instructors) => instructors.map(inst => ({
    value: inst.id.toString(),
    label: `${inst.name} - ${inst.idNumber}`
  }))
);

export const selectCourseOptions = createSelector(
  [selectCourses],
  (courses) => courses.map((course: { course_id: any; course_code: any; course_name: any; }) => ({
    value: course.course_id.toString(),
    label: `${course.course_code} - ${course.course_name}`
  }))
);

export const selectRoomOptions = createSelector(
  [selectRooms],
  (rooms) => rooms.map((room) => ({
    value: room.room_id.toString(),
    label: `B ${room.block_name} - ${room.room_number} (${room.room_type})`
  }))
);

// NEW: Memoized selectors for BatchSemesterSelector
export const selectHasBatchSelection = createSelector(
  [selectBatchFilters],
  (filters) => {
    const { department, batch, semester, section } = filters;
    return !!(department && batch && semester && section);
  }
);

export const selectBatchOptions = (state: RootState) => {
  const batches = selectBatches(state);
  
  if (!Array.isArray(batches)) {
    console.error("Batches is not an array:", batches);
    return [];
  }
  
  return batches
    .map(batch => ({
      value: batch.batch_id?.toString() || '',
      label: batch.batch_year || 'Unknown Batch',
    }))
    .filter(option => option.value && option.label);
};

export const selectSemesterOptions = (state: RootState) => {
  const semesters = selectSemesters(state);
  
  if (!Array.isArray(semesters)) {
    console.error("Semesters is not an array:", semesters);
    return [];
  }
  
  return semesters
    .map(semester => ({
      value: semester.id?.toString() || '',
      label: semester.semester || 'Unknown Semester',
    }))
    .filter(option => option.value && option.label);
};
export const selectSelectedDepartment = createSelector(
  [selectDepartments, selectBatchFilters],
  (departments, filters) => {
    return departments.find(dept => dept.department_id.toString() === filters.department);
  }
);

export const selectDepartmentOptions = createSelector(
  [selectDepartments],
  (departments) => departments.map(dept => ({
    value: dept.department_id.toString(),
    label: dept.department_name
  }))
);

export const selectFormattedBatchSchedules = createSelector(
  [selectBatchSchedules],
  (schedules) => {
    return schedules.map(schedule => ({
      ...schedule,
      formattedStartTime: new Date(`1970-01-01T${schedule.start_time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      formattedEndTime: new Date(`1970-01-01T${schedule.end_time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }));
  }
);

export const selectTimeSlots = createSelector(
  [selectBatchSchedules],
  (schedules) => {
    const timeSlots = Array.from(
      new Set(schedules.map(s => `${s.start_time}-${s.end_time}`))
    ).sort();
    
    return timeSlots.map(slot => {
      const [startTime, endTime] = slot.split('-');
      return {
        slot,
        startTime,
        endTime,
        formattedStartTime: new Date(`1970-01-01T${startTime}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        formattedEndTime: new Date(`1970-01-01T${endTime}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        isMorning: new Date(`1970-01-01T${startTime}`).getHours() < 12
      };
    });
  }
);

export const selectSchedulesByDayAndTime = createSelector(
  [selectBatchSchedules],
  (schedules) => {
    const schedulesByDayAndTime: { [key: string]: { [key: string]: any } } = {};
    
    schedules.forEach(schedule => {
      const day = schedule.day_of_week;
      const timeSlot = `${schedule.start_time}-${schedule.end_time}`;
      
      if (!schedulesByDayAndTime[day]) {
        schedulesByDayAndTime[day] = {};
      }
      
      schedulesByDayAndTime[day][timeSlot] = schedule;
    });
    
    return schedulesByDayAndTime;
  }
);

export const selectScheduleStats = createSelector(
  [selectBatchSchedules],
  (schedules) => {
    const totalClasses = schedules.length;
    const classesByDay: { [key: string]: number } = {};
    const instructors = new Set(schedules.map(s => s.instructor_name));
    const courses = new Set(schedules.map(s => s.course_name));
    const rooms = new Set(schedules.map(s => s.room));
    
    schedules.forEach(schedule => {
      const day = schedule.day_of_week;
      classesByDay[day] = (classesByDay[day] || 0) + 1;
    });
    
    return {
      totalClasses,
      totalInstructors: instructors.size,
      totalCourses: courses.size,
      totalRooms: rooms.size,
      classesByDay
    };
  }
);

export const selectFilteredSchedules = createSelector(
  [selectBatchSchedules, selectBatchFilters],
  (schedules) => {
    // If no specific filters beyond the main ones, return all schedules
    return schedules;
  }
);
export const selectDepartmentSchedules = createSelector(
  [selectSchedules, selectSession],
  (schedules, session) => {
    return schedules.filter(schedule => 
      !session?.user?.department_id || schedule.department_id === session.user.department_id
    );
  }
);
export const selectPublishedSchedules = createSelector(
  [selectDepartmentSchedules],
  (schedules) => schedules.filter(s => s.status === 'published')
);

export const selectDraftSchedules = createSelector(
  [selectDepartmentSchedules],
  (schedules) => schedules.filter(s => s.status === 'draft')
);
export const selectCurrentSelectionInfo = createSelector(
  [selectSelectedDepartment, selectBatchFilters],
  (department, filters) => {
    if (!department || !filters.batch || !filters.semester || !filters.section) {
      return null;
    }
    
    return {
      departmentName: department.department_name,
      batch: filters.batch,
      semester: filters.semester,
      section: filters.section === '1' ? 'Single Class' : `Section ${filters.section}`
    };
  }
);

export const selectIsScheduleEmpty = createSelector(
  [selectBatchSchedules, selectHasBatchSelection, selectLoading],
  (schedules, hasSelection, loading) => {
    return hasSelection && !loading && schedules.length === 0;
  }
);

export const selectDayWiseSchedules = createSelector(
  [selectBatchSchedules],
  (schedules) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const dayWise: { [key: string]: any[] } = {};
    
    days.forEach(day => {
      dayWise[day] = schedules.filter(s => s.day_of_week === day)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    
    return dayWise;
  }
);

export const selectScheduleForTimeSlot = createSelector(
  [selectSchedulesByDayAndTime],
  (schedulesByDayAndTime) => 
    (day: string, timeSlot: string) => {
      return schedulesByDayAndTime[day]?.[timeSlot] || null;
    }
);

// Combined loading state for BatchSemesterSelector
export const selectBatchLoading = createSelector(
  [selectLoading, selectDeptLoading],
  (schedulesLoading, deptLoading) => schedulesLoading || deptLoading
);

// Export all selectors in organized groups
export const scheduleSelectors = {
  // Basic state selectors
  selectSchedules,
  selectCurrentSchedule,
  selectInstructors,
  selectCourses,
  selectRooms,
  selectBatches,
  selectSemesters,
  selectSemesterLoading,
  selectLoading,
  selectSubmitting,
  selectError,
  selectSession,
  
  // BatchSemesterSelector specific
  selectBatchSchedules,
  selectDepartments,
  selectDeptLoading,
  selectBatchFilters,
  
  // Memoized selectors - existing
  selectSchedulesCount,
  selectAvailableDays,
  selectInstructorOptions,
  selectCourseOptions,
  selectRoomOptions,
  
  // Memoized selectors - BatchSemesterSelector
  selectHasBatchSelection,
  selectSelectedDepartment,
  selectDepartmentOptions,
  selectFormattedBatchSchedules,
  selectTimeSlots,
  selectSchedulesByDayAndTime,
  selectScheduleStats,
  selectFilteredSchedules,
  selectCurrentSelectionInfo,
  selectIsScheduleEmpty,
  selectDayWiseSchedules,
  selectScheduleForTimeSlot,
  selectBatchLoading,
  // 🤖 AI selectors
  selectAiSuggestions,
  selectAiLoading,
  selectAiError,
  selectAiConflictPlan,
  selectAiConflictLoading,
  selectAiConflictError,
  selectAiSuggestionForSchedule,
};

export default scheduleSelectors;