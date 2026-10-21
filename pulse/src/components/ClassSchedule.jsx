import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import SchoolIcon from '@mui/icons-material/School';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import {
  DAY_LABELS,
  FULL_DAY_LABELS,
  validateClassBlock,
  classConflict,
  toMinutes,
  toLabel,
} from '../lib/scheduling';
import { tokens } from '../theme';

const DURATION_PRESETS = [30, 45, 60, 75, 90];

const emptyForm = { title: '', day: 0, start: '09:00', end: '10:00' };

/**
 * ClassSchedule — enter and edit your weekly class schedule.
 * The student owns this list; the planner never modifies it.
 */
export default function ClassSchedule({ classes, onAdd, onUpdate, onRemove }) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (justSaved) {
      const t = setTimeout(() => setJustSaved(false), 1200);
      return () => clearTimeout(t);
    }
  }, [justSaved]);

  function startEdit(c) {
    setEditingId(c.id);
    setForm({ title: c.title || '', day: c.day, start: c.start, end: c.end });
    setError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const validationError = validateClassBlock(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const conflict = classConflict(classes, form, editingId);
    if (conflict) {
      setError(
        `That overlaps with "${conflict.title || 'a class'}" on ${FULL_DAY_LABELS[conflict.day]} (${toLabel(toMinutes(conflict.start))}).`
      );
      return;
    }

    if (editingId) {
      onUpdate(editingId, form);
      setEditingId(null);
    } else {
      onAdd(form);
    }
    setForm(emptyForm);
    setJustSaved(true);
  }

  const sortedClasses = [...classes].sort(
    (a, b) => a.day - b.day || toMinutes(a.start) - toMinutes(b.start)
  );

  return (
    <Box id="class-schedule">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <SchoolIcon sx={{ color: 'primary.light', fontSize: 22 }} />
        <Typography variant="h6" sx={{ fontSize: '0.9rem' }}>
          My Classes
        </Typography>
      </Box>

      {/* Add / edit form */}
      <Card sx={{ mb: 2 }}>
        <CardContent
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            label="Class name (optional)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Intro to Biology"
            fullWidth
            size="small"
            id="class-title-input"
          />
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 140, flex: '1 1 140px' }}>
              <InputLabel>Day</InputLabel>
              <Select
                value={form.day}
                label="Day"
                onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}
                id="class-day-input"
              >
                {FULL_DAY_LABELS.map((label, idx) => (
                  <MenuItem key={idx} value={idx}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Start"
              type="time"
              value={form.start}
              onChange={(e) => setForm({ ...form, start: e.target.value })}
              size="small"
              sx={{ flex: '1 1 110px' }}
              slotProps={{ inputLabel: { shrink: true } }}
              id="class-start-input"
            />
            <TextField
              label="End"
              type="time"
              value={form.end}
              onChange={(e) => setForm({ ...form, end: e.target.value })}
              size="small"
              sx={{ flex: '1 1 110px' }}
              slotProps={{ inputLabel: { shrink: true } }}
              id="class-end-input"
            />
          </Box>

          {error && (
            <Alert severity="error" id="class-form-error" sx={{ fontSize: '0.85rem' }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              type="submit"
              variant="contained"
              size="small"
              fullWidth
              startIcon={justSaved ? <CheckIcon /> : (editingId ? <CheckIcon /> : <AddIcon />)}
              id="class-submit-button"
            >
              {justSaved ? 'Saved!' : editingId ? 'Save changes' : 'Add class'}
            </Button>
            {editingId && (
              <Button
                variant="outlined"
                size="small"
                onClick={cancelEdit}
                id="class-cancel-button"
              >
                Cancel
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Class list */}
      {sortedClasses.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
          <EventBusyIcon sx={{ fontSize: 40, opacity: 0.4, mb: 1 }} />
          <Typography variant="body2">
            No classes yet. Add your classes above and we'll find workout times that fit around them.
          </Typography>
        </Box>
      ) : (
        <Card>
          <List disablePadding>
            {sortedClasses.map((c, idx) => (
              <React.Fragment key={c.id}>
                {idx > 0 && <Divider sx={{ borderColor: tokens.accentDim12 }} />}
                <ListItem
                  id={`class-item-${c.id}`}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => startEdit(c)}
                        aria-label={`Edit ${c.title || 'class'}`}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'primary.light' } }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => onRemove(c.id)}
                        aria-label={`Delete ${c.title || 'class'}`}
                        sx={{ color: 'text.secondary', '&:hover': { color: '#ef4444' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                  sx={{ py: 1.25 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <SchoolIcon sx={{ color: 'primary.light', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                          {c.title || 'Untitled class'}
                        </Typography>
                        <Chip
                          label={DAY_LABELS[c.day]}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '0.7rem',
                            height: 20,
                            borderColor: tokens.borderViolet,
                            color: 'text.secondary',
                          }}
                        />
                      </Box>
                    }
                    secondary={`${toLabel(toMinutes(c.start))} – ${toLabel(toMinutes(c.end))}`}
                    secondaryTypographyProps={{ color: 'text.secondary', fontSize: '0.8rem' }}
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Card>
      )}
    </Box>
  );
}
