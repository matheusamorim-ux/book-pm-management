import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import {
  DAY_LABELS,
  FULL_DAY_LABELS,
  toMinutes,
  toLabel,
  durationLabel,
} from '../lib/scheduling';
import { tokens } from '../theme';

/**
 * MyWorkouts — the saved weekly plan. Shows each planned workout with its day
 * and time, flags any that now conflict after a schedule edit (test state 4),
 * and lets the student remove them.
 *
 * Messaging is encouraging, never shaming — a busy week or a conflict is
 * framed as something to adjust, not a failure.
 */
export default function MyWorkouts({ workouts, conflictIds, onRemove, duration }) {
  const conflictSet = new Set(conflictIds);
  const sorted = [...workouts].sort(
    (a, b) => a.day - b.day || toMinutes(a.start) - toMinutes(b.start)
  );

  return (
    <Box id="my-workouts-panel">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <FitnessCenterIcon sx={{ color: 'primary.light', fontSize: 22 }} />
        <Typography variant="h6" sx={{ fontSize: '0.9rem' }}>
          My Weekly Plan
        </Typography>
      </Box>

      {workouts.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <FitnessCenterIcon sx={{ fontSize: 44, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
            <Typography variant="body1" sx={{ mb: 1, fontWeight: 600 }}>
              No workouts planned yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 340, mx: 'auto', lineHeight: 1.6 }}>
              Pick a suggested time above or tap an open slot on the calendar to start your week. Even one session makes a difference.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {conflictIds.length > 0 && (
            <Alert
              severity="warning"
              icon={<WarningAmberIcon />}
              id="workout-conflict-alert"
              sx={{ mb: 1.5, fontSize: '0.85rem', alignItems: 'center' }}
            >
              {conflictIds.length === 1
                ? 'One planned workout now overlaps with an updated class. Remove it or pick a new time.'
                : `${conflictIds.length} planned workouts now overlap with updated classes. Remove them or pick new times.`}
            </Alert>
          )}

          <Card>
            <List disablePadding>
              {sorted.map((w, idx) => {
                const conflicting = conflictSet.has(w.id);
                const start = toMinutes(w.start);
                const end = toMinutes(w.end);
                const mins = end - start;
                return (
                  <React.Fragment key={w.id}>
                    {idx > 0 && <Divider sx={{ borderColor: tokens.accentDim12 }} />}
                    <ListItem
                      id={`workout-item-${w.id}`}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => onRemove(w.id)}
                          aria-label={`Remove workout on ${FULL_DAY_LABELS[w.day]}`}
                          sx={{ color: 'text.secondary', '&:hover': { color: '#ef4444' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                      sx={{ py: 1.25, backgroundColor: conflicting ? 'rgba(239,68,68,0.06)' : 'inherit' }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {conflicting ? (
                          <WarningAmberIcon sx={{ color: '#ef4444', fontSize: 20 }} />
                        ) : (
                          <FitnessCenterIcon sx={{ color: tokens.violetBright, fontSize: 20 }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                              {FULL_DAY_LABELS[w.day]}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {toLabel(start)} – {toLabel(end)}
                            </Typography>
                            <Chip
                              label={durationLabel(mins)}
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: '0.65rem',
                                height: 20,
                                borderColor: tokens.borderViolet,
                                color: 'text.secondary',
                              }}
                            />
                            {conflicting && (
                              <Chip
                                label="Conflict"
                                size="small"
                                sx={{
                                  fontSize: '0.65rem',
                                  height: 20,
                                  backgroundColor: 'rgba(239,68,68,0.2)',
                                  color: '#FCA5A5',
                                  border: '1px solid rgba(239,68,68,0.5)',
                                  fontFamily: '"Space Grotesk", sans-serif',
                                  fontWeight: 600,
                                }}
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          </Card>

          {/* Encouraging summary footer */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.5, justifyContent: 'center' }}>
            <EmojiEventsIcon sx={{ fontSize: 16, color: tokens.violetBright, opacity: 0.7 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              {workouts.length} {workouts.length === 1 ? 'workout' : 'workouts'} planned this week —
              {conflictIds.length > 0
                ? " adjust the conflicts and you're set."
                : ' great start, keep it going.'}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}
