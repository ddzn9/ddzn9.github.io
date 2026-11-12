(function (g) {
  const D = [["LP", "Língua Portuguesa", 12, "I"], ["RL", "Raciocínio Lógico-Matemático", 8, "I"], ["INF", "Informática", 6, "I"], ["FIS", "Física", 5, "I"],
    ["ETI", "Ética e Cidadania", 5, "I"], ["GEO", "Geopolítica Brasileira", 6, "I"], ["LE", "Língua Estrangeira", 4, "I"], ["LT", "Legislação de Trânsito", 25, "II"],
    ["ADM", "Direito Administrativo", 5, "III"], ["CON", "Direito Constitucional", 5, "III"], ["PEN", "Direito Penal", 5, "III"], ["PPE", "Direito Processual Penal", 4, "III"],
    ["LEG", "Legislação Especial", 6, "III"], ["DH", "Direitos Humanos", 4, "III"]];
  const PH = [[1, "Adaptação e início da preparação", "2026-11-11", "2026-11-30"], [2, "Construção da base teórica", "2026-12-01", "2027-03-31"],
    [3, "Desenvolvimento e aprofundamento", "2027-04-01", "2027-06-30"], [4, "Consolidação", "2027-07-01", "2027-09-30"],
    [5, "Retificação de pontos fracos e preparação avançada", "2027-10-01", "2027-12-31"]];
  const p2 = n => String(n).padStart(2, "0");
  const iso = d => d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate());   // data LOCAL (sem fuso)
  const par = s => { const a = s.split("-").map(Number); return new Date(a[0], a[1] - 1, a[2]); };
  const add = (s, n) => { const d = par(s); d.setDate(d.getDate() + n); return iso(d); };
  const fmt = s => s.split("-").reverse().join("/");
  const hm = m => Math.floor(m / 60) + "h" + p2(m % 60);
  const toMin = (h, m) => Math.max(0, Math.floor(+h || 0)) * 60 + Math.max(0, Math.floor(+m || 0));
  const wk = s => add(s, -((par(s).getDay() + 6) % 7));                                      // segunda-feira
  const eom = ym => { const a = ym.split("-").map(Number); return iso(new Date(a[0], a[1], 0)); };
  function rng(k, t, o) {
    o = o || {};
    if (k === "all") return [null, null];
    if (k === "today") return [t, t];
    if (k === "7d") return [add(t, -6), t];
    if (k === "30d") return [add(t, -29), t];
    if (k === "week") { const a = wk(t); return [a, add(a, 6)]; }
    if (k === "month") return [t.slice(0, 7) + "-01", eom(t.slice(0, 7))];
    if (k === "ym") return o.ym ? [o.ym + "-01", eom(o.ym)] : [null, null];
    return [o.from || null, o.to || null];
  }
  const sel = (r, a, b, d) => r.filter(x => (!a || x.date >= a) && (!b || x.date <= b) && (!d || x.disc === d));
  const sum = r => r.reduce((s, x) => s + x.min, 0);
  const by = r => { const o = {}; r.forEach(x => { o[x.disc] = (o[x.disc] || 0) + x.min; }); return o; };
  const phase = s => PH.find(p => s >= p[2] && s <= p[3]) || null;
  const weeks = (r, t, n) => { const o = []; for (let i = n - 1; i >= 0; i--) { const a = add(wk(t), -7 * i); o.push([a, sum(sel(r, a, add(a, 6)))]); } return o; };
  const months = r => { const o = {}; r.forEach(x => { const k = x.date.slice(0, 7); o[k] = o[k] || {}; o[k][x.disc] = (o[k][x.disc] || 0) + x.min; }); return o; };
  const sig = x => [x.date, x.disc, x.min, x.type, x.topic || "", x.notes || ""].join("|");
  function merge(cur, inc) {
    const ids = new Set(cur.map(x => x.id)), sg = new Set(cur.map(sig)), out = []; let dup = 0;
    inc.forEach(x => { if (ids.has(x.id) || sg.has(sig(x))) dup++; else { out.push(x); ids.add(x.id); } });
    return { add: out, dup };
  }
  function csv(r) {
    const q = v => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    return "\ufeff" + ["data", "disciplina", "conteudo", "minutos", "horas", "atividade", "observacoes"].join(";") + "\n" +
      r.map(x => [x.date, x.disc, x.topic, x.min, hm(x.min), x.type, x.notes].map(q).join(";")).join("\n");
  }
  function seq() {   // rodízio ponderado suave: 100 posições proporcionais aos percentuais sugeridos
    const w = D.map(d => d[2]), c = w.map(() => 0), o = [];
    for (let i = 0; i < 100; i++) { let b = 0; c.forEach((_, j) => { c[j] += w[j]; if (c[j] > c[b]) b = j; }); c[b] -= 100; o.push(D[b][0]); }
    return o;
  }
  const X = { D, PH, iso, par, add, fmt, hm, toMin, wk, eom, rng, sel, sum, by, phase, weeks, months, merge, csv, seq };
  if (typeof module !== "undefined") module.exports = X; else g.Core = X;
})(typeof self !== "undefined" ? self : globalThis);
