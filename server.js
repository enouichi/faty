const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'));
const server = http.createServer((q, r) => {
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
const RIDE = { horse_w: 1, horse_b: 1, donkey: 1, camel: 1 };
const ENC = {
  chicken: [16, 16], duck: [30, 16], goose: [44, 16], turkey: [58, 16], rabbit: [16, 30], pig: [30, 30], sheep: [44, 30], goat: [58, 30],
  cow: [16, 44], llama: [30, 44], camel: [44, 44], donkey: [58, 44], horse_w: [30, 58], horse_b: [30, 58]
};
const BASE = {
  wheat: 10, corn: 30, tomato: 22, potato: 16, egg: 4, duckegg: 6, feather: 9, turkeyegg: 8, angora: 13, truffle: 38, wool: 14, cheese: 12,
  milk: 18, dmilk: 24, cmilk: 32, alpaca: 22, honey: 20, fish: 18, wood: 6, butter: 75, yogurt: 55, bcheese: 110, bread: 42, cake: 95
};
const RECIPES = { butter: { milk: 3 }, yogurt: { milk: 2 }, bcheese: { milk: 4 }, bread: { wheat: 3 }, cake: { egg: 2, wheat: 1, milk: 1 } };
const FLOW = { rose: 10, tulip: 8, sunflower: 7, daisy: 5, lavender: 9, lily: 12, orchid: 25, poppy: 6, marigold: 5, jasmine: 11, carnation: 8, iris: 10, hibiscus: 12,
  apple: 60, orange: 60, olive: 55, cypress: 40, palm: 80, cherry: 90, lemon: 60 };
const HOUSE = [[300, 20], [500, 40], [800, 30]];
const PRICE = [2500, 3500];
const PLOTS = 60, NTREES = 28, MAXLEVEL = 8;
const rnd = (a, b) => a + Math.random() * (b - a);
const send = (w, o) => w && w.readyState === 1 && w.send(JSON.stringify(o));
const all = (r, o) => r.p.forEach(w => send(w, o));
const avail = (s, i) => i < 6 * s.level || (i >= 48 && i < 54 && s.own[0]) || (i >= 54 && s.own[1]);
const capOf = (s, k) => 6 + 6 * (s.up[k] || 0) + 4 * (s.own[0] + s.own[1]);
const newState = () => {
  const stock = {}, mult = {}, inv = {}, up = {};
  for (const k in BASE) { stock[k] = 0; mult[k] = 1; }
  for (const k in FLOW) inv[k] = 0;
  for (const k in ANI) up[k] = 0;
  return {
    money: 100, level: 1, feed: 20, time: 20, hives: 0, rain: false, stock, mult, inv, up, house: 0,
    plots: Array.from({ length: PLOTS }, () => ({ c: '', p: 0, w: 0 })),
    garden: Array(100).fill(''), trees: Array(NTREES).fill(3), animals: [], enemies: [],
    rel: [0, 0], own: [0, 0],
    msg: 'مرحبًا في مزرعتكما. انقرا على الحقول بعد الاقتراب منها لتبدآ.'
  };
};
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
  r.rt -= dt;
  if (!s.rain && r.rt <= 0) { s.rain = true; r.rl = rnd(20, 30); s.msg = 'بدأ المطر، الحقول تُسقى تلقائيًا'; }
  if (s.rain) { r.rl -= dt; s.plots.forEach(p => { if (p.c) p.w = 1; }); if (r.rl <= 0) { s.rain = false; r.rt = rnd(90, 180); } }
  s.plots.forEach(p => { if (p.c && p.w && p.p < 100) p.p = Math.min(100, p.p + 100 / CROPS[p.c][2] * dt); });
  s.animals.forEach(a => {
    const [, prod, cy, use] = ANI[a.k];
    if (!prod) return;
    if (a.t < cy) a.t += dt;
    if (a.t >= cy && s.feed >= use) { s.feed -= use; s.stock[prod]++; a.t = 0; }
  });
  const gc = s.garden.filter(Boolean).length;
  r.hv += dt * s.hives * (1 + gc * 0.03); if (r.hv >= 50) { r.hv -= 50; s.stock.honey++; }
  s.trees.forEach((h, i) => { if (h <= 0 && s.time >= r.rg[i]) s.trees[i] = 3; });
  if ((r.tc = (r.tc || 0) + 1) % 2 === 0) all(r, { t: 'state', s });
}
setInterval(() => { for (const c in rooms) if (rooms[c].p.length === 2) tick(rooms[c]); }, 100);

wss.on('connection', ws => {
  ws.on('message', d => {
    let m; try { m = JSON.parse(d); } catch { return; }
    if (m.t === 'create') {
      let c; do { c = Math.random().toString(36).slice(2, 6).toUpperCase(); } while (rooms[c]);
      rooms[c] = { p: [ws], s: newState(), idc: 0, rt: 100, rl: 0, hv: 0, day: 0, rg: Array(NTREES).fill(0), gc: [0, 0] };
      ws.room = c; ws.role = m.c === 1 ? 1 : 0;
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
    if (m.t === 'pos') { ws.x = +m.x || 0; ws.z = +m.z || 0; return send(other, { t: 'pos', x: m.x, z: m.z, ry: m.ry }); }
    if (m.t === 'chat') {
      const tx = String(m.text || '').trim().slice(0, 80);
      if (tx) all(r, { t: 'chat', role: ws.role, text: tx });
      return;
    }
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
      if (s.animals.filter(x => x.k === m.k).length >= capOf(s, m.k)) { s.msg = 'حظيرة هذا الحيوان ممتلئة. وسّعوها'; }
      else {
        s.money -= a[0]; const [cx, cz] = ENC[m.k];
        s.animals.push({ id: ++r.idc, k: m.k, x: cx + rnd(-3.2, 3.2), z: cz + rnd(-3.2, 3.2), t: 0, rider: null });
        s.msg = who + ' اشترى حيوانًا جديدًا';
      }
    } else if (m.t === 'enlarge') {
      const k = m.k, u = s.up[k], cost = 150 * ((u || 0) + 1);
      if (!(k in ANI) || u >= 3 || s.money < cost || s.stock.wood < 10) return;
      s.money -= cost; s.stock.wood -= 10; s.up[k]++; s.msg = 'تم توسيع مكان الحيوانات (+6)';
    } else if (m.t === 'expand') {
      const cost = 200 * s.level;
      if (s.level >= MAXLEVEL || s.money < cost || s.stock.wood < 10) return;
      s.money -= cost; s.stock.wood -= 10; s.level++; s.msg = 'تم شراء أرض زراعية جديدة';
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
    } else if (m.t === 'sleep') {
      const night = Math.sin(s.time % 120 / 120 * Math.PI * 2) < 0;
      if (s.house < 3 || !night) return;
      s.time = (Math.floor(s.time / 120) + 1) * 120 + 2; s.msg = 'نمتما جيدًا. صباح جديد';
    } else if (m.t === 'ride') {
      const a = s.animals.find(x => x.id === m.id);
      if (!a || !RIDE[a.k] || a.rider !== null || s.animals.some(x => x.rider === ws.role)) return;
      if (Math.hypot((ws.x || 0) - a.x, (ws.z || 0) - a.z) > 16) return;
      a.rider = ws.role; s.msg = who + ' ركب';
    } else if (m.t === 'dismount') {
      const a = s.animals.find(x => x.rider === ws.role); if (!a) return;
      a.rider = null; s.msg = who + ' نزل من المركوب';
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
