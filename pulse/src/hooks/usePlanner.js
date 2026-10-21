import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const CLASSES_KEY = 'planner.classes';
const WORKOUTS_KEY = 'planner.workouts';
const DURATION_KEY = 'planner.duration';

const DEFAULT_DURATION = 45;

/**
 * Custom hook for the workout planner. Manages three persisted pieces of state:
 *   - classes   : the student's entered class schedule
 *   - workouts  : saved planned workouts
 *   - duration  : preferred workout length in minutes
 *
 * All three are stored in localStorage, mirroring the pattern in useEntries.
 * The hook never modifies the student's class schedule as a side effect of
 * saving a workout — edits to classes are explicit and user-initiated.
 */
export default function usePlanner() {
  const [classes, setClasses] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [duration, setDurationState] = useState(DEFAULT_DURATION);

  // Load persisted state on mount.
  useEffect(() => {
    try {
      const c = localStorage.getItem(CLASSES_KEY);
      if (c) setClasses(JSON.parse(c));
    } catch {
      // ignore
    }
    try {
      const w = localStorage.getItem(WORKOUTS_KEY);
      if (w) setWorkouts(JSON.parse(w));
    } catch {
      // ignore
    }
    try {
      const d = localStorage.getItem(DURATION_KEY);
      if (d) setDurationState(Number(d) || DEFAULT_DURATION);
    } catch {
      // ignore
    }
  }, []);

  const persistClasses = useCallback((next) => {
    setClasses(next);
    localStorage.setItem(CLASSES_KEY, JSON.stringify(next));
  }, []);

  const persistWorkouts = useCallback((next) => {
    setWorkouts(next);
    localStorage.setItem(WORKOUTS_KEY, JSON.stringify(next));
  }, []);

  const persistDuration = useCallback((next) => {
    setDurationState(next);
    localStorage.setItem(DURATION_KEY, String(next));
  }, []);

  /** Add a class block. */
  const addClass = useCallback((block) => {
    const newClass = { ...block, id: uuidv4() };
    persistClasses((prev) => [...prev, newClass]);
    return newClass;
  }, [persistClasses]);

  /** Update an existing class by id. */
  const updateClass = useCallback((id, changes) => {
    persistClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...changes } : c)));
  }, [persistClasses]);

  /** Remove a class by id. */
  const removeClass = useCallback((id) => {
    persistClasses((prev) => prev.filter((c) => c.id !== id));
  }, [persistClasses]);

  /** Save a workout to the weekly plan. */
  const addWorkout = useCallback((workout) => {
    const newWorkout = { ...workout, id: workout.id || uuidv4() };
    persistWorkouts((prev) => [...prev, newWorkout]);
    return newWorkout;
  }, [persistWorkouts]);

  /** Remove a planned workout by id. */
  const removeWorkout = useCallback((id) => {
    persistWorkouts((prev) => prev.filter((w) => w.id !== id));
  }, [persistWorkouts]);

  /** Set the preferred workout duration (minutes). */
  const setDuration = useCallback((mins) => {
    persistDuration(mins);
  }, [persistDuration]);

  return {
    classes,
    workouts,
    duration,
    addClass,
    updateClass,
    removeClass,
    addWorkout,
    removeWorkout,
    setDuration,
  };
}
