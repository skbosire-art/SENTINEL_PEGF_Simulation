// Usage: node tools/calibrate.js — loads the browser scripts in a VM and prints model outputs.
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = { window: {} }; ctx.TH = undefined; vm.createContext(ctx);
for (const f of ['data.js', 'engine.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8').replace(/window\.TH = window\.TH \|\| \{\};/, 'var TH = window.TH = {};'), ctx);
const { engine: E, data: D } = ctx.window.TH;
const row = (label, design) => {
  const { run, d, grades: g } = E.simulateExpected(design);
  console.log(label.padEnd(34), 'harm', String(d.harm).padStart(3), 'capex', Math.round(d.capex), 'delay', d.baseDelay + '+' + d.regDelay, 'fine', d.fine,
    '| ' + g.dims.map(x => x.id.slice(0, 4) + ':' + x.score + x.letter).join(' '), '| GPA', g.gpa.toFixed(2), 'ROI', g.roi.toFixed(2));
};
const all = Object.keys(D.SAFEGUARDS);
for (const tech of Object.keys(D.TECHS)) {
  console.log('\n==', tech);
  row('meridian/closed/moonshot/none', { tech, region: 'meridian', release: 'closed', rollout: 'moonshot', safeguards: [], community: 0 });
  row('global/open/moonshot/none', { tech, region: 'global', release: 'open', rollout: 'moonshot', safeguards: [], community: 0 });
  row('novara/licensed/staged/none', { tech, region: 'novara', release: 'licensed', rollout: 'staged', safeguards: [], community: 0 });
  row('novara/licensed/staged/all+300', { tech, region: 'novara', release: 'licensed', rollout: 'staged', safeguards: all, community: 300 });
  row('meridian/licensed/staged/ks,rt,sec,eb', { tech, region: 'meridian', release: 'licensed', rollout: 'staged', safeguards: ['killswitch','redteam','security','ethicsboard'], community: 100 });
  if (process.argv[2] === 'ref') { const t0 = Date.now(); const ref = E.referencePath(tech); console.log('REF', JSON.stringify(ref.design), ref.grades.dims.map(x => x.letter).join(' '), ref.grades.gpa.toFixed(2), (Date.now() - t0) + 'ms'); }
}
