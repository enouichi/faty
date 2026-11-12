const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'));
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const server = http.createServer((q, r) => {
  const u = (q.url || '/').split('?')[0], ext = path.extname(u).toLowerCase();
  if (MIME[ext]) {
    return fs.readFile(path.join(__dirname, 'public', path.basename(u)), (e, d) => {
      if (e) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'Content-Type': MIME[ext], 'Cache-Control': 'public, max-age=3600' }); r.end(d);
    });
  }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  r.end(html);
});
const wss = new WebSocketServer({ server });
const rooms = {};
const NAMES = ['Omar', 'Faty'];
const CROPS = { wheat: [3, 0, 12], corn: [8, 0, 20], tomato: [6, 0, 17], potato: [5, 0, 15] };
// الحيوانات: [السعر, المنتج, ثواني الإنتاج, العلف]
const ANI = {
  chicken: [60, 'egg', 10, 1], duck: [90, 'duckegg', 12, 1], goose: [140, 'feather', 16, 1.2], turkey: [160, 'turkeyegg', 18, 1.2],
  rabbit: [110, 'angora', 14, 0.8], pig: [300, 'truffle', 30, 2], sheep: [260, 'wool', 24, 1], goat: [180, 'cheese', 16, 1.5],
  cow: [420, 'milk', 20, 2], horse_w: [900, null, 0, 0], horse_b: [900, null, 0, 0], donkey: [450, 'dmilk', 30, 1.5],
  camel: [1200, 'cmilk', 26, 2.5], llama: [600, 'alpaca', 28, 1.5]
};
const RIDE = { horse_w: 1, horse_b: 1, donkey: 1, camel: 1, bike: 1 };
const MENU = [12, 8, 10, 20, 18];
const riding = (s, role) => s.animals.some(a => a.rider === role || a.rider2 === role) || s.bikes.some(b => b.rider === role) || s.truck.driver === role || s.truck.pass === role;
const ENC = {
  chicken: [16, 16], duck: [30, 16], goose: [44, 16], turkey: [58, 16], rabbit: [16, 30], pig: [30, 30], sheep: [44, 30], goat: [58, 30],
  cow: [16, 44], llama: [30, 44], camel: [44, 44], donkey: [58, 44], horse_w: [30, 58], horse_b: [30, 58]
};
const BASE = {
  wheat: 10, corn: 30, tomato: 22, potato: 16, egg: 4, duckegg: 6, feather: 9, turkeyegg: 8, angora: 13, truffle: 38, wool: 14, cheese: 12,
  milk: 18, dmilk: 24, cmilk: 32, alpaca: 22, honey: 20, fish: 18, wood: 6, butter: 75, yogurt: 55, bcheese: 110, bread: 42, cake: 95, cream: 42, icecream: 70, ghee: 170, meat: 28, hide: 40, ivory: 160, horn: 220
};
const WILD = { lion: [3, { meat: 4, hide: 2 }], elephant: [6, { meat: 10, ivory: 2 }], giraffe: [4, { meat: 6, hide: 2 }], rhino: [5, { meat: 8, horn: 1 }], hippo: [5, { meat: 8, hide: 2 }], zebra: [2, { meat: 3, hide: 1 }], bear: [4, { meat: 5, hide: 2 }] };
const WILDLIST = ['lion', 'lion', 'lion', 'elephant', 'elephant', 'giraffe', 'giraffe', 'giraffe', 'rhino', 'rhino', 'hippo', 'hippo', 'zebra', 'zebra', 'zebra', 'bear', 'bear'];
const NGOODS = [['wheat', 'corn', 'tomato', 'potato', 'egg', 'milk'], ['wool', 'honey', 'cheese', 'fish', 'butter', 'bread']];
const RECIPES = { butter: { milk: 3 }, yogurt: { milk: 2 }, bcheese: { milk: 4 }, bread: { wheat: 3 }, cake: { egg: 2, wheat: 1, milk: 1 },
  cream: { milk: 2 }, icecream: { milk: 3, egg: 1 }, ghee: { butter: 2 } };
const MACH = { dairy: ['butter', 'yogurt', 'bcheese', 'cream', 'icecream', 'ghee'], bakery: ['bread', 'cake'] };
const PORT = [112, 82], REQITEMS = ['wheat', 'corn', 'tomato', 'egg', 'milk', 'wool', 'honey', 'fish', 'butter', 'bread'];
const portDocked = t => { const ph = t % 180; return ph >= 30 && ph < 120; };
const FLOW = { rose: 10, tulip: 8, sunflower: 7, daisy: 5, lavender: 9, lily: 12, orchid: 25, poppy: 6, marigold: 5, jasmine: 11, carnation: 8, iris: 10, hibiscus: 12,
  apple: 60, orange: 60, olive: 55, cypress: 40, palm: 80, cherry: 90, lemon: 60 };
