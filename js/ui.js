// THRESHOLD — rendering and interaction. State is a single plain object saved to
// localStorage after every action; views are re-rendered from it.
(function () {
  const D = TH.data;
  const E = TH.engine;
  const KEY = 'threshold-sim-v1';

  const $ = (s) => document.querySelector(s);
  const main = $('#main');
  const side = $('#sidebar');
  const tracker = $('#tracker');
  const modal = $('#modal');
  const modalBody = $('#modal-body');

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const money = (m) => {
    const a = Math.abs(m);
    const s = a >= 1000 ? `$${(a / 1000).toFixed(2)}B` : `$${Math.round(a)}M`;
    return m < 0 ? `−${s}` : s;
  };
  const pct = (x) => `${Math.round(x * 100)}%`;
  const signed = (n, f = (v) => Math.round(v)) => (n >= 0 ? `+${f(n)}` : `−${f(-n)}`);
  const concern = (id) => D.CONCERNS.find((c) => c.id === id);
  const topConcern = (res) => Object.keys(res).reduce((a, b) => (res[b] > res[a] ? b : a));
  const tone = (v, good = 65, mid = 40) => (v >= good ? 'good' : v >= mid ? 'mid' : 'bad');

  const PHASES = [['000', 'Brief'], ['PH-I', 'Design'], ['PH-II', 'Oversight'], ['PH-III', 'Rollout'], ['PH-IV', 'Debrief']];
  const DIMS = {
    innovation: ['Innovation & Impact', 'How many people your technology reached and helped.'],
    safety: ['Safety & Security', 'Harm from accidents, misuse and breaches — and how you responded.'],
    equity: ['Ethics & Equity', 'Who benefited, who was left out, and whether consent was respected.'],
    trust: ['Public Trust', 'What people think of Helix Forge at the end of year five.'],
    regulatory: ['Regulatory Standing', 'Regulator confidence, review delays and fines.'],
    financial: ['Financial Health', 'Five-year return on capital, including the value of the business you built.'],
  };
  const TIPS = {
    innovation: 'Reach suffered. Long delays, low trust, or a closed model kept your technology from the people who needed it. Caution has a cost too.',
    safety: 'Harm piled up. Look at which concerns you left unmitigated in Phase I — incidents are drawn from your biggest residual risks.',
    equity: 'Benefits flowed unevenly. Access funds, equity audits, consent processes and benefit-sharing all move this grade.',
    trust: 'Trust is earned slowly and lost fast. Cover-ups, blame and surprises cost more than bad news delivered honestly.',
    regulatory: 'Regulators punished your worst unaddressed risk. Strict regions reward targeted safeguards; lobbying and secrecy backfire.',
    financial: 'Returns were thin. Overspending, long delays and costly crises all eat into capital. Responsible doesn\'t have to mean unprofitable.',
  };

  function fresh() {
    return {
      phase: 0,
      seed: (Date.now() ^ Math.floor(Math.random() * 1e9)) | 0,
      design: { tech: null, region: null, release: null, rollout: null, safeguards: [], community: 0 },
      pivots: E.emptyPivots(),
      run: null,
      player: '',
    };
  }
  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY));
    } catch {
      return null;
    }
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable (private mode) — the game still works, it just won't resume */
    }
  }

  let state = load() || fresh();
  const refCache = {};

  // ---------- shared fragments ----------

  function chips(o, { costMult = 1, extraMonths = 0, showCost = true } = {}) {
    const out = [];
    if (showCost && o.cost != null) out.push(`<span class="chip dark">${money(o.cost * costMult)}</span>`);
    if (o.annual) out.push(`<span class="chip red">+${money(o.annual)}/yr</span>`);
    const months = (o.months || 0) + extraMonths;
    if (months) out.push(`<span class="chip">+${months} mo</span>`);
    for (const [c, v] of Object.entries(o.mitig || {})) if (v >= 0.1) out.push(`<span class="chip green">${concern(c).label} −${pct(v)}</span>`);
    for (const [c, v] of Object.entries(o.concernMult || {})) out.push(`<span class="chip red">${concern(c).label} +${pct(v - 1)}</span>`);
    if (o.trust) out.push(`<span class="chip ${o.trust > 0 ? 'green' : 'red'}">Trust ${signed(o.trust)}</span>`);
    if (o.regulator) out.push(`<span class="chip green">Regulators ${signed(o.regulator)}</span>`);
    if (o.revMult) out.push(`<span class="chip red">Revenue −${pct(1 - o.revMult)}</span>`);
    if (o.adoptPenalty) out.push(`<span class="chip red">Reach −${pct(o.adoptPenalty)}</span>`);
    if (o.adoptMult) out.push(`<span class="chip red">Reach −${pct(1 - o.adoptMult)}</span>`);
    if (o.regRelief) out.push(`<span class="chip green">Review pressure −${pct(1 - o.regRelief)}</span>`);
    if (o.delayRelief) out.push(`<span class="chip green">Review delay −${pct(1 - o.delayRelief)}</span>`);
    if (o.flag === 'league') out.push('<span class="chip blue">Heroes on call</span>');
    if (o.flag === 'lobbied') out.push('<span class="chip red">Scandal risk</span>');
    return out.join('');
  }

  function bar(value, max = 100, cls = '') {
    return `<div class="bar ${cls}"><span style="width:${Math.max(0, Math.min(100, (value / max) * 100))}%"></span></div>`;
  }

  function metric(label, value, extra = '') {
    return `<div class="metric"><span class="label">${label}</span><span class="value">${value}</span>${extra}</div>`;
  }

  function stepHead(n, title, sub) {
    return `<div class="step-head"><span class="step-num">${n}</span><h3>${title}</h3></div>${sub ? `<p class="muted small">${sub}</p>` : ''}`;
  }

  function oversightLabel(reg) {
    return reg < 0.35 ? 'Light' : reg < 0.75 ? 'Moderate' : 'Strict';
  }

  function residualNow() {
    const mods = state.run ? state.run.mods : {};
    return E.derive(state.design, state.pivots, mods);
  }

  // ---------- stakeholders ----------

  function stakeholders(d, run) {
    const res = d.residual;
    const top = concern(topConcern(res)).label.toLowerCase();
    const flags = run ? run.flags : d.flags;
    const lines = {};

    const trust = run ? run.trust : d.trustStart;
    lines.public = trust >= 65
      ? ['good', `Readers are excited — and watching how you handle ${top}.`]
      : trust >= 40
        ? ['mid', `The public is split. Biggest worry on the letters page: ${top}.`]
        : ['bad', `Front page: "WHO ASKED FOR THIS?" Readers fear ${top} most.`];

    if (run) {
      lines.regulators = run.regulator >= 65
        ? ['good', 'Confident in your oversight. Renewals are routine.']
        : run.regulator >= 40
          ? ['mid', 'Monitoring you closely. One more incident and the hearings start.']
          : ['bad', 'Drafting emergency restrictions on your entire product line.'];
    } else {
      lines.regulators = d.pressure < 0.2
        ? ['good', 'Review looks routine. Paperwork, not politics.']
        : d.pressure < 0.35
          ? ['mid', `Reviewers have questions about ${top}. Expect some delay.`]
          : ['bad', `Formal objection filed over ${top}. Delays and fines are coming unless you act.`];
    }

    lines.heroes = flags.league
      ? ['good', 'Partnered. Nightwire is on call if anything goes wrong.']
      : res.misuse < 0.3
        ? ['good', 'Impressed by your security work. "Hard to steal is hard to misuse."']
        : res.misuse < 0.55
          ? ['mid', 'Worried your technology becomes the next villain\'s weapon.']
          : ['bad', 'Captain Valor: "If this gets stolen, people die. Fix it, or we oppose you."'];

    if (run) {
      lines.investors = run.cash < 0
        ? ['bad', 'Burning cash. The board is discussing your replacement.']
        : run.lastNet <= 0
          ? ['mid', 'Still losing money every year. Patience is thinning.']
          : ['good', `Operating profit of ${money(run.lastNet)} last year. Keep it up.`];
    } else {
      const months = d.baseDelay + d.regDelay;
      lines.investors = d.overBudget > 0
        ? ['bad', `You're ${money(d.overBudget)} over budget. Covering it means diluting the board's stake.`]
        : months > 30
          ? ['mid', `${months} months to first revenue? The board is getting restless.`]
          : ['good', 'Bullish. "Ship it."'];
    }

    const eq = run ? run.equity : d.equityStart;
    lines.communities = res.sovereignty > 0.5
      ? ['bad', state.design.tech === 'aetherium' ? 'Tavari elders: "Nobody asked us. This is our land."' : 'Nobody asked the people who will live with this.']
      : eq >= 65
        ? ['good', 'Residents feel included and are seeing real benefits.']
        : eq >= 45
          ? ['mid', 'Benefits seem to stop at the wealthy districts.']
          : ['bad', 'Organizing protests over who gets left behind.'];

    lines.rivals = res.misuse < 0.3
      ? ['good', 'Threat level LOW. Your systems look too hard to crack.']
      : res.misuse < 0.55
        ? ['mid', 'Threat level ELEVATED. The Syndicate is probing your defenses.']
        : ['bad', 'Threat level SEVERE. The Syndicate has a plan — and it involves your technology.'];

    return D.STAKEHOLDERS.map((s) => ({ ...s, mood: lines[s.id][0], line: lines[s.id][1] }));
  }

  // ---------- views ----------

  function viewBrief() {
    return `
      <section class="panel yellow">
        <span class="kicker">000 · MISSION BRIEF</span>
        <h2>Every power comes with a price tag.</h2>
        <p class="lede">You are the new Chief Technology Officer of <b>Helix Forge Industries</b>, the Vanguard Universe's most ambitious inventor-company. Your labs have just cracked a breakthrough that could change the world — or break it.</p>
        <p class="lede">Your job is not to build the most powerful technology. It is to decide <b>whether, how, where and for whom</b> it should exist — and then live with the consequences for five years.</p>
      </section>
      <section class="panel">
        <h3>How it works</h3>
        <div class="phase-list">
          <div class="panel tight"><div class="code">PH-I · DESIGN</div><p class="small">Pick a breakthrough. Lock in where you launch, how you release it, how fast you move, which safeguards you build, and how much you invest in access.</p></div>
          <div class="panel tight"><div class="code">PH-II · OVERSIGHT</div><p class="small">Regulators, heroes, investors, communities — and villains — react. Choose pivots. Safeguards added now cost 1.5×.</p></div>
          <div class="panel tight"><div class="code">PH-III · ROLLOUT</div><p class="small">Five years, one at a time. Incidents come from the risks you left open. Every crisis demands a decision.</p></div>
          <div class="panel tight"><div class="code">PH-IV · DEBRIEF</div><p class="small">Letter grades on six dimensions, a computed benchmark for your technology, and the real-world cases behind your dilemmas.</p></div>
        </div>
      </section>
      <section class="grid-2">
        <div class="panel">
          <h3>How you're graded</h3>
          <ul class="tight small">${Object.values(DIMS).map(([n, w]) => `<li><b>${n}</b> — ${w}</li>`).join('')}</ul>
          <p class="small muted" style="margin-top:.6rem">There is no perfect score. Every choice trades one dimension against another — that's the point.</p>
        </div>
        <div class="panel sky">
          <h3>Think like a responsible innovator</h3>
          <ul class="tight small">
            <li><b>Anticipate</b> — What could go wrong, and for whom?</li>
            <li><b>Reflect</b> — What are you assuming? Whose values are built in?</li>
            <li><b>Include</b> — Who should have a say before you launch?</li>
            <li><b>Respond</b> — When the evidence changes, will you change course?</li>
          </ul>
        </div>
      </section>
      <div class="actions">
        <button class="btn red" data-action="start" type="button">Take the job →</button>
        <span class="muted small">About 20–30 minutes. Progress saves automatically in this browser.</span>
      </div>`;
  }

  function choiceCard(group, id, selected, body) {
    return `<button type="button" class="card ${selected ? 'selected' : ''}" data-action="pick" data-group="${group}" data-id="${id}" aria-pressed="${selected}">${body}</button>`;
  }

  function viewDesign() {
    const dz = state.design;
    const techCards = Object.entries(D.TECHS).map(([id, t]) => {
      const risks = Object.entries(t.concerns).sort((a, b) => b[1] - a[1]).slice(0, 2);
      return choiceCard('tech', id, dz.tech === id, `
        <span class="title">${t.name}</span><span class="tag">${t.tagline}</span>
        <span class="desc">${t.blurb}</span>
        <span class="small muted">Real-world parallel: ${t.parallel}</span>
        <span class="meta"><span class="chip dark">Dev ${money(t.devCost)}</span>${risks.map(([c]) => `<span class="chip red">${concern(c).label} risk</span>`).join('')}</span>`);
    }).join('');

    const regionCards = Object.entries(D.REGIONS).map(([id, r]) => choiceCard('region', id, dz.region === id, `
      <span class="title">${r.name}</span><span class="tag">${r.tag}</span>
      <span class="desc">${r.blurb}</span>
      <span class="meta"><span class="chip blue">Market ×${r.marketMult}</span><span class="chip">Oversight: ${oversightLabel(r.reg)}</span>${r.impactMult > 1 ? `<span class="chip green">Impact ×${r.impactMult}</span>` : ''}${r.riskMult ? `<span class="chip red">Risk ×${r.riskMult}</span>` : ''}</span>`)).join('');

    const releaseCards = Object.entries(D.RELEASE).map(([id, r]) => choiceCard('release', id, dz.release === id, `
      <span class="title">${r.name}</span><span class="desc">${r.blurb}</span>
      <span class="meta"><span class="chip blue">Revenue ×${r.revMult}</span><span class="chip blue">Reach ×${r.adoptMult}</span></span>`)).join('');

    const rolloutCards = Object.entries(D.ROLLOUT).map(([id, r]) => choiceCard('rollout', id, dz.rollout === id, `
      <span class="title">${r.name}</span><span class="desc">${r.blurb}</span>
      <span class="meta"><span class="chip">${r.delay} mo to launch</span><span class="chip ${r.riskMult > 1 ? 'red' : 'green'}">Risk ×${r.riskMult}</span></span>`)).join('');

    const sgCards = Object.entries(D.SAFEGUARDS).map(([id, s]) => {
      const on = dz.safeguards.includes(id);
      return `<button type="button" class="card ${on ? 'selected' : ''}" data-action="toggle-sg" data-id="${id}" aria-pressed="${on}">
        <span class="title">${s.name}</span><span class="desc">${s.blurb}</span><span class="meta">${chips(s)}</span></button>`;
    }).join('');

    return `
      <section class="panel">
        <span class="kicker">PH-I · DESIGN</span>
        <h2>Commit your design</h2>
        <p class="lede">Steps 1–4 are <b>permanent</b> once locked. Safeguards can be added later, but at 1.5× the cost and with rework delays. Watch the risk profile on the right change as you choose.</p>
      </section>
      <section class="panel">${stepHead(1, 'Choose your breakthrough', 'Each technology carries a different mix of risks. Read the risk chips carefully.')}<div class="cards">${techCards}</div></section>
      <section class="panel">${stepHead(2, 'Pick your launch market', 'Market size, oversight strength and need all vary by region.')}<div class="cards">${regionCards}</div></section>
      <section class="panel">${stepHead(3, 'Decide how to release it', 'Who gets to build with your technology — and who can inspect it?')}<div class="cards">${releaseCards}</div></section>
      <section class="panel">${stepHead(4, 'Set your rollout speed', 'Speed multiplies every risk. So does caution\'s cost in time.')}<div class="cards">${rolloutCards}</div></section>
      <section class="panel">${stepHead(5, 'Build in safeguards', 'Choose any number. Each one targets specific risks — a safeguard that doesn\'t match your technology\'s risks is mostly wasted money.')}<div class="cards">${sgCards}</div></section>
      <section class="panel">${stepHead(6, 'Fund access & community benefits', 'Subsidized access, local hiring, and community programs before launch. Improves equity, consent and trust.')}
        <div class="slider-row">
          <input type="range" id="community" min="0" max="${D.COMMUNITY_MAX}" step="25" value="${dz.community}" aria-label="Access and community fund in millions" />
          <span class="big-num" id="community-val">${money(dz.community)}</span>
        </div>
      </section>
      <div class="actions"><button class="btn red" data-action="lock" type="button">Lock in design →</button></div>`;
  }

  function viewOversight() {
    const d = E.derive(state.design, state.pivots);
    const dz = state.design;
    const top = concern(topConcern(d.residual)).label;
    const bubbles = stakeholders(d, null).map((s) => `
      <div class="bubble ${s.mood}"><div class="who">${s.name}</div><div class="role">${s.role}</div><p style="margin:.4rem 0 0">${s.line}</p></div>`).join('');

    const pivotCards = Object.entries(D.PIVOTS).map(([id, p]) => {
      const on = state.pivots.chosen.includes(id);
      return `<button type="button" class="card ${on ? 'selected' : ''}" data-action="toggle-pivot" data-id="${id}" aria-pressed="${on}">
        <span class="title">${p.name}</span><span class="desc">${p.blurb}</span><span class="meta">${chips(p)}</span></button>`;
    }).join('');

    const retroCards = Object.entries(D.SAFEGUARDS).filter(([id]) => !dz.safeguards.includes(id)).map(([id, s]) => {
      const on = state.pivots.retrofits.includes(id);
      return `<button type="button" class="card ${on ? 'selected' : ''}" data-action="toggle-retro" data-id="${id}" aria-pressed="${on}">
        <span class="title">${s.name}</span><span class="desc">${s.blurb}</span>
        <span class="meta">${chips({ ...s, months: 0 }, { costMult: D.RETROFIT.costMult })}<span class="chip">rework</span></span></button>`;
    }).join('');

    const level = E.pressureLabel(d.pressure);
    return `
      <section class="panel">
        <span class="kicker">PH-II · OVERSIGHT</span>
        <h2>The world reacts</h2>
        <p class="lede">Your commitments are locked: <b>${d.t.name}</b> · ${d.r.name} · ${d.rel.name} · ${d.ro.name}. Now everyone with a stake in your technology has something to say.</p>
      </section>
      <section class="panel"><h3>Stakeholder reactions</h3><div class="bubbles">${bubbles}</div></section>
      <section class="panel sky">
        <h3>Regulatory review · ${d.r.name}</h3>
        <p>Oversight here is <b>${oversightLabel(d.r.reg).toLowerCase()}</b>. Reviewers focus hardest on your worst unaddressed risk: <b>${top}</b> (${pct(d.residual[topConcern(d.residual)])} residual).</p>
        <div class="stats">
          <div class="stat"><div class="label">Review pressure</div><div class="value">${level}</div>${bar(d.pressure, 0.7, d.pressure < 0.2 ? 'good' : d.pressure < 0.35 ? 'mid' : 'bad')}</div>
          <div class="stat"><div class="label">Projected review delay</div><div class="value">${d.regDelay} mo</div></div>
          <div class="stat"><div class="label">Projected fine</div><div class="value">${money(d.fine)}</div></div>
          <div class="stat"><div class="label">Total time to launch</div><div class="value">${d.baseDelay + d.regDelay} mo</div></div>
        </div>
      </section>
      <section class="panel">${stepHead('A', 'Strategic pivots', 'Optional. Choose any combination — every option has a cost.')}<div class="cards">${pivotCards}</div></section>
      <section class="panel">${stepHead('B', 'Retrofit safeguards', `Adding safeguards after design costs ${D.RETROFIT.costMult}× and forces ${D.RETROFIT.months}+ months of rework. This is the Collingridge dilemma in action.`)}
        ${retroCards ? `<div class="cards">${retroCards}</div>` : '<p class="muted">You already built every safeguard.</p>'}</section>
      <div class="actions"><button class="btn red" data-action="submit-review" type="button">Submit for approval →</button></div>`;
  }

  function deltaChips(dl) {
    if (!dl) return '';
    const items = [
      ['Cash', dl.cash, (v) => money(v)],
      ['Trust', dl.trust],
      ['Regulators', dl.regulator],
      ['Equity', dl.equity],
      ['Safety record', -dl.harm],
    ].filter(([, v]) => Math.abs(v) >= 0.5);
    if (!items.length) return '<span class="chip">No immediate change</span>';
    return items.map(([k, v, f]) => `<span class="chip ${v > 0 ? 'green' : 'red'}">${k} ${f ? (v > 0 ? '+' : '') + f(v) : signed(v)}</span>`).join(' ');
  }

  function viewRollout() {
    const run = state.run;
    const cur = run.current;
    const ev = E.eventFor(state, cur);
    const d = E.derive(state.design, state.pivots);
    const years = Array.from({ length: D.YEARS }, (_, i) => {
      const y = i + 1;
      const cls = y < run.year || (y === run.year && cur.resolved) ? 'done' : y === run.year ? 'now' : '';
      return `<div class="y ${cls}" aria-label="Year ${y}">Y${y}</div>`;
    }).join('');

    const status = cur.active === 0
      ? `Pre-launch: still in trials and review. Launch is scheduled for month ${run.delay}.`
      : cur.active < 1 ? `Launch year: ${d.t.name} goes live in month ${run.delay}.` : `${d.t.name} is operating at ${pct(run.adoption)} of its addressable market.`;

    const kindLabel = cur.kind === 'incident' ? `INCIDENT · ${concern(cur.concern).label.toUpperCase()}` : cur.kind === 'scandal' ? 'SCANDAL' : 'DILEMMA';
    const fallout = cur.fallout
      ? `<div class="fallout">IMMEDIATE FALLOUT → Trust ${signed(-cur.fallout.trust)} · Regulators ${signed(-cur.fallout.regulator)} · Cash −${money(cur.fallout.cash)} · Safety record −${cur.fallout.harm}</div>`
      : '';

    let body;
    if (!cur.resolved) {
      body = `<p class="small mono"><b>What do you do?</b></p><div class="options">${ev.options.map((o, i) => {
        const av = E.optionAvailable(state, o);
        return `<button type="button" class="option" data-action="choose" data-idx="${i}" ${av.ok ? '' : 'disabled'}>
          <span class="letter">${'ABC'[i]}</span><span>${esc(o.label)}${av.ok ? '' : `<span class="why">${esc(av.why)}</span>`}</span></button>`;
      }).join('')}</div>`;
    } else {
      const o = ev.options[cur.choice];
      const last = run.year >= D.YEARS;
      body = `<div class="outcome"><p class="small mono"><b>You chose:</b> ${esc(o.label)}</p><p>${esc(o.outcome)}</p><div class="meta">${deltaChips(cur.deltas)}</div></div>
        <div class="actions">${last
          ? '<button class="btn red" data-action="to-debrief" type="button">Go to debrief →</button>'
          : `<button class="btn red" data-action="next-year" type="button">Advance to year ${run.year + 1} →</button>`}</div>`;
    }

    const rows = run.ledger.map((r) => `<tr><td>Y${r.year}</td><td>${esc(r.event)}<br><span class="muted">${esc(r.choice)}</span></td>
      <td>${money(r.revenue)}</td><td>${money(r.cash)}</td><td>${r.reach.toFixed(1)}M</td><td>${Math.round(r.trust)}</td><td>${Math.round(r.regulator)}</td><td>${Math.round(r.equity)}</td><td>${Math.round(100 - r.harm)}</td></tr>`).join('');

    return `
      <section class="panel">
        <span class="kicker">PH-III · ROLLOUT</span>
        <h2>Year ${run.year} of ${D.YEARS}</h2>
        <div class="years">${years}</div>
        <p class="mono small">${status} Revenue this year: <b>${money(cur.revenue)}</b> · Operating costs: <b>${money(cur.opex)}</b></p>
      </section>
      <section class="panel event ${cur.kind}" id="event">
        <div class="sfx" aria-hidden="true">${ev.sfx}</div>
        <span class="kicker">${kindLabel}</span>
        <h3>${ev.title}</h3>
        <p class="lede">${ev.text}</p>
        ${fallout}
        ${body}
      </section>
      <section class="panel">
        <h3>Operations ledger</h3>
        ${rows ? `<div class="table-wrap"><table class="ledger"><thead><tr><th>Year</th><th>Event / decision</th><th>Revenue</th><th>Cash</th><th>Reach</th><th>Trust</th><th>Reg.</th><th>Equity</th><th>Safety</th></tr></thead><tbody>${rows}</tbody></table></div>`
          : '<p class="muted">The ledger fills in as each year closes.</p>'}
      </section>`;
  }

  function verdict(gpa) {
    if (gpa >= 3.3) return 'Helix Forge is now the case study other companies are taught.';
    if (gpa >= 2.5) return 'A solid record — with a few scars worth learning from.';
    if (gpa >= 1.5) return 'You shipped. The world is still deciding whether to forgive you.';
    return 'The congressional hearings will be televised.';
  }

  function results() {
    const d = E.derive(state.design, state.pivots);
    return { d, g: E.grade(state.run, d, state.design) };
  }

  function viewDebrief() {
    const run = state.run;
    const { d, g } = results();
    const weakest = [...g.dims].sort((a, b) => a.score - b.score).slice(0, 2);
    const tiles = g.dims.map((x) => `
      <div class="grade"><div class="letter ${x.letter[0]}">${x.letter}</div><div class="dim">${DIMS[x.id][0]}</div><div class="why">${DIMS[x.id][1]} <b>${x.score}/100</b></div></div>`).join('');

    const moments = run.ledger.map((r) => `<li><b>Year ${r.year} — ${esc(r.event)}.</b> You chose: <i>${esc(r.choice)}</i>. ${esc(r.outcome)}</li>`).join('');
    const lessons = [...D.LESSONS[state.design.tech], ...D.LESSONS.frameworks]
      .map((l) => `<div class="lesson"><h4>${l.title}</h4><p>${l.text}</p></div>`).join('');

    return `
      <section class="panel yellow">
        <span class="kicker">PH-IV · DEBRIEF</span>
        <h2>Five years later…</h2>
        <div class="gpa"><div class="score">${g.gpa.toFixed(2)}</div><div><p class="lede" style="margin:0"><b>Composite GPA.</b> ${verdict(g.gpa)}</p>
          <p class="small muted" style="margin:0">${d.t.name} · ${d.r.name} · ${d.rel.name} · ${d.ro.name}</p></div></div>
      </section>
      <section class="panel"><h3>Scorecard</h3><div class="grades">${tiles}</div>
        <div class="stats">
          <div class="stat"><div class="label">5-year profit / loss</div><div class="value">${money(g.net5)}</div></div>
          <div class="stat"><div class="label">Business value (est.)</div><div class="value">${money(g.terminal)}</div></div>
          <div class="stat"><div class="label">Reach</div><div class="value">${run.reach.toFixed(1)}M</div><div class="small muted">${d.t.reachLabel.replace(/^M /, '')}</div></div>
          <div class="stat"><div class="label">Crises faced</div><div class="value">${run.incidents}</div></div>
          <div class="stat"><div class="label">Review delay</div><div class="value">${d.regDelay} mo</div></div>
          <div class="stat"><div class="label">Fines</div><div class="value">${money(d.fine)}</div></div>
        </div>
      </section>
      <section class="panel sky"><h3>Where to look first</h3>${weakest.map((x) => `<p><b>${DIMS[x.id][0]} (${x.letter}).</b> ${TIPS[x.id]}</p>`).join('')}</section>
      <section class="panel" id="ref"><h3>Reference path</h3><p class="muted">Testing every Phase I combination for ${d.t.name}…</p></section>
      <section class="panel"><h3>Your pivotal moments</h3><ol class="moments">${moments}</ol></section>
      <section class="panel"><h3>Real-world parallels</h3><div class="lessons">${lessons}</div></section>
      <section class="panel">
        <h3>Discussion questions</h3>
        <ol class="moments">
          <li>Which single Phase I decision shaped your outcome most? Would you make it again?</li>
          <li>Who did your design leave out of the decision — and how did that show up later?</li>
          <li>When was the moment you could still have changed course cheaply? Did you notice it at the time?</li>
          <li>Pick a real emerging technology in the news this month. Which of these six dimensions is its developer neglecting?</li>
        </ol>
      </section>
      <section class="panel">
        <h3>Certificate & results</h3>
        <div class="actions">
          <input type="text" id="player" placeholder="Your name" value="${esc(state.player)}" aria-label="Your name for the certificate" maxlength="48" />
          <button class="btn blue" data-action="download-cert" type="button">Download certificate</button>
          <button class="btn ghost" data-action="export" type="button">Export results (.txt)</button>
          <button class="btn red" data-action="reset" type="button">Play again</button>
        </div>
      </section>`;
  }

  function fillReference() {
    const el = document.getElementById('ref');
    if (!el) return;
    const tech = state.design.tech;
    const ref = refCache[tech] || (refCache[tech] = E.referencePath(tech));
    const { d, g } = results();
    const rd = ref.design;
    const names = (ids) => (ids.length ? ids.map((id) => D.SAFEGUARDS[id].name).join(', ') : 'None');
    const allSg = [...state.design.safeguards, ...state.pivots.retrofits];
    const rows = [
      ['Launch market', d.r.name, D.REGIONS[rd.region].name],
      ['Release model', d.rel.name, D.RELEASE[rd.release].name],
      ['Rollout speed', d.ro.name, D.ROLLOUT[rd.rollout].name],
      ['Safeguards', names(allSg), names(rd.safeguards)],
      ['Access fund', money(state.design.community), money(rd.community)],
      ['Grades', g.dims.map((x) => x.letter).join(' · '), ref.grades.dims.map((x) => x.letter).join(' · ')],
      ['GPA', g.gpa.toFixed(2), ref.grades.gpa.toFixed(2)],
    ];
    el.innerHTML = `<h3>Reference path</h3>
      <p class="small">We ran every Phase I combination for ${d.t.name} (${(Object.keys(D.REGIONS).length * 3 * 3 * 256 * 4).toLocaleString()} designs) through the model with average luck and no pivots. This is the best-balanced design it found. It's a benchmark, not the "right answer": notice that even the best design leaves some grades below A.</p>
      <div class="table-wrap"><table class="compare"><thead><tr><th></th><th>Your path</th><th>Reference</th></tr></thead><tbody>
      ${rows.map(([k, a, b]) => `<tr><th scope="row">${k}</th><td class="${a !== b ? 'diff' : ''}">${a}</td><td>${b}</td></tr>`).join('')}
      </tbody></table></div>`;
  }

  // ---------- sidebar ----------

  function renderSidebar() {
    const dz = state.design;
    const t = D.TECHS[dz.tech];
    if (state.phase === 0) {
      side.innerHTML = `<div class="panel tight"><div class="side-title">Telemetry</div><p class="small muted">Your capital, timeline, risk profile and stakeholder mood will appear here as you make decisions.</p></div>`;
      return;
    }
    let html = '';
    const d = state.phase >= 3 ? residualNow() : E.derive(dz, state.pivots);

    if (state.phase <= 2) {
      const capex = E.capexOf(dz, state.pivots);
      const over = capex - D.BUDGET;
      html += `<div class="panel tight"><div class="side-title">Telemetry <span class="small mono muted">· projected</span></div>
        ${metric('Capital committed', `${money(capex)} / ${money(D.BUDGET)}`, bar(capex, D.BUDGET, over > 0 ? 'bad' : capex > D.BUDGET * 0.85 ? 'mid' : 'good') + (over > 0 ? `<span class="note warn">Over budget by ${money(over)} — the board will dilute you (Financial penalty).</span>` : ''))}
        ${d ? metric('Time to launch', `${d.baseDelay + (state.phase === 2 ? d.regDelay : 0)} mo`, state.phase === 1 ? '<span class="note">Plus regulatory review, revealed in Phase II.</span>' : '<span class="note">Includes projected review delay.</span>') : ''}
        ${d ? metric('Harm potential', `${d.harm}/100`, bar(d.harm, 100, d.harm < 30 ? 'good' : d.harm < 50 ? 'mid' : 'bad')) : ''}
        ${d ? metric('Review pressure', E.pressureLabel(d.pressure)) : ''}
        ${d ? metric('Revenue at scale', `${money(d.annualRev * d.potential)}/yr`) : ''}
        ${d ? metric('Starting trust', Math.round(d.trustStart), bar(d.trustStart, 100, tone(d.trustStart))) : ''}
        ${d ? metric('Regulator confidence', Math.round(d.regulatorStart), bar(d.regulatorStart, 100, tone(d.regulatorStart))) : ''}
        ${d ? metric('Equity index', Math.round(d.equityStart), bar(d.equityStart, 100, tone(d.equityStart))) : ''}
        ${!d ? '<p class="small muted">Complete steps 1–4 to see full projections.</p>' : ''}
      </div>`;
    } else {
      const run = state.run;
      html += `<div class="panel tight"><div class="side-title">Telemetry <span class="small mono muted">· year ${run.year}</span></div>
        ${metric('Cash on hand', money(run.cash), run.cash < 0 ? '<span class="note warn">Negative: you are borrowing against the company.</span>' : '')}
        ${metric('Reach', `${run.reach.toFixed(1)}${t.reachLabel}`)}
        ${metric('Public trust', Math.round(run.trust), bar(run.trust, 100, tone(run.trust)))}
        ${metric('Regulator confidence', Math.round(run.regulator), bar(run.regulator, 100, tone(run.regulator)))}
        ${metric('Equity index', Math.round(run.equity), bar(run.equity, 100, tone(run.equity)))}
        ${metric('Safety record', Math.round(100 - run.harm), bar(100 - run.harm, 100, tone(100 - run.harm, 80, 60)))}
        ${metric('Crises faced', run.incidents)}
      </div>`;
    }

    if (t) {
      const inherent = d ? d.inherent : t.concerns;
      html += `<div class="panel tight"><div class="side-title">Risk profile</div>
        ${D.CONCERNS.map((c) => {
          const inh = inherent[c.id];
          const res = d ? d.residual[c.id] : inh;
          const cls = res < 0.3 ? 'good' : res < 0.55 ? 'mid' : 'bad';
          return `<div class="risk-row" title="${c.hint}"><span class="name">${c.label}</span>
            <div class="bar ${cls}"><span class="ghost" style="width:${inh * 100}%"></span><span style="width:${res * 100}%"></span></div>
            <span class="num">${pct(res)}</span></div>`;
        }).join('')}
        <div class="legend"><span><i style="background:var(--green)"></i>Residual risk</span><span><i style="background:#f5a3aa"></i>Removed by your choices</span></div>
      </div>`;
    }

    if (state.phase >= 2 && d) {
      html += `<div class="panel tight"><div class="side-title">Stakeholders</div>
        ${stakeholders(d, state.phase >= 3 ? state.run : null).map((s) => `
          <div class="stake"><div class="avatar ${s.mood}">${s.initials}</div><div><div class="who">${s.name} <span>· ${s.role}</span></div><div class="said">${s.line}</div></div></div>`).join('')}
      </div>`;
    }
    side.innerHTML = html;
  }

  function renderTracker() {
    tracker.innerHTML = PHASES.map(([code, name], i) => {
      const cls = i < state.phase ? 'done' : i === state.phase ? 'now' : '';
      return `<span class="step ${cls}" ${i === state.phase ? 'aria-current="step"' : ''}>${code} ${name}</span>`;
    }).join('');
  }

  function render() {
    renderTracker();
    main.innerHTML = [viewBrief, viewDesign, viewOversight, viewRollout, viewDebrief][state.phase]();
    renderSidebar();
    if (state.phase === 4) setTimeout(fillReference, 50);
  }

  function goPhase(p) {
    state.phase = p;
    save();
    render();
    window.scrollTo({ top: 0 });
    main.focus({ preventScroll: true });
  }

  // ---------- modals ----------

  function openModal(html) {
    modalBody.innerHTML = html;
    if (!modal.open) modal.showModal();
  }
  function closeModal() {
    if (modal.open) modal.close();
  }

  function lockModal() {
    const dz = state.design;
    const items = [['tech', 'Technology'], ['region', 'Launch market'], ['release', 'Release model'], ['rollout', 'Rollout speed']];
    const done = E.isComplete(dz);
    const capex = E.capexOf(dz);
    const warnings = [];
    if (capex > D.BUDGET) warnings.push(`You're <b>${money(capex - D.BUDGET)}</b> over the board's budget. They'll cover it by diluting your stake — a Financial penalty.`);
    if (!dz.safeguards.length) warnings.push('No safeguards selected. Bold. Retrofitting later costs 1.5×.');
    if (dz.community === 0) warnings.push('No access & community fund. Equity and consent will start low.');
    openModal(`
      <h3>Lock in your design?</h3>
      <ul class="checklist">${items.map(([k, label]) => `<li><span class="${dz[k] ? 'ok' : 'no'}">${dz[k] ? '✓' : '✕'}</span>${label}${dz[k] ? `: <b>${({ tech: D.TECHS, region: D.REGIONS, release: D.RELEASE, rollout: D.ROLLOUT })[k][dz[k]].name}</b>` : ' — <span class="warn">required</span>'}</li>`).join('')}
        <li><span class="ok">✓</span>Safeguards: <b>${dz.safeguards.length}</b> · Access fund: <b>${money(dz.community)}</b> · Capital: <b>${money(capex)}</b></li></ul>
      ${warnings.map((w) => `<p class="small">⚠ ${w}</p>`).join('')}
      <p class="small muted">Technology, market, release model and rollout speed cannot be changed after this point.</p>
      <div class="actions"><button class="btn ghost small" data-action="close-modal" type="button">Keep editing</button>
        <button class="btn red" data-action="confirm-lock" type="button" ${done ? '' : 'disabled'}>Lock it in</button></div>`);
  }

  function reviewModal() {
    const d = E.derive(state.design, state.pivots);
    const clean = d.regDelay <= 3 && d.fine === 0;
    openModal(`
      <h3>Regulatory decision · ${d.r.name}</h3>
      <div class="stamp ${clean ? '' : 'cond'}">${clean ? 'APPROVED' : 'APPROVED WITH CONDITIONS'}</div>
      <ul class="checklist">
        <li><span class="${d.regDelay <= 3 ? 'ok' : 'no'}">${d.regDelay <= 3 ? '✓' : '!'}</span>Review delay: <b>${d.regDelay} months</b></li>
        <li><span class="${d.fine === 0 ? 'ok' : 'no'}">${d.fine === 0 ? '✓' : '!'}</span>Compliance fine: <b>${money(d.fine)}</b></li>
        <li><span class="ok">✓</span>Total time to launch: <b>${d.baseDelay + d.regDelay} months</b></li>
        <li><span class="${d.overBudget ? 'no' : 'ok'}">${d.overBudget ? '!' : '✓'}</span>Capital committed: <b>${money(d.capex)}</b>${d.overBudget ? ` (${money(d.overBudget)} over budget)` : ''}</li>
      </ul>
      <p class="small muted">Pivots are now final. Five years of operations begin.</p>
      <div class="actions"><button class="btn ghost small" data-action="close-modal" type="button">Reconsider pivots</button>
        <button class="btn red" data-action="begin-ops" type="button">Begin operations →</button></div>`);
  }

  // ---------- certificate & export ----------

  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function downloadCertificate() {
    try {
      await document.fonts.load('80px Bangers');
    } catch {
      /* fall back to Impact */
    }
    const { d, g } = results();
    const W = 1600;
    const H = 1000;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d');
    const display = (px) => `${px}px Bangers, Impact, sans-serif`;

    x.fillStyle = '#fff8e7';
    x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(21,17,14,0.07)';
    for (let i = 0; i < W; i += 16) for (let j = 0; j < H; j += 16) { x.beginPath(); x.arc(i, j, 2, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = '#e63946';
    x.fillRect(0, 0, W, 190);
    x.lineWidth = 16;
    x.strokeStyle = '#15110e';
    x.strokeRect(8, 8, W - 16, H - 16);
    x.lineWidth = 6;
    x.beginPath(); x.moveTo(0, 190); x.lineTo(W, 190); x.stroke();

    x.textAlign = 'center';
    x.font = display(140);
    x.lineJoin = 'round';
    x.lineWidth = 10;
    x.strokeText('THRESHOLD', W / 2 + 6, 150 + 6);
    x.fillStyle = '#ffd60a';
    x.fillText('THRESHOLD', W / 2, 150);
    x.strokeText('THRESHOLD', W / 2, 150);
    x.fillText('THRESHOLD', W / 2, 150);

    x.fillStyle = '#15110e';
    x.font = 'bold 34px "Space Mono", Menlo, monospace';
    x.fillText('CERTIFICATE OF COMPLETION', W / 2, 270);
    x.font = display(110);
    x.fillText(state.player.trim() || 'Chief Technology Officer', W / 2, 400);
    x.font = '30px Inter, system-ui, sans-serif';
    x.fillText('completed THRESHOLD: An Emerging Tech Decision Simulation', W / 2, 465);
    x.fillText(`as CTO of Helix Forge Industries, launching ${d.t.name} in ${d.r.name}`, W / 2, 510);

    const tw = 220;
    const gap = 20;
    const startX = (W - (tw * 6 + gap * 5)) / 2;
    g.dims.forEach((dim, i) => {
      const bx = startX + i * (tw + gap);
      const by = 570;
      x.fillStyle = '#15110e';
      x.fillRect(bx + 6, by + 6, tw, 200);
      x.fillStyle = { A: '#c9f2e3', B: '#dbeafe', C: '#fde68a' }[dim.letter[0]] || '#ffc2c7';
      x.fillRect(bx, by, tw, 200);
      x.lineWidth = 4;
      x.strokeRect(bx, by, tw, 200);
      x.fillStyle = '#15110e';
      x.font = display(96);
      x.fillText(dim.letter, bx + tw / 2, by + 110);
      x.font = display(24);
      x.fillText(DIMS[dim.id][0].toUpperCase(), bx + tw / 2, by + 165);
    });

    x.font = display(64);
    x.fillStyle = '#e63946';
    x.fillText(`GPA ${g.gpa.toFixed(2)}`, W / 2, 870);
    x.fillStyle = '#5f574d';
    x.font = '24px "Space Mono", Menlo, monospace';
    x.fillText(new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), W / 2, 930);

    c.toBlob((b) => download(b, 'threshold-certificate.png'), 'image/png');
  }

  function exportResults() {
    const { d, g } = results();
    const run = state.run;
    const lines = [
      'THRESHOLD — An Emerging Tech Decision Simulation',
      `Player: ${state.player.trim() || '(unnamed)'}`,
      `Date: ${new Date().toISOString().slice(0, 10)}`,
      '',
      'DESIGN',
      `  Technology:   ${d.t.name}`,
      `  Market:       ${d.r.name}`,
      `  Release:      ${d.rel.name}`,
      `  Rollout:      ${d.ro.name}`,
      `  Safeguards:   ${state.design.safeguards.map((id) => D.SAFEGUARDS[id].name).join(', ') || 'None'}`,
      `  Retrofits:    ${state.pivots.retrofits.map((id) => D.SAFEGUARDS[id].name).join(', ') || 'None'}`,
      `  Pivots:       ${state.pivots.chosen.map((id) => D.PIVOTS[id].name).join(', ') || 'None'}`,
      `  Access fund:  ${money(state.design.community)}`,
      `  Capital:      ${money(d.capex)}   Review delay: ${d.regDelay} mo   Fine: ${money(d.fine)}`,
      '',
      'OPERATIONS',
      ...run.ledger.map((r) => `  Y${r.year}  ${r.event} → ${r.choice}\n       revenue ${money(r.revenue)} · cash ${money(r.cash)} · trust ${Math.round(r.trust)} · regulators ${Math.round(r.regulator)} · equity ${Math.round(r.equity)}`),
      '',
      'SCORECARD',
      ...g.dims.map((x) => `  ${DIMS[x.id][0].padEnd(22)} ${x.letter.padEnd(3)} (${x.score}/100)`),
      `  ${'Composite GPA'.padEnd(22)} ${g.gpa.toFixed(2)}`,
      '',
      `5-year profit/loss ${money(g.net5)} · Business value ${money(g.terminal)} · Reach ${run.reach.toFixed(1)}${d.t.reachLabel}`,
    ];
    download(new Blob([lines.join('\n')], { type: 'text/plain' }), 'threshold-results.txt');
  }

  // ---------- actions ----------

  const toggle = (arr, id) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const actions = {
    start: () => goPhase(1),
    pick: (el) => {
      if (state.phase !== 1) return;
      state.design[el.dataset.group] = el.dataset.id;
    },
    'toggle-sg': (el) => {
      if (state.phase !== 1) return;
      state.design.safeguards = toggle(state.design.safeguards, el.dataset.id);
    },
    lock: () => lockModal(),
    'confirm-lock': () => {
      if (!E.isComplete(state.design)) return;
      closeModal();
      goPhase(2);
    },
    'close-modal': () => closeModal(),
    'toggle-pivot': (el) => {
      state.pivots.chosen = toggle(state.pivots.chosen, el.dataset.id);
    },
    'toggle-retro': (el) => {
      state.pivots.retrofits = toggle(state.pivots.retrofits, el.dataset.id);
    },
    'submit-review': () => reviewModal(),
    'begin-ops': () => {
      closeModal();
      state.run = E.startRun(state);
      E.beginYear(state);
      goPhase(3);
    },
    choose: (el) => {
      const run = state.run;
      if (run.current.resolved) return;
      const before = { cash: run.cash, trust: run.trust, regulator: run.regulator, equity: run.equity, harm: run.harm };
      E.resolveEvent(state, Number(el.dataset.idx));
      if (!run.current.resolved) return;
      run.current.deltas = Object.fromEntries(Object.keys(before).map((k) => [k, run[k] - before[k]]));
    },
    'next-year': () => {
      E.beginYear(state);
      save();
      render();
      document.getElementById('event')?.scrollIntoView({ block: 'start' });
      return true;
    },
    'to-debrief': () => goPhase(4),
    reset: () => openModal(`<h3>Start over?</h3><p>This clears your current run. There's no undo.</p>
      <div class="actions"><button class="btn ghost small" data-action="close-modal" type="button">Cancel</button>
      <button class="btn red" data-action="confirm-reset" type="button">Start over</button></div>`),
    'confirm-reset': () => {
      closeModal();
      state = fresh();
      goPhase(0);
    },
    'download-cert': () => downloadCertificate(),
    export: () => exportResults(),
  };

  // Actions that only open dialogs or download files don't need a re-render.
  const NO_RENDER = new Set(['lock', 'submit-review', 'close-modal', 'reset', 'download-cert', 'export', 'start', 'confirm-lock', 'begin-ops', 'to-debrief', 'confirm-reset']);

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const name = el.dataset.action;
    if (!actions[name]) return;
    const handled = actions[name](el);
    if (NO_RENDER.has(name) || handled) return;
    save();
    const y = window.scrollY;
    render();
    window.scrollTo({ top: y });
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'community' && state.phase === 1) {
      state.design.community = Number(e.target.value);
      document.getElementById('community-val').textContent = money(state.design.community);
      renderSidebar();
      save();
    } else if (e.target.id === 'player') {
      state.player = e.target.value;
      save();
    }
  });

  render();
})();
