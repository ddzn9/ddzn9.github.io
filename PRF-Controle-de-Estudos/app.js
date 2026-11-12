"use strict";
const C = Core, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)], A = {}, R = {};
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const db = new Promise((ok, no) => { const q = indexedDB.open("prf-estudos", 1); q.onupgradeneeded = () => ["rec", "meta", "pcpe"].forEach(s => q.result.createObjectStore(s, { keyPath: s === "meta" ? "k" : "id" })); q.onsuccess = () => ok(q.result); q.onerror = () => no(q.error); });
const tx = async (s, m, f) => { const d = await db; return new Promise((ok, no) => { const t = d.transaction(s, m); const r = f(t.objectStore(s)); t.oncomplete = () => ok(r && r.result); t.onerror = t.onabort = () => no(t.error); }); };
const all = s => tx(s, "readonly", o => o.getAll()), put = (s, v) => tx(s, "readwrite", o => o.put(v)), del = (s, k) => tx(s, "readwrite", o => o.delete(k)),
  clr = s => tx(s, "readwrite", o => o.clear()), many = (s, a) => tx(s, "readwrite", o => { a.forEach(v => o.put(v)); });
const S = { recs: [], pcpe: [], m: { goals: { d: 0, w: 0, m: 0 }, av: [0, 0, 0, 0, 0, 0, 0], lang: "Inglês", ptr: 0, topics: {} } };
const sm = k => put("meta", { k, v: S.m[k] }), today = () => C.iso(new Date()), SEQ = C.seq();
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const dn = id => { const d = C.D.find(x => x[0] === id); return d ? (id === "LE" ? d[1] + " (" + S.m.lang + ")" : d[1]) : id; };
const ACT = ["Teoria", "Revisão", "Resolução de questões", "Simulado", "Leitura de legislação", "Discursiva", "Outros"];
const act = (p, i) => { const a = [["Teoria"], ["Teoria", "Teoria", "Revisão"], ["Teoria", "Questões"], ["Revisão", "Questões", "Questões"], ["Questões", "Revisão", "Questões"]][p - 1]; return a[i % a.length]; };
const bar = (v, t) => '<div class=bar><i style="width:' + (t > 0 ? Math.min(100, v / t * 100) : 0).toFixed(0) + '%"></i></div>';
const toast = m => { const t = $("#t"); t.textContent = m; t.className = "show"; clearTimeout(toast.h); toast.h = setTimeout(() => t.className = "", 2400); };
async function load() { S.recs = await all("rec"); S.pcpe = await all("pcpe"); (await all("meta")).forEach(x => { S.m[x.k] = x.v; }); }

R.inicio = () => {
  const t = today(), r = S.recs, w0 = C.wk(t), ph = C.phase(t), g = S.m.goals, ym = t.slice(0, 7);
  const d = C.sum(C.sel(r, t, t)), w = C.sum(C.sel(r, w0, C.add(w0, 6))), mo = C.sum(C.sel(r, ym + "-01", C.eom(ym)));
  const gl = (n, v, h) => '<div class=c><span>' + n + '</span><b class=n>' + C.hm(v) + '</b>' + (h > 0 ? bar(v, h * 60) + '<small>meta ' + h + ' h</small>' : '<small>defina a meta em Backup e configurações</small>') + '</div>';
  const nx = [0, 1, 2].map(i => '<li>' + esc(dn(SEQ[(S.m.ptr + i) % 100])) + ' — ' + (ph ? act(ph[0], S.m.ptr + i) : "Teoria") + '</li>').join("");
  $("#v-inicio").innerHTML = '<h2>Início</h2><div class=g><div class=c><span>Data</span><b class=n>' + C.fmt(t) + '</b><small>' + (ph ? "Fase " + ph[0] + " — " + ph[1] : "Fora do período planejado") + '</small></div>' +
    '<div class=c><span>Total desde o início</span><b class=n>' + C.hm(C.sum(r)) + '</b><small>' + r.length + ' sessões registradas</small></div>' + gl("Hoje", d, g.d) + gl("Esta semana", w, g.w) + gl("Este mês", mo, g.m) +
    '</div><div class=c style="margin-top:12px"><b>Próximas matérias (ciclo rotativo)</b><ol>' + nx + '</ol><small>Se você perder um dia, o ciclo continua da próxima matéria pendente.</small><p><button class=b onclick="A.show(\'reg\')">Registrar estudo</button></p></div>';
};

