// Kodieren und Dekodieren des Meeting-Zustands für Teilen-Links (#s=…), ohne DOM-Zugriff.
(function (global) {
  'use strict';

  const VERSION = 1;
  const MAX_PARTICIPANTS = 500;
  const MAX_NAME_LENGTH = 200;

  // Ersetzt die Einträge durch Zeitabschnitte mit gleicher Besetzung. Pro Abschnitt bleiben nur
  // Kopfzahl und Gesamtsatz übrig (count = Köpfe, rate = Gesamtsatz / Köpfe), sodass die Kosten
  // mit calc.js identisch bleiben, aber keine Namen oder Einzelsätze im Link stehen.
  function aggregate(participants, startedAt, endedAt) {
    const from = (p) => (p.joinedAt === null ? startedAt : Math.max(p.joinedAt, startedAt));
    const cut = (t) => (endedAt === null ? t : Math.min(t, endedAt));

    const points = new Set([startedAt]);
    for (const p of participants) {
      points.add(cut(from(p)));
      if (p.leftAt !== null) points.add(cut(Math.max(p.leftAt, startedAt)));
    }
    const sorted = [...points].sort((a, b) => a - b);

    const segments = [];
    sorted.forEach((a, i) => {
      const b = i + 1 < sorted.length ? sorted[i + 1] : endedAt;
      if (b !== null && b <= a) return;
      let heads = 0;
      let total = 0;
      for (const p of participants) {
        if (from(p) <= a && (p.leftAt === null || p.leftAt > a)) {
          heads += p.count;
          total += p.rate * p.count;
        }
      }
      if (heads > 0) segments.push({ name: '', count: heads, rate: total / heads, joinedAt: a, leftAt: b });
    });
    return segments;
  }

  function toBase64Url(text) {
    let binary = '';
    for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromBase64Url(code) {
    const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }

  // snapshot: { startedAt, endedAt, currency, participants }. Zeitpunkte werden relativ zu
  // startedAt gespeichert, damit der Link kürzer wird.
  function encode(snapshot, { anonymous = false } = {}) {
    const { startedAt, endedAt, currency } = snapshot;
    const list = anonymous ? aggregate(snapshot.participants, startedAt, endedAt) : snapshot.participants;
    const rel = (t) => (t === null ? null : t - startedAt);
    const payload = {
      v: VERSION,
      s: startedAt,
      e: rel(endedAt),
      c: currency,
      a: anonymous ? 1 : 0,
      p: list.map((p) => [anonymous ? '' : p.name, p.count, p.rate, rel(p.joinedAt), rel(p.leftAt)]),
    };
    return toBase64Url(JSON.stringify(payload));
  }

  const isNum = (x) => typeof x === 'number' && Number.isFinite(x);
  const isTime = (x) => x === null || isNum(x);

  function fail() {
    throw new Error('Ungültiger Teilen-Link');
  }

  function decode(code) {
    if (typeof code !== 'string' || !/^[A-Za-z0-9_-]+$/.test(code)) fail();
    let data;
    try {
      data = JSON.parse(fromBase64Url(code));
    } catch {
      fail();
    }
    if (!data || data.v !== VERSION || !isNum(data.s) || !isTime(data.e)) fail();
    if (data.e !== null && data.e < 0) fail();
    if (typeof data.c !== 'string' || !/^[A-Z]{3}$/.test(data.c)) fail();
    if (!Array.isArray(data.p) || data.p.length > MAX_PARTICIPANTS) fail();

    const abs = (t) => (t === null ? null : data.s + t);
    const participants = data.p.map((entry, i) => {
      if (!Array.isArray(entry) || entry.length !== 5) fail();
      const [name, count, rate, joined, left] = entry;
      if (typeof name !== 'string' || name.length > MAX_NAME_LENGTH) fail();
      if (!Number.isInteger(count) || count < 1) fail();
      if (!isNum(rate) || rate < 0) fail();
      if (!isTime(joined) || !isTime(left)) fail();
      return { id: i + 1, name, count, rate, joinedAt: abs(joined), leftAt: abs(left) };
    });

    return {
      startedAt: data.s,
      endedAt: abs(data.e),
      currency: data.c,
      anonymous: data.a === 1,
      participants,
    };
  }

  const api = { aggregate, encode, decode };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.MeetingShare = api;
})(typeof window !== 'undefined' ? window : globalThis);
