const WHATSAPP_NUMBER = '40700000000'; // EXEMPLU – numărul pensiunii, format internațional, fără „+” și fără spații
/* Casa dintre Valuri – machetă demo. Datele (prețuri, sezoane, zile ocupate) sunt în js/data.js. */
(() => {
  'use strict';
  const D = window.CDV_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- date calendaristice (fără fus orar: șiruri AAAA-LL-ZZ) ---------- */
  const LUNI = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
  const LS = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const ZS = ['du', 'lu', 'ma', 'mi', 'jo', 'vi', 'sâ'];
  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const add = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const span = (a, b) => { const r = []; for (let x = a; x < b; x = add(x, 1)) r.push(x); return r; };
  const nice = s => { const d = parse(s); return ZS[d.getDay()] + ', ' + d.getDate() + ' ' + LS[d.getMonth()] + ' ' + d.getFullYear(); };
  const lei = n => n.toLocaleString('ro-RO') + ' ' + D.moneda;
  const cnt = (n, one, many) => n === 1 ? '1 ' + one : n + (n % 100 >= 20 || (n > 0 && n % 100 === 0) ? ' de ' : ' ') + many;
  const nopti = n => cnt(n, 'noapte', 'nopți');
  const TODAY = iso(new Date());
  const LAST = (() => { const [y, m] = D.rezervariPanaLa.split('-').map(Number); return iso(new Date(y, m, 0)); })();

  /* ---------- prețuri și disponibilitate ---------- */
  const season = s => { const m = parse(s).getMonth() + 1; return D.sezoane.find(z => z.luni.includes(m)); };
  const price = (room, s) => Math.round(room.pret * season(s).factor);
  const busy = {};
  D.camere.forEach(r => { const set = new Set(); (D.ocupat[r.id] || []).forEach(([a, b]) => span(a, b).forEach(x => set.add(x))); busy[r.id] = set; });
  const fromPrice = Math.min(...D.camere.map(r => Math.min(...D.sezoane.map(z => Math.round(r.pret * z.factor)))));

  // intervale compacte: „14–15 aug 2027, 20 aug 2027”
  function ranges(list) {
    const out = []; let a = list[0], b = list[0];
    const fmt = (x, y) => { const p = parse(x), q = parse(y); return x === y ? p.getDate() + ' ' + LS[p.getMonth()] : (p.getMonth() === q.getMonth() ? p.getDate() + '–' + q.getDate() + ' ' + LS[q.getMonth()] : p.getDate() + ' ' + LS[p.getMonth()] + ' – ' + q.getDate() + ' ' + LS[q.getMonth()]); };
    for (let i = 1; i <= list.length; i++) {
      if (i < list.length && list[i] === add(b, 1)) { b = list[i]; continue; }
      out.push(fmt(a, b)); a = b = list[i];
    }
    return out.join(', ');
  }

  const S = { room: 0, in: null, out: null, adults: 2, kids: 0, ex: { mic: false, pat: false, parc: false, animal: false } };

  function evaluate() {
    const room = D.camere[S.room];
    const R = { room, errors: [], info: '', nights: [], lines: [], seasons: [], total: 0, avans: 0, ok: false };
    if (!S.in) { R.info = 'Alege în calendar ziua sosirii.'; return R; }
    if (!S.out) { R.info = 'Sosire ' + nice(S.in) + '. Acum alege ziua plecării.'; return R; }
    if (S.out <= S.in) { R.errors.push('Data plecării trebuie să fie după data sosirii.'); return R; }
    const N = span(S.in, S.out); R.nights = N;

    // 1. nopți ocupate
    const taken = N.filter(n => busy[room.id].has(n));
    if (taken.length) {
      const free = D.camere.filter(r => r !== room && N.every(n => !busy[r.id].has(n))).map(r => r.nume);
      R.errors.push(room.nume + ' este ocupată în ' + (taken.length === 1 ? 'noaptea de ' : 'nopțile ') + ranges(taken) + '. Alege alt interval' +
        (free.length ? ' sau ' + free.join(' / ') + ' (liberă în aceste date).' : '.'));
    }
    // 2. minim de nopți
    let min = 1, why = '';
    N.forEach(n => {
      const z = season(n), wk = [5, 6].includes(parse(n).getDay());
      if (z.minNopti > min) { min = z.minNopti; why = 'În ' + z.perioada + ' (' + z.nume.toLowerCase() + ') sejurul minim este de ' + nopti(min); }
      if (wk && z.minNoptiWeekend > min) { min = z.minNoptiWeekend; why = 'Sejururile care includ o noapte de vineri sau sâmbătă au minimum ' + nopti(min); }
    });
    if (N.length < min) R.errors.push(why + ' – ai ales ' + nopti(N.length) + '.');
    // 3. capacitate
    const ppl = S.adults + S.kids, extraBed = S.ex.pat && room.patSuplimentar, cap = room.capacitate + (extraBed ? 1 : 0);
    if (ppl > cap) {
      let m = room.nume + ' primește maximum ' + cnt(cap, 'persoană', 'persoane') + (extraBed ? ' (cu pat suplimentar)' : '') + ' – ai ales ' + ppl + '.';
      if (room.patSuplimentar && !S.ex.pat && ppl === cap + 1) m += ' Bifează „Pat suplimentar” sau alege altă cameră.';
      else {
        const fit = D.camere.filter(r => r !== room && r.capacitate + (r.patSuplimentar ? 1 : 0) >= ppl).map(r => r.nume);
        if (fit.length) m += ' Pentru ' + ppl + ' persoane potrivit: ' + fit.join(', ') + '.';
      }
      R.errors.push(m);
    }

    // defalcare
    const groups = [];
    N.forEach(n => {
      const z = season(n), p = price(room, n), last = groups[groups.length - 1];
      if (last && last.z === z) last.n++; else groups.push({ z, p, n: 1 });
    });
    const merged = [];
    groups.forEach(g => { const m = merged.find(x => x.z === g.z); if (m) m.n += g.n; else merged.push({ ...g }); });
    merged.forEach(g => {
      const pct = Math.round((g.z.factor - 1) * 100);
      R.lines.push({ label: g.z.nume + (pct ? ' (' + (pct > 0 ? '+' : '−') + Math.abs(pct) + '%)' : ''), detail: nopti(g.n) + ' × ' + lei(g.p), amount: g.n * g.p });
    });
    R.seasons = merged;
    const n = N.length, X = D.extra;
    if (room.micDejunInclus) R.lines.push({ label: X.micDejun.nume, detail: 'pentru toți oaspeții', amount: 0 });
    else if (S.ex.mic) {
      const parts = [S.adults + ' ad. × ' + lei(X.micDejun.adult)]; if (S.kids) parts.push(S.kids + ' copii × ' + lei(X.micDejun.copil));
      R.lines.push({ label: X.micDejun.nume, detail: '(' + parts.join(' + ') + ') × ' + nopti(n), amount: n * (S.adults * X.micDejun.adult + S.kids * X.micDejun.copil) });
    }
    if (extraBed) R.lines.push({ label: X.patSuplimentar.nume, detail: nopti(n) + ' × ' + lei(X.patSuplimentar.pret), amount: n * X.patSuplimentar.pret });
    if (S.ex.parc) R.lines.push({ label: X.parcare.nume, detail: nopti(n) + ' × ' + lei(X.parcare.pret), amount: n * X.parcare.pret });
    if (S.ex.animal) R.lines.push({ label: X.animal.nume, detail: 'o dată pe sejur', amount: X.animal.pret });
    R.total = R.lines.reduce((s, l) => s + l.amount, 0);
    R.avans = Math.round(R.total * D.avans);
    R.ok = !R.errors.length;
    return R;
  }

  /* ---------- calendar ---------- */
  const cal = $('#cal');
  const now = parse(TODAY);
  let view = { y: now.getFullYear(), m: now.getMonth() };
  const lastView = (() => { const d = parse(LAST); return { y: d.getFullYear(), m: d.getMonth() - 1 }; })(); // prima dintre ultimele două luni
  const vIdx = v => v.y * 12 + v.m;
  const setView = (y, m) => {
    let i = Math.max(vIdx({ y: now.getFullYear(), m: now.getMonth() }), Math.min(y * 12 + m, lastView.y * 12 + lastView.m));
    view = { y: Math.floor(i / 12), m: i % 12 };
  };
  function showDate(s) { // aduce luna în ecran dacă nu e deja vizibilă
    const d = parse(s), i = d.getFullYear() * 12 + d.getMonth();
    if (i < vIdx(view) || i > vIdx(view) + 1) setView(d.getFullYear(), d.getMonth());
  }

  function monthHTML(y, m) {
    const room = D.camere[S.room];
    const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate(), off = (first.getDay() + 6) % 7;
    let h = '<div class="month"><h3>' + LUNI[m] + ' ' + y + '</h3><div class="wd" aria-hidden="true"><span>Lu</span><span>Ma</span><span>Mi</span><span>Jo</span><span>Vi</span><span>Sâ</span><span>Du</span></div><div class="days">';
    for (let i = 0; i < off; i++) h += '<span></span>';
    for (let d = 1; d <= days; d++) {
      const s = y + '-' + pad(m + 1) + '-' + pad(d);
      const past = s < TODAY, beyond = s > LAST, isBusy = busy[room.id].has(s);
      const cls = ['d', 'z-' + season(s).id];
      let label = (isBusy || past || beyond ? '' : ' lei pe noapte') + ', ' + d + ' ' + LUNI[m] + ' ' + y;
      if (past || beyond) cls.push('off');
      else if (isBusy) cls.push('busy');
      else label += ', liber';
      if (s === TODAY) cls.push('today');
      if (s === S.in) { cls.push('start'); label += ', sosire'; }
      if (s === S.out) { cls.push('end'); label += ', plecare'; }
      if (S.in && S.out && s > S.in && s < S.out) cls.push('mid');
      if (S.in && S.out && s >= S.in && s < S.out && isBusy) cls.push('clash');
      h += '<button type="button" class="' + cls.join(' ') + '" data-d="' + s + '"' + (past || beyond ? ' disabled' : '') +
        (s === S.in || s === S.out ? ' aria-pressed="true"' : '') + '><b>' + d + '</b><small>' + (past || beyond ? '&nbsp;' : isBusy ? 'ocupat' : price(room, s)) + '</small><span class="sr">' + label + '</span></button>';
    }
    return h + '</div></div>';
  }
  function renderCal() {
    const v2 = vIdx(view) + 1;
    cal.innerHTML = monthHTML(view.y, view.m) + monthHTML(Math.floor(v2 / 12), v2 % 12);
    $('#prevM').disabled = vIdx(view) <= now.getFullYear() * 12 + now.getMonth();
    $('#nextM').disabled = vIdx(view) >= vIdx(lastView);
    $('#calRoom').textContent = D.camere[S.room].nume;
  }
  $('#prevM').addEventListener('click', () => { setView(view.y, view.m - 1); renderCal(); });
  $('#nextM').addEventListener('click', () => { setView(view.y, view.m + 1); renderCal(); });

  const note = $('#calNote');
  let noteTimer = 0, flashMsg = '';
  function flash(msg) { flashMsg = msg; clearTimeout(noteTimer); noteTimer = setTimeout(() => { flashMsg = ''; update(); }, 6000); update(); }

  cal.addEventListener('click', e => {
    const b = e.target.closest('button.d'); if (!b || b.disabled) return;
    const s = b.dataset.d, room = D.camere[S.room];
    flashMsg = '';
    if (!S.in || S.out || s <= S.in) {
      if (busy[room.id].has(s)) { flash('Noaptea de ' + nice(s) + ' este ocupată pentru ' + room.nume + ' – alege altă zi de sosire.'); return; }
      S.in = s; S.out = null;
    } else S.out = s;
    update();
    const again = $('button[data-d="' + s + '"]', cal); if (again) again.focus({ preventScroll: true });
  });
  // previzualizare interval la trecerea cu mouse-ul
  cal.addEventListener('mouseover', e => {
    if (!S.in || S.out) return;
    const b = e.target.closest('button.d'); if (!b) return;
    const s = b.dataset.d;
    $$('button.d', cal).forEach(x => x.classList.toggle('hov', x.dataset.d > S.in && x.dataset.d <= s));
  });
  cal.addEventListener('mouseleave', () => $$('.hov', cal).forEach(x => x.classList.remove('hov')));

  /* ---------- controale (hero + rezumat) ---------- */
  const roomSels = $$('[data-k="room"]');
  roomSels.forEach(sel => D.camere.forEach((r, i) => sel.add(new Option(r.nume + ' — ' + r.pret + ' lei/noapte', i))));
  $$('[data-k]').forEach(el => el.addEventListener('change', () => {
    const k = el.dataset.k;
    if (k === 'room') { S.room = +el.value; if (!D.camere[S.room].patSuplimentar) S.ex.pat = false; }
    else S[k] = +el.value;
    update();
  }));
  $$('[data-ex]').forEach(el => el.addEventListener('change', () => { S.ex[el.dataset.ex] = el.checked; update(); }));

  const hin = $('#in'), hout = $('#out');
  hin.min = TODAY; hin.max = LAST; hout.min = add(TODAY, 1); hout.max = add(LAST, 1);
  hin.addEventListener('change', () => {
    if (!hin.value || hin.value < TODAY) { S.in = S.out = null; update(); return; }
    S.in = hin.value;
    if (!S.out || S.out <= S.in) S.out = add(S.in, season(S.in).minNopti > 2 ? season(S.in).minNopti : 2);
    showDate(S.in); update();
  });
  hout.addEventListener('change', () => { S.out = hout.value || null; if (S.out && S.in) showDate(S.in); update(); });

  $('#rezervare').addEventListener('submit', e => { e.preventDefault(); $('#disponibilitate').scrollIntoView({ behavior: 'smooth' }); });
  $$('[data-room]').forEach(b => b.addEventListener('click', () => {
    S.room = +b.dataset.room; if (!D.camere[S.room].patSuplimentar) S.ex.pat = false;
    update(); $('#disponibilitate').scrollIntoView({ behavior: 'smooth' });
  }));

  /* ---------- rezumat ---------- */
  let last = null;
  function summaryText(R, who) {
    const L = ['Bună ziua! Aș dori o rezervare la Casa dintre Valuri:', '• Cameră: ' + R.room.nume,
      '• Sosire: ' + nice(S.in), '• Plecare: ' + nice(S.out) + ' (' + nopti(R.nights.length) + ')',
      '• Persoane: ' + cnt(S.adults, 'adult', 'adulți') + (S.kids ? ', ' + cnt(S.kids, 'copil', 'copii') : '')];
    R.lines.forEach(l => L.push('• ' + l.label + ': ' + l.detail + (l.amount ? ' = ' + lei(l.amount) : '')));
    L.push('• Total estimat: ' + lei(R.total) + ' (avans ' + Math.round(D.avans * 100) + '%: ' + lei(R.avans) + ')');
    if (who) L.push('', who);
    return L.join('\n');
  }
  const extrasText = () => {
    const r = D.camere[S.room], X = D.extra, a = [];
    if (r.micDejunInclus) a.push(X.micDejun.nume + ' (inclus)'); else if (S.ex.mic) a.push(X.micDejun.nume);
    if (S.ex.pat && r.patSuplimentar) a.push(X.patSuplimentar.nume);
    if (S.ex.parc) a.push(X.parcare.nume);
    if (S.ex.animal) a.push(X.animal.nume);
    return a.join(', ') || 'fără';
  };

  function update() {
    const R = last = evaluate(), room = R.room;
    renderCal();
    // controale sincronizate
    roomSels.forEach(s => { s.value = S.room; });
    $$('[data-k="adults"]').forEach(s => { s.value = S.adults; });
    $$('[data-k="kids"]').forEach(s => { s.value = S.kids; });
    hin.value = S.in || ''; hout.value = S.out || '';
    hout.min = S.in ? add(S.in, 1) : add(TODAY, 1);
    const mic = $('[data-ex="mic"]'), pat = $('[data-ex="pat"]');
    mic.checked = room.micDejunInclus || S.ex.mic; mic.disabled = room.micDejunInclus;
    $('#micNote').textContent = room.micDejunInclus ? 'inclus în preț la ' + room.nume : lei(D.extra.micDejun.adult) + ' adult · ' + lei(D.extra.micDejun.copil) + ' copil / noapte';
    pat.disabled = !room.patSuplimentar; pat.checked = S.ex.pat && room.patSuplimentar;
    $('#patNote').textContent = room.patSuplimentar ? lei(D.extra.patSuplimentar.pret) + ' / noapte · +1 loc' : 'indisponibil la ' + room.nume;
    [mic, pat].forEach(c => { const l = c.closest('.chk'); l.classList.toggle('dis', c.disabled); l.classList.toggle('off', c.disabled && !c.checked); });
    $('#parcNote').textContent = lei(D.extra.parcare.pret) + ' / noapte'; $('#animalNote').textContent = lei(D.extra.animal.pret) + ' / sejur';
    $$('[data-ex="parc"], [data-ex="animal"]').forEach(c => { c.checked = S.ex[c.dataset.ex]; });

    // notă calendar
    note.className = 'cal-note' + (flashMsg || R.errors.length ? ' err' : '');
    note.textContent = flashMsg || (R.errors.length ? R.errors[0] : R.info || (nopti(R.nights.length) + ' selectate: ' + nice(S.in) + ' → ' + nice(S.out) + '. Poți schimba sosirea cu un nou click.'));

    // rezumat
    $('#sRoom').textContent = room.nume + ' · ' + room.descriere;
    $('#sIn').textContent = S.in ? nice(S.in) : '—';
    $('#sOut').textContent = S.out ? nice(S.out) : '—';
    $('#sN').textContent = R.nights.length ? nopti(R.nights.length) : '—';
    const msgs = $('#sMsgs');
    msgs.innerHTML = '';
    R.errors.forEach(t => { const p = document.createElement('p'); p.className = 'msg err'; p.textContent = t; msgs.appendChild(p); });
    if (!R.errors.length && R.info) { const p = document.createElement('p'); p.className = 'msg'; p.textContent = R.info; msgs.appendChild(p); }
    const tb = $('#sLines'); tb.innerHTML = '';
    R.lines.forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = '<th scope="row"></th><td></td>';
      tr.firstChild.innerHTML = '<span></span><small></small>';
      tr.firstChild.firstChild.textContent = l.label; tr.firstChild.lastChild.textContent = l.detail;
      tr.lastChild.textContent = l.amount ? lei(l.amount) : 'inclus';
      tb.appendChild(tr);
    });
    const show = R.nights.length > 0;
    $('#sCalc').hidden = !show;
    $('#sTotal').textContent = show ? lei(R.total) : '—';
    $('#sAvans').textContent = show ? lei(R.avans) : '—';
    $('#sRest').textContent = show ? lei(R.total - R.avans) : '—';
    $('#sCard').classList.toggle('bad', !R.ok && show);

    // hero
    $('#nights').textContent = R.ok ? nopti(R.nights.length) + ' · ' + room.nume : (R.errors.length ? 'Verifică intervalul în calendar' : (S.in ? 'Alege data plecării' : 'Alege datele'));
    $('#sum').textContent = R.ok ? lei(R.total) : (show ? 'de verificat' : 'alege datele');

    // bara mobilă
    $('#mbarTxt').innerHTML = R.ok ? '<small>Total · ' + nopti(R.nights.length) + '</small><b>' + lei(R.total) + '</b>' : '<small>de la</small><b>' + lei(fromPrice) + '</b> / noapte';

    // formular + WhatsApp
    const f = $('#cerere');
    const set = (n, v) => { f.elements[n].value = v; };
    set('camera', room.nume); set('sosire', S.in || ''); set('plecare', S.out || ''); set('nopti', R.nights.length || '');
    set('adulti', S.adults); set('copii', S.kids); set('extra', extrasText());
    set('defalcare', R.lines.map(l => l.label + ': ' + l.detail + (l.amount ? ' = ' + lei(l.amount) : '')).join(' | '));
    set('total', show ? lei(R.total) : ''); set('avans', show ? lei(R.avans) : '');
    $('#sendBtn').setAttribute('aria-disabled', String(!R.ok));
    $('#wa').setAttribute('aria-disabled', String(!R.ok));
    if (R.ok) $('#wa').href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(summaryText(R, waWho()));
    else $('#wa').href = '#rezumat';
  }
  const waWho = () => { const f = $('#cerere'), n = f.elements.nume.value.trim(), t = f.elements.telefon.value.trim(); return [n, t].filter(Boolean).join(' · '); };

  function needValid() {
    if (last && last.ok) return true;
    $('#sMsgs').scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('#sCard').classList.remove('shake'); void $('#sCard').offsetWidth; $('#sCard').classList.add('shake');
    if (!last || !last.nights.length) flash(last && last.info ? last.info : 'Alege mai întâi datele în calendar.');
    return false;
  }
  $('#sendBtn').addEventListener('click', () => {
    if (!needValid()) return;
    const f = $('#cerere'); f.hidden = false; $('#sendBtn').hidden = true; f.elements.nume.focus();
  });
  $('#wa').addEventListener('click', e => { if (!needValid()) e.preventDefault(); else $('#wa').href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(summaryText(last, waWho())); });

  $('#cerere').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.currentTarget;
    if (!needValid() || !f.reportValidity()) return;
    const btn = $('button[type="submit"]', f), err = $('#formErr');
    btn.disabled = true; btn.textContent = 'Se trimite…'; err.hidden = true;
    const body = new URLSearchParams(new FormData(f)).toString();
    let ok = false;
    try {
      if (/^(localhost|127\.0\.0\.1|)$/.test(location.hostname)) { await new Promise(r => setTimeout(r, 500)); ok = true; } // local: Netlify Forms există doar după publicare
      else { const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }); ok = res.ok; }
    } catch (_) { ok = false; }
    btn.disabled = false; btn.textContent = 'Trimite cererea de rezervare';
    if (!ok) { err.hidden = false; return; }
    const R = last, t = $('#thanks');
    $('#thName').textContent = f.elements.nume.value.trim().split(/\s+/)[0];
    $('#thSum').textContent = R.room.nume + ', ' + nice(S.in) + ' → ' + nice(S.out) + ' (' + nopti(R.nights.length) + '), total estimat ' + lei(R.total) + '.';
    f.hidden = true; $('#sActions').hidden = true; t.hidden = false; t.focus();
  });
  $('#again').addEventListener('click', () => {
    const f = $('#cerere'); f.reset(); f.hidden = true; $('#thanks').hidden = true; $('#sActions').hidden = false; $('#sendBtn').hidden = false; update();
  });

  /* ---------- selecție inițială: primul interval liber de 2 nopți după 7 zile ---------- */
  (function initial() {
    let s = add(TODAY, 7);
    for (let i = 0; i < 60; i++, s = add(s, 1)) {
      S.in = s; S.out = add(s, 2);
      if (evaluate().ok) { showDate(s); return; }
    }
    S.in = S.out = null;
  })();
  update();

  /* ---------- bara mobilă: ascunsă cât timp rezumatul e pe ecran ---------- */
  const mbar = $('#mbar');
  $('#mbarBtn').addEventListener('click', () => $('#disponibilitate').scrollIntoView({ behavior: 'smooth' }));
  new IntersectionObserver(es => es.forEach(x => mbar.classList.toggle('hide', x.isIntersecting)), { threshold: 0.15 }).observe($('#sCard'));

  /* ---------- galerie + lightbox ---------- */
  const shots = $$('#galerie .g');
  const lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  let cur = 0, opener = null;
  function openLb(i) {
    cur = (i + shots.length) % shots.length;
    const s = shots[cur];
    lbImg.src = s.dataset.full; lbImg.alt = s.querySelector('img').alt;
    lbCap.textContent = (cur + 1) + ' / ' + shots.length + ' · ' + s.querySelector('img').alt;
    if (lb.hidden) { opener = document.activeElement; lb.hidden = false; document.body.classList.add('lock'); $('#lbClose').focus(); }
  }
  function closeLb() { lb.hidden = true; document.body.classList.remove('lock'); lbImg.removeAttribute('src'); if (opener) opener.focus(); }
  shots.forEach((s, i) => s.addEventListener('click', () => openLb(i)));
  $('#lbPrev').addEventListener('click', () => openLb(cur - 1));
  $('#lbNext').addEventListener('click', () => openLb(cur + 1));
  $('#lbClose').addEventListener('click', closeLb);
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-stage')) closeLb(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') openLb(cur - 1);
    else if (e.key === 'ArrowRight') openLb(cur + 1);
    else if (e.key === 'Tab') { // focus în lightbox
      const f = $$('button', lb), i = f.indexOf(document.activeElement);
      e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  let tx = null, ty = 0;
  lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) openLb(cur + (dx < 0 ? 1 : -1));
  });

  /* ---------- meniu, apariții, video ---------- */
  const nav = $('#nav'), banner = $('.demo-bar');
  let bh = 0; // înălțimea bannerului demo, măsurată după prima afișare (fără reflow forțat la încărcare)
  const measure = () => requestAnimationFrame(() => { bh = banner.offsetHeight; onScroll(); });
  const onScroll = () => {
    nav.style.top = Math.max(0, bh - scrollY) + 'px';
    nav.classList.toggle('solid', scrollY > innerHeight * 0.6);
  };
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', measure); measure();

  const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { threshold: 0.12 });
  $$('.rv').forEach(el => io.observe(el));

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const portrait = matchMedia('(orientation: portrait) and (max-width: 900px)').matches;
  const v = $('.hero video');
  if (!reduce && !navigator.connection?.saveData) {
    const idle = window.requestIdleCallback || (f => setTimeout(f, 1));
    const start = () => setTimeout(() => idle(() => {
      $$('source', v).forEach(s => { s.src = (portrait && s.dataset.srcPortrait) || s.dataset.src; });
      v.muted = true; v.load(); const p = v.play(); if (p && p.catch) p.catch(() => {});
    }), 3500);
    if (document.readyState === 'complete') start(); else addEventListener('load', start, { once: true });
  }
})();
