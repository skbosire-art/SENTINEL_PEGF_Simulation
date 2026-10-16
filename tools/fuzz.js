// Usage: node tools/fuzz.js [games] — plays random full games through the engine and checks invariants.
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = { window: {} }; vm.createContext(ctx);
for (const f of ['data.js', 'engine.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8').replace(/window\.TH = window\.TH \|\| \{\};/, 'var TH = window.TH = {};'), ctx);
const { engine: E, data: D } = ctx.window.TH;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const sub = (a) => a.filter(() => Math.random() < 0.4);
const N = Number(process.argv[2] || 3000), kinds = {}, gpas = [];
for (let i = 0; i < N; i++) {
  const state = { seed: (Math.random() * 2 ** 31) | 0,
    design: { tech: pick(Object.keys(D.TECHS)), region: pick(Object.keys(D.REGIONS)), release: pick(Object.keys(D.RELEASE)), rollout: pick(Object.keys(D.ROLLOUT)), safeguards: sub(Object.keys(D.SAFEGUARDS)), community: pick([0, 100, 300]) },
    pivots: { chosen: sub(Object.keys(D.PIVOTS)), retrofits: [] } };
  state.pivots.retrofits = sub(Object.keys(D.SAFEGUARDS).filter((s) => !state.design.safeguards.includes(s)));
  state.run = E.startRun(state);
  for (let y = 0; y < D.YEARS; y++) {
    E.beginYear(state);
    const ev = E.eventFor(state, state.run.current);
    if (!ev) throw new Error('no event');
    kinds[ev.title] = (kinds[ev.title] || 0) + 1;
    const ok = ev.options.map((o, j) => [o, j]).filter(([o]) => E.optionAvailable(state, o).ok);
    if (!ok.length) throw new Error('no available option for ' + ev.title);
    E.resolveEvent(state, pick(ok)[1]);
    if (!state.run.current.resolved) throw new Error('not resolved');
  }
  const g = E.grade(state.run, E.derive(state.design, state.pivots), state.design);
  for (const x of g.dims) if (!Number.isFinite(x.score)) throw new Error('NaN score ' + x.id);
  if (state.run.ledger.length !== D.YEARS) throw new Error('ledger length');
  gpas.push(g.gpa);
}
gpas.sort((a, b) => a - b);
console.log(`${N} games OK. GPA p10 ${gpas[N * 0.1 | 0].toFixed(2)} median ${gpas[N / 2 | 0].toFixed(2)} p90 ${gpas[N * 0.9 | 0].toFixed(2)} max ${gpas[N - 1].toFixed(2)}`);
console.log(Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join('\n'));
// Incidents per game by Phase-I harm potential bucket.
const buckets = {};
for (let i = 0; i < 4000; i++) {
  const state = { seed: (Math.random() * 2 ** 31) | 0,
    design: { tech: pick(Object.keys(D.TECHS)), region: pick(Object.keys(D.REGIONS)), release: pick(Object.keys(D.RELEASE)), rollout: pick(Object.keys(D.ROLLOUT)), safeguards: sub(Object.keys(D.SAFEGUARDS)), community: pick([0, 100, 300]) },
    pivots: { chosen: [], retrofits: [] } };
  const harm = E.derive(state.design, state.pivots).harm, b = Math.min(70, Math.floor(harm / 10) * 10);
  state.run = E.startRun(state);
  for (let y = 0; y < D.YEARS; y++) { E.beginYear(state); const ev = E.eventFor(state, state.run.current); const j = ev.options.findIndex((o) => E.optionAvailable(state, o).ok); E.resolveEvent(state, j); }
  (buckets[b] = buckets[b] || []).push(state.run.incidents);
}
console.log('\nincidents/game by harm bucket:', Object.entries(buckets).map(([b, a]) => `${b}+: ${(a.reduce((s, x) => s + x, 0) / a.length).toFixed(2)} (n=${a.length})`).join(' | '));