R.cron = () => {
  const t = today(), ph = C.phase(t), w0 = C.wk(t), av = S.m.av;
  const days = [...Array(7)].map((_, i) => { const mn = av[i] || 0, n = mn >= 30 ? Math.max(1, Math.round(mn / 60)) : 0; return { d: C.add(w0, i), n, m: n ? Math.round(mn / n) : 0, b: [] }; });
  let q = S.m.ptr; days.forEach(x => { for (let j = 0; j < x.n; j++) { x.b.push([SEQ[q % 100], ph ? act(ph[0], q) : "Teoria"]); q++; } });
  const L = days.filter(x => x.n).pop(); if (L) L.b[L.b.length - 1][1] = "Revisão (24 h · 7 d · 30 d)";
  const wn = Math.floor((C.par(w0) - C.par("2026-11-09")) / 6048e5), ex = [];
  if (ph && (ph[0] >= 3 || wn % 2 === 0)) ex.push("Discursiva"); if (ph && ph[0] >= 4 && C.par(w0).getDate() <= 7) ex.push("Simulado do mês");
  const nm = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  $("#v-cron").innerHTML = '<h2>Cronograma</h2><div class=c><table>' + C.PH.map(x => '<tr' + (ph && ph[0] === x[0] ? ' style="background:#fff3c4"' : '') + '><td>Fase ' + x[0] + '</td><td>' + x[1] + '</td><td>' + C.fmt(x[2]) + ' a ' + C.fmt(x[3]) + '</td></tr>').join("") + '</table></div>' +
    '<h3>Semana atual</h3>' + (av.some(v => v >= 30) ? '<div class=w7>' + days.map((x, i) => '<div class=c><b>' + nm[i] + ' ' + x.d.slice(8) + '/' + x.d.slice(5, 7) + '</b>' + (x.b.length ? x.b.map(b => '<div>' + esc(dn(b[0])) + '<br><small>' + b[1] + ' · ' + C.hm(x.m) + '</small></div>').join("") : '<small>sem horário</small>') + '</div>').join("") + '</div>' +
      '<p>' + ex.map(e => '<span class=chip>' + e + ' nesta semana</span>').join("") + '</p>' : '<div class=c>Informe sua disponibilidade (horas por dia) em <b>Backup e configurações</b> para montar o ciclo semanal. Nenhum horário é inventado.</div>') +
    '<h3>Ordem de rotação (próximas 14)</h3><div class=c>' + [...Array(14)].map((_, i) => '<span class=chip>' + (i + 1) + '. ' + esc(dn(SEQ[(S.m.ptr + i) % 100])) + '</span>').join("") + '</div>';
};

