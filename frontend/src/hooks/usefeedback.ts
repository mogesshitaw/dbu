// hooks/useFeedback.ts
import { useAppSelector } from '@/hooks/redux';

export const useFeedback = () => {
  return useAppSelector((state) => state.feedback);
};