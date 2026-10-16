// Reine Berechnungslogik ohne DOM-Zugriff, damit sie auch in Node testbar ist.
(function (global) {
  'use strict';

  const MS_PER_HOUR = 3600000;

  // Stundensatz pro Person: direkt eingegeben oder aus Jahresgehalt / Arbeitsstunden pro Jahr.
  function hourlyRate(mode, amount, hoursPerYear) {
    if (mode === 'annual') return amount / hoursPerYear;
    return amount;
  }

  // Zeit, die ein Eintrag im Meeting war. joinedAt === null heißt "seit Meetingbeginn",
  // leftAt === null heißt "noch dabei".
  function activeMs(p, meetingStart, now) {
    const from = p.joinedAt === null ? meetingStart : Math.max(p.joinedAt, meetingStart);
    const to = p.leftAt === null ? now : Math.min(p.leftAt, now);
    return Math.max(0, to - from);
  }

  function participantCost(p, meetingStart, now) {
    return (p.rate * p.count * activeMs(p, meetingStart, now)) / MS_PER_HOUR;
  }

  function totalCost(participants, meetingStart, now) {
    return participants.reduce((sum, p) => sum + participantCost(p, meetingStart, now), 0);
  }

  function isActive(p, now) {
    return p.leftAt === null && (p.joinedAt === null || p.joinedAt <= now);
  }

  // Kosten pro Stunde aller aktuell Anwesenden.
  function currentHourlyRate(participants, now) {
    return participants.reduce((sum, p) => (isActive(p, now) ? sum + p.rate * p.count : sum), 0);
  }

  function activeHeadcount(participants, now) {
    return participants.reduce((sum, p) => (isActive(p, now) ? sum + p.count : sum), 0);
  }

  function formatDuration(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // "HH:MM" -> Zeitstempel am heutigen Tag (bezogen auf nowDate), sonst null.
  function parseTimeToday(value, nowDate) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value || '');
    if (!match) return null;
    const d = new Date(nowDate.getTime());
    d.setHours(Number(match[1]), Number(match[2]), 0, 0);
    return d.getTime();
  }

  const api = {
    hourlyRate,
    activeMs,
    participantCost,
    totalCost,
    isActive,
    currentHourlyRate,
    activeHeadcount,
    formatDuration,
    parseTimeToday,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.MeetingCost = api;
})(typeof window !== 'undefined' ? window : globalThis);
