// hooks/useAnnouncement.ts
import { useAppSelector } from './redux';

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