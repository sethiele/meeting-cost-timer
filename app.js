(function () {
  'use strict';

  const C = window.MeetingCost;
  const $ = (id) => document.getElementById(id);

  // Gesamter Zustand lebt nur im Speicher – es wird nichts persistiert.
  const state = {
    phase: 'setup', // 'setup' | 'running' | 'stopped'
    startedAt: null,
    endedAt: null,
    participants: [], // { id, name, count, rate, joinedAt, leftAt }
    nextId: 1,
  };

  let fmt;
  let ticker = null;
  let wakeLock = null;

  const money = (v) => fmt.format(v);
  const clock = (ts) => new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const now = () => (state.phase === 'stopped' ? state.endedAt : Date.now());

  function setCurrency(code) {
    fmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: code });
    renderAll();
  }

  // ---------- Anzeige ----------

  function renderDisplay() {
    const t = now();
    const started = state.startedAt !== null;
    const total = started ? C.totalCost(state.participants, state.startedAt, t) : 0;
    const elapsed = started ? t - state.startedAt : 0;

    $('cost').textContent = money(total);
    $('time').textContent = C.formatDuration(elapsed);

    if (state.phase === 'stopped') {
      $('rate-meta').textContent = 'Meeting beendet';
      $('people-meta').textContent = '';
    } else {
      const rate = C.currentHourlyRate(state.participants, t);
      const heads = C.activeHeadcount(state.participants, t);
      $('rate-meta').textContent = `${money(rate)} / Stunde · ${money(rate / 60)} / Minute`;
      $('people-meta').textContent = `${heads} ${heads === 1 ? 'Person' : 'Personen'}`;
    }

    if (state.phase === 'running') {
      document.title = `${money(total)} · ${C.formatDuration(elapsed)}`;
    }
  }

  function statusText(p) {
    if (state.phase === 'setup') return 'ab Start';
    const from = clock(p.joinedAt === null ? state.startedAt : Math.max(p.joinedAt, state.startedAt));
    if (p.leftAt !== null) return `${from}–${clock(p.leftAt)} (entfernt)`;
    return `seit ${from}`;
  }

  function renderList() {
    const list = $('list');
    list.textContent = '';
    $('empty').hidden = state.participants.length > 0;

    for (const p of state.participants) {
      const li = document.createElement('li');
      li.className = 'person' + (p.leftAt !== null ? ' left' : '');

      const name = document.createElement('div');
      name.className = 'p-name';
      name.textContent = p.name;
      if (p.count > 1) {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = `× ${p.count}`;
        name.append(' ', badge);
      }

      const rate = document.createElement('div');
      rate.className = 'p-rate';
      rate.textContent = `${money(p.rate)} / h${p.count > 1 ? ' pro Person' : ''}`;

      const status = document.createElement('div');
      status.className = 'p-status';
      status.textContent = statusText(p);

      const cost = document.createElement('div');
      cost.className = 'p-cost';
      cost.dataset.id = p.id;

      li.append(name, rate, status, cost);

      if (state.phase !== 'stopped' && p.leftAt === null) {
        const btn = document.createElement('button');
        btn.className = 'remove';
        btn.textContent = state.phase === 'setup' ? 'Löschen' : 'Entfernen';
        btn.addEventListener('click', () => removeParticipant(p.id));
        li.append(btn);
      }
      list.append(li);
    }
    updateListCosts();
  }

  function updateListCosts() {
    const t = now();
    for (const el of $('list').querySelectorAll('.p-cost')) {
      const p = state.participants.find((x) => x.id === Number(el.dataset.id));
      el.textContent = state.startedAt === null ? '–' : money(C.participantCost(p, state.startedAt, t));
    }
  }

  function renderPhase() {
    const { phase } = state;
    document.body.dataset.phase = phase;
    $('status').textContent = { setup: 'Bereit', running: 'Läuft', stopped: 'Beendet' }[phase];
    $('start-controls').hidden = phase !== 'setup';
    $('stop').hidden = phase !== 'running';
    $('present').hidden = phase === 'setup';
    $('add-form').hidden = phase === 'stopped';
    $('p-since-wrap').hidden = phase !== 'running';
    $('summary').hidden = phase !== 'stopped';
    if (phase !== 'running') document.title = 'Meeting-Kosten-Timer';
    if (phase === 'stopped') renderSummary();
  }

  function renderSummary() {
    const elapsed = state.endedAt - state.startedAt;
    const total = C.totalCost(state.participants, state.startedAt, state.endedAt);
    $('sum-cost').textContent = money(total);
    $('sum-time').textContent = C.formatDuration(elapsed);
    $('sum-range').textContent = `${clock(state.startedAt)} – ${clock(state.endedAt)}`;
    $('sum-per-minute').textContent = elapsed > 0 ? money(total / (elapsed / 60000)) : money(0);
  }

  function renderRatePreview() {
    const amount = Number($('p-amount').value);
    const hours = Number($('p-hours').value);
    const rate = $('p-amount').value === '' ? 0 : C.hourlyRate($('p-mode').value, amount, hours);
    $('p-rate-preview').textContent = Number.isFinite(rate) ? `= ${money(rate)} / Stunde` : '';
  }

  function renderAll() {
    renderPhase();
    renderList();
    renderDisplay();
    renderRatePreview();
  }

  // ---------- Aktionen ----------

  function addParticipant(e) {
    e.preventDefault();
    const count = Math.max(1, Math.floor(Number($('p-count').value)));
    const rate = C.hourlyRate($('p-mode').value, Number($('p-amount').value), Number($('p-hours').value));
    if (!Number.isFinite(rate) || rate < 0) return;

    const id = state.nextId++;
    const joinNow = state.phase === 'running' && $('p-since').value === 'now';
    state.participants.push({
      id,
      name: $('p-name').value.trim() || `Person ${id}`,
      count,
      rate,
      joinedAt: joinNow ? Date.now() : null,
      leftAt: null,
    });

    $('p-name').value = '';
    $('p-count').value = 1;
    $('p-amount').value = '';
    $('p-name').focus();
    renderRatePreview();
    renderList();
    renderDisplay();
  }

  function removeParticipant(id) {
    const idx = state.participants.findIndex((p) => p.id === id);
    if (idx === -1) return;
    if (state.phase === 'setup') {
      state.participants.splice(idx, 1);
    } else {
      // Bisherige Kosten bleiben erhalten, ab jetzt zählt die Person nicht mehr.
      state.participants[idx].leftAt = Date.now();
    }
    renderList();
    renderDisplay();
  }

  function showStartError(msg) {
    $('start-error').textContent = msg;
    $('start-error').hidden = !msg;
  }

  function start() {
    const mode = document.querySelector('input[name="start-mode"]:checked').value;
    let startedAt = Date.now();
    if (mode === 'time') {
      const ts = C.parseTimeToday($('start-time').value, new Date());
      if (ts === null) return showStartError('Bitte eine Startzeit angeben.');
      if (ts > Date.now()) return showStartError('Die Startzeit liegt in der Zukunft.');
      startedAt = ts;
    }
    showStartError('');
    state.startedAt = startedAt;
    state.phase = 'running';
    ticker = setInterval(tick, 50);
    requestWakeLock();
    renderAll();
  }

  function stop() {
    state.endedAt = Date.now();
    state.phase = 'stopped';
    clearInterval(ticker);
    releaseWakeLock();
    renderAll();
  }

  function reset() {
    exitPresentation();
    state.phase = 'setup';
    state.startedAt = null;
    state.endedAt = null;
    state.participants = [];
    state.nextId = 1;
    $('start-time').value = currentTimeValue();
    renderAll();
  }

  let lastListUpdate = 0;
  function tick() {
    renderDisplay();
    const t = Date.now();
    if (t - lastListUpdate > 250) {
      updateListCosts();
      lastListUpdate = t;
    }
  }

  function copySummary() {
    const lines = [
      `Meeting-Kosten: ${$('sum-cost').textContent}`,
      `Dauer: ${$('sum-time').textContent} (${$('sum-range').textContent})`,
      `Ø pro Minute: ${$('sum-per-minute').textContent}`,
      '',
      ...state.participants.map(
        (p) =>
          `${p.name}${p.count > 1 ? ` × ${p.count}` : ''}: ` +
          money(C.participantCost(p, state.startedAt, state.endedAt))
      ),
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(
      () => flash($('copy'), 'Kopiert ✓'),
      () => flash($('copy'), 'Kopieren fehlgeschlagen')
    );
  }

  function flash(btn, text) {
    const original = btn.textContent;
    btn.textContent = text;
    setTimeout(() => (btn.textContent = original), 1500);
  }

  // ---------- Präsentation / Bildschirm ----------

  function togglePresentation() {
    if (document.body.classList.contains('present')) return exitPresentation();
    document.body.classList.add('present');
    $('present').textContent = 'Präsentation beenden';
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  function exitPresentation() {
    document.body.classList.remove('present');
    $('present').textContent = 'Präsentation';
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  // Verhindert, dass der Bildschirm während des Meetings ausgeht.
  async function requestWakeLock() {
    try {
      wakeLock = await navigator.wakeLock?.request('screen');
    } catch {
      wakeLock = null;
    }
  }

  function releaseWakeLock() {
    wakeLock?.release().catch(() => {});
    wakeLock = null;
  }

  function currentTimeValue() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  // ---------- Verdrahtung ----------

  $('currency').addEventListener('change', (e) => setCurrency(e.target.value));
  $('add-form').addEventListener('submit', addParticipant);
  $('start').addEventListener('click', start);
  $('stop').addEventListener('click', stop);
  $('reset').addEventListener('click', reset);
  $('copy').addEventListener('click', copySummary);
  $('present').addEventListener('click', togglePresentation);

  $('p-mode').addEventListener('change', () => {
    const annual = $('p-mode').value === 'annual';
    $('p-amount-label').textContent = annual ? 'Jahresgehalt' : 'Stundensatz';
    $('p-hours-wrap').hidden = !annual;
    $('p-hours').required = annual;
    renderRatePreview();
  });
  $('p-amount').addEventListener('input', renderRatePreview);
  $('p-hours').addEventListener('input', renderRatePreview);

  $('start-time').value = currentTimeValue();
  $('start-time').addEventListener('focus', () => {
    document.querySelector('input[name="start-mode"][value="time"]').checked = true;
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.body.classList.contains('present')) exitPresentation();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('present')) exitPresentation();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.phase === 'running') requestWakeLock();
  });
  // Nichts wird gespeichert – daher vor versehentlichem Neuladen warnen.
  window.addEventListener('beforeunload', (e) => {
    if (state.phase === 'running') e.preventDefault();
  });

  setCurrency($('currency').value);
})();