R.mat = () => {
  const by = C.by(S.recs), st = ["Não iniciado", "Em andamento", "Concluído", "Revisar"];
  $("#v-mat").innerHTML = '<h2>Matérias</h2><p class=m>O progresso dos tópicos é independente das horas registradas: só muda quando você altera o status.</p><div class=g>' + C.D.map(d => {
    const T = S.m.topics[d[0]] || [], ok = T.filter(x => x.s === 2).length;
    return '<div class=c><b>' + esc(dn(d[0])) + '</b><small> Bloco ' + d[3] + ' · sugestão ' + d[2] + '%</small><div>' + C.hm(by[d[0]] || 0) + ' estudadas</div>' + bar(ok, T.length) +
      '<small>' + ok + '/' + T.length + ' tópicos concluídos (' + (T.length ? Math.round(ok / T.length * 100) : 0) + '%)</small>' +
      T.map((x, i) => '<div class=row><span>' + esc(x.t) + '</span><select onchange="A.ts(\'' + d[0] + '\',' + i + ',this.value)">' + st.map((o, j) => '<option value=' + j + (x.s === j ? " selected" : "") + '>' + o + '</option>').join("") + '</select><button class="b s" onclick="A.td(\'' + d[0] + '\',' + i + ')">×</button></div>').join("") +
      '<div class=row><input id="nt-' + d[0] + '" placeholder="Novo tópico do edital"><button class=b onclick="A.ta(\'' + d[0] + '\')">+</button></div></div>';
  }).join("") + '</div>';
};
A.ta = id => { const v = $("#nt-" + id).value.trim(); if (!v) return; (S.m.topics[id] = S.m.topics[id] || []).push({ t: v, s: 0 }); sm("topics"); R.mat(); };
A.ts = (id, i, v) => { S.m.topics[id][i].s = +v; sm("topics"); R.mat(); };
A.td = (id, i) => { if (confirm("Remover este tópico?")) { S.m.topics[id].splice(i, 1); sm("topics"); R.mat(); } };

R.reg = r => {
  r = r || {}; const o = (a, s) => a.map(x => '<option' + (x[0] === s ? " selected" : "") + ' value="' + x[0] + '">' + esc(x[1]) + '</option>').join("");
  $("#v-reg").innerHTML = '<h2>' + (r.id ? "Editar registro" : "Registrar estudo") + '</h2><form id=f class=c onsubmit="return A.save(event)"><input type=hidden id=fid value="' + (r.id || "") + '"><div class=g>' +
    '<div><label>Data</label><input type=date id=fd required value="' + (r.date || today()) + '"></div><div><label>Disciplina</label><select id=fs>' + o(C.D.map(d => [d[0], dn(d[0])]), r.disc) + '</select></div>' +
    '<div><label>Tipo de atividade</label><select id=fa>' + ACT.map(a => '<option' + (a === r.type ? " selected" : "") + '>' + a + '</option>').join("") + '</select></div>' +
    '<div><label>Horas</label><input type=number id=fh min=0 max=24 value="' + (r.min ? Math.floor(r.min / 60) : 0) + '"></div><div><label>Minutos</label><input type=number id=fm min=0 max=59 value="' + (r.min ? r.min % 60 : 0) + '"></div></div>' +
    '<label>Conteúdo ou assunto (opcional)</label><input id=ft class=w value="' + esc(r.topic) + '"><label>Observações (opcional)</label><textarea id=fn class=w rows=3>' + esc(r.notes) + '</textarea>' +
    '<p><button class=b id=fb>Salvar registro</button> ' + (r.id ? '<button type=button class="b s" onclick="A.show(\'hist\')">Cancelar</button>' : "") + '</p></form>';
};
A.saving = 0;
A.save = async e => {
  e.preventDefault(); if (A.saving) return false;
  const m = C.toMin($("#fh").value, $("#fm").value); if (m < 1) { toast("Informe o tempo estudado"); return false; }
  A.saving = 1; $("#fb").disabled = true;
  try {
    const old = $("#fid").value, id = old || uid(), x = { id, date: $("#fd").value, disc: $("#fs").value, topic: $("#ft").value.trim(), min: m, type: $("#fa").value, notes: $("#fn").value.trim(), ts: Date.now() };
    await put("rec", x); S.recs = S.recs.filter(y => y.id !== id).concat(x);
    if (!old) { const i = [...Array(40).keys()].find(k => SEQ[(S.m.ptr + k) % 100] === x.disc); if (i !== undefined) { S.m.ptr = (S.m.ptr + i + 1) % 100; sm("ptr"); } }
    toast("Registro salvo ✓"); old ? A.show("hist") : R.reg();
  } catch (er) { toast("Erro ao salvar: " + er.message); }
  A.saving = 0; return false;
};

