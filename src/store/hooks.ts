import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from 'react-redux';
import type { RootState, AppDispatch } from './index';

/**
 * Typed useDispatch hook for use throughout the application.
 * Use this instead of plain `useDispatch` to get proper TypeScript support.
 */
export const useAppDispatch: () => AppDispatch = useDispatch;

/**
 * Typed useSelector hook for use throughout the application.
 * Use this instead of plain `useSelector` to get proper TypeScript support.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
