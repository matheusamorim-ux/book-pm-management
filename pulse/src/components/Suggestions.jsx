import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AddIcon from '@mui/icons-material/Add';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import {
  DAY_LABELS,
  FULL_DAY_LABELS,
  toMinutes,
  toLabel,
  durationLabel,
  allAvailableSlots,
} from '../lib/scheduling';
import { tokens } from '../theme';

/**
 * Suggestions — the list of available workout slots that fit around classes.
 * Handles the "no available time" test state explicitly: when classes occupy
 * every suitable slot, we say so plainly rather than inventing availability.
 */
export default function Suggestions({ classes, duration, onAdd, limit = 6 }) {
  // Recompute suggestions whenever classes or duration change (test state 4).
  const allSlots = useMemo(
    () => allAvailableSlots(classes, duration),
    [classes, duration]
  );

  // Group by day, keep order.
  const byDay = useMemo(() => {
    const map = new Map();
    for (const s of allSlots) {
      if (!map.has(s.day)) map.set(s.day, []);
      map.get(s.day).push(s);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [allSlots]);

  // For each day, show up to `limit` evenly spaced suggestions (first, last,
  // and a few between) so the student sees a spread rather than every 15 min.
  const dayGroups = useMemo(() => {
    return byDay.map(([day, slots]) => {
      const picked = pickSpread(slots, limit);
      return { day, slots: picked, total: slots.length };
    });
  }, [byDay, limit]);

  if (allSlots.length === 0) {
    const hasClasses = classes.length > 0;
    return (
      <Box id="suggestions-panel">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <EventAvailableIcon sx={{ color: 'primary.light', fontSize: 22 }} />
          <Typography variant="h6" sx={{ fontSize: '0.9rem' }}>
            Suggested Times
          </Typography>
        </Box>
        <Card id="no-availability-card">
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <SearchOffIcon sx={{ fontSize: 44, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
            <Typography variant="body1" sx={{ mb: 1, fontWeight: 600 }}>
              No matching slots right now
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mx: 'auto', lineHeight: 1.6 }}>
              {hasClasses
                ? `Your ${durationLabel(duration)} workout doesn't fit around your current classes in the 7 AM–10 PM window. Try a shorter duration, or adjust a class to open up time.`
                : `Enter your classes and pick a workout duration — we'll find times that fit around your schedule.`}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box id="suggestions-panel">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventAvailableIcon sx={{ color: 'primary.light', fontSize: 22 }} />
          <Typography variant="h6" sx={{ fontSize: '0.9rem' }}>
            Suggested Times
          </Typography>
        </Box>
        <Chip
          label={`${durationLabel(duration)}`}
          size="small"
          sx={{
            fontSize: '0.7rem',
            height: 22,
            borderColor: tokens.borderViolet,
            color: tokens.violetBright,
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 600,
          }}
          variant="outlined"
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {dayGroups.map(({ day, slots, total }) => (
          <Card key={day}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontSize: '0.8rem', color: 'text.primary' }}
                >
                  {FULL_DAY_LABELS[day]}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                  {total} {total === 1 ? 'slot' : 'slots'} available
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {slots.map((s, i) => (
                  <Chip
                    key={i}
                    icon={<AddIcon sx={{ fontSize: 14 }} />}
                    label={`${toLabel(s.start)}`}
                    onClick={() => onAdd(s)}
                    variant="outlined"
                    clickable
                    aria-label={`Add workout ${DAY_LABELS[day]} ${toLabel(s.start)} to ${toLabel(s.end)}`}
                    sx={{
                      fontSize: '0.72rem',
                      height: 26,
                      borderColor: tokens.accentBorder40,
                      color: 'text.primary',
                      fontFamily: '"Space Grotesk", sans-serif',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: tokens.accentDim12,
                        borderColor: tokens.violet,
                      },
                      '& .MuiChip-icon': { color: tokens.violetBright },
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

/** Pick up to `limit` slots spread across the day (first, last, evenly between). */
function pickSpread(slots, limit) {
  if (slots.length <= limit) return slots;
  const result = [];
  const step = (slots.length - 1) / (limit - 1);
  for (let i = 0; i < limit; i++) {
    const idx = Math.round(i * step);
    result.push(slots[idx]);
  }
  return result;
}