const HOUSE = [[300, 20], [500, 40], [800, 30]];
const PRICE = [2500, 3500];
const PLOTS = 156, NTREES = 28, LAND = 144, START_LAND = 48;
const TREEPOS = [[-30,-30],[-20,-34],[-12,-40],[14,-38],[26,-36],[60,-24],[66,-14],[68,-30],[-44,-6],[-46,-18],[-44,8],[63,-8],[74,30],[74,44],[78,56],[4,70],[18,74],[36,74],[54,72],[8,84],[2,96],[10,100],[-46,46],[-46,30],[-6,-32],[40,-40],[-52,-34],[4,112]];
const WROLES = ['farmer', 'herder', 'buyer', 'woodcutter'];
const WNAMES = ['سعيد','خالد','ماهر','نبيل','وليد','حسن','رامي','طارق','جميل','فهد','سامر','بلال','ياسر','زياد','عادل','مراد','أنس','هاني','كمال','مروان'];
const CROPK = ['wheat', 'corn', 'tomato', 'potato'];
const PRODK = ['feather', 'turkeyegg', 'duckegg', 'angora', 'truffle', 'wool', 'cheese', 'dmilk', 'cmilk', 'alpaca'];
const plotXY = i => i < 144 ? [-36 + (i % 6) * 5.6, 6 + Math.floor(i / 6) * 5.6] : i < 150 ? [75 + ((i - 144) % 3) * 4.4, -11 + Math.floor((i - 144) / 3) * 4.4] : [-108 + ((i - 150) % 3) * 4.4, 26 + Math.floor((i - 150) / 3) * 4.4];
const landOwned = s => s.lo.filter(Boolean).length;
const landCost = s => 100 + 10 * (landOwned(s) - START_LAND);
const maxWorkers = s => Infinity;
const hireCost = s => 150 + 30 * Math.max(0, s.workers.length - 10);
const rnd = (a, b) => a + Math.random() * (b - a);
const send = (w, o) => w && w.readyState === 1 && w.send(JSON.stringify(o));
const all = (r, o) => r.p.forEach(w => send(w, o));
const avail = (s, i) => i < LAND ? !!s.lo[i] : i < 150 ? !!s.own[0] : !!s.own[1];
const capOf = (s, k) => 6 + 6 * (s.up[k] || 0) + 4 * (s.own[0] + s.own[1]);
const newState = (w) => {
  const stock = {}, mult = {}, inv = {}, up = {};
  for (const k in BASE) { stock[k] = 0; mult[k] = 1; }
  for (const k in FLOW) inv[k] = 0;
  for (const k in ANI) up[k] = 0;
  return {
    money: 400, feed: 40, time: 20, hives: 0, rain: false, stock, mult, inv, up, house: 0,
    plots: Array.from({ length: PLOTS }, () => ({ c: '', p: 0, w: 0 })),
    garden: Array(100).fill(''), trees: Array(NTREES).fill(3), animals: [], enemies: [],
    rel: [0, 0], own: [0, 0], lo: Array.from({ length: LAND }, (_, i) => i < START_LAND ? 1 : 0),
    bikes: [{ id: 1001, k: 'bike', x: 5, z: 3.4, rider: null }, { id: 1002, k: 'bike', x: 6.8, z: 3.4, rider: null }], kids: [1, 2, 3].map(id => ({ id, follow: null, school: 0 })), kdays: 0, ord: { n: 0, i: 0, role: 0, c: 0 },
    out: [0, 0], wd: [[1, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0]], auto: { dairy: '', bakery: '' }, req: null,
    truck: { x: 12, z: -1, ry: 0, driver: null, pass: null, cargo: {} },
    wild: WILDLIST.map((k, i) => ({ id: i, k, hp: WILD[k][0], res: 0 })),
    workers: Array.from({ length: w === undefined ? 10 : w }, (_, i) => ({ id: i + 1, role: 'farmer', x: -2 + i * 1.2, z: 1, tx: -2 + i * 1.2, tz: 1, act: '', v: 0, i: -1, busy: 0.5 + i * 0.4 })),
    msg: 'مرحبًا! عندكما 10 عمال يعملون وحدهم، ويمكنكما شراء أي أرض بالنقر عليها.'
  };
};
function loadSave(d) {
  const b = newState(0), num = (v, def, lo, hi) => Number.isFinite(+v) ? Math.min(hi, Math.max(lo, +v)) : def;
  if (!d || typeof d !== 'object') return b;
  b.money = num(d.money, b.money, 0, 1e9); b.feed = num(d.feed, b.feed, 0, 80); b.time = num(d.time, b.time, 0, 1e9);
  b.hives = num(d.hives, 0, 0, 3) | 0; b.house = num(d.house, 0, 0, 3) | 0;
  for (const k in BASE) b.stock[k] = num(d.stock && d.stock[k], 0, 0, 1e6) | 0;
  for (const k in FLOW) b.inv[k] = num(d.inv && d.inv[k], 0, 0, 1e5) | 0;
  for (const k in ANI) b.up[k] = num(d.up && d.up[k], 0, 0, 3) | 0;
  for (let i = 0; i < PLOTS; i++) { const p = d.plots && d.plots[i]; if (p && (p.c === '' || CROPS[p.c])) b.plots[i] = { c: p.c, p: num(p.p, 0, 0, 100), w: p.w ? 1 : 0 }; }
  for (let i = 0; i < 100; i++) { const g = d.garden && d.garden[i]; b.garden[i] = FLOW[g] ? g : ''; }
  for (let i = 0; i < NTREES; i++) b.trees[i] = num(d.trees && d.trees[i], 3, 0, 3) | 0;
  if (Array.isArray(d.lo)) for (let i = 0; i < LAND; i++) b.lo[i] = d.lo[i] ? 1 : 0;
  b.rel = [num(d.rel && d.rel[0], 0, 0, 100), num(d.rel && d.rel[1], 0, 0, 100)]; b.own = [d.own && d.own[0] ? 1 : 0, d.own && d.own[1] ? 1 : 0];
  b.animals = (Array.isArray(d.animals) ? d.animals : []).slice(0, 200).filter(a => a && ANI[a.k]).map((a, i) => ({ id: i + 1, k: a.k, x: num(a.x, ENC[a.k][0], -300, 300), z: num(a.z, ENC[a.k][1], -300, 300), t: 0, rider: null, rider2: null }));
  if (d.kdays) b.kdays = num(d.kdays, 0, 0, 1e6) | 0;
  b.workers = (Array.isArray(d.workers) ? d.workers : []).slice(0, 20).filter(w => w && WROLES.includes(w.role)).map((w, i) => ({ id: i + 1, role: w.role, x: 0, z: 1, tx: 0, tz: 1, act: '', v: 0, i: -1, busy: 0.5 + i * 0.3 }));
  if (d.wd) for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) b.wd[r][i] = d.wd[r] && d.wd[r][i] ? 1 : 0;
  if (d.out) b.out = [num(d.out[0], 0, 0, 5) | 0, num(d.out[1], 0, 0, 5) | 0];
  if (d.truck && d.truck.cargo) for (const k in BASE) b.truck.cargo[k] = num(d.truck.cargo[k], 0, 0, 1e6) | 0;
  b.msg = 'تم تحميل اللعبة المحفوظة. أكملا من حيث توقفتما!'; return b;
}
function addRel(s, n, v) {
  const old = s.rel[n]; s.rel[n] = Math.min(100, old + v);
  if (old < 30 && s.rel[n] >= 30) { s.money += 150; s.msg = 'أصبح الجار صديقًا. فتح بوابته وأهداكما 150'; }
  else if (old < 70 && s.rel[n] >= 70) s.msg = 'الجار يثق بكما الآن. يمكنكما شراء مزرعته';
}
function tick(r) {
  const s = r.s, dt = 0.1;
  s.time += dt;
  const day = Math.floor(s.time / 120);
  if (day !== r.day) { r.day = day; for (const k in BASE) s.mult[k] = +(0.8 + Math.random() * 0.5).toFixed(2); }
  s.rain = false;
  s.plots.forEach(p => { if (p.c && p.w && p.p < 100) p.p = Math.min(100, p.p + 100 / CROPS[p.c][2] * dt); });
  const hb = 1 + 0.12 * Math.min(5, s.workers.filter(w => w.role === 'herder').length);
  s.animals.forEach(a => {
    const [, prod, cy, use] = ANI[a.k];
    if (!prod) return;
    if (a.t < cy) a.t += dt * hb;
    if (a.t >= cy && s.feed >= use) { s.feed -= use; s.stock[prod]++; a.t = 0; }
  });
  const gc = s.garden.filter(Boolean).length;
  r.hv += dt * s.hives * (1 + gc * 0.03); if (r.hv >= 50) { r.hv -= 50; s.stock.honey++; }
  s.trees.forEach((h, i) => { if (h <= 0 && s.time >= r.rg[i]) s.trees[i] = 3; });
  wtick(r, dt);
  r.at = (r.at || 0) + dt;
  if (r.at >= 6) { r.at = 0; for (const m in MACH) { const rc = RECIPES[s.auto[m]]; if (rc && MACH[m].includes(s.auto[m]) && Object.keys(rc).every(k => s.stock[k] >= rc[k])) { for (const k in rc) s.stock[k] -= rc[k]; s.stock[s.auto[m]]++; } } }
  if (s.req && s.time > s.req.exp) { s.req = null; s.msg = 'غادر الجار دون جواب'; }
  s.wild.forEach(w => { if (w.hp <= 0 && s.time >= w.res) w.hp = WILD[w.k][0]; });
  s.kids.forEach(k => { if (k.school && s.time >= k.school) { k.school = 0; s.kdays++; s.msg = 'عاد الأطفال من المدرسة'; } });
  r.rq = (r.rq === undefined ? 80 : r.rq) - dt;
  if (!s.req && r.rq <= 0) { r.rq = rnd(100, 170); const ns = [0, 1].filter(n => !s.own[n]); if (ns.length) {
      const n = ns[Math.floor(Math.random() * ns.length)], ks = [...new Set(s.animals.filter(a => a.rider == null && a.rider2 == null).map(a => a.k))];
      if (ks.length && Math.random() < 0.45) { const k = ks[Math.floor(Math.random() * ks.length)], have = s.animals.filter(a => a.k === k && a.rider == null && a.rider2 == null).length, qty = 1 + Math.floor(Math.random() * Math.min(3, have)); s.req = { n, type: 'animal', item: k, qty, reward: Math.round(qty * ANI[k][0] * 1.4), exp: s.time + 75 }; s.msg = 'الجار جاء يريد شراء حيوانات'; }
      else { const item = REQITEMS[Math.floor(Math.random() * REQITEMS.length)], qty = 4 + Math.floor(Math.random() * 7); s.req = { n, type: 'item', item, qty, reward: Math.round(qty * BASE[item] * 1.6), exp: s.time + 75 }; s.msg = 'الجار جاء يطلب منكما شيئاً'; }
    } }
  if ((r.tc = (r.tc || 0) + 1) % 2 === 0) all(r, { t: 'state', s });
}
const sellKeys = (s, keys) => { let v = 0; keys.forEach(k => { v += Math.round(s.stock[k] * BASE[k] * s.mult[k]); s.stock[k] = 0; }); s.money += v; return v; };
const near = (list, w) => { let b = null, bd = 1e9; list.forEach(i => { const [x, z] = plotXY(i); const d = Math.hypot(x - w.x, z - w.z); if (d < bd) { bd = d; b = i; } }); return b; };
function setTask(r, w, act, tx, tz, work, i) {
  w.act = act; w.tx = tx; w.tz = tz; w.v++; w.i = i === undefined ? -1 : i;
  w.busy = Math.max(1.2, Math.hypot(tx - w.x, tz - w.z) * 1.35 / 5) + work;
  if (i !== undefined && i >= 0) r.lock.add((act === 'chop' ? 't' : 'p') + i);
}
function release(r, w) { if (w.i >= 0) { r.lock.delete((w.act === 'chop' ? 't' : 'p') + w.i); } w.i = -1; }
function idle(r, w) {
  const base = w.role === 'farmer' ? [-20, 25] : w.role === 'herder' ? [20, 8] : w.role === 'buyer' ? [0, 4] : [10, -4];
  setTask(r, w, 'idle', base[0] + rnd(-12, 12), base[1] + rnd(-6, 6), rnd(1, 3));
}
function assign(r, w) {
  const s = r.s, free = i => !r.lock.has('p' + i);
  if (w.role === 'farmer') {
    const cropN = CROPK.reduce((a, k) => a + s.stock[k], 0);
    if (cropN >= 12 && !s.workers.some(x => x !== w && x.act === 'sellcrops')) return setTask(r, w, 'sellcrops', 0, -3.5, 1.2);
    const ready = [], dry = [], empty = [];
    s.plots.forEach((p, i) => { if (i >= PLOTS || !avail(s, i) || !free(i)) return; if (p.c && p.p >= 100) ready.push(i); else if (p.c && !p.w) dry.push(i); else if (!p.c) empty.push(i); });
    let i = near(ready, w);
    if (i !== null && i !== undefined) { const [x, z] = plotXY(i); return setTask(r, w, 'harvest', x, z, 1.6, i); }
    i = near(dry, w);
    if (i !== null && i !== undefined) { const [x, z] = plotXY(i); return setTask(r, w, 'water', x, z, 1.2, i); }
    if (s.money >= 12) { i = near(empty, w); if (i !== null && i !== undefined) { const [x, z] = plotXY(i); return setTask(r, w, 'plant', x, z, 1.6, i); } }
    return idle(r, w);
  }
  if (w.role === 'herder') {
    if (s.feed < 40 && s.money >= 12 && !s.workers.some(x => x !== w && x.act === 'feed')) return setTask(r, w, 'feed', 7, -3.6, 1.5);
    if (PRODK.reduce((a, k) => a + s.stock[k], 0) >= 10 && !s.workers.some(x => x !== w && x.act === 'sellprod')) return setTask(r, w, 'sellprod', 0, -3.5, 1.2);
    const ks = [...new Set(s.animals.map(a => a.k))];
    if (ks.length) { const k = ks[Math.floor(Math.random() * ks.length)], [cx, cz] = ENC[k]; return setTask(r, w, 'tend', cx + rnd(-2, 2), cz - 7, rnd(4, 7)); }
    return idle(r, w);
  }
  if (w.role === 'buyer') {
    if (s.money >= landCost(s) + 250) {
      const cand = []; for (let i = 0; i < LAND; i++) if (!s.lo[i] && free(i)) cand.push(i);
      if (cand.length) { const i = cand[0], [x, z] = plotXY(i); return setTask(r, w, 'buyland', x, z, 1.5, i); }
    }
    return idle(r, w);
  }
  if (w.role === 'woodcutter') {
    const cand = []; s.trees.forEach((h, i) => { if (h > 0 && !r.lock.has('t' + i)) cand.push(i); });
    let b = null, bd = 1e9; cand.forEach(i => { const d = Math.hypot(TREEPOS[i][0] - w.x, TREEPOS[i][1] - w.z); if (d < bd) { bd = d; b = i; } });
    if (b !== null) return setTask(r, w, 'chop', TREEPOS[b][0] + 1.2, TREEPOS[b][1] + 1.2, 3, b);
    return idle(r, w);
  }
  idle(r, w);
}
function finish(r, w) {
  const s = r.s, p = w.i >= 0 ? s.plots[w.i] : null;
  w.x = w.tx; w.z = w.tz;
  if (w.act === 'plant' && p && avail(s, w.i) && !p.c) { const k = Math.random() < .45 ? 'corn' : Math.random() < .5 ? 'tomato' : Math.random() < .5 ? 'wheat' : 'potato'; const c = CROPS[k][0]; if (s.money >= c) { s.money -= c; p.c = k; p.p = 0; p.w = 1; } }
  else if (w.act === 'water' && p && p.c && !p.w) p.w = 1;
  else if (w.act === 'harvest' && p && p.c && p.p >= 100) { s.stock[p.c] += 4; p.c = ''; p.p = 0; p.w = 0; }
  else if (w.act === 'sellcrops') sellKeys(s, CROPK);
  else if (w.act === 'sellprod') sellKeys(s, PRODK);
  else if (w.act === 'feed') { for (let n = 0; n < 4 && s.money >= 12 && s.feed < 80; n++) { s.money -= 12; s.feed = Math.min(80, s.feed + 10); } }
  else if (w.act === 'buyland' && w.i >= 0 && !s.lo[w.i] && s.money >= landCost(s)) { s.money -= landCost(s); s.lo[w.i] = 1; s.msg = 'العامل ' + WNAMES[(w.id - 1) % 20] + ' اشترى قطعة أرض جديدة'; }
  else if (w.act === 'chop' && w.i >= 0 && s.trees[w.i] > 0) { s.trees[w.i] = 0; s.stock.wood += 3; r.rg[w.i] = s.time + 90; }
  release(r, w); w.act = '';
}
function wtick(r, dt) { r.s.workers.forEach(w => { if (w.busy > 0) { w.busy -= dt; if (w.busy <= 0) finish(r, w); } else assign(r, w); }); }
setInterval(() => { for (const c in rooms) if (rooms[c].p.length === 2) tick(rooms[c]); }, 100);