R.hist = () => {
  const f = A.hf || {}, rs = C.sel(S.recs, f.a || (f.mo ? f.mo + "-01" : null), f.b || (f.mo ? C.eom(f.mo) : null), f.d).sort((x, y) => y.date.localeCompare(x.date) || y.ts - x.ts);
  $("#v-hist").innerHTML = '<h2>Histórico</h2><div class="c g"><div><label>Matéria</label><select onchange="A.f(\'d\',this.value)"><option value="">Todas</option>' + C.D.map(d => '<option value=' + d[0] + (f.d === d[0] ? " selected" : "") + '>' + esc(dn(d[0])) + '</option>').join("") + '</select></div>' +
    '<div><label>Mês</label><input type=month value="' + (f.mo || "") + '" onchange="A.f(\'mo\',this.value)"></div><div><label>De</label><input type=date value="' + (f.a || "") + '" onchange="A.f(\'a\',this.value)"></div><div><label>Até</label><input type=date value="' + (f.b || "") + '" onchange="A.f(\'b\',this.value)"></div></div>' +
    '<p>' + rs.length + ' registros · ' + C.hm(C.sum(rs)) + '</p><div class=c><table>' + rs.map(x => '<tr><td>' + C.fmt(x.date) + '</td><td>' + esc(dn(x.disc)) + (x.topic ? '<br><small>' + esc(x.topic) + '</small>' : "") + (x.notes ? '<br><small>' + esc(x.notes) + '</small>' : "") + '</td><td>' + C.hm(x.min) + '</td><td>' + esc(x.type) + '</td><td><button class="b s" onclick="A.edit(\'' + x.id + '\')">Editar</button> <button class="b s" onclick="A.del(\'' + x.id + '\')">Excluir</button></td></tr>').join("") + '</table></div>';
};
A.f = (k, v) => { A.hf = A.hf || {}; A.hf[k] = v || undefined; R.hist(); };
A.edit = id => { A.show("reg"); R.reg(S.recs.find(x => x.id === id)); };
A.del = async id => { if (!confirm("Excluir este registro?")) return; await del("rec", id); S.recs = S.recs.filter(x => x.id !== id); R.hist(); toast("Registro excluído"); };

