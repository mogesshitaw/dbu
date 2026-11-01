// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import usersReducer from './slices/usersSlice';
import departmentsReducer from './slices/departmentsSlice';
import roomsReducer from './slices/roomsSlice';
import checkReducer from './slices/checkSession';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import coursesSlice from './slices/coursesSlice';
import instructorsSlice from './slices/instructorsSlice';
import sheduleslice from './slices/scheduleSlice';
import announcementsReducer from './slices/announcementsSlice';
import dashboardReducer from './slices/dashboardSlice';
import feedbackReducer from './slices/feedbackSlice';
import userSettingsReducer from './slices/userSettingsSlice';
import batchReducer from './slices/batchSlice';
import SemesterReducer from './slices/semesterSlice';
import facultyReducer from './slices/facultySlice';
import studentReducer from './slices/studentSlice';
import chatReducer from './slices/chatSlice';
import courseBatchReducer from './slices/courseBatchSlice'; 
import timeSlotsreducer from './slices/timeSlotSlice';
import sectionRoomsReducer from './slices/sectionRoomSlice';
import courseSectionsreducer from './slices/courseSectionSlice';
import academicYearReducer from './slices/academicYearSlice';

export const store = configureStore({
  reducer: {
    users: usersReducer,
    departments: departmentsReducer,
    rooms: roomsReducer,
    auth: checkReducer,
    loginauth: authReducer,
    ui: uiReducer,
    courses: coursesSlice,
    instructor: instructorsSlice,
    schedule:sheduleslice,
     announcements: announcementsReducer,
     dashboard: dashboardReducer,
       feedback: feedbackReducer,
       userSettings: userSettingsReducer,
       batches:batchReducer,
       semesters: SemesterReducer,
    faculty: facultyReducer,
    students: studentReducer,
    chat: chatReducer,
    courseBatches: courseBatchReducer,
    timeSlots: timeSlotsreducer,
    sectionRooms: sectionRoomsReducer,
    courseSections: courseSectionsreducer,
    academicYears: academicYearReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;