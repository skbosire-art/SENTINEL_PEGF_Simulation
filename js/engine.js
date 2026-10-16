// THRESHOLD — simulation model. Pure functions over plain state objects so the
// whole game can be saved to localStorage and replayed deterministically.
(function () {
  const D = TH.data;
  const CONCERN_IDS = D.CONCERNS.map((c) => c.id);
  const SEV_POINTS = [0, 8, 15, 24];
  const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
  const sum = (arr, f) => arr.reduce((s, x) => s + (f ? f(x) : x), 0);

  // Serializable PRNG (mulberry32): the state lives on the run object.
  function rand(run) {
    let t = (run.rng = (run.rng + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function isComplete(design) {
    return !!(design.tech && design.region && design.release && design.rollout);
  }

  function emptyPivots() {
    return { chosen: [], retrofits: [] };
  }

  function capexOf(design, pivots = emptyPivots()) {
    const t = D.TECHS[design.tech];
    return (
      (t ? t.devCost : 0) +
      sum(design.safeguards, (id) => D.SAFEGUARDS[id].cost) +
      sum(pivots.retrofits, (id) => D.SAFEGUARDS[id].cost * D.RETROFIT.costMult) +
      sum(pivots.chosen, (id) => D.PIVOTS[id].cost) +
      design.community
    );
  }

  // Everything that follows from the design + pivots (+ residual modifiers from events).
  function derive(design, pivots = emptyPivots(), mods = {}) {
    if (!isComplete(design)) return null;
    const t = D.TECHS[design.tech];
    const r = D.REGIONS[design.region];
    const rel = D.RELEASE[design.release];
    const ro = D.ROLLOUT[design.rollout];
    const sgIds = [...design.safeguards, ...pivots.retrofits];
    const sgs = sgIds.map((id) => D.SAFEGUARDS[id]);
    const pvs = pivots.chosen.map((id) => D.PIVOTS[id]);
    const f = design.community / D.COMMUNITY_MAX;

    const inherent = {};
    const residual = {};
    for (const c of CONCERN_IDS) {
      let v = t.concerns[c] * (r.concernMult[c] || 1) * (rel.concernMult[c] || 1) * ro.riskMult * (r.riskMult || 1);
      inherent[c] = clamp(v, 0, 1);
      for (const sg of sgs) v *= 1 - (sg.mitig[c] || 0);
      for (const pv of pvs) {
        v *= 1 - ((pv.mitig && pv.mitig[c]) || 0);
        v *= (pv.concernMult && pv.concernMult[c]) || 1;
      }
      if (c === 'equity') v *= 1 - 0.45 * f;
      if (c === 'sovereignty') v *= 1 - 0.25 * f;
      v *= mods[c] || 1;
      residual[c] = clamp(v, 0, 1);
    }

    const weights = D.CONCERNS.map((c) => c.weight);
    const wsum = sum(weights);
    const avgRes = sum(D.CONCERNS, (c) => c.weight * residual[c.id]) / wsum;
    const maxRes = Math.max(...CONCERN_IDS.map((c) => residual[c]));
    const harm = Math.round(avgRes * 100);

    // Delay: safeguards run partly in parallel; retrofits add a fixed rework window.
    const sgMonths = design.safeguards.map((id) => D.SAFEGUARDS[id].months);
    const sgDelay = sgMonths.length ? Math.max(...sgMonths) + 0.25 * (sum(sgMonths) - Math.max(...sgMonths)) : 0;
    const retroDelay = pivots.retrofits.length ? D.RETROFIT.months + (pivots.retrofits.length - 1) : 0;
    const baseDelay = Math.round(ro.delay + sgDelay + retroDelay + sum(pvs, (p) => p.months || 0));

    // Regulatory review: strict regions scrutinize the worst residual risk hardest.
    const pressureRaw = r.reg * (0.6 * maxRes + 0.4 * avgRes);
    const pressure = pressureRaw * pvs.reduce((m, p) => m * (p.regRelief || 1), 1);
    const delayRelief = pvs.reduce((m, p) => m * (p.delayRelief || 1), 1);
    const regDelay = Math.round(Math.max(0, pressure - 0.15) * 30 * delayRelief);
    const fine = Math.round(Math.max(0, pressure - 0.3) * 200);

    const regulatorStart = clamp(
      80 - pressure * 70 + sum(sgs, (s) => s.regulator || 0) + sum(pvs, (p) => p.regulator || 0)
    );
    const trustStart = clamp(
      5 + r.trust * 100 + rel.trust + sum(sgs, (s) => s.trust || 0) + sum(pvs, (p) => p.trust || 0) + 12 * f - harm * 0.2
    );
    const equityStart = clamp(
      60 - residual.equity * 35 - residual.sovereignty * 25 + 20 * f + (design.release === 'open' ? 5 : 0)
    );

    const adoptPenalty = sum(sgs, (s) => s.adoptPenalty || 0);
    const potential = clamp(
      0.7 * rel.adoptMult * (1 - adoptPenalty) * pvs.reduce((m, p) => m * (p.adoptMult || 1), 1),
      0.05,
      1
    );
    const annualRev = t.market * r.marketMult * rel.revMult * pvs.reduce((m, p) => m * (p.revMult || 1), 1);
    const capex = capexOf(design, pivots);

    return {
      t, r, rel, ro, sgIds,
      inherent, residual, harm, avgRes, maxRes,
      capex, overBudget: Math.max(0, capex - D.BUDGET),
      baseDelay, pressure, regDelay, fine,
      regulatorStart, trustStart, equityStart,
      potential, annualRev,
      annualCompliance: sum(pvs, (p) => p.annual || 0),
      flags: Object.fromEntries(pvs.filter((p) => p.flag).map((p) => [p.flag, true])),
    };
  }

  function pressureLabel(p) {
    if (p < 0.2) return 'Low';
    if (p < 0.35) return 'Moderate';
    if (p < 0.5) return 'High';
    return 'Severe';
  }

  // ---------- Phase III ----------

  function startRun(state) {
    const d = derive(state.design, state.pivots);
    return {
      year: 0,
      rng: state.seed,
      delay: d.baseDelay + d.regDelay,
      cash: D.BUDGET - d.capex - d.fine,
      trust: d.trustStart,
      regulator: d.regulatorStart,
      equity: d.equityStart,
      adoption: 0,
      reach: 0,
      potentialMult: 1,
      revMult: 1,
      mods: {},
      harm: 0,
      incidents: 0,
      flags: { ...d.flags },
      used: [],
      ledger: [],
      totalRev: 0,
      totalOpex: 0,
      lastNet: 0,
      current: null,
    };
  }

  // Shared year dynamics for both interactive and expected-value runs.
  function yearDynamics(run, design, pivots) {
    run.year += 1;
    const dd = derive(design, pivots, run.mods);
    const active = clamp(12 * run.year - run.delay, 0, 12) / 12;
    const pot = clamp(dd.potential * run.potentialMult, 0.05, 1);
    if (active > 0) run.adoption += (pot - run.adoption) * dd.ro.ramp * active;
    const tf = 0.4 + (0.6 * run.trust) / 100;
    const revenue = dd.annualRev * run.revMult * run.adoption * tf;
    const opex = (active > 0 ? dd.t.opex * (0.5 + (0.5 * run.adoption) / pot) : dd.t.opex * 0.3) + dd.annualCompliance;
    run.reach = dd.t.reachMax * dd.r.impactMult * run.adoption * tf;
    run.cash += revenue - opex;
    run.totalRev += revenue;
    run.totalOpex += opex;
    run.lastNet = revenue - opex;
    if (design.safeguards.includes('ethicsboard') || pivots.retrofits.includes('ethicsboard')) run.trust = clamp(run.trust + 1);
    return { dd, active, revenue, opex, exposure: active > 0 ? 0.35 + 0.65 * run.adoption : 0.1 };
  }

  function incidentChance(residual, exposure) {
    return Math.min(0.95, Math.pow(residual, 1.4) * 0.9 * exposure);
  }

  function applyIncidentHit(run, sev, reg, w = 1) {
    const before = { trust: run.trust, regulator: run.regulator };
    run.trust = clamp(run.trust - w * sev * 6);
    run.regulator = clamp(run.regulator - w * sev * (3 + 5 * reg));
    run.harm += w * SEV_POINTS[sev];
    run.cash -= w * sev * 40;
    return {
      trust: Math.round(before.trust - run.trust),
      regulator: Math.round(before.regulator - run.regulator),
      cash: w * sev * 40,
      harm: w * SEV_POINTS[sev],
    };
  }

  function applyCleanYear(run, design, w = 1) {
    run.trust = clamp(run.trust + 3 * w);
    run.regulator = clamp(run.regulator + 2.5 * w);
    run.equity = clamp(run.equity + w * (1 + (2 * design.community) / D.COMMUNITY_MAX));
  }

  function beginYear(state) {
    const run = state.run;
    const { design, pivots } = state;
    const y = yearDynamics(run, design, pivots);
    const events = D.EVENTS[design.tech];
    let current = null;

    if (run.flags.coverup && !run.flags.scandalDone && run.year > run.flags.coverupYear && rand(run) < 0.65) {
      current = { kind: 'scandal', key: 'SCANDAL' };
    } else if (run.flags.lobbied && !run.flags.lobbyDone && rand(run) < 0.35) {
      current = { kind: 'scandal', key: 'LOBBY_SCANDAL' };
    } else {
      let best = null;
      for (const c of Object.keys(events)) {
        if (run.used.includes(c)) continue;
        const p = incidentChance(y.dd.residual[c], y.exposure);
        if (rand(run) < p && (!best || p > best.p)) best = { c, p };
      }
      if (best) {
        current = { kind: 'incident', key: best.c, concern: best.c };
        run.used.push(best.c);
      } else {
        const pool = D.OPPORTUNITIES.filter((o) => !run.used.includes(o.id));
        const o = pool[Math.floor(rand(run) * pool.length)];
        current = { kind: 'opportunity', key: o.id };
        run.used.push(o.id);
      }
    }

    const ev = eventFor(state, current);
    let fallout = null;
    if (current.kind !== 'opportunity') {
      fallout = applyIncidentHit(run, ev.severity, y.dd.r.reg);
      run.incidents += 1;
    } else {
      applyCleanYear(run, design);
    }
    run.current = { ...current, fallout, revenue: y.revenue, opex: y.opex, active: y.active, resolved: false };
  }

  function eventFor(state, cur) {
    if (!cur) return null;
    if (cur.kind === 'scandal') return D[cur.key];
    if (cur.kind === 'incident') return D.EVENTS[state.design.tech][cur.key];
    return D.OPPORTUNITIES.find((o) => o.id === cur.key);
  }

  function optionAvailable(state, opt) {
    if (!opt.requires) return { ok: true };
    const { safeguard, flag } = opt.requires;
    if (safeguard && ![...state.design.safeguards, ...state.pivots.retrofits].includes(safeguard)) {
      return { ok: false, why: `Requires: ${D.SAFEGUARDS[safeguard].name}` };
    }
    if (flag && !state.run.flags[flag]) {
      return { ok: false, why: `Requires: ${D.PIVOTS.league.name}` };
    }
    return { ok: true };
  }

  function applyEffect(state, e) {
    const run = state.run;
    run.cash += e.cash || 0;
    run.trust = clamp(run.trust + (e.trust || 0));
    run.regulator = clamp(run.regulator + (e.regulator || 0));
    run.equity = clamp(run.equity + (e.equity || 0));
    run.harm = Math.max(0, run.harm + (e.harm || 0));
    if (e.adoption) run.adoption = clamp(run.adoption * (1 + e.adoption), 0, 1);
    if (e.potential) run.potentialMult *= e.potential;
    if (e.revMult) run.revMult *= e.revMult;
    if (e.residual) {
      const dd = derive(state.design, state.pivots, run.mods);
      for (const [k, m] of Object.entries(e.residual)) {
        let targets = [k];
        if (k === 'all') targets = CONCERN_IDS;
        if (k === 'top') targets = [CONCERN_IDS.reduce((a, b) => (dd.residual[b] > dd.residual[a] ? b : a))];
        for (const c of targets) run.mods[c] = (run.mods[c] || 1) * m;
      }
    }
    if (e.flag === 'coverup' && !run.flags.coverup) {
      run.flags.coverup = true;
      run.flags.coverupYear = run.year;
    }
  }

  function resolveEvent(state, idx) {
    const run = state.run;
    const cur = run.current;
    const ev = eventFor(state, cur);
    const opt = ev.options[idx];
    if (!optionAvailable(state, opt).ok) return;
    applyEffect(state, opt.effect);
    if (cur.key === 'SCANDAL') run.flags.scandalDone = true;
    if (cur.key === 'LOBBY_SCANDAL') run.flags.lobbyDone = true;
    cur.resolved = true;
    cur.choice = idx;
    run.ledger.push({
      year: run.year,
      event: ev.title,
      kind: cur.kind,
      choice: opt.label,
      outcome: opt.outcome,
      revenue: cur.revenue,
      opex: cur.opex,
      cash: run.cash,
      reach: run.reach,
      trust: run.trust,
      regulator: run.regulator,
      equity: run.equity,
      harm: run.harm,
    });
  }

  // ---------- Phase IV ----------

  const LETTERS = [
    [93, 'A', 4.0], [90, 'A-', 3.7], [87, 'B+', 3.3], [83, 'B', 3.0], [80, 'B-', 2.7],
    [77, 'C+', 2.3], [73, 'C', 2.0], [70, 'C-', 1.7], [67, 'D+', 1.3], [60, 'D', 1.0], [0, 'F', 0],
  ];
  const letter = (s) => LETTERS.find(([min]) => s >= min);

  function grade(run, d, design) {
    const net5 = run.cash - D.BUDGET;
    const terminal = Math.max(0, run.lastNet) * 2.5;
    const value = net5 + terminal - d.overBudget * 0.5;
    const roi = value / d.capex;
    const reachFrac = run.reach / d.t.reachMax;
    const raw = {
      innovation: clamp(25 + 80 * Math.sqrt(reachFrac) + (design.release === 'open' ? 5 : 0)),
      safety: clamp(100 - run.harm),
      equity: clamp(run.equity),
      trust: clamp(run.trust),
      regulatory: clamp(run.regulator - d.fine / 15 - d.regDelay * 0.6),
      financial: clamp(60 + roi * 40),
    };
    const dims = Object.entries(raw).map(([id, s]) => {
      const [, l, gp] = letter(s);
      return { id, score: Math.round(s), letter: l, gp };
    });
    const gpa = sum(dims, (x) => x.gp) / dims.length;
    const mean = sum(dims, (x) => x.score) / dims.length;
    return { dims, gpa, mean, roi, value, net5, terminal };
  }

  // Auto-play using expected values (no event choices). Used for the reference path.
  function simulateExpected(design, pivots = emptyPivots()) {
    const d = derive(design, pivots);
    const run = startRun({ design, pivots, seed: 1 });
    const events = D.EVENTS[design.tech];
    for (let i = 0; i < D.YEARS; i++) {
      const y = yearDynamics(run, design, pivots);
      let pAny = 0;
      for (const c of Object.keys(events)) {
        const p = incidentChance(y.dd.residual[c], y.exposure) / 2; // each incident can fire once
        applyIncidentHit(run, events[c].severity, d.r.reg, p);
        pAny += p;
      }
      applyCleanYear(run, design, Math.max(0, 1 - pAny));
    }
    return { run, d, grades: grade(run, d, design) };
  }

  function referencePath(techId) {
    const sgIds = Object.keys(D.SAFEGUARDS);
    let best = null;
    for (const region of Object.keys(D.REGIONS))
      for (const release of Object.keys(D.RELEASE))
        for (const rollout of Object.keys(D.ROLLOUT))
          for (let mask = 0; mask < 1 << sgIds.length; mask++)
            for (const community of [0, 100, 200, 300]) {
              const design = {
                tech: techId, region, release, rollout, community,
                safeguards: sgIds.filter((_, i) => mask & (1 << i)),
              };
              const { grades } = simulateExpected(design);
              if (!best || grades.mean > best.grades.mean) best = { design, grades };
            }
    return best;
  }

  TH.engine = {
    clamp, isComplete, emptyPivots, capexOf, derive, pressureLabel,
    startRun, beginYear, eventFor, optionAvailable, resolveEvent,
    grade, simulateExpected, referencePath, letter,
  };
})();
