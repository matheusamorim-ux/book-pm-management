import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import SchoolIcon from '@mui/icons-material/School';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  DAY_LABELS,
  toMinutes,
  toLabel,
  classesForDay,
  workoutConflictsClass,
} from '../lib/scheduling';
import { tokens } from '../theme';

const START_MIN = 7 * 60; // 07:00 — top of grid
const END_MIN = 22 * 60; // 22:00 — bottom of grid
const PX_PER_MIN = 1.6; // row height scale
const ROW_HEIGHT = (END_MIN - START_MIN) * PX_PER_MIN;

/**
 * WeekCalendar — a 7-column weekly grid.
 * Shows entered classes, saved workouts (flagged if they now conflict), and
 * available suggestion slots the student can click to add.
 */
export default function WeekCalendar({
  classes,
  workouts,
  suggestions = [],
  conflictIds = [],
  onAddSuggestion,
  onRemoveWorkout,
}) {
  const conflictSet = new Set(conflictIds);

  return (
    <Box id="week-calendar">
      <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
        {/* Time gutter */}
        <Box sx={{ width: 48, flexShrink: 0 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
            &nbsp;
          </Typography>
        </Box>
        {DAY_LABELS.map((label) => (
          <Box key={label} sx={{ flex: 1, textAlign: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.6rem', sm: '0.7rem' },
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 600,
                letterSpacing: '0.06em',
              }}
            >
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 0.5, overflowX: 'auto' }}>
        {/* Time labels gutter */}
        <Box sx={{ width: 48, flexShrink: 0, position: 'relative', height: ROW_HEIGHT }}>
          {[8, 10, 12, 14, 16, 18, 20, 22].map((h) => {
            const top = (h * 60 - START_MIN) * PX_PER_MIN;
            return (
              <Box
                key={h}
                sx={{
                  position: 'absolute',
                  top,
                  left: 0,
                  right: 0,
                  transform: 'translateY(-50%)',
                  fontSize: '0.6rem',
                  color: 'text.secondary',
                  textAlign: 'right',
                  pr: 0.5,
                }}
              >
                {h <= 12 ? `${h}:00` : `${h - 12}:00`}
              </Box>
            );
          })}
        </Box>

        {/* Day columns */}
        {DAY_LABELS.map((_, day) => {
          const dayClasses = classesForDay(classes, day);
          const dayWorkouts = workouts.filter((w) => w.day === day);
          const daySuggestions = suggestions.filter((s) => s.day === day);
          return (
            <Box
              key={day}
              sx={{
                flex: 1,
                position: 'relative',
                height: ROW_HEIGHT,
                minWidth: { xs: 56, sm: 80 },
                border: `1px solid ${tokens.accentDim12}`,
                borderRadius: 1,
                backgroundColor: 'rgba(10,10,15,0.4)',
              }}
            >
              {/* Hour gridlines */}
              {[8, 10, 12, 14, 16, 18, 20].map((h) => (
                <Box
                  key={h}
                  sx={{
                    position: 'absolute',
                    top: (h * 60 - START_MIN) * PX_PER_MIN,
                    left: 0,
                    right: 0,
                    borderTop: `1px dashed ${tokens.accentDim08}`,
                  }}
                />
              ))}

              {/* Classes */}
              {dayClasses.map((c) => {
                const top = (c.start - START_MIN) * PX_PER_MIN;
                const height = (c.end - c.start) * PX_PER_MIN;
                return (
                  <Tooltip
                    key={c.id}
                    title={`${c.title || 'Class'} · ${toLabel(c.start)}–${toLabel(c.end)}`}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top,
                        left: 2,
                        right: 2,
                        height: Math.max(height - 2, 16),
                        backgroundColor: 'rgba(142,142,160,0.22)',
                        border: '1px solid rgba(142,142,160,0.4)',
                        borderRadius: 1,
                        px: 0.5,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.25,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                        <SchoolIcon sx={{ fontSize: 10, color: '#C9C9D6' }} />
                        <Typography sx={{ fontSize: '0.58rem', color: '#D8D8E2', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.title || 'Class'}
                        </Typography>
                      </Box>
                      {height > 28 && (
                        <Typography sx={{ fontSize: '0.55rem', color: 'rgba(216,216,226,0.7)', lineHeight: 1.1 }}>
                          {toLabel(c.start)}
                        </Typography>
                      )}
                    </Box>
                  </Tooltip>
                );
              })}

              {/* Saved workouts */}
              {dayWorkouts.map((w) => {
                const start = toMinutes(w.start);
                const end = toMinutes(w.end);
                if (start == null || end == null) return null;
                const top = (start - START_MIN) * PX_PER_MIN;
                const height = (end - start) * PX_PER_MIN;
                const conflicting = conflictSet.has(w.id);
                return (
                  <Tooltip
                    key={w.id}
                    title={
                      conflicting
                        ? `Conflicts with a class! ${toLabel(start)}–${toLabel(end)} — click to remove`
                        : `Workout · ${toLabel(start)}–${toLabel(end)} — click to remove`
                    }
                  >
                    <Box
                      onClick={() => onRemoveWorkout(w.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRemoveWorkout(w.id); } }}
                      aria-label={`Remove workout on ${DAY_LABELS[day]} at ${toLabel(start)}`}
                      sx={{
                        position: 'absolute',
                        top,
                        left: 2,
                        right: 2,
                        height: Math.max(height - 2, 16),
                        backgroundColor: conflicting
                          ? 'rgba(239,68,68,0.28)'
                          : tokens.accentDim15,
                        border: conflicting
                          ? '1px solid #ef4444'
                          : `1px solid ${tokens.accentBorder40}`,
                        borderRadius: 1,
                        px: 0.5,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.25,
                        '&:hover': {
                          backgroundColor: conflicting
                            ? 'rgba(239,68,68,0.4)'
                            : tokens.accentDim15,
                          boxShadow: `0 0 12px ${tokens.glowViolet}`,
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                        {conflicting ? (
                          <WarningAmberIcon sx={{ fontSize: 10, color: '#ef4444' }} />
                        ) : (
                          <FitnessCenterIcon sx={{ fontSize: 10, color: tokens.violetBright }} />
                        )}
                        <Typography sx={{ fontSize: '0.58rem', color: conflicting ? '#FCA5A5' : tokens.violetBright, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {conflicting ? 'Conflict' : 'Workout'}
                        </Typography>
                      </Box>
                      {height > 28 && (
                        <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', lineHeight: 1.1 }}>
                          {toLabel(start)}
                        </Typography>
                      )}
                    </Box>
                  </Tooltip>
                );
              })}

              {/* Suggestion slots (clickable) */}
              {daySuggestions.map((s, i) => {
                const top = (s.start - START_MIN) * PX_PER_MIN;
                const height = (s.end - s.start) * PX_PER_MIN;
                // Skip rendering a suggestion if a saved workout already occupies this slot.
                const taken = dayWorkouts.some((w) => {
                  const ws = toMinutes(w.start);
                  const we = toMinutes(w.end);
                  return ws != null && we != null && ws < s.end && s.start < we;
                });
                if (taken) return null;
                return (
                  <Tooltip
                    key={`sug-${day}-${i}`}
                    title={`Available ${toLabel(s.start)}–${toLabel(s.end)} — click to add`}
                  >
                    <Box
                      onClick={() => onAddSuggestion(s)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAddSuggestion(s); } }}
                      aria-label={`Add workout on ${DAY_LABELS[day]} at ${toLabel(s.start)}`}
                      sx={{
                        position: 'absolute',
                        top,
                        left: 2,
                        right: 2,
                        height: Math.max(height - 2, 8),
                        border: `1px dashed ${tokens.accentBorder40}`,
                        borderRadius: 1,
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '&:hover': {
                          backgroundColor: tokens.accentDim08,
                          borderStyle: 'solid',
                        },
                      }}
                    >
                      <AddIconMini />
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
          );
        })}
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
        <LegendItem color="rgba(142,142,160,0.22)" border="rgba(142,142,160,0.4)" label="Class" />
        <LegendItem color={tokens.accentDim15} border={tokens.accentBorder40} label="Planned workout" />
        <LegendItem color="rgba(239,68,68,0.28)" border="#ef4444" label="Conflict" />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 14, height: 10, border: `1px dashed ${tokens.accentBorder40}`, borderRadius: 0.5 }} />
          <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>Available slot</Typography>
        </Box>
      </Box>
    </Box>
  );
}

function LegendItem({ color, border, label }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Box sx={{ width: 14, height: 10, backgroundColor: color, border: `1px solid ${border}`, borderRadius: 0.5 }} />
      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>{label}</Typography>
    </Box>
  );
}

function AddIconMini() {
  return (
    <Typography sx={{ fontSize: '0.7rem', color: tokens.accentBorder40, fontWeight: 700, lineHeight: 1 }}>
      +
    </Typography>
  );
}
