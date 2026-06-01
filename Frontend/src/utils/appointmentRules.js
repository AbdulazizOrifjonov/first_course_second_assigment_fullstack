/** Minimal qabul vaqti: hozirdan kamida 30 soat 30 daqiqa keyin */
export const MIN_APPOINTMENT_LEAD_MS = (30 * 60 + 30) * 60 * 1000;

function parseSlotDateTime(dateStr, timeStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min] = timeStr.split(':').map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
}

export function getEarliestAppointmentTime() {
  return new Date(Date.now() + MIN_APPOINTMENT_LEAD_MS);
}

function formatDateLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getMinAppointmentDateStr() {
  return formatDateLocal(getEarliestAppointmentTime());
}

/** Klinika ish vaqtlari: 08:00–17:30, har 30 daqiqa */
export function getClinicTimeSlots() {
  const slots = [];
  for (let h = 8; h < 18; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

/** Birinchi kun, unda kamida bitta 30.5 soat qoidasiga mos slot mavjud */
export function getFirstBookableDateStr(maxDaysAhead = 90) {
  const start = getEarliestAppointmentTime();
  const slots = getClinicTimeSlots();
  for (let d = 0; d < maxDaysAhead; d++) {
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + d);
    const dateStr = formatDateLocal(day);
    if (filterAllowedSlots(dateStr, slots).length > 0) return dateStr;
  }
  return getMinAppointmentDateStr();
}

export function isAppointmentSlotAllowed(dateStr, timeStr) {
  if (!dateStr || !timeStr) return false;
  return parseSlotDateTime(dateStr, timeStr).getTime() >= Date.now() + MIN_APPOINTMENT_LEAD_MS;
}

export function filterAllowedSlots(dateStr, slots) {
  return (slots || []).filter((slot) => isAppointmentSlotAllowed(dateStr, slot));
}
