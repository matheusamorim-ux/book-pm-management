import React, { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import usePlanner from '../hooks/usePlanner';
import {
  allAvailableSlots,
  conflictingWorkouts,
  workoutFromSlot,
  workoutConflictsClass,
  workoutOverlapExisting,
  toLabel,
  toMinutes,
  FULL_DAY_LABELS,
  durationLabel,
} from '../lib/scheduling';
import { tokens } from '../theme';
import ClassSchedule from './ClassSchedule';
import WeekCalendar from './WeekCalendar';
import Suggestions from './Suggestions';
import MyWorkouts from './MyWorkouts';

const DURATION_OPTIONS = [30, 45, 60, 75, 90];

/**
 * Planner — the schedule-aware workout planner view.
 * Orchestrates: class schedule entry, duration selection, deterministic
 * suggestion generation, the weekly calendar, and the saved plan.
 */
export default function Planner() {
  const {
    classes,
    workouts,
    duration,
    addClass,
    updateClass,
    removeClass,
    addWorkout,
    removeWorkout,
    setDuration,
  } = usePlanner();

  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });

  // Recompute suggestions whenever classes or duration change (test state 4).
  const suggestions = useMemo(
    () => allAvailableSlots(classes, duration),
    [classes, duration]
  );

  // Detect saved workouts that now conflict after a schedule edit (test state 4).
  const conflictIds = useMemo(
    () => conflictingWorkouts(classes, workouts),
    [classes, workouts]
  );

  const handleAddSuggestion = useCallback(
    (slot) => {
      // Guardrail: never add a workout that overlaps a class (test state 3).
      const candidate = workoutFromSlot(slot, undefined);
      if (workoutConflictsClass(classes, candidate)) {
        setToast({
          open: true,
          severity: 'error',
          msg: `That time overlaps with a class — pick another slot.`,
        });
        return;
      }
      // Guardrail: prevent conflicting workout plans (two workouts at once).
      const overlap = workoutOverlapExisting(workouts, candidate);
      if (overlap) {
        setToast({
          open: true,
          severity: 'error',
          msg: `You already have a workout then on ${FULL_DAY_LABELS[slot.day]}.`,
        });
        return;
      }
      const saved = addWorkout(workoutFromSlot(slot, undefined));
      setToast({
        open: true,
        severity: 'success',
        msg: `Added ${durationLabel(duration)} workout on ${FULL_DAY_LABELS[slot.day]} at ${toLabel(slot.start)}.`,
      });
      void saved;
    },
    [classes, workouts, duration, addWorkout]
  );

  const handleRemoveWorkout = useCallback(
    (id) => {
      removeWorkout(id);
      setToast({ open: true, severity: 'success', msg: 'Workout removed from your plan.' });
    },
    [removeWorkout]
  );

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 1.5, sm: 2 }, py: 3 }}>
      {/* Heading */}
      <Typography variant="h5" sx={{ fontSize: '1.2rem', mb: 0.5 }}>
        Workout Planner
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 560, lineHeight: 1.6 }}>
        Enter your classes, choose how long you want to work out, and we'll find times that fit around them. No pressure — even one session counts.
      </Typography>

      {/* Duration selector */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <TimerOutlinedIcon sx={{ color: 'primary.light', fontSize: 20 }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Workout length
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={duration}
          exclusive
          onChange={(_, v) => v && setDuration(v)}
          size="small"
          aria-label="Preferred workout duration"
          id="duration-selector"
        >
          {DURATION_OPTIONS.map((d) => (
            <ToggleButton
              key={d}
              value={d}
              id={`duration-${d}`}
              sx={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontFamily: '"Space Grotesk", sans-serif',
                px: 1.5,
                '&.Mui-selected': {
                  backgroundColor: tokens.accentDim15,
                  color: tokens.violetBright,
                  borderColor: tokens.accentBorder40,
                },
              }}
            >
              {d < 60 ? `${d} min` : `${d / 60} hr`}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Weekly calendar */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CalendarMonthIcon sx={{ color: 'primary.light', fontSize: 22 }} />
          <Typography variant="h6" sx={{ fontSize: '0.9rem' }}>
            This Week
          </Typography>
        </Box>
        <WeekCalendar
          classes={classes}
          workouts={workouts}
          suggestions={suggestions}
          conflictIds={conflictIds}
          onAddSuggestion={handleAddSuggestion}
          onRemoveWorkout={handleRemoveWorkout}
        />
      </Box>

      {/* Two-column layout: suggestions + plan on the right, classes on the left */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Suggestions
            classes={classes}
            duration={duration}
            onAdd={handleAddSuggestion}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <MyWorkouts
            workouts={workouts}
            conflictIds={conflictIds}
            onRemove={handleRemoveWorkout}
            duration={duration}
          />
        </Grid>
      </Grid>

      {/* Class schedule — full width below */}
      <Box sx={{ mt: 4 }}>
        <ClassSchedule
          classes={classes}
          onAdd={addClass}
          onUpdate={updateClass}
          onRemove={removeClass}
        />
      </Box>

      {/* Toast feedback */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3200}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          variant="filled"
          sx={{ alignItems: 'center' }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
