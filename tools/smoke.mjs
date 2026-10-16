// Usage: node tools/smoke.mjs — plays one full game in headless Chrome via CDP, saving screenshots to /tmp/threshold-shots.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT = '/tmp/threshold-shots';
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true });
const url = 'file://' + resolve(import.meta.dirname, '..', 'index.html');
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--remote-debugging-port=9333', '--user-data-dir=/tmp/thr-chrome', '--window-size=1440,1000', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) { await sleep(200); try { target = (await (await fetch('http://127.0.0.1:9333/json')).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const errors = [];
ws.addEventListener('message', (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(expr + ' → ' + r.result.exceptionDetails.exception?.description); return r.result.result.value; };
const click = (sel) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('missing ${sel.replace(/'/g, '')}'); el.click(); return true; })()`);
let n = 0;
const shot = async (name, full = true) => {
  await sleep(250);
  const { result: m } = await send('Page.getLayoutMetrics');
  const h = full ? Math.min(m.cssContentSize.height, 7000) : 1000;
  const { result } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full, clip: { x: 0, y: full ? 0 : m.cssVisualViewport.pageY, width: 1440, height: h, scale: full ? 0.6 : 0.8 } });
  writeFileSync(`${OUT}/${String(++n).padStart(2, '0')}-${name}.png`, Buffer.from(result.data, 'base64'));
};

await send('Runtime.enable'); await send('Page.enable');
await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: OUT });
await send('Page.navigate', { url }); await sleep(1500);
await ev('localStorage.clear(); location.reload(); true'); await sleep(1500);
await shot('brief');
await click('[data-action=start]');
for (const [g, v] of [['tech', 'sentinel'], ['region', 'novara'], ['release', 'licensed'], ['rollout', 'staged']]) await click(`[data-group=${g}][data-id=${v}]`);
for (const s of ['killswitch', 'redteam', 'privacy']) await click(`[data-action=toggle-sg][data-id=${s}]`);
await ev(`(() => { const el = document.getElementById('community'); el.value = 100; el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
await shot('design');
await click('[data-action=lock]'); await shot('lock-modal', false);
await click('[data-action=confirm-lock]');
await click('[data-action=toggle-pivot][data-id=league]');
await click('[data-action=toggle-retro][data-id=security]');
await shot('oversight');
await click('[data-action=submit-review]'); await shot('review-modal', false);
await click('[data-action=begin-ops]');
for (let y = 1; y <= 5; y++) {
  if (y === 1) await shot('year1');
  await click('.option:not([disabled])');
  if (y === 1) await shot('year1-resolved');
  await click(y < 5 ? '[data-action=next-year]' : '[data-action=to-debrief]');
}
await sleep(3500);
await ev(`(() => { const el = document.getElementById('player'); el.value = 'Test Player'; el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
await shot('debrief');
await click('[data-action=download-cert]'); await click('[data-action=export]'); await sleep(2000);
const phase = await ev('JSON.parse(localStorage.getItem("threshold-sim-v1")).phase');
console.log('final phase', phase, '| files:', readdirSync(OUT).join(', '));
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'No JS errors');
ws.close(); chrome.kill();
