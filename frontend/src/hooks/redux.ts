// hooks/redux.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import { InstructorState } from '@/store/slices/instructorsSlice';


export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAnnouncements = () => {
const state = useAppSelector((state) => state.announcements);
  
  return {
    announcements: state?.announcements || [],
    currentAnnouncement: state?.currentAnnouncement || null,
    loading: state?.loading || false,
    error: state?.error || null,
    submitting: state?.submitting || false,
  };
};
export const useFeedback = () => {
  return useAppSelector((state) => state.feedback);
};
export const useInstructor = (): InstructorState => {
  return useAppSelector((state) => state.instructor);
};

// Specific selectors for better performance
export const useInstructorsList = () => {
  return useAppSelector((state) => state.instructor.instructors);
};

export const useInstructorsLoading = () => {
  return useAppSelector((state) => state.instructor.instructorsLoading);
};

export const useInstructorsError = () => {
  return useAppSelector((state) => state.instructor.instructorsError);
};

export const useInstructorSchedules = () => {
  return useAppSelector((state) => state.instructor.schedules);
};

export const useScheduleLoading = () => {
  return useAppSelector((state) => state.instructor.scheduleLoading);
};

export const useScheduleError = () => {
  return useAppSelector((state) => state.instructor.scheduleError);
};

export const useCurrentInstructorInfo = () => {
  return useAppSelector((state) => state.instructor.instructorInfo);
};

export const useSelectedInstructor = () => {
  return useAppSelector((state) => state.instructor.selectedInstructor);
};