R.est = () => {
  const e = A.es || { k: "all" }, t = today(), [a, b] = C.rng(e.k, t, e), rs = C.sel(S.recs, a, b), by = C.by(rs), tot = C.sum(rs);
  const s0 = a || (rs.length ? rs.map(x => x.date).sort()[0] : t), e0 = b && b < t ? b : t, nd = Math.max(1, Math.round((C.par(e0) - C.par(s0)) / 864e5) + 1);
  const rank = Object.entries(by).sort((x, y) => y[1] - x[1]), wks = C.weeks(S.recs, t, 12), mx = Math.max(1, ...wks.map(x => x[1]));
  const mo = C.months(S.recs), ms = Object.keys(mo).sort(), mt = ms.map(k => [k, Object.values(mo[k]).reduce((s, v) => s + v, 0)]), mm = Math.max(1, ...mt.map(x => x[1])), lm = ms.slice(-6);
  const opt = [["all", "Todo o período"], ["today", "Hoje"], ["7d", "Últimos 7 dias"], ["30d", "Últimos 30 dias"], ["week", "Esta semana"], ["month", "Este mês"], ["ym", "Um mês específico"], ["c", "Intervalo personalizado"]];
  const col = (arr, mxv, lab) => '<div class=cols>' + arr.map(x => '<div style="height:' + Math.round(x[1] / mxv * 100) + '%"><span>' + lab(x[0]) + '<br>' + C.hm(x[1]) + '</span></div>').join("") + '</div>';
  $("#v-est").innerHTML = '<h2>Estatísticas</h2><div class="c g"><div><label>Período</label><select onchange="A.e(\'k\',this.value)">' + opt.map(o => '<option value=' + o[0] + (e.k === o[0] ? " selected" : "") + '>' + o[1] + '</option>').join("") + '</select></div>' +
    (e.k === "ym" ? '<div><label>Mês</label><input type=month value="' + (e.ym || "") + '" onchange="A.e(\'ym\',this.value)"></div>' : "") +
    (e.k === "c" ? '<div><label>De</label><input type=date value="' + (e.from || "") + '" onchange="A.e(\'from\',this.value)"></div><div><label>Até</label><input type=date value="' + (e.to || "") + '" onchange="A.e(\'to\',this.value)"></div>' : "") + '</div>' +
    '<div class=g style="margin:12px 0"><div class=c><span>Total no período</span><b class=n>' + C.hm(tot) + '</b></div><div class=c><span>Sessões</span><b class=n>' + rs.length + '</b></div><div class=c><span>Média diária (dias corridos)</span><b class=n>' + C.hm(Math.round(tot / nd)) + '</b></div><div class=c><span>Hoje</span><b class=n>' + C.hm(C.sum(C.sel(S.recs, t, t))) + '</b></div></div>' +
    '<div class=c><b>Horas por disciplina (ranking)</b><table>' + (rank.length ? rank.map((x, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(dn(x[0])) + '</td><td>' + C.hm(x[1]) + '</td><td>' + (Math.round(x[1] / tot * 1000) / 10) + '%</td><td style="width:30%">' + bar(x[1], rank[0][1]) + '</td></tr>').join("") : '<tr><td>Sem registros no período</td></tr>') + '</table></div>' +
    '<div class=g style="margin-top:12px"><div class=c><b>Horas por semana (12 semanas)</b>' + col(wks, mx, s => s.slice(8) + "/" + s.slice(5, 7)) + '</div><div class=c><b>Horas por mês</b>' + (mt.length ? col(mt, mm, s => s.slice(5) + "/" + s.slice(2, 4)) : "<p>Sem dados</p>") + '</div></div>' +
    '<div class=c style="margin-top:12px;overflow:auto"><b>Comparativo mensal por disciplina</b><table><tr><th></th>' + lm.map(k => '<th>' + k.slice(5) + '/' + k.slice(0, 4) + '</th>').join("") + '</tr>' + C.D.map(d => '<tr><td>' + esc(dn(d[0])) + '</td>' + lm.map(k => '<td>' + C.hm((mo[k] || {})[d[0]] || 0) + '</td>').join("") + '</tr>').join("") + '</table></div>';
};
A.e = (k, v) => { A.es = Object.assign(A.es || { k: "all" }, { [k]: v }); R.est(); };

const dl = (n, t, m) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t], { type: m })); a.download = n; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1e3); };
R.cfg = () => {
  const g = S.m.goals, dd = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"], gi = (k, n) => '<label>' + n + '</label><input type=number min=0 step=.5 value=' + g[k] + ' onchange="A.g(\'' + k + '\',this.value)">';
  $("#v-cfg").innerHTML = '<h2>Backup e configurações</h2><div class=g><div class=c><b>Metas (horas)</b>' + gi("d", "Diária") + gi("w", "Semanal") + gi("m", "Mensal") + '</div>' +
    '<div class=c><b>Disponibilidade (horas por dia)</b>' + dd.map((n, i) => '<label>' + n + '</label><input type=number min=0 max=16 step=.5 value=' + (S.m.av[i] / 60) + ' onchange="A.av(' + i + ',this.value)">').join("") + '</div>' +
    '<div class=c><b>Língua estrangeira</b><select onchange="A.lang(this.value)"><option' + (S.m.lang === "Inglês" ? " selected" : "") + '>Inglês</option><option' + (S.m.lang === "Espanhol" ? " selected" : "") + '>Espanhol</option></select><small>Só o idioma escolhido é contabilizado.</small></div>' +
    '<div class=c><b>Backup</b><p><button class=b onclick="A.exj()">Exportar JSON</button> <button class=b onclick="A.exc()">Exportar CSV</button></p><label>Importar ou restaurar backup (JSON)</label><input type=file id=fi accept=".json,application/json"><p><button class="b s" onclick="A.imp(0)">Importar (sem duplicar)</button> <button class="b r" onclick="A.imp(1)">Restaurar (substituir tudo)</button></p>' +
    '<small>Faça backup com frequência: desinstalar o app ou limpar os dados do navegador apaga os registros locais.</small></div>' +
    '<div class=c><b>Arquivo da PCPE (' + S.pcpe.length + ' registros)</b><small>Histórico separado, fora das estatísticas da PRF.</small><input type=file id=fp accept=".json"><p><button class="b s" onclick="A.ipc()">Importar arquivo da PCPE (JSON)</button></p></div></div>';
};
A.g = (k, v) => { S.m.goals[k] = Math.max(0, +v || 0); sm("goals"); toast("Meta salva"); };
A.av = (i, v) => { S.m.av[i] = Math.round(Math.max(0, +v || 0) * 60); sm("av"); toast("Disponibilidade salva"); };
A.lang = v => { S.m.lang = v; sm("lang"); toast("Idioma: " + v); };
A.exj = () => dl("prf-backup-" + today() + ".json", JSON.stringify({ app: "prf-controle-de-estudos", v: 1, rec: S.recs, meta: S.m, pcpe: S.pcpe }), "application/json");
A.exc = () => dl("prf-historico-" + today() + ".csv", C.csv(S.recs), "text/csv");
const rf = async id => { const f = $(id).files[0]; if (!f) { toast("Escolha um arquivo"); return null; } try { return JSON.parse(await f.text()); } catch (e) { toast("Arquivo inválido"); return null; } };
A.imp = async mode => {
  const j = await rf("#fi"); if (!j) return; if (!Array.isArray(j.rec)) { toast("Backup inválido"); return; }
  const ok = j.rec.filter(x => x && x.id && /^\d{4}-\d\d-\d\d$/.test(x.date) && C.D.some(d => d[0] === x.disc) && x.min > 0);
  if (mode) { if (!confirm("Substituir TODOS os registros atuais por " + ok.length + " do backup? Isso não pode ser desfeito.")) return; await clr("rec"); await many("rec", ok); S.recs = ok; if (j.meta) { Object.assign(S.m, j.meta); for (const k in j.meta) await sm(k); } }
  else { const r = C.merge(S.recs, ok); if (!confirm("Importar " + r.add.length + " registros novos (" + r.dup + " duplicados serão ignorados)?")) return; await many("rec", r.add); S.recs = S.recs.concat(r.add); }
  toast("Importação concluída"); R.cfg();
};
A.ipc = async () => {
  const j = await rf("#fp"); if (!j) return; const a = (Array.isArray(j) ? j : j.rec) || [];
  if (!confirm("Guardar " + a.length + " registros no arquivo da PCPE (fora das estatísticas da PRF)?")) return;
  const x = a.map(r => Object.assign({ id: uid() }, r)); await many("pcpe", x); S.pcpe = S.pcpe.concat(x); toast("Arquivo da PCPE atualizado"); R.cfg();
};

A.show = v => { $$("main section").forEach(s => s.hidden = s.id !== "v-" + v); $$("nav button").forEach(b => b.classList.toggle("on", b.dataset.v === v)); R[v] && R[v](); history.replaceState(0, "", "#" + v); scrollTo(0, 0); };
A.upd = () => navigator.serviceWorker.getRegistration().then(r => r && r.waiting && r.waiting.postMessage("skip"));
(async () => {
  try { await load(); if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); }
  catch (e) { document.body.insertAdjacentHTML("afterbegin", "<p style='padding:20px'>Armazenamento indisponível neste navegador: " + esc(e.message) + "</p>"); return; }
  const v = location.hash.slice(1); A.show(R[v] ? v : "inicio");
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").then(r => { r.onupdatefound = () => { const w = r.installing; w.onstatechange = () => { if (w.state === "installed" && navigator.serviceWorker.controller) $("#u").hidden = false; }; }; });
    let rl; navigator.serviceWorker.addEventListener("controllerchange", () => { if (!rl) { rl = 1; location.reload(); } });
  }
})();
