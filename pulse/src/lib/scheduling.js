/**
 * Deterministic scheduling logic for the workout planner.
 *
 * No AI, no randomness — pure time arithmetic. Everything here works in
 * minutes since midnight on a given day so overlaps and slot fits are simple
 * integer comparisons.
 *
 * Domain:
 *   classBlock   = { id, day, start, end, title }   day: 0=Mon..6=Sun, start/end "HH:MM"
 *   workout      = { id, day, start, end }           same shape, derived from duration + a slot
 *   duration     = number of minutes (e.g. 45)
 */

const DAY_START = 7 * 60; // 07:00 — earliest suggested workout
const DAY_END = 22 * 60; // 22:00 — latest suggested workout start window ends
const SLOT_STEP = 15; // suggestions snap to 15-minute boundaries

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const FULL_DAY_LABELS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/** Convert "HH:MM" to minutes since midnight. Returns null on bad input. */
export function toMinutes(time) {
  if (typeof time !== 'string') return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/** Convert minutes since midnight to "H:MM AM/PM" for display. */
export function toLabel(mins) {
  if (mins == null || Number.isNaN(mins)) return '';
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const ampm = h24 < 12 ? 'AM' : 'PM';
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** Format a duration in minutes as a readable string. */
export function durationLabel(mins) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

/** True if [aStart, aEnd) overlaps [bStart, bEnd). Half-open: touching edges don't overlap. */
export function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

/** Sort blocks by start time (in place copy). */
function sortByStart(blocks) {
  return [...blocks].sort((a, b) => a.start - b.start);
}

/** Normalize raw class objects into { start, end } minutes for a given day. */
export function classesForDay(classes, day) {
  return classes
    .filter((c) => c.day === day)
    .map((c) => ({ ...c, start: toMinutes(c.start), end: toMinutes(c.end) }))
    .filter((c) => c.start != null && c.end != null && c.end > c.start);
}

/** Validate a class block's time fields. Returns an error string or null. */
export function validateClassBlock({ start, end }) {
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s == null) return 'Start time must be in HH:MM format.';
  if (e == null) return 'End time must be in HH:MM format.';
  if (e <= s) return 'End time must be after the start time.';
  return null;
}

/** Detect whether a new/edited class overlaps an existing one on the same day. */
export function classConflict(classes, candidate, excludeId = null) {
  const s = toMinutes(candidate.start);
  const e = toMinutes(candidate.end);
  if (s == null || e == null) return null;
  return classes
    .filter((c) => c.day === candidate.day && c.id !== excludeId)
    .map((c) => ({ ...c, s: toMinutes(c.start), e: toMinutes(c.end) }))
    .find((c) => overlaps(s, e, c.s, c.e));
}

/**
 * Find available workout slots for a given day.
 * A slot fits if [start, start+duration) does not overlap any class AND
 * stays within the suggestable window [DAY_START, DAY_END].
 * Returns an array of { day, start, end } candidate slots.
 */
export function availableSlotsForDay(classes, day, duration) {
  const busy = sortByStart(classesForDay(classes, day));
  const slots = [];
  for (let t = DAY_START; t + duration <= DAY_END; t += SLOT_STEP) {
    const slotStart = t;
    const slotEnd = t + duration;
    const conflict = busy.some((c) => overlaps(slotStart, slotEnd, c.start, c.end));
    if (!conflict) {
      slots.push({ day, start: slotStart, end: slotEnd });
    }
  }
  return slots;
}

/** Find available slots across all 7 days. */
export function allAvailableSlots(classes, duration) {
  const out = [];
  for (let day = 0; day < 7; day++) {
    out.push(...availableSlotsForDay(classes, day, duration));
  }
  return out;
}

/**
 * Does a planned workout conflict with any class? (Test state 3 guardrail.)
 * A planned workout that matches a class time must be rejected.
 */
export function workoutConflictsClass(classes, workout) {
  const s = toMinutes(workout.start);
  const e = toMinutes(workout.end);
  if (s == null || e == null) return false;
  return classesForDay(classes, workout.day).some((c) =>
    overlaps(s, e, c.start, c.end)
  );
}

/**
 * Detect planned workouts that now conflict after a schedule edit. (Test state 4.)
 * Returns the list of conflicting workout ids.
 */
export function conflictingWorkouts(classes, workouts) {
  return workouts
    .filter((w) => workoutConflictsClass(classes, w))
    .map((w) => w.id);
}

/** Does a candidate workout overlap an existing saved workout on the same day? */
export function workoutOverlapExisting(workouts, candidate, excludeId = null) {
  const s = toMinutes(candidate.start);
  const e = toMinutes(candidate.end);
  if (s == null || e == null) return null;
  return workouts
    .filter((w) => w.day === candidate.day && w.id !== excludeId)
    .map((w) => ({ ...w, s: toMinutes(w.start), e: toMinutes(w.end) }))
    .find((w) => overlaps(s, e, w.s, w.e));
}

/** Build a workout object from a slot + duration, with a fresh id. */
export function workoutFromSlot(slot, id) {
  return {
    id,
    day: slot.day,
    start: minsToHHMM(slot.start),
    end: minsToHHMM(slot.end),
  };
}

function minsToHHMM(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Get the ISO weekday index (0=Mon..6=Sun) for a Date. */
export function weekdayOf(date) {
  // JS getDay: 0=Sun..6=Sat. Convert to Mon-first.
  return (date.getDay() + 6) % 7;
}