wss.on('connection', ws => {
  ws.on('message', d => {
    let m; try { m = JSON.parse(d); } catch { return; }
    if (m.t === 'create') {
      let c; do { c = Math.random().toString(36).slice(2, 6).toUpperCase(); } while (rooms[c]);
      rooms[c] = { p: [ws], s: m.save ? loadSave(m.save) : newState(10), lock: new Set(), idc: 0, rt: 100, rl: 0, hv: 0, day: 0, rg: Array(NTREES).fill(0), gc: [0, 0] };
      rooms[c].idc = rooms[c].s.animals.length; ws.room = c; ws.role = m.c === 1 ? 1 : 0;
      return send(ws, { t: 'joined', code: c, role: ws.role });
    }
    if (m.t === 'join') {
      const c = String(m.code || '').toUpperCase(), r = rooms[c];
      if (!r || r.p.length > 1) return send(ws, { t: 'err', msg: 'الغرفة غير موجودة أو ممتلئة' });
      ws.role = r.p[0].role === 0 ? 1 : 0; r.p.push(ws); ws.room = c;
      send(ws, { t: 'joined', code: c, role: ws.role });
      return all(r, { t: 'state', s: r.s });
    }
    const r = rooms[ws.room]; if (!r) return;
    const s = r.s, other = r.p.find(w => w !== ws);
    if (m.t === 'pos') { ws.x = +m.x || 0; ws.z = +m.z || 0; if (s.truck.driver === ws.role) { s.truck.x = ws.x; s.truck.z = ws.z; s.truck.ry = +m.ry || 0; }
      s.animals.forEach(a => { if (a.rider === ws.role) { a.x = ws.x; a.z = ws.z; } }); s.bikes.forEach(b => { if (b.rider === ws.role) { b.x = ws.x; b.z = ws.z; } });
      return send(other, { t: 'pos', x: m.x, z: m.z, ry: m.ry, sit: m.sit }); }
    if (m.t === 'chat') {
      const tx = String(m.text || '').trim().slice(0, 80);
      if (tx) all(r, { t: 'chat', role: ws.role, text: tx });
      return;
    }
    if (m.t === 'save') return send(ws, { t: 'saved', data: s });
    if (r.p.length < 2) return;
    const who = NAMES[ws.role], now = Date.now();
    if (m.t === 'plant') {
      const p = s.plots[m.i], c = CROPS[m.c];
      if (!p || !c || !avail(s, m.i) || p.c || s.money < c[0]) return;
      s.money -= c[0]; p.c = m.c; p.p = 0; p.w = s.rain ? 1 : 0; s.msg = who + ' زرع ' + m.c;
    } else if (m.t === 'water') {
      const p = s.plots[m.i]; if (!p || !avail(s, m.i) || !p.c || p.w) return;
      p.w = 1; s.msg = who + ' سقى الأرض';
    } else if (m.t === 'harvest') {
      const p = s.plots[m.i]; if (!p || !avail(s, m.i) || !p.c || p.p < 100) return;
      s.stock[p.c] += 4; s.msg = who + ' حصد المحصول'; p.c = ''; p.p = 0; p.w = 0;
    } else if (m.t === 'sell') {
      let v = 0;
      for (const k in s.stock) { if ((m.g === 'wood') !== (k === 'wood')) continue; v += Math.round(s.stock[k] * BASE[k] * s.mult[k]); s.stock[k] = 0; }
      if (!v) return; s.money += v; s.msg = 'تم البيع بمبلغ ' + v;
    } else if (m.t === 'feed') {
      if (s.money < 12 || s.feed >= 80) return;
      s.money -= 12; s.feed = Math.min(80, s.feed + 10); s.msg = 'تمت إضافة علف إلى المخزن';
    } else if (m.t === 'buyAnimal') {
      const a = ANI[m.k]; if (!a || s.money < a[0]) return;
      s.money -= a[0]; const [cx, cz] = ENC[m.k];
      s.animals.push({ id: ++r.idc, k: m.k, x: cx + rnd(-4.5, 4.5), z: cz + rnd(-4.5, 4.5), t: 0, rider: null, rider2: null });
      s.msg = who + ' اشترى حيوانًا جديدًا';
    } else if (m.t === 'enlarge') {
      const k = m.k, u = s.up[k], cost = 150 * ((u || 0) + 1);
      if (!(k in ANI) || u >= 3 || s.money < cost || s.stock.wood < 10) return;
      s.money -= cost; s.stock.wood -= 10; s.up[k]++; s.msg = 'تم توسيع مكان الحيوانات (+6)';
    } else if (m.t === 'buyLand' || m.t === 'buyRow') {
      const i = m.i | 0; if (!(i >= 0 && i < LAND)) return;
      const list = m.t === 'buyRow' ? [0, 1, 2, 3, 4, 5].map(c => Math.floor(i / 6) * 6 + c) : [i];
      let n = 0; list.forEach(j => { if (!s.lo[j] && s.money >= landCost(s)) { s.money -= landCost(s); s.lo[j] = 1; n++; } });
      if (!n) return; s.msg = who + ' اشترى ' + (n > 1 ? n + ' قطع أرض' : 'قطعة أرض');
    } else if (m.t === 'hire') {
      if (!WROLES.includes(m.r) || s.workers.length >= maxWorkers(s) || s.money < hireCost(s)) return;
      s.money -= hireCost(s); const id = s.workers.reduce((a, w) => Math.max(a, w.id), 0) + 1;
      s.workers.push({ id, role: m.r, x: rnd(-3, 3), z: 1, tx: 0, tz: 1, act: '', v: 0, busy: 0.3, i: -1 }); s.msg = 'تم توظيف عامل جديد';
    } else if (m.t === 'setRole') {
      const w = s.workers.find(x => x.id === (m.id | 0)); if (!w || !WROLES.includes(m.r) || w.role === m.r) return;
      release(r, w); w.role = m.r; w.act = ''; w.busy = 0.3; s.msg = 'تغيّرت مهمة العامل';
    } else if (m.t === 'hive') {
      if (s.hives >= 3 || s.money < 150) return;
      s.money -= 150; s.hives++; s.msg = 'تم تركيب خلية نحل';
    } else if (m.t === 'chop') {
      if (now - (ws.cc || 0) < 450 || !(s.trees[m.i] > 0)) return;
      ws.cc = now; s.trees[m.i]--;
      if (s.trees[m.i] <= 0) { s.stock.wood += 3; r.rg[m.i] = s.time + 90; s.msg = who + ' قطع شجرة'; }
    } else if (m.t === 'fish') {
      if (now - (ws.fc || 0) < 2500) return;
      ws.fc = now;
      if (Math.random() < 0.55) { s.stock.fish++; s.msg = who + ' اصطاد سمكة'; } else s.msg = 'لم يعلق شيء';
    } else if (m.t === 'craft') {
      const rc = RECIPES[m.r]; if (!rc) return;
      for (const k in rc) if (s.stock[k] < rc[k]) return;
      for (const k in rc) s.stock[k] -= rc[k];
      s.stock[m.r]++; s.msg = who + ' صنع منتجًا جديدًا';
    } else if (m.t === 'buyFlower') {
      const q = m.q === 5 ? 5 : 1, pr = FLOW[m.k];
      if (!pr || s.money < pr * q) return;
      s.money -= pr * q; s.inv[m.k] += q; s.msg = 'تم الشراء من المشتل';
    } else if (m.t === 'gplant') {
      const c = m.c | 0;
      if (!(c >= 0 && c < 100) || s.garden[c] || !(m.k in FLOW) || !(s.inv[m.k] > 0)) return;
      s.inv[m.k]--; s.garden[c] = m.k; s.msg = who + ' زرع في الحديقة';
    } else if (m.t === 'gclear') {
      const c = m.c | 0; if (!(c >= 0 && c < 100) || !s.garden[c]) return;
      s.garden[c] = ''; s.msg = 'تمت إزالة النبتة';
    } else if (m.t === 'buildHouse') {
      const h = HOUSE[s.house]; if (!h || s.money < h[0] || s.stock.wood < h[1]) return;
      s.money -= h[0]; s.stock.wood -= h[1]; s.house++; s.msg = s.house === 3 ? 'اكتمل بناء بيتكما!' : 'تمت مرحلة من بناء البيت';
    } else if (m.t === 'auto') {
      if (!MACH[m.m] || !(m.r === '' || MACH[m.m].includes(m.r))) return; s.auto[m.m] = m.r; s.msg = m.r ? 'تشغيل الآلة تلقائياً' : 'تم إيقاف الآلة';
    } else if (m.t === 'outfit') {
      const o = m.o | 0; if (!(o >= 0 && o < 6)) return;
      if (!s.wd[ws.role][o]) { if (s.money < 100) return; s.money -= 100; s.wd[ws.role][o] = 1; }
      s.out[ws.role] = o; s.msg = who + ' غيّر ملابسه';
    } else if (m.t === 'board') {
      const t = s.truck; if (t.driver === ws.role || t.pass === ws.role || Math.hypot((ws.x || 0) - t.x, (ws.z || 0) - t.z) > 8) return;
      if (riding(s, ws.role)) return;
      if (t.driver === null) { t.driver = ws.role; s.msg = who + ' صعد أولاً وسيقود الشاحنة'; } else if (t.pass === null) { t.pass = ws.role; s.msg = who + ' ركب بجانب السائق'; } else return;
    } else if (m.t === 'exitTruck') {
      const t = s.truck;
      if (t.driver === ws.role) { t.driver = null; t.x = ws.x || t.x; t.z = ws.z || t.z; if (t.pass !== null) { t.driver = t.pass; t.pass = null; } }
      else if (t.pass === ws.role) t.pass = null; else return;
      s.msg = who + ' نزل من الشاحنة';
    } else if (m.t === 'load' || m.t === 'unload') {
      const t = s.truck; if (Math.hypot((ws.x || 0) - t.x, (ws.z || 0) - t.z) > 14) return;
      const from = m.t === 'load' ? s.stock : t.cargo, to = m.t === 'load' ? t.cargo : s.stock; let n = 0;
      for (const k in BASE) { if (k === 'wood' || !from[k]) continue; n += from[k]; to[k] = (to[k] || 0) + from[k]; from[k] = 0; }
      if (!n) return; s.msg = m.t === 'load' ? 'تم تحميل البضاعة في الشاحنة' : 'تم إفراغ الشاحنة في المخزن';
    } else if (m.t === 'portSell') {
      const t = s.truck;
      if (!portDocked(s.time)) { s.msg = 'لا توجد سفينة راسية الآن'; }
      else if (Math.hypot(t.x - PORT[0], t.z - PORT[1]) > 28) { s.msg = 'الشاحنة بعيدة عن الميناء'; }
      else { let v = 0; for (const k in t.cargo) { v += Math.round(t.cargo[k] * BASE[k] * s.mult[k] * 1.3); t.cargo[k] = 0; } if (!v) return; s.money += v; s.msg = 'بعتم البضاعة للسفينة بمبلغ ' + v; }
    } else if (m.t === 'reqYes' || m.t === 'reqNo') {
      const q = s.req; if (!q) return;
      if (m.t === 'reqYes' && q.type === 'animal') {
        const mine = s.animals.filter(a => a.k === q.item && a.rider == null && a.rider2 == null);
        if (mine.length < q.qty) { s.msg = 'لا تملكون العدد المطلوب من الحيوانات'; }
        else { const rm = new Set(mine.slice(0, q.qty).map(a => a.id)); s.animals = s.animals.filter(a => !rm.has(a.id)); s.money += q.reward; addRel(s, q.n, 8); s.req = null; s.msg = 'بعتما الحيوانات للجار وكسبتما ' + q.reward; }
      } else if (m.t === 'reqYes') { if (s.stock[q.item] < q.qty) { s.msg = 'لا تملكون الكمية المطلوبة'; } else { s.stock[q.item] -= q.qty; s.money += q.reward; addRel(s, q.n, 8); s.req = null; if (s.msg.indexOf('صديقًا') < 0) s.msg = 'وافقتما على طلب الجار وكسبتما ' + q.reward; } }
      else { s.rel[q.n] = Math.max(0, s.rel[q.n] - 3); s.req = null; s.msg = 'رفضتما طلب الجار'; }
    } else if (m.t === 'ride') {
      const a = s.animals.find(x => x.id === m.id) || s.bikes.find(x => x.id === m.id);
      if (!a || !RIDE[a.k] || riding(s, ws.role) || Math.hypot((ws.x || 0) - a.x, (ws.z || 0) - a.z) > 16) return;
      if (a.rider === null) a.rider = ws.role; else if (a.rider2 === null) a.rider2 = ws.role; else return;
      s.msg = who + ' ركب';
    } else if (m.t === 'dismount') {
      const a = s.animals.find(x => x.rider === ws.role || x.rider2 === ws.role) || s.bikes.find(x => x.rider === ws.role); if (!a) return;
      if (a.rider === ws.role) { if (a.rider2 !== undefined) { a.rider = a.rider2; a.rider2 = null; } else a.rider = null; } else a.rider2 = null;
      s.msg = who + ' نزل';
    } else if (m.t === 'kid') {
      const k = s.kids[m.i | 0]; if (!k || k.school > s.time) return;
      k.follow = k.follow === ws.role ? null : ws.role; s.msg = k.follow === null ? 'توقف الطفل' : 'الطفل يتبع ' + who;
    } else if (m.t === 'school') {
      let n = 0; s.kids.forEach(k => { if (k.follow === ws.role) { k.follow = null; k.school = s.time + 45; n++; } });
      if (!n) return; s.msg = 'دخل ' + n + ' من الأطفال المدرسة';
    } else if (m.t === 'order') {
      const i = m.i | 0, pr = MENU[i]; if (pr === undefined || s.money < pr) return;
      s.money -= pr; s.ord = { n: s.ord.n + 1, i, role: ws.role, c: m.c | 0 }; s.msg = who + ' طلب من المقهى';
    } else if (m.t === 'hunt') {
      if (now - (ws.hc || 0) < 350) return; const w = s.wild[m.i | 0]; if (!w || w.hp <= 0) return; ws.hc = now; w.hp--;
      if (w.hp <= 0) { w.res = s.time + 150; const lt = WILD[w.k][1]; for (const k in lt) s.stock[k] += lt[k]; s.msg = who + ' اصطاد ' + w.k + ' بالرمح وحصل على غنيمة'; }
    } else if (m.t === 'buyFrom') {
      const n = m.n | 0; if (!(n === 0 || n === 1) || s.own[n] || !NGOODS[n].includes(m.k)) return;
      const pr = Math.round(5 * BASE[m.k] * s.mult[m.k] * 1.25 * (s.rel[n] >= 70 ? 0.7 : s.rel[n] >= 30 ? 0.85 : 1)); if (s.money < pr) return;
      s.money -= pr; s.stock[m.k] += 5; s.msg = 'اشتريتم 5 من الجار مقابل ' + pr;
    } else if (m.t === 'greet') {
      const n = m.n | 0; if (!(n === 0 || n === 1) || s.own[n]) return;
      if (now - r.gc[n] < 30000) s.msg = 'حيّيتما الجار قبل قليل';
      else { r.gc[n] = now; addRel(s, n, 2); if (s.rel[n] < 30) s.msg = 'ردّ الجار التحية'; }
    } else if (m.t === 'gift') {
      const n = m.n | 0, k = m.k;
      if (!(n === 0 || n === 1) || s.own[n] || !(k in BASE) || k === 'wood' || !(s.stock[k] > 0)) return;
      s.stock[k]--; addRel(s, n, Math.max(1, Math.round(BASE[k] / 3)));
      if (s.rel[n] < 30) s.msg = 'شكركما الجار على الهدية';
    } else if (m.t === 'buyFarm') {
      const n = m.n | 0;
      if (!(n === 0 || n === 1) || s.own[n] || s.rel[n] < 70 || s.money < PRICE[n]) return;
      s.money -= PRICE[n]; s.own[n] = 1; s.msg = 'اشتريتما مزرعة الجار! أصبحت ملككما';
    } else return;
    all(r, { t: 'state', s });
  });
  ws.on('close', () => {
    const r = rooms[ws.room]; if (!r) return;
    send(r.p.find(w => w !== ws), { t: 'left' });
    delete rooms[ws.room];
  });
});
server.listen(process.env.PORT || 3000, () => console.log('faty running'));
