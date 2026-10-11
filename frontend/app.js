/* RevenueIQ front-end: vanilla JS single-page app (no build step, works offline). */
"use strict";

// ------------------------------------------------------------------ icons
const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  kanban: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 7v7"/><path d="M12 7v4"/><path d="M16 7v9"/>',
  trend: '<path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  cpu: '<rect x="4" y="4" width="16" height="16" rx="3"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  menu: '<path d="M3 12h18M3 6h18M3 18h18"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
  refresh: '<path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  bot: '<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><path d="M8 16h.01M16 16h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
  flask: '<path d="M9 3h6M10 3v6L4 20a1 1 0 0 0 .9 1.5h14.2A1 1 0 0 0 20 20L14 9V3"/>',
  dollar: '<path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
  fire: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
  card: '<rect x="1" y="4" width="22" height="16" rx="3"/><path d="M1 10h22"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  life: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M4.93 19.07l4.24-4.24"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  down: '<path d="M23 18l-9.5-9.5-5 5L1 6"/><path d="M17 18h6v-6"/>',
  smile: '<circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><path d="M9 9h.01M15 9h.01"/>',
  rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  bars: '<path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
};
const icon = (n) => `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ""}</svg>`;
const renderIcons = (root = document) => root.querySelectorAll("i[data-icon]").forEach((el) => { el.innerHTML = icon(el.dataset.icon); });
const ic = (n, style = "") => `<i data-icon="${n}" ${style ? `style="${style}"` : ""}></i>`;
const icS = (n, px = 13) => ic(n, `width:${px}px;height:${px}px;display:inline-flex;flex-shrink:0`);

const REASON_ICON = { PAYMENT_ISSUE: "card", CHAMPION_LOST: "user", USAGE_DECLINE: "down", LOW_ADOPTION: "target", SUPPORT_FRICTION: "life",
  DOWNGRADE_SIGNAL: "dollar", RENEWAL_RISK: "calendar", LOW_SATISFACTION: "smile", NEW_CUSTOMER: "rocket", EXPANSION: "trend" };
const REASON_TONE = { PAYMENT_ISSUE: "high", CHAMPION_LOST: "primary", USAGE_DECLINE: "high", LOW_ADOPTION: "med", SUPPORT_FRICTION: "blue",
  DOWNGRADE_SIGNAL: "med", RENEWAL_RISK: "primary", LOW_SATISFACTION: "high", NEW_CUSTOMER: "low", EXPANSION: "low" };
const STATUS_COLOR = { Suggested: "#8b7dff", "To Do": "#1b8fd8", "In Progress": "#e5900b", "Waiting on Customer": "#e0498f", Done: "#12a571" };
const PRIO_COLOR = { Urgent: "#e5484d", High: "#e5900b", Medium: "#5b4cf0", Low: "#b5b9cc" };

// ------------------------------------------------------------------ helpers
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (v, compact = true) => {
  if (v == null || isNaN(v)) return "-";
  const a = Math.abs(v);
  if (compact && a >= 1e6) return "$" + (v / 1e6).toFixed(a >= 1e7 ? 1 : 2) + "M";
  if (compact && a >= 1e4) return "$" + (v / 1e3).toFixed(0) + "k";
  if (compact && a >= 1e3) return "$" + (v / 1e3).toFixed(1) + "k";
  return "$" + Math.round(v).toLocaleString();
};
const pct = (v, d = 0) => (v == null || isNaN(v) ? "-" : (v * 100).toFixed(d) + "%");
const num = (v) => (v == null ? "-" : Number(v).toLocaleString());
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const parseD = (s) => { if (!s) return null; const [y, m, d] = s.slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
const fdate = (s) => { const d = parseD(s); return d ? `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : "-"; };
const sdate = (s) => { const d = parseD(s); return d ? `${MONTHS[d.getMonth()]} ${d.getDate()}` : "-"; };
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const daysUntil = (s) => { const d = parseD(s); if (!d) return null; return Math.round((d - parseD(todayStr())) / 864e5); };
const relTime = (s) => {
  if (!s) return "";
  const d = new Date(s.length <= 10 ? s + "T12:00:00" : s);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400 && s.length > 10) return Math.floor(diff / 3600) + "h ago";
  return fdate(s);
};
const initials = (n) => (n || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const avatar = (name, color, sm) => `<span class="avatar ${sm ? "sm" : ""}" style="background:${color || "#9aa0b8"}" data-tip="${esc(name)}">${initials(name)}</span>`;
const hashHue = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const logo = (name, size = "") => { const h = hashHue(name); return `<span class="logo ${size}" style="background:linear-gradient(135deg,hsl(${h} 70% 60%),hsl(${(h + 35) % 360} 65% 45%))">${initials(name)}</span>`; };
const riskColor = (p) => (p >= 0.2 ? "var(--high)" : p >= 0.08 ? "var(--med)" : "var(--low)");
const tierColor = (t) => ({ High: "#e5484d", Medium: "#f0a020", Low: "#12a571" }[t] || "#9aa0b8");
const tierBadge = (t) => (t ? `<span class="badge ${t}"><span class="dot"></span>${t} risk</span>` : "");
const outcomeCls = (o) => String(o || "").split(" ")[0];
const riskBar = (p) => p == null ? '<span class="muted">-</span>' :
  `<div class="riskbar"><div class="track"><div class="fill" style="width:${Math.max(3, Math.min(100, p / 0.6 * 100))}%;background:${riskColor(p)}"></div></div><span style="color:${riskColor(p)}">${pct(p)}</span></div>`;
const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const emptyState = (iconName, text) => `<div class="empty">${ic(iconName)}${text}</div>`;

// ------------------------------------------------------------------ state + api
const S = { meta: null, team: [], user: null, teamById: {}, modalLocked: false };
try { S.user = Number(localStorage.getItem("riq_user")) || null; } catch (e) { /* storage unavailable */ }

async function api(path, opts = {}) {
  const init = { method: opts.method || "GET", headers: {} };
  if (opts.body !== undefined) { init.headers["Content-Type"] = "application/json"; init.body = JSON.stringify(opts.body); }
  let res;
  try { res = await fetch(path, init); } catch (e) { throw new Error("Cannot reach the RevenueIQ server. Is the run.bat window still open?"); }
  if (!res.ok) {
    let msg = res.statusText;
    try { const j = await res.json(); msg = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail); } catch (e) { /* ignore */ }
    throw new Error(msg);
  }
  return res.json();
}

function toast(msg, type = "", action) {
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.innerHTML = `<span style="flex:1">${esc(msg)}</span>`;
  if (action) {
    const b = document.createElement("button");
    b.textContent = action.label;
    b.onclick = () => { action.fn(); el.remove(); };
    el.appendChild(b);
  }
  $("#toast-root").appendChild(el);
  setTimeout(() => el.remove(), action ? 8000 : 3800);
}
const fail = (e) => toast(e.message || String(e), "error");

// ------------------------------------------------------------------ modal + drawer
function openModal(html, { drawer = false, locked = false } = {}) {
  closeModal(true);
  const root = $("#modal-root");
  root.innerHTML = drawer
    ? `<div class="overlay"></div><aside class="drawer" role="dialog">${html}</aside>`
    : `<div class="overlay modal-wrap"><div class="modal" role="dialog">${html}</div></div>`;
  S.modalLocked = locked;
  const ov = $(".overlay", root);
  ov.addEventListener("mousedown", (e) => { if (e.target === ov && !S.modalLocked) closeModal(); });
  renderIcons(root);
  $$("[data-close]", root).forEach((b) => b.addEventListener("click", () => closeModal(true)));
  document.body.style.overflow = "hidden";
  return $(drawer ? ".drawer" : ".modal", root);
}
function closeModal(force = false) {
  if (S.modalLocked && !force) return;
  S.modalLocked = false;
  $("#modal-root").innerHTML = "";
  document.body.style.overflow = "";
}
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

// ------------------------------------------------------------------ tooltip
let tipEl;
document.addEventListener("mousemove", (e) => {
  const t = e.target.closest && e.target.closest("[data-tip]");
  if (!t) { if (tipEl) tipEl.style.display = "none"; return; }
  if (!tipEl) { tipEl = document.createElement("div"); tipEl.className = "tip"; document.body.appendChild(tipEl); }
  tipEl.innerHTML = t.getAttribute("data-tip");
  tipEl.style.display = "block";
  const w = tipEl.offsetWidth;
  tipEl.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, e.clientX + 14)) + "px";
  tipEl.style.top = e.clientY - 42 + "px";
});

// ------------------------------------------------------------------ charts (SVG)
function niceMax(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

function barChart({ labels, series, height = 240, fmt = (v) => v, width = 720 }) {
  const W = width, H = height, L = 52, R = 8, T = 12, B = 30;
  const n = labels.length;
  const totals = labels.map((_, i) => series.reduce((s, se) => s + (se.values[i] || 0), 0));
  const max = niceMax(Math.max(...totals, 0));
  const cw = (W - L - R) / n, bw = Math.min(n <= 6 ? 70 : 34, cw * 0.56);
  let g = "";
  for (let k = 0; k <= 4; k++) {
    const y = T + (H - T - B) * (1 - k / 4);
    g += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="#eef0f6" ${k ? 'stroke-dasharray="3 5"' : ""}/><text x="${L - 10}" y="${y + 4}" text-anchor="end">${fmt(max * k / 4)}</text>`;
  }
  labels.forEach((lab, i) => {
    const x = L + cw * i + (cw - bw) / 2;
    let base = H - B;
    const last = series.map((se) => se.values[i] || 0).reduce((li, v, si) => (v > 0 ? si : li), -1);
    series.forEach((se, si) => {
      const v = se.values[i] || 0;
      const h = (H - T - B) * v / max;
      if (h <= 0) return;
      const y = base - h;
      const r = si === last ? Math.min(6, h, bw / 2) : 0;
      const path = r ? `M${x},${base} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${base} Z` : `M${x},${base} V${y} H${x + bw} V${base} Z`;
      g += `<path d="${path}" fill="${se.color}" data-tip="${esc(lab)} &middot; ${esc(se.name)}: <b>${esc(fmt(v))}</b>"/>`;
      base = y;
    });
    if (lab) g += `<text x="${L + cw * i + cw / 2}" y="${H - 9}" text-anchor="middle">${esc(lab)}</text>`;
  });
  const legend = series.length > 1 ? `<div class="legend">${series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join("")}</div>` : "";
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}">${g}</svg>${legend}</div>`;
}

let gradId = 0;
function lineChart({ labels, series, height = 230, fmt = (v) => v }) {
  const W = 720, H = height, L = 44, R = 12, T = 12, B = 30;
  const all = series.flatMap((s) => s.values).filter((v) => v != null);
  const max = niceMax(Math.max(...all, 1));
  const n = labels.length;
  const X = (i) => L + (W - L - R) * (n === 1 ? 0.5 : i / (n - 1));
  const Y = (v) => T + (H - T - B) * (1 - v / max);
  let g = "", defs = "";
  for (let k = 0; k <= 4; k++) {
    const y = Y(max * k / 4);
    g += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="#eef0f6" ${k ? 'stroke-dasharray="3 5"' : ""}/><text x="${L - 9}" y="${y + 4}" text-anchor="end">${fmt(max * k / 4)}</text>`;
  }
  const step = Math.ceil(n / 7);
  labels.forEach((lab, i) => { if (i % step === 0 || (i === n - 1 && (n - 1) % step >= step / 2)) g += `<text x="${X(i)}" y="${H - 9}" text-anchor="middle">${esc(lab)}</text>`; });
  series.forEach((s) => {
    const pts = s.values.map((v, i) => `${X(i)},${Y(v || 0)}`).join(" ");
    if (s.area) {
      const id = "lg" + (++gradId);
      defs += `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity=".28"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient>`;
      g += `<polygon points="${X(0)},${Y(0)} ${pts} ${X(n - 1)},${Y(0)}" fill="url(#${id})"/>`;
    }
    g += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="${s.dash ? 1.8 : 2.6}" ${s.dash ? 'stroke-dasharray="6 5"' : ""} stroke-linejoin="round" stroke-linecap="round"/>`;
    if (!s.dash) { const lv = s.values[n - 1] || 0; g += `<circle cx="${X(n - 1)}" cy="${Y(lv)}" r="4.5" fill="#fff" stroke="${s.color}" stroke-width="2.5"/>`; }
    s.values.forEach((v, i) => { g += `<circle cx="${X(i)}" cy="${Y(v || 0)}" r="9" fill="transparent" data-tip="${esc(labels[i])} &middot; ${esc(s.name)}: <b>${esc(fmt(v))}</b>"/>`; });
  });
  const legend = `<div class="legend">${series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join("")}</div>`;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${g}</svg>${legend}</div>`;
}

function donut(items, centerTop, centerSub) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  const R = 54, C = 2 * Math.PI * R, gap = items.filter((i) => i.value > 0).length > 1 ? 3 : 0;
  let off = 0, arcs = "";
  items.forEach((it) => {
    const len = C * it.value / total;
    if (len > 0) arcs += `<circle cx="80" cy="80" r="${R}" fill="none" stroke="${it.color}" stroke-width="20" stroke-dasharray="${Math.max(0.5, len - gap)} ${C - len + gap}" stroke-dashoffset="${-off}" transform="rotate(-90 80 80)" data-tip="${esc(it.label)}: <b>${esc(it.display ?? it.value)}</b>"/>`;
    off += len;
  });
  return `<div class="donut-wrap"><svg viewBox="0 0 160 160"><circle cx="80" cy="80" r="${R}" fill="none" stroke="#f1f2f8" stroke-width="20"/>${arcs}
    <text x="80" y="80" text-anchor="middle" style="font-size:${String(centerTop).length > 5 ? 19 : 24}px;font-weight:600;fill:var(--text)">${esc(centerTop)}</text>
    <text x="80" y="98" text-anchor="middle" style="font-size:11px;fill:var(--muted)">${esc(centerSub)}</text></svg>
    <div class="donut-legend">${items.map((it) => `<div class="item"><span class="sw" style="background:${it.color}"></span><div class="t"><b>${esc(it.label)}</b><span>${esc(it.sub || "")}</span></div><span class="v">${esc(it.display ?? it.value)}</span></div>`).join("")}</div></div>`;
}

function hbars(items, { fmt = (v) => v, color = "var(--primary)", max } = {}) {
  const m = max || Math.max(...items.map((i) => i.value), 1e-9);
  if (!items.length) return emptyState("inbox", "No data yet");
  return `<div class="hbars">${items.map((i) => `<div class="hbar"><div class="top"><span class="l">${esc(i.label)}${i.sub ? ` <span class="muted small">&middot; ${esc(i.sub)}</span>` : ""}</span><b>${esc(fmt(i.value))}</b></div>
    <div class="track"><div class="fill" style="width:${Math.max(1.5, 100 * i.value / m)}%;background:${i.color || color}"></div></div></div>`).join("")}</div>`;
}

function gauge(p) {
  const R = 70, C = Math.PI * R, len = C * Math.min(1, p / 0.6);
  return `<svg viewBox="0 0 180 104"><path d="M20 94 A70 70 0 0 1 160 94" fill="none" stroke="#eef0f6" stroke-width="16" stroke-linecap="round"/>
    <path d="M20 94 A70 70 0 0 1 160 94" fill="none" stroke="${riskColor(p)}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${Math.max(1, len)} ${C}"/>
    <text x="90" y="86" text-anchor="middle" style="font-size:32px;font-weight:600;fill:${riskColor(p)}">${pct(p)}</text></svg>`;
}

// ------------------------------------------------------------------ router
const ROUTES = {
  "": { title: "Dashboard", sub: "Your revenue health at a glance", nav: "dashboard", render: viewDashboard },
  accounts: { title: "Accounts", sub: "Every customer, ranked by revenue at risk", nav: "accounts", render: viewAccounts },
  account: { title: "Account", sub: "", nav: "accounts", render: viewAccount },
  board: { title: "Action Board", sub: "Work retention actions from suggestion to outcome", nav: "board", render: viewBoard },
  signals: { title: "Signals", sub: "Important changes across your accounts, as they happen", nav: "signals", render: viewSignals },
  renewals: { title: "Renewals", sub: "Upcoming annual renewals and the revenue forecast", nav: "renewals", render: viewRenewals },
  expansion: { title: "Expansion", sub: "Accounts ready to grow: more seats or a higher plan", nav: "expansion", render: viewExpansion },
  revenue: { title: "Revenue Analytics", sub: "NRR, GRR, ARR movement, cohorts and where churn happens", nav: "revenue", render: viewRevenue },
  impact: { title: "Impact", sub: "Proof that retention actions save revenue", nav: "impact", render: viewImpact },
  model: { title: "Churn Model", sub: "Prediction accuracy and what drives churn", nav: "model", render: viewModel },
  playbooks: { title: "Playbooks", sub: "The recommended action for each churn reason", nav: "playbooks", render: viewPlaybooks },
};
let routeToken = 0;

async function router() {
  const parts = location.hash.replace(/^#\/?/, "").split("/");
  const r = ROUTES[parts[0]] || ROUTES[""];
  setTitle(r.title, r.sub);
  $$(".sidebar nav a").forEach((a) => a.classList.toggle("active", a.dataset.route === r.nav));
  $(".sidebar").classList.remove("open");
  closeModal(true);
  const view = $("#view");
  const token = ++routeToken;
  view.innerHTML = '<div class="loading"><span class="spinner"></span></div>';
  try {
    await r.render(view, parts.slice(1), () => token === routeToken);
  } catch (e) {
    if (token === routeToken) view.innerHTML = `<div class="panel panel-b"><div class="callout warn">${ic("alert")}<div><b>Could not load this page.</b><br>${esc(e.message)}</div></div></div>`;
  }
  renderIcons(view);
}
function setTitle(t, sub) { $("#page-title").textContent = t; $("#page-sub").textContent = sub || ""; document.title = `${t} - RevenueIQ`; }
const rerender = async () => { const y = window.scrollY; await router(); window.scrollTo(0, y); };
window.addEventListener("hashchange", () => { router().then(() => window.scrollTo(0, 0)); });

async function refreshBoardCount() {
  try { const s = await api("/api/summary"); $("#nav-board-count").textContent = s.suggested_cards || ""; } catch (e) { /* ignore */ }
}

function kpi({ label, value, foot = "", tone = "primary", icon: ico = "activity", tip = "" }) {
  return `<div class="panel kpi tone-${tone}"><div class="k-head"><span class="k-ico">${ic(ico)}</span>
    <div class="label">${label}${tip ? `<i data-icon="info" class="info-i" data-tip="${esc(tip)}"></i>` : ""}</div></div>
    <div class="value">${value}</div><div class="foot">${foot}</div></div>`;
}
function actionPill(a) {
  if (a.is_control) return '<span class="badge neutral" data-tip="Held out as control group (no actions) to measure true impact">Control group</span>';
  if (a.card_status) return `<span class="badge primary"><span class="dot"></span>${esc(a.card_status)}</span>`;
  if (a.last_closed) { const [o, d] = a.last_closed.split("|"); return `<span class="badge ${esc(outcomeCls(o))}" data-tip="Last action closed ${fdate(d)} with outcome ${esc(o)}">${ic("check", "width:11px;height:11px;display:inline-flex")}${esc(o)}</span>`; }
  return '<span class="muted small">No action</span>';
}
const reasonChip = (code, label) => `<span class="chip">${icS(REASON_ICON[code] || "info", 12)}${esc(label)}</span>`;
function bindRowLinks(el) {
  $$("[data-href]", el).forEach((tr) => tr.addEventListener("click", (e) => { if (!e.target.closest("button,a")) location.hash = tr.dataset.href; }));
}
function greeting() { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; }

// ------------------------------------------------------------------ dashboard
async function viewDashboard(el, _p, alive) {
  const s = await api("/api/summary" + (S.user ? `?user_id=${S.user}` : ""));
  if (!alive()) return;
  const tiers = ["High", "Medium", "Low"].map((t) => s.tiers.find((x) => x.tier === t) || { tier: t, n: 0, arr: 0, arr_at_risk: 0 });
  const me = S.teamById[S.user];
  const first = me ? me.name.split(" ")[0] : "there";
  el.innerHTML = `
    <div class="hero">
      <div class="h-main">
        <div class="eyebrow">${greeting()}, ${esc(first)}</div>
        <h2>${num(s.high_risk + s.medium_risk)} accounts need attention</h2>
        <p><b>${money(s.arr_at_risk)}</b> of ARR could churn in the next 60 days. You have <b>${s.suggested_cards}</b> new suggested actions
          and <b>${s.overdue_cards}</b> overdue ${s.overdue_cards === 1 ? "action" : "actions"}.</p>
      </div>
      <div class="h-actions">
        <a class="btn light" href="#/board">${ic("kanban")}Review suggestions</a>
        <a class="btn glass" href="#/accounts">View at-risk accounts</a>
      </div>
    </div>

    <div class="grid kpis mt">
      ${kpi({ label: "Total ARR", value: money(s.arr), foot: `${num(s.accounts)} active accounts`, tone: "primary", icon: "dollar", tip: "Annual recurring revenue across all active accounts" })}
      ${kpi({ label: "ARR at risk", value: money(s.arr_at_risk), foot: `${pct(s.arr_at_risk / s.arr, 1)} of total ARR, next 60 days`, tone: "high", icon: "fire", tip: "Sum of churn probability x ARR across active accounts" })}
      ${kpi({ label: "High-risk accounts", value: num(s.high_risk), foot: `Plus ${num(s.medium_risk)} at medium risk`, tone: "med", icon: "alert", tip: "Accounts with a 20% or higher chance of churning in 60 days" })}
      ${kpi({ label: "ARR saved (90 days)", value: money(s.arr_saved_90d), foot: `${num(s.saved_90d)} accounts &middot; ${pct(s.save_rate_90d)} save rate`, tone: "low", icon: "shield", tip: "ARR of accounts whose action closed as Saved in the last 90 days" })}
    </div>

    <div class="grid cols-main mt">
      <div class="panel">
        <div class="panel-h"><div class="h-txt"><h3>Top accounts by revenue at risk</h3><span class="sub">Churn probability x lifetime value</span></div><a class="btn sm" href="#/accounts">View all ${ic("arrowRight")}</a></div>
        <div class="panel-b flush"><div class="table-wrap"><table class="compact">
          <thead><tr><th>Account</th><th>Churn risk</th><th class="num">At risk</th><th>Action</th></tr></thead>
          <tbody>${s.top_accounts.map((a) => `<tr class="clickable" data-href="#/account/${a.id}">
            <td><div class="acc-cell">${logo(a.name, "sm")}<div class="ellipsis"><div class="acc-name ellipsis">${esc(a.name)}</div><div class="acc-sub">${money(a.mrr * 12)} ARR &middot; ${esc(a.reason_label)}</div></div></div></td>
            <td>${riskBar(a.churn_prob)}</td><td class="num strong-num">${money(a.revenue_at_risk)}</td><td>${actionPill(a)}</td></tr>`).join("")}</tbody></table></div></div>
      </div>
      <div class="panel">
        <div class="panel-h"><div class="h-txt"><h3>My queue</h3><span class="sub">${me ? `Open actions for ${esc(me.name)}` : "Choose who you are, top right"}</span></div><a class="btn sm" href="#/board">Board</a></div>
        <div class="panel-b flush">${!S.user ? emptyState("user", 'Pick your name in "Acting as" (top right) to see your queue.') :
          s.my_cards.length ? s.my_cards.map((c) => { const d = daysUntil(c.due_date); return `<div class="list-item clickable" data-card="${c.id}">
            ${logo(c.account_name, "sm")}<div class="li-main"><div class="li-title">${esc(c.account_name)}</div><div class="li-sub">${esc(c.title)}</div></div>
            <div style="text-align:right;flex-shrink:0"><span class="badge ${c.priority}">${c.priority}</span><div class="small" style="margin-top:4px;color:${d < 0 ? "var(--high)" : "var(--muted)"}">${d < 0 ? `${-d}d overdue` : d === 0 ? "Due today" : `Due ${sdate(c.due_date)}`}</div></div></div>`; }).join("")
          : emptyState("check", "Nothing open. Nice work!")}</div>
      </div>
    </div>

    <div class="grid cols-2 mt">
      <div class="panel"><div class="panel-h"><div class="h-txt"><h3>Accounts by risk tier</h3><span class="sub">Likelihood of churning in the next 60 days</span></div></div>
        <div class="panel-b">${donut(tiers.map((t) => ({ label: `${t.tier} risk`, sub: `${num(t.n)} accounts`, value: t.n, display: money(t.arr), color: tierColor(t.tier) })), num(s.accounts), "accounts")}</div></div>
      <div class="panel"><div class="panel-h"><div class="h-txt"><h3>Where the risk comes from</h3><span class="sub">ARR at risk by main churn reason (high and medium risk)</span></div></div>
        <div class="panel-b">${hbars(s.by_reason.slice(0, 6).map((r) => ({ label: r.label, sub: `${r.n} accounts`, value: r.arr_at_risk })), { fmt: money, color: "linear-gradient(90deg,#ff9a9c,#e5484d)" })}</div></div>
    </div>

    <div class="panel mt"><div class="panel-h"><div class="h-txt"><h3>Churned MRR per month</h3><span class="sub">Last 12 months: voluntary cancellations vs failed payments</span></div></div>
      <div class="panel-b">${barChart({ labels: s.churn_trend.map((m) => m.month), series: [
        { name: "Voluntary", color: "#8b7dff", values: s.churn_trend.map((m) => m.mrr - m.involuntary) },
        { name: "Involuntary (payment failure)", color: "#ffb547", values: s.churn_trend.map((m) => m.involuntary) }], fmt: money, width: 1100, height: 280 })}</div></div>`;
  bindRowLinks(el);
  $$("[data-card]", el).forEach((r) => r.addEventListener("click", () => openCard(Number(r.dataset.card), rerender)));
}

// ------------------------------------------------------------------ accounts
const AF = { search: "", tier: "", segment: "", owner_id: "", reason: "", status: "active", sort: "rar", order: "desc", page: 1 };
const opt = (v, l, cur) => `<option value="${esc(v)}" ${String(cur) === String(v) ? "selected" : ""}>${esc(l)}</option>`;

async function viewAccounts(el, _p, alive) {
  el.innerHTML = `<div class="panel">
    <div class="toolbar">
      <label class="search">${ic("search")}<input type="search" id="af-search" placeholder="Search account or champion" value="${esc(AF.search)}"></label>
      <select id="af-tier">${opt("", "All risk tiers", AF.tier)}${["High", "Medium", "Low"].map((t) => opt(t, `${t} risk`, AF.tier)).join("")}</select>
      <select id="af-segment">${opt("", "All segments", AF.segment)}${["SMB", "Mid-Market", "Enterprise"].map((t) => opt(t, t, AF.segment)).join("")}</select>
      <select id="af-owner">${opt("", "All owners", AF.owner_id)}${S.team.map((t) => opt(t.id, t.name, AF.owner_id)).join("")}</select>
      <select id="af-reason">${opt("", "All reasons", AF.reason)}${Object.entries(S.meta.reasons).filter(([k]) => k !== "EXPANSION").map(([k, v]) => opt(k, v, AF.reason)).join("")}</select>
      <select id="af-status">${opt("active", "Active", AF.status)}${opt("churned", "Churned", AF.status)}${opt("all", "All statuses", AF.status)}</select>
      <span class="spacer"></span>
      <button class="btn" id="af-export">${ic("download")}Export CSV</button>
    </div>
    <div id="acc-table"><div class="loading"><span class="spinner"></span></div></div></div>`;
  const load = async () => {
    const q = new URLSearchParams({ ...AF, page_size: 25 });
    if (!AF.owner_id) q.delete("owner_id");
    const d = await api("/api/accounts?" + q);
    if (!alive()) return;
    const cols = [["name", "Account"], ["risk", "Churn risk"], ["mrr", "ARR / renewal", "num"], ["rar", "Revenue at risk", "num"], [null, "Top reason", "hide-md"], [null, "Owner", "hide-md"], [null, "Action"]];
    const pages = Math.max(1, Math.ceil(d.total / d.page_size));
    $("#acc-table", el).innerHTML = `<div class="table-wrap"><table><thead><tr>${cols.map(([k, l, c]) => `<th class="${c || ""} ${k ? "sortable" : ""} ${AF.sort === k ? "sorted" : ""}" ${k ? `data-sort="${k}"` : ""}>${l}${AF.sort === k ? (AF.order === "asc" ? " &uarr;" : " &darr;") : ""}</th>`).join("")}</tr></thead>
      <tbody>${d.items.map((a) => `<tr class="clickable" data-href="#/account/${a.id}">
        <td><div class="acc-cell">${logo(a.name, "sm")}<div class="ellipsis"><div class="acc-name ellipsis">${esc(a.name)}</div><div class="acc-sub">${esc(a.segment)} &middot; ${esc(a.plan)} &middot; ${num(a.seats)} seats</div></div></div></td>
        <td>${a.status === "churned" ? `<span class="badge Churned">Churned ${sdate(a.churn_date)}</span>` : riskBar(a.churn_prob)}</td>
        <td class="num"><div>${money(a.mrr * 12)}</div><div class="acc-sub">${a.renewal_date ? `renews ${sdate(a.renewal_date)}` : ""}</div></td><td class="num strong-num">${money(a.revenue_at_risk)}</td>
        <td class="hide-md">${a.reason_label ? reasonChip(a.top_reason, a.reason_label) : '<span class="muted">-</span>'}</td>
        <td class="hide-md">${avatar(a.owner_name, a.owner_color, true)}</td><td>${a.status === "churned" ? "" : actionPill(a)}</td></tr>`).join("") || `<tr><td colspan="7">${emptyState("search", "No accounts match these filters.")}</td></tr>`}</tbody></table></div>
      <div class="pager"><span><b style="color:var(--text)">${num(d.total)}</b> accounts</span><span class="spacer"></span>
        <button class="btn sm" id="pg-prev" ${AF.page <= 1 ? "disabled" : ""}>${ic("arrowLeft")}Previous</button><span>Page ${AF.page} of ${pages}</span>
        <button class="btn sm" id="pg-next" ${AF.page >= pages ? "disabled" : ""}>Next${ic("arrowRight")}</button></div>`;
    renderIcons(el);
    bindRowLinks(el);
    $$("th[data-sort]", el).forEach((th) => th.addEventListener("click", () => {
      const k = th.dataset.sort;
      if (AF.sort === k) AF.order = AF.order === "asc" ? "desc" : "asc"; else { AF.sort = k; AF.order = k === "name" || k === "renewal" ? "asc" : "desc"; }
      AF.page = 1; load().catch(fail);
    }));
    $("#pg-prev", el).onclick = () => { AF.page--; load().catch(fail); };
    $("#pg-next", el).onclick = () => { AF.page++; load().catch(fail); };
  };
  const bind = (id, key) => $(id, el).addEventListener("change", (e) => { AF[key] = e.target.value; AF.page = 1; load().catch(fail); });
  bind("#af-tier", "tier"); bind("#af-segment", "segment"); bind("#af-owner", "owner_id"); bind("#af-reason", "reason"); bind("#af-status", "status");
  $("#af-search", el).addEventListener("input", debounce((e) => { AF.search = e.target.value.trim(); AF.page = 1; load().catch(fail); }));
  $("#af-export", el).onclick = () => {
    const q = new URLSearchParams(AF); ["sort", "order", "page"].forEach((k) => q.delete(k)); if (!AF.owner_id) q.delete("owner_id");
    window.location.href = "/api/export/accounts.csv?" + q;
  };
  await load();
}

// ------------------------------------------------------------------ account detail
const reasonHtml = (r) => `<div class="reason"><div class="w"><b>${r.weight ? pct(r.weight) : "!"}</b><div class="mini"><div style="width:${Math.round((r.weight || 1) * 100)}%"></div></div></div>
  <div class="r-t"><b>${esc(r.label)}</b><span>${esc(r.text)}</span></div></div>`;
const listIcon = (name, bg, fg) => `<span class="logo sm" style="background:${bg};color:${fg}">${icS(name, 15)}</span>`;
const miniStat = (l, v, color = "") => `<div class="mini-stat"><div class="l">${l}</div><div class="v" ${color ? `style="color:${color}"` : ""}>${esc(v)}</div></div>`;

async function viewAccount(el, params, alive) {
  const d = await api("/api/accounts/" + Number(params[0]));
  if (!alive()) return;
  const a = d.account, s = d.score;
  setTitle(a.name, `${a.segment} account · ${a.industry}`);
  const openC = d.cards.find((c) => c.status !== "Done");
  const rec = s && s.recommendation;
  const f = (s && s.features) || {};
  const h = hashHue(a.name);
  const sevColors = (sev) => sev === "High" ? ["var(--high-soft)", "var(--high)"] : sev === "Medium" ? ["var(--med-soft)", "var(--med)"] : ["#f0f1f6", "var(--muted)"];
  const tabs = [
    { k: "tickets", l: "Support tickets", n: d.tickets.length },
    { k: "payments", l: "Payments", n: d.payments.length },
    { k: "nps", l: "NPS", n: d.nps.length },
    { k: "actions", l: "Action history", n: d.cards.length },
  ];
  const tabBody = {
    tickets: d.tickets.length ? d.tickets.map((t) => `<div class="list-item">${listIcon("life", ...sevColors(t.severity))}
      <div class="li-main"><div class="li-title">${esc(t.subject)}</div><div class="li-sub">${fdate(t.created_at)} &middot; ${esc(t.category)} &middot; resolved in ${Math.round(t.resolution_hours)}h</div></div>
      ${t.sentiment === "Negative" ? '<span class="badge High">Negative</span>' : ""}<span class="badge ${t.severity === "High" ? "High" : t.severity === "Medium" ? "Medium" : "neutral"}">${esc(t.severity)}</span></div>`).join("") : emptyState("inbox", "No support tickets"),
    payments: d.payments.length ? d.payments.map((p) => `<div class="list-item">${listIcon("card", "#f0f1f6", "var(--text-2)")}
      <div class="li-main"><div class="li-title">${money(p.amount, false)}</div><div class="li-sub">${fdate(p.date)}</div></div>
      <span class="badge ${p.status === "failed" ? "High" : p.status === "recovered" ? "info" : "Low"}">${esc(p.status)}</span></div>`).join("") : emptyState("card", "No payments"),
    nps: d.nps.length ? `<div class="nps-row">${d.nps.map((n) => `<div class="nps"><b style="color:${n.score >= 9 ? "var(--low)" : n.score >= 7 ? "var(--med)" : "var(--high)"}">${n.score}</b><span class="acc-sub">${sdate(n.date)}</span></div>`).join("")}</div>` : emptyState("smile", "No NPS responses yet"),
    actions: d.cards.length ? d.cards.map((c) => `<div class="list-item clickable" data-card="${c.id}">${listIcon("kanban", "var(--primary-soft)", "var(--primary)")}
      <div class="li-main"><div class="li-title">${esc(c.title)}</div><div class="li-sub">${fdate(c.created_at)} &middot; ${esc(c.owner_name || "")}</div></div>
      ${c.status === "Done" ? `<span class="badge ${esc(outcomeCls(c.outcome))}">${esc(c.outcome)}</span>` : `<span class="badge primary">${esc(c.status)}</span>`}</div>`).join("") : emptyState("kanban", "No actions yet"),
  };
  const ctaBtn = (id, full) => openC
    ? `<button class="btn primary" ${full ? 'style="width:100%"' : ""} data-card="${openC.id}">${ic("kanban")}View action card${full ? ` &middot; ${esc(openC.status)}` : ""}</button>`
    : `<button class="btn primary" ${full ? 'style="width:100%"' : ""} id="${id}">${ic("plus")}Create action card</button>`;

  el.innerHTML = `
    <a class="btn ghost sm" href="#/accounts" style="margin:-6px 0 14px -8px">${ic("arrowLeft")}All accounts</a>
    <div class="panel acc-hero">
      <div class="band" style="background:linear-gradient(120deg,hsl(${h} 75% 62%),hsl(${(h + 40) % 360} 70% 48%))"></div>
      <div class="ah-body">
        ${logo(a.name, "lg")}
        <div class="ah-main">
          <div class="row wrap"><h2>${esc(a.name)}</h2>
            ${a.status === "churned" ? `<span class="badge Churned">Churned ${fdate(a.churn_date)} &middot; ${esc(a.churn_type)}</span>` : tierBadge(s && s.risk_tier)}
            ${a.is_control ? '<span class="badge neutral" data-tip="10% of accounts are held out from automated actions to measure true impact">Control group</span>' : ""}</div>
          <div class="meta-row">
            <span class="meta">${ic("grid")}${esc(a.industry)} &middot; ${esc(a.region)}</span>
            <span class="meta">${ic("card")}<b>${esc(a.plan)}</b> &middot; ${esc(a.billing_cycle)} &middot; ${esc(a.payment_method)}</span>
            <span class="meta">${ic("users")}<b>${num(a.seats)}</b> seats</span>
            <span class="meta">${ic("clock")}Customer since <b>${fdate(a.signup_date)}</b></span>
            ${a.renewal_date ? `<span class="meta">${ic("calendar")}Renews <b>${fdate(a.renewal_date)}</b></span>` : ""}
            <span class="meta">${avatar(a.owner_name, a.owner_color, true)}Owner <b>${esc(a.owner_name)}</b></span>
            <span class="meta">${ic("user")}Champion <b>${esc(a.champion_name)}</b></span>
          </div>
        </div>
        ${a.status === "active" ? `<div class="row">${ctaBtn("create-card", false)}</div>` : ""}
      </div>
    </div>

    ${s ? `<div class="grid kpis mt">
      ${kpi({ label: "ARR", value: money(a.mrr * 12), foot: `${money(a.mrr)} per month`, tone: "primary", icon: "dollar" })}
      ${kpi({ label: "Lifetime value", value: money(s.ltv), foot: "If the customer is retained", tone: "blue", icon: "target", tip: "MRR x 80% gross margin x expected lifetime for this segment" })}
      ${kpi({ label: "Revenue at risk", value: money(s.revenue_at_risk), foot: "Churn risk x lifetime value", tone: "high", icon: "fire" })}
      ${kpi({ label: "Seat utilisation", value: pct(f.seat_utilization), foot: `${Math.round(f.active_users_4w || 0)} of ${num(a.seats)} seats active weekly`, tone: "med", icon: "users" })}
    </div>` : ""}

    <div class="grid cols-side mt">
      <div class="stack">
        <div class="panel"><div class="panel-h"><div class="h-txt"><h3>Product usage</h3><span class="sub">Weekly active users vs paid seats, last 26 weeks</span></div></div><div class="panel-b">
          ${d.usage.length ? lineChart({ labels: d.usage.map((u) => sdate(u.week_start)), series: [
            { name: "Paid seats", color: "#b5b9cc", dash: true, values: d.usage.map((u) => u.seats) },
            { name: "Weekly active users", color: "#5b4cf0", area: true, values: d.usage.map((u) => u.active_users) }], fmt: (v) => Math.round(v) }) : emptyState("activity", "No usage data")}
          ${s ? `<div class="mini-stats">
            ${miniStat("Active-user trend", (f.active_users_trend >= 0 ? "+" : "") + pct(f.active_users_trend), f.active_users_trend < -0.1 ? "var(--high)" : "")}
            ${miniStat("Core features used", (f.features_used ?? 0).toFixed(1) + " / 10")}
            ${miniStat("Champion inactive", (f.champion_inactive_weeks ?? 0) + " of 4 wks", f.champion_inactive_weeks >= 2 ? "var(--high)" : "")}
            ${miniStat("Tickets (90 days)", num(f.tickets_90d))}</div>` : ""}
        </div></div>
        <div class="panel"><div class="panel-h"><div class="tabs" id="acc-tabs">${tabs.map((t, i) => `<button class="tab ${i === 0 ? "active" : ""}" data-tab="${t.k}">${t.l}<span class="cnt">${t.n}</span></button>`).join("")}</div></div>
          <div class="panel-b flush" id="tab-body" style="padding-top:12px">${tabBody.tickets}</div></div>
      </div>
      <div class="stack sticky">
        ${s ? `<div class="panel"><div class="risk-card">
            <div class="small muted">Chance of churning in the next 60 days</div>
            <div class="gauge" style="margin-top:10px">${gauge(s.churn_prob)}</div>
            <div class="row" style="justify-content:center;margin-top:8px">${tierBadge(s.risk_tier)}</div></div>
          <div class="panel-b" style="padding-top:0"><div class="section-t" style="margin-top:4px">Why this account is at risk</div>
            ${s.reasons.map(reasonHtml).join("")}
            <div class="metric-help">Each percentage is that reason's share of the risk, from the model's explanation for this account.</div></div></div>` :
          `<div class="panel panel-b"><div class="callout warn">${ic("alert")}<div>This account churned on <b>${fdate(a.churn_date)}</b> (${esc(a.churn_type)}). It is no longer scored.</div></div></div>`}
        ${rec && a.status === "active" ? `<div class="panel"><div class="panel-b"><div class="rec-box">
          <div class="row wrap"><span class="badge primary">${icS("rocket", 12)}Recommended action</span><span class="badge ${rec.priority}">${rec.priority} priority</span></div>
          <h4>${esc(rec.action_title)}</h4><div class="desc">${esc(rec.description)}</div>
          <ol class="steps">${rec.steps.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
          ${rec.alternatives && rec.alternatives.length ? `<div class="metric-help">Also consider: ${rec.alternatives.map((x) => esc(x.action_title)).join(" &middot; ")}</div>` : ""}
          <div style="margin-top:16px">${ctaBtn("create-card-2", true)}</div>
          ${a.is_control && !openC ? '<div class="metric-help">This account is in the control group, so no card is created automatically. You can still create one manually.</div>' : ""}
        </div></div></div>` : ""}
      </div>
    </div>`;
  renderIcons(el);
  const bindCards = (root) => $$("[data-card]", root).forEach((b) => b.addEventListener("click", () => openCard(Number(b.dataset.card), rerender)));
  bindCards(el);
  $$("#acc-tabs .tab", el).forEach((t) => t.addEventListener("click", () => {
    $$("#acc-tabs .tab", el).forEach((x) => x.classList.toggle("active", x === t));
    const body = $("#tab-body", el);
    body.innerHTML = tabBody[t.dataset.tab];
    renderIcons(body);
    bindCards(body);
  }));
  const create = async (btn) => {
    btn.disabled = true;
    try {
      const c = await api("/api/cards", { method: "POST", body: { account_id: a.id, actor_id: S.user } });
      toast("Action card created in To Do", "success", { label: "Open board", fn: () => (location.hash = "#/board") });
      await rerender();
      openCard(c.id, rerender);
      refreshBoardCount();
    } catch (e) { fail(e); btn.disabled = false; }
  };
  ["#create-card", "#create-card-2"].forEach((id) => { const b = $(id, el); if (b) b.onclick = () => create(b); });
}

// ------------------------------------------------------------------ board
const BF = { owner_id: "", search: "", priority: "", done_days: 30, tab: "Suggested", sort: "priority" };
const PRIO_RANK = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
const TAB_INFO = {
  Suggested: { label: "Suggested", hint: "New risks found by the model. Accept to start working on them, or dismiss.", icon: "bot", empty: "No new suggestions right now. Re-score accounts on the Churn Model page to look for new risks." },
  "To Do": { label: "To Do", hint: "Accepted and ready to start.", icon: "inbox", empty: "Nothing waiting to be started." },
  "In Progress": { label: "In Progress", hint: "Someone is actively working on it.", icon: "activity", empty: "Nothing in progress. Start a card from To Do." },
  "Waiting on Customer": { label: "Waiting", hint: "Reached out, waiting for the customer to reply.", icon: "clock", empty: "No cards waiting on customers." },
  Done: { label: "Done", hint: "Closed with an outcome.", icon: "check", empty: "No completed cards in this period." },
};
const NEXT_STEP = {
  "To Do": { to: "In Progress", label: "Start", icon: "arrowRight" },
  "In Progress": { to: "Done", label: "Complete", icon: "check" },
  "Waiting on Customer": { to: "Done", label: "Complete", icon: "check" },
};

async function viewBoard(el, _p, alive) {
  el.innerHTML = `
    <div class="status-tabs" id="status-tabs"></div>
    <div class="board-bar">
      <label class="search">${ic("search")}<input type="search" id="bf-search" placeholder="Search account or action" value="${esc(BF.search)}"></label>
      <select id="bf-owner">${opt("", "Everyone", BF.owner_id)}${S.team.map((t) => opt(t.id, t.name, BF.owner_id)).join("")}</select>
      <select id="bf-priority">${opt("", "All priorities", BF.priority)}${S.meta.priorities.map((p) => opt(p, p, BF.priority)).join("")}</select>
      <select id="bf-sort">${opt("priority", "Sort: Priority", BF.sort)}${opt("rar", "Sort: Revenue at risk", BF.sort)}${opt("due", "Sort: Due date", BF.sort)}${opt("arr", "Sort: ARR", BF.sort)}</select>
      <span id="done-range"></span>
      ${S.user ? `<button class="btn ${String(BF.owner_id) === String(S.user) ? "primary" : ""}" id="bf-mine">${ic("user")}My cards</button>` : ""}
    </div>
    <div id="board"><div class="loading"><span class="spinner"></span></div></div>`;
  renderIcons(el);
  let cards = [];
  const load = async () => {
    const q = new URLSearchParams({ done_days: BF.done_days });
    if (BF.owner_id) q.set("owner_id", BF.owner_id);
    if (BF.search) q.set("search", BF.search);
    if (BF.priority) q.set("priority", BF.priority);
    cards = await api("/api/cards?" + q);
    if (!alive()) return;
    draw();
  };
  const draw = () => {
    const open = cards.filter((c) => c.status !== "Done" && c.status !== "Suggested");
    const overdue = open.filter((c) => daysUntil(c.due_date) < 0).length;
    const week = open.filter((c) => { const dd = daysUntil(c.due_date); return dd >= 0 && dd <= 7; }).length;
    renderTabs($("#status-tabs", el), cards, load, draw);
    const dr = $("#done-range", el);
    dr.innerHTML = BF.tab === "Done" ? `<select id="bf-done">${opt(7, "Done: last 7 days", BF.done_days)}${opt(30, "Done: last 30 days", BF.done_days)}${opt(90, "Done: last 90 days", BF.done_days)}</select>` : "";
    const ds = $("#bf-done", el);
    if (ds) ds.onchange = (e) => { BF.done_days = Number(e.target.value); load().catch(fail); };
    renderCardGrid($("#board", el), cards, load);
    $("#board-stats", el).innerHTML = [[num(open.length), "active", "var(--primary)"], [num(overdue), "overdue", "var(--high)"], [num(week), "due this week", "var(--med)"]]
      .map(([v, l, c]) => `<span class="bs"><span class="dot" style="background:${c}"></span><b>${v}</b>${l}</span>`).join("");
  };
  const syncMine = () => { const m = $("#bf-mine", el); if (m) m.classList.toggle("primary", String(BF.owner_id) === String(S.user)); };
  const bind = (id, key) => $(id, el).addEventListener("change", (e) => { BF[key] = e.target.value; syncMine(); load().catch(fail); });
  bind("#bf-owner", "owner_id"); bind("#bf-priority", "priority");
  $("#bf-sort", el).addEventListener("change", (e) => { BF.sort = e.target.value; draw(); });
  $("#bf-search", el).addEventListener("input", debounce((e) => { BF.search = e.target.value.trim(); load().catch(fail); }));
  const mine = $("#bf-mine", el);
  if (mine) mine.onclick = () => { BF.owner_id = String(BF.owner_id) === String(S.user) ? "" : String(S.user); $("#bf-owner", el).value = BF.owner_id; syncMine(); load().catch(fail); };
  await load();
}

function renderTabs(root, cards, reload, redraw) {
  root.innerHTML = S.meta.statuses.map((s) => {
    const list = cards.filter((c) => c.status === s);
    const arr = list.reduce((t, c) => t + (c.account_mrr || 0) * 12, 0);
    const late = s !== "Done" && s !== "Suggested" ? list.filter((c) => daysUntil(c.due_date) < 0).length : 0;
    return `<button class="stab ${BF.tab === s ? "active" : ""}" data-status="${s}" data-tip="${esc(TAB_INFO[s].hint)}">
      <span class="stab-ico" style="--c:${STATUS_COLOR[s]}">${ic(TAB_INFO[s].icon)}</span>
      <span class="stab-txt"><span class="stab-l">${TAB_INFO[s].label}</span><span class="stab-s">${late ? `<b class="late">${late} overdue</b>` : `${money(arr)} ARR`}</span></span>
      <span class="stab-n">${list.length}</span></button>`;
  }).join("");
  renderIcons(root);
  $$(".stab", root).forEach((t) => {
    t.addEventListener("click", () => { BF.tab = t.dataset.status; redraw(); });
    t.addEventListener("dragover", (e) => { e.preventDefault(); t.classList.add("drag-over"); });
    t.addEventListener("dragleave", () => t.classList.remove("drag-over"));
    t.addEventListener("drop", (e) => {
      e.preventDefault(); t.classList.remove("drag-over");
      const card = cards.find((c) => c.id === Number(e.dataTransfer.getData("text/plain")));
      if (!card || card.status === t.dataset.status) return;
      if (t.dataset.status === "Done") completeDialog(card, reload); else moveCard(card.id, t.dataset.status, reload);
    });
  });
}

function sortCards(list) {
  const by = {
    priority: (a, b) => (PRIO_RANK[a.priority] - PRIO_RANK[b.priority]) || (b.live_rar || 0) - (a.live_rar || 0),
    rar: (a, b) => (b.live_rar || b.rar_at_creation || 0) - (a.live_rar || a.rar_at_creation || 0),
    due: (a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"),
    arr: (a, b) => (b.account_mrr || 0) - (a.account_mrr || 0),
  };
  if (BF.tab === "Done" && BF.sort === "priority") return list.sort((a, b) => (b.completed_at || "").localeCompare(a.completed_at || ""));
  return list.sort(by[BF.sort] || by.priority);
}

function renderCardGrid(root, cards, reload) {
  const list = sortCards(cards.filter((c) => c.status === BF.tab));
  const info = TAB_INFO[BF.tab];
  root.innerHTML = `<div class="grid-head"><span class="sdot" style="background:${STATUS_COLOR[BF.tab]}"></span><h3>${BF.tab}</h3><span class="count-pill">${list.length}</span><span class="muted small">${info.hint}</span>
      <span class="spacer"></span><div class="bstats" id="board-stats"></div></div>
    ${list.length ? `<div class="card-grid">${list.map(cardHtml).join("")}</div>` : `<div class="panel">${emptyState(info.icon, info.empty)}</div>`}`;
  renderIcons(root);
  $$(".kcard", root).forEach((k) => {
    const id = Number(k.dataset.id);
    k.addEventListener("click", (e) => { if (!e.target.closest("button,.menu")) openCard(id, reload); });
    if (k.dataset.status !== "Done") {
      k.draggable = true;
      k.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", String(id)); e.dataTransfer.effectAllowed = "move"; k.classList.add("dragging"); document.body.classList.add("is-dragging"); });
      k.addEventListener("dragend", () => { k.classList.remove("dragging"); document.body.classList.remove("is-dragging"); });
    }
  });
  const byId = (id) => cards.find((c) => c.id === Number(id));
  $$("[data-accept]", root).forEach((b) => b.addEventListener("click", () => moveCard(Number(b.dataset.accept), "To Do", reload)));
  $$("[data-dismiss]", root).forEach((b) => b.addEventListener("click", () => dismissCard(Number(b.dataset.dismiss), reload)));
  $$("[data-next]", root).forEach((b) => b.addEventListener("click", () => {
    const c = byId(b.dataset.next), step = NEXT_STEP[c.status];
    if (step.to === "Done") completeDialog(c, reload); else moveCard(c.id, step.to, reload);
  }));
  $$("[data-menu]", root).forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); openMoveMenu(b, byId(b.dataset.menu), reload); }));
}

function openMoveMenu(anchor, card, reload) {
  closeMoveMenu();
  const items = S.meta.statuses.filter((s) => s !== card.status && s !== "Suggested").map((s) =>
    `<button class="menu-item" data-to="${s}"><span class="dot" style="background:${STATUS_COLOR[s]}"></span>${s === "Done" ? "Complete..." : `Move to ${s}`}</button>`).join("");
  const m = document.createElement("div");
  m.className = "menu";
  m.innerHTML = `<div class="menu-t">Move card</div>${items}<div class="menu-sep"></div><button class="menu-item" data-open>${icS("edit", 14)}Open details</button>${card.status !== "Done" ? `<button class="menu-item danger" data-dismiss-m>${icS("ban", 14)}Dismiss</button>` : ""}`;
  document.body.appendChild(m);
  renderIcons(m);
  const r = anchor.getBoundingClientRect();
  const w = 210;
  m.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w)) + "px";
  const top = r.bottom + 6;
  m.style.top = (top + m.offsetHeight > window.innerHeight - 8 ? r.top - m.offsetHeight - 6 : top) + "px";
  $$("[data-to]", m).forEach((b) => b.addEventListener("click", () => {
    closeMoveMenu();
    if (b.dataset.to === "Done") completeDialog(card, reload); else moveCard(card.id, b.dataset.to, reload);
  }));
  $("[data-open]", m).onclick = () => { closeMoveMenu(); openCard(card.id, reload); };
  const dm = $("[data-dismiss-m]", m); if (dm) dm.onclick = () => { closeMoveMenu(); dismissCard(card.id, reload); };
  setTimeout(() => document.addEventListener("click", closeMoveMenu, { once: true }), 0);
}
function closeMoveMenu() { $$(".menu").forEach((m) => m.remove()); }
window.addEventListener("scroll", closeMoveMenu, true);

function dueChip(c) {
  const d = daysUntil(c.due_date);
  if (d == null) return "";
  const late = c.status !== "Suggested" && d < 0;
  const cls = late ? "overdue" : d === 0 ? "today" : "";
  const txt = late ? `${-d}d overdue` : d === 0 ? "Due today" : `Due ${sdate(c.due_date)}`;
  return `<span class="due ${cls}" data-tip="Due ${fdate(c.due_date)}">${ic("clock")}${txt}</span>`;
}

function cardHtml(c) {
  const risk = c.live_risk != null ? c.live_risk : c.risk_at_creation;
  const done = c.status === "Done";
  const hot = !done && (c.priority === "Urgent" || c.priority === "High");
  const meta = `${done ? `<span class="badge ${esc(outcomeCls(c.outcome))}">${esc(c.outcome)}</span>` :
      risk != null ? `<span class="k-risk" style="color:${riskColor(risk)}" data-tip="Current churn risk"><span class="dot"></span>${risk < 0.01 ? "<1%" : pct(risk)} risk</span>` : ""}
    <span class="k-reason">${icS(REASON_ICON[c.reason_code] || "info", 12)}${esc(c.reason_label)}</span>`;
  let actions;
  if (c.status === "Suggested") {
    actions = `<button class="btn sm primary" data-accept="${c.id}">${ic("check")}Accept</button><button class="btn sm" data-dismiss="${c.id}">Dismiss</button>`;
  } else if (done) {
    actions = `<span class="due">${ic("check")}Closed ${sdate(c.completed_at)}</span>`;
  } else {
    const step = NEXT_STEP[c.status];
    actions = `${dueChip(c)}<span class="spacer"></span><button class="btn sm ${step.to === "Done" ? "success" : "primary"}" data-next="${c.id}">${ic(step.icon)}${step.label}</button>`;
  }
  return `<div class="kcard ${done ? "done" : ""} ${hot ? `hot-${c.priority}` : ""}" data-id="${c.id}" data-status="${c.status}">
    <div class="k-head">${logo(c.account_name, "sm")}<div class="k-who"><div class="k-acc">${esc(c.account_name)}</div><div class="k-sub">${esc(c.segment)} &middot; ${money((c.account_mrr || 0) * 12)} ARR</div></div>
      ${!done ? `<span class="k-prio ${c.priority}" data-tip="${c.priority} priority">${c.priority}</span>` : ""}
      <button class="icon-btn sm k-more" data-menu="${c.id}" data-tip="More actions">${ic("menu")}</button></div>
    <div class="k-title">${esc(c.title)}</div>
    <div class="k-meta">${meta}</div>
    <div class="k-foot">${avatar(c.owner_name, c.owner_color, true)}<span class="k-owner">${esc((c.owner_name || "").split(" ")[0])}</span>${c.status === "Suggested" || done ? '<span class="spacer"></span>' : ""}${actions}</div>
  </div>`;
}

async function moveCard(id, status, reload) {
  try {
    await api(`/api/cards/${id}`, { method: "PATCH", body: { status, actor_id: S.user } });
    toast(`Moved to ${status}`, "success");
    await reload();
    refreshBoardCount();
  } catch (e) { fail(e); }
}
async function dismissCard(id, reload) {
  try {
    await api(`/api/cards/${id}/dismiss`, { method: "POST", body: { actor_id: S.user } });
    toast("Suggestion dismissed");
    closeModal(true);
    await reload();
    refreshBoardCount();
  } catch (e) { fail(e); }
}

const OUTCOME_HELP = {
  Saved: "Staying on the same plan or better",
  Downgraded: "Stayed, but reduced seats or plan",
  Churned: "Cancelled despite the action",
  "No response": "Could not reach the customer",
  Expanded: "Customer bought more seats or upgraded",
  "Not now": "Interested later, not this quarter",
};
function completeDialog(card, reload) {
  const m = openModal(`<div class="modal-h"><div style="flex:1;min-width:0"><h2>Complete this action</h2><div class="small muted ellipsis" style="margin-top:3px">${esc(card.account_name)} &middot; ${esc(card.title)}</div></div><button class="icon-btn" data-close>${ic("x")}</button></div>
    <div class="modal-b">
      <div class="section-t" style="margin-top:6px">What was the outcome?</div>
      <div class="outcomes">${(card.reason_code === "EXPANSION" ? S.meta.expansion_outcomes : S.meta.outcomes).map((o) => `<label class="outcome-opt"><input type="radio" name="outcome" value="${o}"><div><b>${o}</b><span>${OUTCOME_HELP[o]}</span></div></label>`).join("")}</div>
      <label class="field" style="margin-top:18px">What did you do?<input type="text" id="c-action" value="${esc(card.title)}"></label>
      <label class="field" style="margin-top:14px">Notes (optional)<textarea id="c-note" placeholder="e.g. Ran a workshop with 12 users and agreed a 30-day success plan"></textarea></label>
      <div class="metric-help">Outcomes teach RevenueIQ which actions work. They feed the Impact page.</div>
    </div>
    <div class="modal-f"><button class="btn" data-close>Cancel</button><button class="btn success" id="c-save" disabled>${ic("check")}Complete card</button></div>`);
  $$(".outcome-opt", m).forEach((o) => o.addEventListener("change", () => { $$(".outcome-opt", m).forEach((x) => x.classList.toggle("sel", x.querySelector("input").checked)); $("#c-save", m).disabled = false; }));
  $("#c-save", m).onclick = async () => {
    const outcome = (m.querySelector("input[name=outcome]:checked") || {}).value;
    const btn = $("#c-save", m);
    btn.disabled = true;
    try {
      await api(`/api/cards/${card.id}/complete`, { method: "POST", body: { outcome, action_taken: $("#c-action", m).value, note: $("#c-note", m).value, actor_id: S.user } });
      closeModal(true);
      toast(`Card completed: ${outcome}`, outcome === "Saved" || outcome === "Expanded" ? "success" : "");
      await reload();
    } catch (e) { fail(e); btn.disabled = false; }
  };
}

async function openCard(id, reload = async () => {}) {
  let c;
  try { c = await api(`/api/cards/${id}`); } catch (e) { return fail(e); }
  const done = c.status === "Done";
  const risk = c.live_risk != null ? c.live_risk : c.risk_at_creation;
  const m = openModal(`
    <div class="drawer-h">
      <div class="row"><span style="width:10px;height:10px;border-radius:50%;flex-shrink:0;background:${STATUS_COLOR[c.status]}"></span><span class="small" style="font-weight:500">${esc(c.status)}</span>
        <span class="small muted ellipsis">&middot; #${c.id} &middot; ${c.source === "manual" ? "created manually" : "suggested by RevenueIQ"} ${relTime(c.created_at)}</span><span class="spacer"></span><button class="icon-btn" data-close>${ic("x")}</button></div>
      <h2>${esc(c.title)}</h2>
      <div class="row wrap" style="margin-top:10px"><span class="badge ${c.priority}">${c.priority} priority</span>${reasonChip(c.reason_code, c.reason_label)}
        ${done ? `<span class="badge ${esc(outcomeCls(c.outcome))}">${esc(c.outcome)}</span>` : ""}</div>
      <a class="acc-strip" href="#/account/${c.account_id}" style="color:inherit">${logo(c.account_name, "sm")}<div style="min-width:0"><div class="acc-name ellipsis">${esc(c.account_name)}</div><div class="acc-sub">${esc(c.segment)} &middot; open account</div></div>
        <div class="as-stats"><div><b>${money((c.account_mrr || 0) * 12)}</b><span>ARR</span></div>${risk != null ? `<div><b style="color:${riskColor(risk)}">${pct(risk)}</b><span>Churn risk</span></div>` : ""}${c.live_rar ? `<div><b>${money(c.live_rar)}</b><span>At risk</span></div>` : ""}</div></a>
    </div>
    <div class="drawer-b">
      ${c.account_status === "churned" && !done ? `<div class="callout warn" style="margin-top:18px">${ic("alert")}<div>This account has churned. Close the card with the outcome <b>Churned</b>.</div></div>` : ""}
      ${done ? `<div class="callout ok" style="margin-top:18px">${ic("check")}<div><b>Completed ${fdate(c.completed_at)}</b>, outcome <b>${esc(c.outcome)}</b>${c.action_taken ? `<br>Action taken: ${esc(c.action_taken)}` : ""}</div></div>` : ""}
      <div class="field-grid">
        <label class="field">Status<select id="f-status" ${done ? "disabled" : ""}>${S.meta.statuses.map((s) => `<option ${s === c.status ? "selected" : ""}>${s}</option>`).join("")}</select></label>
        <label class="field">Owner<select id="f-owner" ${done ? "disabled" : ""}>${S.team.map((t) => `<option value="${t.id}" ${t.id === c.owner_id ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select></label>
        <label class="field">Priority<select id="f-priority" ${done ? "disabled" : ""}>${S.meta.priorities.map((p) => `<option ${p === c.priority ? "selected" : ""}>${p}</option>`).join("")}</select></label>
        <label class="field">Due date<input type="date" id="f-due" value="${esc((c.due_date || "").slice(0, 10))}" ${done ? "disabled" : ""}></label>
      </div>
      <div class="section-t">Why this account was flagged</div>
      ${c.reasons.length ? c.reasons.map(reasonHtml).join("") : `<div class="small muted">${esc(c.description || "")}</div>`}
      <div class="section-t">Playbook steps</div>
      <ol class="steps">${c.steps.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
      <div class="section-t">Activity</div>
      <div class="timeline">${c.activity.map(activityHtml).join("")}</div>
      <div class="comment-box"><textarea id="f-comment" placeholder="Add a note: call summary, next step, blocker..."></textarea>
        <div class="cb-f"><button class="btn sm primary" id="f-comment-btn">${ic("msg")}Add note</button></div></div>
    </div>
    <div class="drawer-f">
      ${done ? `<button class="btn" id="f-reopen">${ic("refresh")}Reopen</button>` : `<button class="btn danger" id="f-dismiss">${ic("ban")}Dismiss</button>`}
      <span class="spacer"></span><button class="btn" data-close>Close</button>
      ${done ? "" : `<button class="btn success" id="f-complete">${ic("check")}Mark complete</button>`}
    </div>`, { drawer: true });
  $(".acc-strip", m).addEventListener("click", () => closeModal(true));
  const patch = async (body, msg) => {
    const pos = $(".drawer-b", m).scrollTop;
    try {
      await api(`/api/cards/${id}`, { method: "PATCH", body: { ...body, actor_id: S.user } });
      toast(msg, "success");
      await reload(); refreshBoardCount();
    } catch (e) { fail(e); }
    await openCard(id, reload);
    const b = $(".drawer-b"); if (b) b.scrollTop = pos;
  };
  if (!done) {
    $("#f-status", m).onchange = (e) => {
      if (e.target.value === "Done") { closeModal(true); completeDialog(c, reload); } else patch({ status: e.target.value }, `Moved to ${e.target.value}`);
    };
    $("#f-owner", m).onchange = (e) => patch({ owner_id: Number(e.target.value) }, "Owner updated");
    $("#f-priority", m).onchange = (e) => patch({ priority: e.target.value }, "Priority updated");
    $("#f-due", m).onchange = (e) => e.target.value && patch({ due_date: e.target.value }, "Due date updated");
    $("#f-complete", m).onclick = () => { closeModal(true); completeDialog(c, reload); };
    $("#f-dismiss", m).onclick = () => dismissCard(id, reload);
  } else {
    $("#f-reopen", m).onclick = async () => {
      try { await api(`/api/cards/${id}/reopen`, { method: "POST", body: { actor_id: S.user } }); toast("Card reopened", "success"); await reload(); openCard(id, reload); } catch (e) { fail(e); }
    };
  }
  $("#f-comment-btn", m).onclick = async () => {
    const t = $("#f-comment", m).value.trim();
    if (!t) return;
    try {
      await api(`/api/cards/${id}/comments`, { method: "POST", body: { text: t, actor_id: S.user } });
      await openCard(id, reload);
      const b = $(".drawer-b"); if (b) b.scrollTop = b.scrollHeight;
    } catch (e) { fail(e); }
  };
}

function activityHtml(a) {
  const who = a.actor_name ? avatar(a.actor_name, a.actor_color, true) : `<span class="bot">${ic("bot")}</span>`;
  const name = a.actor_name || "RevenueIQ";
  if (a.kind === "comment") return `<div class="tl-item comment">${who}<div class="tl-text"><b>${esc(name)}</b> <span class="tl-when">&middot; ${relTime(a.created_at)}</span><div class="body">${esc(a.text)}</div></div></div>`;
  return `<div class="tl-item">${who}<div class="tl-text"><b>${esc(name)}</b> ${esc(a.text)}<div class="tl-when">${relTime(a.created_at)}</div></div></div>`;
}

// ------------------------------------------------------------------ impact
async function viewImpact(el, _p, alive) {
  const d = await api("/api/impact");
  if (!alive()) return;
  const x = d.experiment;
  const oc = { Saved: "#12a571", Downgraded: "#f0a020", Churned: "#e5484d", "No response": "#b5b9cc" };
  const totalClosed = d.outcomes.reduce((s, o) => s + o.n, 0);
  const saved = d.outcomes.find((o) => o.outcome === "Saved") || { n: 0, arr: 0 };
  const cmax = Math.max(x.control.churn_rate, x.treated.churn_rate, 0.01);
  el.innerHTML = `
    <div class="panel">
      <div class="panel-h"><div class="h-txt"><h3>Does the retention program work?</h3><span class="sub">At-risk accounts flagged since ${fdate(x.program_start)}. Churn is measured 60 days after each flag.</span></div><span class="badge primary">${icS("flask", 12)}Controlled experiment</span></div>
      <div class="exp">
        <div><div class="lbl"><span class="dot" style="background:var(--high)"></span>Control group, no action</div><div class="big" style="color:var(--high)">${pct(x.control.churn_rate, 1)}</div><div class="small muted">churned &middot; ${num(x.control.n)} accounts held out</div></div>
        <div><div class="lbl"><span class="dot" style="background:var(--low)"></span>Treated group, action taken</div><div class="big" style="color:var(--low)">${pct(x.treated.churn_rate, 1)}</div><div class="small muted">churned &middot; ${num(x.treated.n)} accounts worked</div></div>
        <div><div class="lbl"><span class="dot" style="background:var(--primary)"></span>Churn reduction from actions</div><div class="big" style="color:var(--primary)">${x.relative_reduction > 0 ? "-" : ""}${pct(Math.abs(x.relative_reduction))}</div>
          <div class="small muted">About <b style="color:var(--text)">${num(Math.round(Math.max(0, x.accounts_saved_est)))}</b> accounts and <b style="color:var(--text)">${money(x.arr_protected_est)}</b> ARR protected</div></div>
      </div>
      <div class="compare">
        <div class="cbar"><span class="cl">Control (no action)</span><div class="ct"><div class="cf" style="width:${100 * x.control.churn_rate / cmax}%;background:linear-gradient(90deg,#ff9a9c,#e5484d)"></div></div><b>${pct(x.control.churn_rate, 1)}</b></div>
        <div class="cbar"><span class="cl">Treated (action)</span><div class="ct"><div class="cf" style="width:${100 * x.treated.churn_rate / cmax}%;background:linear-gradient(90deg,#5fe0b0,#12a571)"></div></div><b>${pct(x.treated.churn_rate, 1)}</b></div>
        <div class="callout ${x.enough_data ? "" : "warn"}" style="margin-top:18px">${ic("info")}<div>${x.enough_data ? "10% of at-risk accounts are randomly held out from actions. Comparing them with treated accounts shows the <b>real</b> effect of the retention team, not just customers who would have stayed anyway."
          : "Not enough flagged accounts yet for a reliable comparison. Keep working cards; results appear after 60 days."}</div></div>
      </div>
    </div>
    <div class="grid kpis mt">
      ${kpi({ label: "Actions completed", value: num(totalClosed), foot: "All time, with an outcome", tone: "primary", icon: "check" })}
      ${kpi({ label: "Save rate", value: pct(totalClosed ? saved.n / totalClosed : null), foot: `${num(saved.n)} accounts saved`, tone: "low", icon: "shield" })}
      ${kpi({ label: "ARR retained", value: money(saved.arr), foot: "ARR of saved accounts", tone: "low", icon: "dollar" })}
      ${kpi({ label: "Open actions", value: num(d.team.reduce((s, t) => s + t.open, 0)), foot: `${d.team.reduce((s, t) => s + t.overdue, 0)} overdue`, tone: "med", icon: "clock" })}
    </div>
    <div class="grid cols-2 mt">
      <div class="panel"><div class="panel-h"><div class="h-txt"><h3>Outcomes</h3><span class="sub">All completed actions</span></div></div><div class="panel-b">
        ${donut(S.meta.outcomes.map((o) => { const r = d.outcomes.find((y) => y.outcome === o) || { n: 0 }; return { label: o, sub: OUTCOME_HELP[o], value: r.n, display: num(r.n), color: oc[o] }; }), num(totalClosed), "completed")}</div></div>
      <div class="panel"><div class="panel-h"><div class="h-txt"><h3>Save rate by playbook</h3><span class="sub">Which actions work best</span></div></div><div class="panel-b">
        ${hbars(d.by_action.map((a) => ({ label: a.label, sub: `${a.completed} done`, value: a.save_rate })), { fmt: (v) => pct(v), max: 1, color: "linear-gradient(90deg,#5fe0b0,#12a571)" })}</div></div>
    </div>
    <div class="grid cols-main mt">
      <div class="panel"><div class="panel-h"><div class="h-txt"><h3>Completed actions per month</h3><span class="sub">By outcome</span></div></div><div class="panel-b">
        ${barChart({ labels: d.monthly.map((m) => m.month), series: S.meta.outcomes.map((o) => ({ name: o, color: oc[o], values: d.monthly.map((m) => m[o] || 0) })), fmt: (v) => Math.round(v) })}</div></div>
      <div class="panel"><div class="panel-h"><div class="h-txt"><h3>Team leaderboard</h3><span class="sub">Ranked by ARR saved</span></div></div><div class="panel-b flush">
        ${d.team.map((t, i) => `<div class="list-item"><span class="small muted" style="width:14px">${i + 1}</span>${avatar(t.name, t.color)}<div class="li-main"><div class="li-title">${esc(t.name)}</div>
          <div class="li-sub">${t.completed} done &middot; ${pct(t.save_rate)} save rate &middot; ${t.open} open${t.overdue ? ` &middot; <span style="color:var(--high)">${t.overdue} late</span>` : ""}</div></div>
          <b class="tnum">${money(t.arr_saved)}</b></div>`).join("")}</div></div>
    </div>`;
}

// ------------------------------------------------------------------ model
const METRIC_INFO = {
  roc_auc: ["ROC-AUC", "How well the model ranks churners above non-churners. 0.5 is random, 1.0 is perfect.", "target"],
  lift_top10: ["Lift in top 10%", "How many times more churners are in the riskiest 10% of accounts than in a random 10%.", "trend"],
  recall_top10: ["Recall in top 10%", "Share of all upcoming churners caught by reviewing only the riskiest 10%.", "search"],
  precision_at_50: ["Precision @ 50", "Of the 50 riskiest accounts, the share that actually churned within 60 days.", "check"],
  pr_auc: ["PR-AUC", "Precision-recall area. Compare it with the base rate; higher is better for rare events.", "activity"],
  brier: ["Brier score", "Accuracy of the probabilities themselves (lower is better).", "info"],
};

async function viewModel(el, _p, alive) {
  const d = await api("/api/model");
  if (!alive()) return;
  const r = d.active;
  if (!r) {
    el.innerHTML = `<div class="panel panel-b">${emptyState("cpu", "No model trained yet.")}<div class="row" style="justify-content:center"><button class="btn primary" id="m-retrain">Train model</button></div></div>`;
    $("#m-retrain", el).onclick = () => runJob("/api/model/retrain", "Training model");
    return;
  }
  const m = r.metrics;
  const fmtM = (k, v) => k === "lift_top10" ? v.toFixed(1) + "x" : k === "brier" || k === "roc_auc" || k === "pr_auc" ? v.toFixed(3) : pct(v);
  const footM = (k) => k === "pr_auc" ? `Base rate ${pct(m.base_rate, 1)}` : k === "precision_at_50" ? `vs ${pct(m.base_rate, 1)} for random picks` : k === "lift_top10" ? "vs random selection" : "On held-out test months";
  const dist = Array.from({ length: 20 }, (_, i) => (d.distribution.find((x) => x.bucket === i) || { n: 0 }).n);
  el.innerHTML = `
    <div class="panel"><div class="model-head">
      <span class="mh-ico">${ic("cpu")}</span>
      <div style="flex:1;min-width:240px"><div class="row wrap"><h3 style="font-size:18px">${esc(r.algorithm)}</h3><span class="badge Low"><span class="dot"></span>Active</span><span class="badge neutral">${esc(r.version)}</span></div>
        <div class="small muted" style="margin-top:5px">Trained ${relTime(r.created_at)} &middot; predicts churn in the next ${m.horizon_days} days &middot; ${num(m.train_rows)} training rows from ${m.snapshots} monthly snapshots &middot; tested on ${esc(m.test_period)}</div></div>
      <div class="row wrap">
        <button class="btn" id="m-rescore" data-tip="Score all accounts again with the current model and playbooks">${ic("refresh")}Re-score</button>
        <button class="btn primary" id="m-retrain">${ic("cpu")}Retrain model</button>
        <button class="btn danger" id="m-reset" data-tip="Delete everything and generate fresh demo data">Reset data</button>
      </div>
    </div></div>
    <div class="grid kpis-3 mt">${Object.keys(METRIC_INFO).map((k) => kpi({ label: METRIC_INFO[k][0], value: fmtM(k, m[k]), foot: footM(k), tone: "primary", icon: METRIC_INFO[k][2], tip: METRIC_INFO[k][1] })).join("")}</div>
    <div class="grid cols-2 mt">
      <div class="panel"><div class="panel-h"><div class="h-txt"><h3>What drives churn</h3><span class="sub">Permutation importance on test data</span></div></div><div class="panel-b">
        ${hbars(r.importance.slice(0, 10).map((i) => ({ label: i.label, value: i.share })), { fmt: (v) => pct(v, 1), color: "linear-gradient(90deg,#a99fff,#5b4cf0)" })}</div></div>
      <div class="stack">
        <div class="panel"><div class="panel-h"><div class="h-txt"><h3>Calibration</h3><span class="sub">Predicted vs actual churn rate on test data. Closer to the dashed line is better.</span></div></div><div class="panel-b">${calibChart(r.calibration)}</div></div>
        <div class="panel"><div class="panel-h"><div class="h-txt"><h3>Current risk distribution</h3><span class="sub">Active accounts by churn probability</span></div></div><div class="panel-b">
          ${barChart({ labels: dist.map((_, i) => i % 4 === 0 ? `${i * 5}%` : ""), series: [{ name: "Accounts", color: "#8b7dff", values: dist }], height: 180, fmt: (v) => Math.round(v) })}</div></div>
      </div>
    </div>
    <div class="grid cols-2 mt">
      <div class="panel"><div class="panel-h"><div class="h-txt"><h3>Model comparison</h3><span class="sub">The model with the best validation PR-AUC is selected</span></div></div><div class="panel-b flush"><div class="table-wrap"><table><thead><tr><th>Model</th><th class="num">Val PR-AUC</th><th class="num">ROC-AUC</th><th class="num">Lift</th></tr></thead>
        <tbody>${r.comparison.map((c) => `<tr><td><span class="acc-name">${esc(c.model)}</span> ${c.model === r.algorithm ? '<span class="badge Low">Selected</span>' : ""}</td><td class="num">${c.val_pr_auc.toFixed(3)}</td><td class="num">${c.roc_auc.toFixed(3)}</td><td class="num">${c.lift_top10.toFixed(1)}x</td></tr>`).join("")}</tbody></table></div></div></div>
      <div class="panel"><div class="panel-h"><div class="h-txt"><h3>Training history</h3><span class="sub">Last 10 runs</span></div></div><div class="panel-b flush"><div class="table-wrap"><table><thead><tr><th>Version</th><th>Trained</th><th class="num">ROC-AUC</th><th class="num">Lift</th></tr></thead>
        <tbody>${d.history.map((hh) => `<tr><td><span class="acc-name">${esc(hh.version)}</span> ${hh.is_active ? '<span class="badge primary">Active</span>' : ""}</td><td class="muted">${relTime(hh.created_at)}</td><td class="num">${(hh.roc_auc || 0).toFixed(3)}</td><td class="num">${(hh.lift_top10 || 0).toFixed(1)}x</td></tr>`).join("")}</tbody></table></div></div></div>
    </div>
    <div class="panel mt"><div class="panel-h"><div class="h-txt"><h3>How RevenueIQ works</h3><span class="sub">From raw data to a saved customer</span></div></div><div class="panel-b"><div class="howto">
      <div class="step"><div class="n">1</div><b>Point-in-time signals</b><p>Every month, 22 signals per account (usage trends, seat use, champion activity, tickets, failed payments, NPS, renewal timing) are computed using only data from before that date.</p></div>
      <div class="step"><div class="n">2</div><b>Train and calibrate</b><p>Two models are trained on older months, compared on a validation period, calibrated so 30% really means about 30%, and tested on the newest months.</p></div>
      <div class="step"><div class="n">3</div><b>Rank and explain</b><p>Revenue at risk = churn probability x lifetime value. Each account's reasons come from resetting one signal at a time to a healthy value and measuring the drop in risk.</p></div>
      <div class="step"><div class="n">4</div><b>Act and learn</b><p>Reasons map to playbooks, which become action cards. Recorded outcomes and a 10% control group prove what actually saves customers.</p></div>
    </div></div></div>`;
  renderIcons(el);
  $("#m-retrain", el).onclick = () => runJob("/api/model/retrain", "Retraining model");
  $("#m-rescore", el).onclick = () => runJob("/api/model/rescore", "Re-scoring accounts");
  $("#m-reset", el).onclick = () => {
    const mm = openModal(`<div class="modal-h"><h2 style="flex:1">Reset all demo data?</h2><button class="icon-btn" data-close>${ic("x")}</button></div>
      <div class="modal-b"><div class="callout warn">${ic("alert")}<div>This deletes every account, action card, note and outcome, then generates fresh synthetic data and retrains the model. This cannot be undone.</div></div></div>
      <div class="modal-f"><button class="btn" data-close>Cancel</button><button class="btn danger-solid" id="rs-go">Reset everything</button></div>`);
    $("#rs-go", mm).onclick = () => { closeModal(true); runJob("/api/admin/reset", "Resetting demo data"); };
  };
}

function calibChart(points) {
  const W = 420, H = 220, L = 42, B = 28, T = 10, R = 10;
  const max = niceMax(Math.max(0.05, ...points.map((p) => Math.max(p.predicted, p.actual))));
  const X = (v) => L + (W - L - R) * v / max, Y = (v) => T + (H - T - B) * (1 - v / max);
  let g = "";
  for (let k = 0; k <= 4; k++) { const v = max * k / 4; g += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#eef0f6" ${k ? 'stroke-dasharray="3 5"' : ""}/><text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end">${pct(v)}</text><text x="${X(v)}" y="${H - 8}" text-anchor="middle">${pct(v)}</text>`; }
  g += `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(max)}" y2="${Y(max)}" stroke="#b5b9cc" stroke-width="1.5" stroke-dasharray="6 5"/>`;
  g += `<polyline points="${points.map((p) => `${X(p.predicted)},${Y(p.actual)}`).join(" ")}" fill="none" stroke="#5b4cf0" stroke-width="2.6" stroke-linejoin="round"/>`;
  points.forEach((p) => { g += `<circle cx="${X(p.predicted)}" cy="${Y(p.actual)}" r="5" fill="#fff" stroke="#5b4cf0" stroke-width="2.5" data-tip="Predicted ${pct(p.predicted, 1)} &middot; actual ${pct(p.actual, 1)} &middot; ${p.count} rows"/>`; });
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}">${g}</svg><div class="legend"><span><i style="background:#5b4cf0"></i>Model</span><span><i style="background:#b5b9cc"></i>Perfect calibration</span></div></div>`;
}

async function runJob(url, title) {
  try { await api(url, { method: "POST" }); } catch (e) { return fail(e); }
  const m = openModal(`<div class="modal-h"><div class="row" style="flex:1"><span class="spinner" id="job-spin"></span><h2 id="job-title">${esc(title)}...</h2></div></div>
    <div class="modal-b"><div class="joblog" id="job-log">Starting...</div></div>
    <div class="modal-f"><button class="btn primary" id="job-done" disabled>Please wait...</button></div>`, { locked: true });
  const poll = async () => {
    let j;
    try { j = await api("/api/jobs/current"); } catch (e) { setTimeout(poll, 1000); return; }
    const log = $("#job-log", m);
    if (!log || !m.isConnected) return;
    log.textContent = j.log.join("\n") || "Working...";
    log.scrollTop = 1e9;
    if (j.running) { setTimeout(poll, 700); return; }
    const spin = $("#job-spin", m); if (spin) spin.remove();
    $("#job-title", m).textContent = j.error ? "Something went wrong" : `${title}: done`;
    const b = $("#job-done", m);
    b.disabled = false; b.textContent = "Close";
    b.onclick = () => closeModal(true);
    S.modalLocked = false;
    await loadMeta();
    refreshBoardCount();
    refreshSignalCount();
    const viewY = window.scrollY;
    const keep = $("#modal-root").innerHTML ? $("#modal-root").firstChild : null;
    await routerKeepModal(keep);
    window.scrollTo(0, viewY);
  };
  poll();
}
// Re-render the current page underneath an open dialog (used after background jobs).
async function routerKeepModal(keep) {
  const html = keep ? $("#modal-root").innerHTML : null;
  const parts = location.hash.replace(/^#\/?/, "").split("/");
  const r = ROUTES[parts[0]] || ROUTES[""];
  const view = $("#view");
  const token = ++routeToken;
  try { await r.render(view, parts.slice(1), () => token === routeToken); } catch (e) { fail(e); }
  renderIcons(view);
  if (html && !$("#modal-root").innerHTML) $("#modal-root").innerHTML = html;
}

// ------------------------------------------------------------------ playbooks
async function viewPlaybooks(el, _p, alive) {
  const items = await api("/api/playbooks");
  if (!alive()) return;
  const tone = (code) => ({ high: ["var(--high-soft)", "var(--high)"], med: ["var(--med-soft)", "var(--med)"], low: ["var(--low-soft)", "var(--low)"], blue: ["var(--blue-soft)", "var(--blue)"], primary: ["var(--primary-soft)", "var(--primary)"] }[REASON_TONE[code] || "primary"]);
  const readView = (p) => `<p class="pb-desc">${esc(p.description)}</p>
    <ol class="steps">${p.steps.split("\n").filter((x) => x.trim()).map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`;
  const editView = (p) => `<div class="stack" style="gap:14px">
      <label class="field">Action title<input type="text" class="pb-title" value="${esc(p.action_title)}"></label>
      <label class="field">Why it matters<textarea class="pb-desc-in" rows="2">${esc(p.description)}</textarea></label>
      <label class="field">Steps (one per line)<textarea class="pb-steps" rows="5">${esc(p.steps)}</textarea></label>
      <label class="field" style="max-width:200px">SLA (days to complete)<input type="number" min="1" max="60" class="pb-sla" value="${p.sla_days}"></label>
    </div>`;
  const footInfo = (p) => `<span class="badge neutral">${icS("clock", 12)}${p.sla_days}-day SLA</span><span class="badge ${p.at_risk_accounts ? "Medium" : "neutral"}">${p.at_risk_accounts} at-risk accounts</span>`;
  el.innerHTML = `<div class="callout" style="margin-bottom:20px">${ic("info")}<div>Each churn reason maps to a recommended retention action. Edit them to match how your team works.
      After saving, <b>re-score accounts</b> so new suggestions use the change. A disabled playbook is skipped, and the next reason's playbook is used instead.</div></div>
    <div class="pb-grid">${items.map((p) => { const [bg, fg] = tone(p.reason_code); return `<div class="panel pb-card ${p.enabled ? "" : "disabled"}" data-code="${p.reason_code}">
      <div class="pb-top"><span class="pb-ico" style="background:${bg};color:${fg}">${ic(REASON_ICON[p.reason_code] || "info")}</span>
        <div style="flex:1;min-width:0"><div class="small muted">${p.reason_code === "EXPANSION" ? "For <b style=\"color:var(--text-2)\">expansion opportunities</b>" : `When the top reason is <b style="color:var(--text-2)">${esc(p.label)}</b>`}</div><h3 class="pb-h">${esc(p.action_title)}</h3></div>
        <label class="switch" data-tip="Turn this playbook on or off"><input type="checkbox" class="pb-enabled" ${p.enabled ? "checked" : ""}><span class="sl"></span></label></div>
      <div class="pb-body">${readView(p)}</div>
      <div class="pb-foot"><span class="pb-info row wrap">${footInfo(p)}</span><span class="spacer"></span><span class="pb-btns row"></span></div>
    </div>`; }).join("")}</div>`;
  renderIcons(el);
  $$("[data-code]", el).forEach((card) => {
    const p = items.find((x) => x.reason_code === card.dataset.code);
    const body = $(".pb-body", card), btns = $(".pb-btns", card);
    const save = async () => {
      const editing = !!$(".pb-title", card);
      const upd = await api(`/api/playbooks/${p.reason_code}`, { method: "PUT", body: {
        action_title: editing ? $(".pb-title", card).value : p.action_title,
        description: editing ? $(".pb-desc-in", card).value : p.description,
        steps: editing ? $(".pb-steps", card).value : p.steps,
        sla_days: editing ? Number($(".pb-sla", card).value) : p.sla_days,
        enabled: $(".pb-enabled", card).checked } });
      Object.assign(p, upd);
      toast("Playbook saved", "success", { label: "Re-score now", fn: () => runJob("/api/model/rescore", "Re-scoring accounts") });
    };
    const showRead = () => {
      body.innerHTML = readView(p);
      $(".pb-h", card).textContent = p.action_title;
      $(".pb-info", card).innerHTML = footInfo(p);
      btns.innerHTML = `<button class="btn sm pb-edit">${ic("edit")}Edit</button>`;
      renderIcons(card);
      $(".pb-edit", card).onclick = showEdit;
    };
    const showEdit = () => {
      body.innerHTML = editView(p);
      btns.innerHTML = `<button class="btn sm pb-cancel">Cancel</button><button class="btn sm primary pb-save">${ic("check")}Save</button>`;
      renderIcons(card);
      $(".pb-cancel", card).onclick = showRead;
      $(".pb-save", card).onclick = async () => { try { await save(); showRead(); } catch (e) { fail(e); } };
    };
    $(".pb-enabled", card).onchange = async (e) => {
      try { await save(); card.classList.toggle("disabled", !e.target.checked); } catch (err) { e.target.checked = !e.target.checked; fail(err); }
    };
    showRead();
  });
}

// ------------------------------------------------------------------ shared action helper
async function createActionCard(accountId, reasonCode, { value, note, reload } = {}) {
  try {
    const c = await api("/api/cards", { method: "POST", body: { account_id: accountId, reason_code: reasonCode, value, note, actor_id: S.user } });
    toast(reasonCode === "EXPANSION" ? "Expansion card created in To Do" : "Action card created in To Do", "success", { label: "Open board", fn: () => { BF.tab = "To Do"; location.hash = "#/board"; } });
    refreshBoardCount();
    if (reload) await reload();
    return c;
  } catch (e) { fail(e); return null; }
}
const cardBtn = (acc, reasonCode, label = "Create action", extra = "") => acc.open_card_id
  ? `<button class="btn sm" data-open-card="${acc.open_card_id}">${ic("kanban")}${esc(acc.open_card_status || "View card")}</button>`
  : `<button class="btn sm primary" data-create="${acc.id}" data-reason="${esc(reasonCode)}" ${extra}>${ic("plus")}${label}</button>`;
function bindCardButtons(root, reload) {
  $$("[data-open-card]", root).forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); openCard(Number(b.dataset.openCard), reload); }));
  $$("[data-create]", root).forEach((b) => b.addEventListener("click", async (e) => {
    e.stopPropagation(); b.disabled = true;
    const c = await createActionCard(Number(b.dataset.create), b.dataset.reason, { value: b.dataset.value ? Number(b.dataset.value) : undefined, note: b.dataset.note, reload });
    if (!c) b.disabled = false;
  }));
}
const accLink = (a, sub = "") => `<a class="acc-cell link" href="#/account/${a.id}">${logo(a.name, "sm")}<div class="ellipsis"><div class="acc-name ellipsis">${esc(a.name)}</div><div class="acc-sub">${sub || `${esc(a.segment)} &middot; ${money(a.arr)} ARR`}</div></div></a>`;

// ------------------------------------------------------------------ signals
const SIG = { type: "", severity: "", reviewed: false, limit: 30, movers: "up" };
const SIGNAL_ICON = { payment: "card", renewal: "calendar", risk_jump: "trend", usage_drop: "down", champion: "user", support: "life", nps: "smile", expansion: "rocket" };
const SEV_COLOR = { critical: "var(--high)", warning: "var(--med)", info: "var(--blue)" };
const SEV_SOFT = { critical: "var(--high-soft)", warning: "var(--med-soft)", info: "var(--blue-soft)" };

async function viewSignals(el, _p, alive) {
  const d = await api("/api/signals" + (SIG.reviewed ? "?include_reviewed=true" : ""));
  if (!alive()) return;
  const total = d.items.length;
  const items = d.items.filter((s) => (!SIG.type || s.type === SIG.type) && (!SIG.severity || s.severity === SIG.severity));
  const chip = (key, label, n, iconName, color) => `<button class="fchip ${SIG.type === key ? "active" : ""}" data-type="${key}">${iconName ? `<span class="fc-ico" style="color:${color || "var(--text-2)"}">${icS(iconName, 14)}</span>` : ""}${esc(label)}<span class="fc-n">${n}</span></button>`;
  el.innerHTML = `
    <div class="grid kpis">
      ${kpi({ label: "Critical signals", value: num(d.severity.critical), foot: "Act on these today", tone: "high", icon: "alert" })}
      ${kpi({ label: "Warnings", value: num(d.severity.warning), foot: "Review this week", tone: "med", icon: "bell" })}
      ${kpi({ label: "Growth signals", value: num(d.severity.info), foot: "Expansion moments", tone: "blue", icon: "rocket" })}
      ${kpi({ label: "Reviewed", value: num(d.reviewed_count), foot: "Signals marked as handled", tone: "low", icon: "check" })}
    </div>
    <div class="fchips mt">${chip("", "All signals", total)}${Object.entries(d.types).map(([k, t]) => chip(k, t.label, d.counts[k] || 0, SIGNAL_ICON[k], k === "expansion" ? "var(--blue)" : "var(--text-2)")).join("")}</div>
    <div class="grid cols-side mt">
      <div class="panel">
        <div class="panel-h"><div class="h-txt"><h3>Signal feed</h3><span class="sub">${num(items.length)} signals${SIG.type ? ` &middot; ${esc(d.types[SIG.type].label)}` : ""}, most urgent and valuable first</span></div>
          <select id="sig-sev" class="sm">${opt("", "All severities", SIG.severity)}${opt("critical", "Critical", SIG.severity)}${opt("warning", "Warning", SIG.severity)}${opt("info", "Growth", SIG.severity)}</select>
          <label class="switch small"><input type="checkbox" id="sig-rev" ${SIG.reviewed ? "checked" : ""}><span class="sl"></span>Show reviewed</label></div>
        <div class="panel-b flush" id="sig-list">${items.length ? items.slice(0, SIG.limit).map(signalRow).join("") : emptyState("check", "No signals here. Everything looks calm.")}</div>
        ${items.length > SIG.limit ? `<div class="pager"><span>Showing ${SIG.limit} of ${num(items.length)}</span><span class="spacer"></span><button class="btn sm" id="sig-more">Show more</button></div>` : ""}
      </div>
      <div class="stack sticky">
        <div class="panel"><div class="panel-h"><div class="h-txt"><h3>Risk movers</h3><span class="sub">Biggest change in churn risk over 30 days</span></div></div>
          <div class="panel-b" style="padding-bottom:6px"><div class="tabs"><button class="tab ${SIG.movers === "up" ? "active" : ""}" data-mv="up">${icS("trend", 13)}Rising</button><button class="tab ${SIG.movers === "down" ? "active" : ""}" data-mv="down">${icS("down", 13)}Falling</button></div></div>
          <div class="panel-b flush">${(SIG.movers === "up" ? d.movers_up : d.movers_down).map((m) => `<a class="list-item clickable" href="#/account/${m.id}" style="color:inherit">
            ${logo(m.name, "sm")}<div class="li-main"><div class="li-title">${esc(m.name)}</div><div class="li-sub">${m.prev < 0.01 ? "&lt;1%" : pct(m.prev)} &rarr; <b style="color:${riskColor(m.risk)}">${pct(m.risk)}</b> &middot; ${esc(m.reason_label)}</div></div>
            <span class="delta ${m.delta >= 0 ? "up" : "down"}">${m.delta >= 0 ? "+" : ""}${(m.delta * 100).toFixed(0)} pts</span></a>`).join("")}</div></div>
        <div class="panel panel-b"><div class="callout">${ic("info")}<div>Signals are detected from the latest usage, billing, support and NPS data, plus a comparison with each account's risk 30 days ago. <b>Create action</b> turns a signal into a card on the Action Board.</div></div></div>
      </div>
    </div>`;
  renderIcons(el);
  bindCardButtons(el, rerender);
  $$(".fchip", el).forEach((b) => b.addEventListener("click", () => { SIG.type = b.dataset.type; SIG.limit = 30; rerender(); }));
  $$("[data-mv]", el).forEach((b) => b.addEventListener("click", () => { SIG.movers = b.dataset.mv; rerender(); }));
  $("#sig-sev", el).onchange = (e) => { SIG.severity = e.target.value; SIG.limit = 30; rerender(); };
  $("#sig-rev", el).onchange = (e) => { SIG.reviewed = e.target.checked; rerender(); };
  const more = $("#sig-more", el); if (more) more.onclick = () => { SIG.limit += 30; rerender(); };
  $$("[data-review]", el).forEach((b) => b.addEventListener("click", async () => {
    try {
      await api("/api/signals/review", { method: "POST", body: { key: b.dataset.review, actor_id: S.user, undo: b.dataset.undo === "1" } });
      toast(b.dataset.undo === "1" ? "Signal restored" : "Signal marked as reviewed", "success");
      refreshSignalCount(); rerender();
    } catch (e) { fail(e); }
  }));
}

function signalRow(s) {
  const a = s.account;
  return `<div class="sig ${s.reviewed ? "reviewed" : ""}" style="--sev:${SEV_COLOR[s.severity]}">
    <span class="sig-ico" style="background:${SEV_SOFT[s.severity]};color:${SEV_COLOR[s.severity]}">${ic(SIGNAL_ICON[s.type])}</span>
    <div class="sig-main">
      <div class="sig-top"><b>${esc(s.title)}</b><span class="sig-type">${esc(s.type_label)}</span><span class="sig-date">${sdate(s.date)}</span></div>
      <div class="sig-detail">${esc(s.detail)}</div>
      <div class="sig-acc"><a href="#/account/${a.id}">${logo(a.name, "sm")}<span class="ellipsis"><b>${esc(a.name)}</b> &middot; ${esc(a.segment)} &middot; ${money(a.arr)} ARR${a.risk != null ? ` &middot; <span style="color:${riskColor(a.risk)}">${pct(a.risk)} risk</span>` : ""}</span></a></div>
    </div>
    <div class="sig-actions">
      ${a.is_control && !a.open_card_id ? '<span class="badge neutral" data-tip="Control group account - no automatic actions">Control</span>' : ""}
      ${cardBtn(a, s.reason_code, s.type === "expansion" ? "Create opportunity" : "Create action")}
      <button class="btn sm ghost" data-review="${esc(s.key)}" ${s.reviewed ? 'data-undo="1"' : ""} data-tip="${s.reviewed ? "Restore this signal" : "Mark as reviewed"}">${ic(s.reviewed ? "refresh" : "check")}${s.reviewed ? "Restore" : "Reviewed"}</button>
    </div></div>`;
}

async function refreshSignalCount() {
  try { const d = await api("/api/signals"); $("#nav-signal-count").textContent = d.severity.critical || ""; } catch (e) { /* ignore */ }
}

// ------------------------------------------------------------------ renewals
const RF = { days: 120, owner_id: "", risky: false };

async function viewRenewals(el, _p, alive) {
  const q = new URLSearchParams({ days: RF.days });
  if (RF.owner_id) q.set("owner_id", RF.owner_id);
  const d = await api("/api/renewals?" + q);
  if (!alive()) return;
  const s = d.summary;
  const rows = RF.risky ? d.rows.filter((r) => r.tier === "High" || r.tier === "Medium") : d.rows;
  el.innerHTML = `
    <div class="grid kpis">
      ${kpi({ label: `Renewing ARR (${d.days} days)`, value: money(s.arr), foot: `${num(s.count)} annual contracts`, tone: "primary", icon: "calendar" })}
      ${kpi({ label: "Forecast to renew", value: money(s.expected), foot: `${pct(s.arr ? s.expected / s.arr : 0, 1)} of renewing ARR`, tone: "low", icon: "shield", tip: "Sum of ARR x (1 - churn risk) for each renewing contract" })}
      ${kpi({ label: "ARR at risk", value: money(s.at_risk), foot: `${num(s.risky_count)} renewals at medium or high risk`, tone: "high", icon: "fire" })}
      ${kpi({ label: "At risk with no plan", value: num(s.no_plan), foot: `${money(s.no_plan_arr)} ARR without an action card`, tone: "med", icon: "alert", tip: "Medium or high-risk renewals that have no open action card (control group excluded)" })}
    </div>
    <div class="grid cols-main mt">
      <div class="panel"><div class="panel-h"><div class="h-txt"><h3>Renewal forecast</h3><span class="sub">Renewing ARR by window: expected to renew vs at risk</span></div></div>
        <div class="panel-b">${barChart({ labels: d.buckets.map((b) => b.label), series: [
          { name: "Expected to renew", color: "#34c38f", values: d.buckets.map((b) => b.expected) },
          { name: "At risk", color: "#ff7a7e", values: d.buckets.map((b) => b.at_risk) }], fmt: money, height: 250 })}</div></div>
      <div class="panel"><div class="panel-h"><div class="h-txt"><h3>Windows at a glance</h3><span class="sub">Count, ARR and share at risk</span></div></div>
        <div class="panel-b flush">${d.buckets.map((b) => `<div class="list-item"><span class="logo sm" style="background:var(--primary-soft);color:var(--primary)">${icS("calendar", 15)}</span>
          <div class="li-main"><div class="li-title">${esc(b.label)}</div><div class="li-sub">${b.count} renewals &middot; ${money(b.arr)} ARR</div></div>
          <div style="text-align:right"><b class="tnum" style="color:${b.arr && b.at_risk / b.arr > 0.05 ? "var(--high)" : "var(--text)"}">${money(b.at_risk)}</b><div class="acc-sub">at risk</div></div></div>`).join("")}</div></div>
    </div>
    <div class="panel mt">
      <div class="toolbar">
        <h3 style="font-size:15.5px;margin-right:6px">Upcoming renewals</h3>
        <select id="rf-days">${[30, 60, 90, 120, 180].map((n) => opt(n, `Next ${n} days`, RF.days)).join("")}</select>
        <select id="rf-owner">${opt("", "All owners", RF.owner_id)}${S.team.map((t) => opt(t.id, t.name, RF.owner_id)).join("")}</select>
        <label class="switch"><input type="checkbox" id="rf-risky" ${RF.risky ? "checked" : ""}><span class="sl"></span>Only at-risk renewals</label>
        <span class="spacer"></span><span class="small muted">${num(rows.length)} contracts</span>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Account</th><th>Renews</th><th class="num">ARR</th><th>Churn risk</th><th class="num">At risk</th><th class="hide-md">Owner</th><th>Plan</th></tr></thead>
        <tbody>${rows.map((r) => `<tr class="clickable" data-href="#/account/${r.id}">
          <td>${accLink(r, `${esc(r.segment)} &middot; ${esc(r.plan)}${r.reason_label ? ` &middot; ${esc(r.reason_label)}` : ""}`)}</td>
          <td class="nowrap"><div>${sdate(r.renewal_date)}</div><span class="days-pill ${r.days <= 30 ? "soon" : ""}">${r.days === 0 ? "today" : `in ${r.days} days`}</span></td>
          <td class="num">${money(r.arr)}</td><td>${riskBar(r.risk)}</td><td class="num strong-num">${money(r.at_risk)}</td>
          <td class="hide-md">${avatar(r.owner_name, r.owner_color, true)}</td>
          <td>${r.is_control && !r.open_card_id ? '<span class="badge neutral">Control</span>' : r.tier === "Low" && !r.open_card_id ? '<span class="badge Low">On track</span>' : cardBtn(r, "RENEWAL_RISK", "Create plan")}</td></tr>`).join("") || `<tr><td colspan="7">${emptyState("calendar", "No renewals in this window.")}</td></tr>`}</tbody></table></div>
    </div>`;
  renderIcons(el);
  bindRowLinks(el);
  bindCardButtons(el, rerender);
  $("#rf-days", el).onchange = (e) => { RF.days = Number(e.target.value); rerender(); };
  $("#rf-owner", el).onchange = (e) => { RF.owner_id = e.target.value; rerender(); };
  $("#rf-risky", el).onchange = (e) => { RF.risky = e.target.checked; rerender(); };
}

// ------------------------------------------------------------------ expansion
const EF = { play: "", sort: "value" };

function scoreRing(score) {
  const R = 19, C = 2 * Math.PI * R, len = C * score / 100;
  const color = score >= 75 ? "#12a571" : score >= 55 ? "#5b4cf0" : "#e5900b";
  return `<svg class="ring" viewBox="0 0 48 48" data-tip="Expansion score ${score}/100"><circle cx="24" cy="24" r="${R}" fill="none" stroke="#eef0f6" stroke-width="5"/>
    <circle cx="24" cy="24" r="${R}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${len} ${C}" transform="rotate(-90 24 24)"/>
    <text x="24" y="28.5" text-anchor="middle" style="font-size:13px;font-weight:600;fill:${color}">${score}</text></svg>`;
}

async function viewExpansion(el, _p, alive) {
  const d = await api("/api/expansion");
  if (!alive()) return;
  const s = d.summary;
  let items = d.items.filter((i) => !EF.play || i.play === EF.play);
  if (EF.sort === "score") items = items.slice().sort((a, b) => b.score - a.score);
  if (EF.sort === "potential") items = items.slice().sort((a, b) => b.potential - a.potential);
  el.innerHTML = `
    <div class="grid kpis">
      ${kpi({ label: "Expansion pipeline", value: money(s.pipeline), foot: `${num(s.count)} opportunities`, tone: "low", icon: "rocket", tip: "Estimated extra ARR if every opportunity converts" })}
      ${kpi({ label: "Weighted pipeline", value: money(s.weighted), foot: "Pipeline x expansion score", tone: "primary", icon: "target" })}
      ${kpi({ label: "In progress", value: num(s.open_count), foot: `${money(s.open_arr)} potential ARR being worked`, tone: "blue", icon: "kanban" })}
      ${kpi({ label: "Won expansion ARR", value: money(s.won_arr), foot: `${num(s.won_count)} expansions closed as Expanded`, tone: "low", icon: "shield" })}
    </div>
    <div class="toolbar panel mt" style="padding:12px 14px">
      <div class="fchips" style="margin:0">
        <button class="fchip ${!EF.play ? "active" : ""}" data-play="">All plays<span class="fc-n">${s.count}</span></button>
        <button class="fchip ${EF.play === "Seat expansion" ? "active" : ""}" data-play="Seat expansion"><span class="fc-ico" style="color:var(--low)">${icS("users", 14)}</span>Seat expansion<span class="fc-n">${s.seat_plays}</span></button>
        <button class="fchip ${EF.play === "Plan upgrade" ? "active" : ""}" data-play="Plan upgrade"><span class="fc-ico" style="color:var(--primary)">${icS("trend", 14)}</span>Plan upgrade<span class="fc-n">${s.plan_plays}</span></button>
      </div>
      <span class="spacer"></span>
      <select id="ef-sort" class="sm">${opt("value", "Sort: Best value", EF.sort)}${opt("potential", "Sort: Potential ARR", EF.sort)}${opt("score", "Sort: Score", EF.sort)}</select>
    </div>
    ${items.length ? `<div class="card-grid mt">${items.map((o) => `<div class="xcard">
      <div class="k-head">${logo(o.name, "sm")}<div class="k-who"><a class="k-acc" href="#/account/${o.id}" style="color:inherit;display:block">${esc(o.name)}</a><div class="k-sub">${esc(o.segment)} &middot; ${esc(o.plan)} &middot; ${money(o.arr)} ARR</div></div>${scoreRing(o.score)}</div>
      <div class="x-play"><span class="badge ${o.play === "Seat expansion" ? "Low" : "primary"}">${icS(o.play === "Seat expansion" ? "users" : "trend", 12)}${esc(o.play)}</span><span class="x-pot"><b>+${money(o.potential)}</b> ARR</span></div>
      <div class="x-detail">${esc(o.detail)}</div><div class="x-why">${esc(o.why)}</div>
      <div class="x-stats">
        <div><span>Seats</span><b style="color:${o.util >= 0.9 ? "var(--low)" : "var(--text)"}">${pct(o.util)}</b></div>
        <div><span>Users</span><b style="color:${o.trend >= 0 ? "var(--low)" : "var(--high)"}">${o.trend >= 0 ? "+" : ""}${pct(o.trend)}</b></div>
        <div><span>NPS</span><b>${Math.round(o.nps)}</b></div>
        <div><span>Features</span><b>${o.features.toFixed(1)}</b></div>
      </div>
      <div class="k-foot">${avatar(o.owner_name, o.owner_color, true)}<span class="k-owner">${esc((o.owner_name || "").split(" ")[0])}</span>
<span class="spacer"></span>
        ${o.open_card_id ? `<button class="btn sm" data-open-card="${o.open_card_id}">${ic("kanban")}${o.open_card_reason === "EXPANSION" ? "Opportunity" : "Open card"}</button>`
          : `<button class="btn sm success" data-create="${o.id}" data-reason="EXPANSION" data-value="${Math.round(o.potential)}" data-note="${esc(`Expansion opportunity: ${o.detail} (+${money(o.potential)} ARR)`)}">${ic("plus")}Create opportunity</button>`}
      </div></div>`).join("")}</div>` : `<div class="panel mt">${emptyState("rocket", "No expansion opportunities match this filter.")}</div>`}`;
  renderIcons(el);
  bindCardButtons(el, rerender);
  $$("[data-play]", el).forEach((b) => b.addEventListener("click", () => { EF.play = b.dataset.play; rerender(); }));
  $("#ef-sort", el).onchange = (e) => { EF.sort = e.target.value; rerender(); };
}

// ------------------------------------------------------------------ revenue analytics
const RV = { by: "segment" };

function movementChart(rows) {
  const W = 1100, H = 300, L = 60, R = 10, T = 14, B = 30;
  const pos = rows.map((r) => r.new + r.expansion), neg = rows.map((r) => r.contraction + r.churn);
  const max = niceMax(Math.max(...pos, ...neg, 1));
  const zero = T + (H - T - B) / 2;
  const sc = (v) => (H - T - B) / 2 * v / max;
  const cw = (W - L - R) / rows.length, bw = Math.min(40, cw * 0.5);
  let g = "";
  [-1, -0.5, 0, 0.5, 1].forEach((k) => {
    const y = zero - sc(max * k);
    g += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="${k === 0 ? "#cfd3e3" : "#eef0f6"}" ${k ? 'stroke-dasharray="3 5"' : ""}/><text x="${L - 10}" y="${y + 4}" text-anchor="end">${k < 0 ? "-" : ""}${money(Math.abs(max * k))}</text>`;
  });
  const netPts = [];
  rows.forEach((r, i) => {
    const x = L + cw * i + (cw - bw) / 2;
    let up = zero;
    [["New", r.new, "#5b4cf0"], ["Expansion", r.expansion, "#34c38f"]].forEach(([n, v, c]) => { const h = sc(v); if (h > 0) { g += `<rect x="${x}" y="${up - h}" width="${bw}" height="${h}" fill="${c}" rx="2" data-tip="${esc(r.month)} &middot; ${n}: <b>+${money(v)}</b>"/>`; up -= h; } });
    let dn = zero;
    [["Contraction", r.contraction, "#ffb547"], ["Churn", r.churn, "#ff7a7e"]].forEach(([n, v, c]) => { const h = sc(v); if (h > 0) { g += `<rect x="${x}" y="${dn}" width="${bw}" height="${h}" fill="${c}" rx="2" data-tip="${esc(r.month)} &middot; ${n}: <b>-${money(v)}</b>"/>`; dn += h; } });
    g += `<text x="${L + cw * i + cw / 2}" y="${H - 8}" text-anchor="middle">${esc(r.month)}</text>`;
    netPts.push([L + cw * i + cw / 2, zero - sc(r.net), r]);
  });
  g += `<polyline points="${netPts.map((p) => p[0] + "," + p[1]).join(" ")}" fill="none" stroke="#121433" stroke-width="2" stroke-linejoin="round"/>`;
  netPts.forEach(([x, y, r]) => { g += `<circle cx="${x}" cy="${y}" r="4.5" fill="#fff" stroke="#121433" stroke-width="2" data-tip="${esc(r.month)} &middot; Net new ARR: <b>${r.net >= 0 ? "+" : "-"}${money(Math.abs(r.net))}</b>"/>`; });
  const lg = [["New", "#5b4cf0"], ["Expansion", "#34c38f"], ["Contraction", "#ffb547"], ["Churn", "#ff7a7e"], ["Net new ARR", "#121433"]];
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}">${g}</svg><div class="legend">${lg.map(([n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join("")}</div></div>`;
}

function cohortHeatmap(cohorts) {
  if (!cohorts.length) return emptyState("grid", "Not enough history for cohorts yet.");
  const cols = Math.max(...cohorts.map((c) => c.values.length));
  const cell = (v) => {
    if (v == null) return '<td class="hm-empty"></td>';
    const a = 0.12 + 0.88 * Math.max(0, (v - 0.6) / 0.4);
    return `<td style="background:rgba(91,76,240,${a.toFixed(2)});color:${a > 0.55 ? "#fff" : "var(--text)"}" data-tip="${(v * 100).toFixed(1)}% still customers">${Math.round(v * 100)}%</td>`;
  };
  return `<div class="table-wrap"><table class="heatmap"><thead><tr><th>Signup month</th><th class="num">Accounts</th>${Array.from({ length: cols }, (_, k) => `<th>M${k}</th>`).join("")}</tr></thead>
    <tbody>${cohorts.map((c) => `<tr><td class="hm-label">${esc(c.cohort)}</td><td class="num muted">${c.size}</td>${Array.from({ length: cols }, (_, k) => cell(c.values[k])).join("")}</tr>`).join("")}</tbody></table></div>`;
}

async function viewRevenue(el, _p, alive) {
  const d = await api("/api/revenue");
  if (!alive()) return;
  const k = d.kpis;
  const by = d.churn_by[RV.by] || [];
  el.innerHTML = `
    <div class="grid kpis-5">
      ${kpi({ label: "Ending ARR", value: money(k.arr), foot: `Period ${esc(k.period)}`, tone: "primary", icon: "dollar" })}
      ${kpi({ label: "Net revenue retention", value: pct(k.nrr, 1), foot: "Same customers, 12 months later", tone: k.nrr >= 1 ? "low" : "med", icon: "trend", tip: "ARR today from customers who existed 12 months ago, divided by their ARR back then (includes expansion)" })}
      ${kpi({ label: "Gross revenue retention", value: pct(k.grr, 1), foot: "Excludes expansion", tone: "blue", icon: "shield", tip: "Like NRR but expansion is not counted, so it can never exceed 100%" })}
      ${kpi({ label: "Net new ARR (12 mo)", value: `${k.net_new_12m >= 0 ? "+" : "-"}${money(Math.abs(k.net_new_12m))}`, foot: `+${money(k.new_12m)} new &middot; +${money(k.expansion_12m)} expansion`, tone: k.net_new_12m >= 0 ? "low" : "high", icon: "bars" })}
      ${kpi({ label: "Logo churn (12 mo)", value: pct(k.logo_churn, 1), foot: `${pct(k.involuntary_share)} from failed payments`, tone: "high", icon: "fire", tip: "Share of customers lost in the last 12 months" })}
    </div>
    <div class="panel mt"><div class="panel-h"><div class="h-txt"><h3>ARR movement per month</h3><span class="sub">What added and removed recurring revenue each month. Line = net new ARR.</span></div>
      <div class="mv-totals"><span><i style="background:#5b4cf0"></i>+${money(k.new_12m)}</span><span><i style="background:#34c38f"></i>+${money(k.expansion_12m)}</span><span><i style="background:#ffb547"></i>-${money(k.contraction_12m)}</span><span><i style="background:#ff7a7e"></i>-${money(k.churn_12m)}</span></div></div>
      <div class="panel-b">${movementChart(d.movement)}</div></div>
    <div class="panel mt"><div class="panel-h"><div class="h-txt"><h3>Customer retention by signup month</h3><span class="sub">Share of each signup cohort still a customer after N months. Darker means better retention.</span></div></div>
      <div class="panel-b">${cohortHeatmap(d.cohorts)}</div></div>
    <div class="grid cols-2 mt">
      <div class="panel"><div class="panel-h"><div class="h-txt"><h3>ARR mix</h3><span class="sub">Where today's recurring revenue comes from</span></div></div>
        <div class="panel-b">${donut(d.mix.segments.map((m, i) => ({ label: m.label, sub: `${num(m.accounts)} accounts \u00b7 ${pct(m.share)} of ARR`, value: m.arr, display: money(m.arr), color: ["#5b4cf0", "#34c38f", "#ffb547", "#1b8fd8"][i % 4] })), money(d.mix.segments.reduce((t, m) => t + m.arr, 0)), "ARR")}
          <div class="callout ${d.mix.top10_share > 0.3 ? "warn" : ""}" style="margin-top:16px">${ic("info")}<div>Top 10 accounts hold <b>${pct(d.mix.top10_share, 1)}</b> of ARR. Average account is worth <b>${money(d.mix.avg_arr)}</b> ARR.${d.mix.top10_share > 0.3 ? " That is a high concentration, so losing one large customer would hurt." : ""}</div></div></div></div>
      <div class="panel"><div class="panel-h"><div class="h-txt"><h3>Where churn happens</h3><span class="sub">Logo churn rate, last 12 months</span></div></div>
        <div class="panel-b" style="padding-bottom:8px"><div class="tabs">${["segment", "plan", "region", "industry"].map((t) => `<button class="tab ${RV.by === t ? "active" : ""}" data-by="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}</div></div>
        <div class="panel-b">${hbars(by.map((r) => ({ label: r.label, sub: `${r.churned} of ${r.base} · ${money(r.lost_arr)} lost`, value: r.rate })), { fmt: (v) => pct(v, 1), color: "linear-gradient(90deg,#ff9a9c,#e5484d)" })}</div></div>
    </div>`;
  renderIcons(el);
  $$("[data-by]", el).forEach((b) => b.addEventListener("click", () => { RV.by = b.dataset.by; rerender(); }));
}

// ------------------------------------------------------------------ boot
async function loadMeta() {
  S.meta = await api("/api/meta");
  $("#data-date").innerHTML = S.meta.data_date ? `${ic("calendar")}Data as of ${fdate(S.meta.data_date)}` : "";
  $("#sidebar-foot").innerHTML = S.meta.model ? `<div class="sf-t"><span class="pulse"></span>Model active</div>${esc(S.meta.model.algorithm)}<br>${esc(S.meta.model.version)}` : "No model trained yet";
  renderIcons($("#data-date"));
}

function renderUser() {
  const u = S.teamById[S.user];
  $("#user-avatar").innerHTML = u ? avatar(u.name, u.color) : "";
}


// First run: the server builds demo data in the background; show live progress.
async function showSetup() {
  document.body.classList.add("setup-mode");
  const steps = ["Generating 2 years of SaaS data", "Building features", "Training the churn model", "Scoring accounts", "Creating action cards"];
  $("#view").innerHTML = `<div class="setup"><div class="setup-card">
      <span class="brand-mark big"><svg viewBox="0 0 32 32"><path d="M7 21l5.5-6.5 4.5 3.5 8-9" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <h2>Setting up RevenueIQ</h2><p class="muted">First run only: creating demo data and training the churn model. This takes about 20 seconds.</p>
      <div class="setup-steps">${steps.map((s, i) => `<div class="ss" data-i="${i}"><span class="ss-dot"></span>${s}</div>`).join("")}</div>
      <div class="joblog" id="setup-log">Starting...</div></div></div>`;
  setTitle("Setting up", "First run");
  const marks = ["Generating", "Building features", "Training on", "Scoring", "new action cards"];
  const poll = async () => {
    let j;
    try { j = await api("/api/jobs/current"); } catch (e) { setTimeout(poll, 1000); return; }
    const text = j.log.join("\n");
    $("#setup-log").textContent = text || "Starting...";
    $("#setup-log").scrollTop = 1e9;
    let reached = -1;
    marks.forEach((m, i) => { if (text.includes(m)) reached = i; });
    $$(".ss").forEach((el) => { const i = Number(el.dataset.i); el.classList.toggle("done", i < reached || (!j.running && !j.error)); el.classList.toggle("now", i === reached && j.running); });
    if (j.error) { $("#setup-log").textContent += "\n\nSetup failed. Close the window and run reset.bat, then run.bat again."; return; }
    if (!j.running && j.finished_at) {
      try { const m = await api("/api/meta"); if (m.ready) { location.reload(); return; } } catch (e) { /* retry */ }
    }
    setTimeout(poll, 700);
  };
  poll();
}

async function boot() {
  renderIcons();
  $("#menu-btn").onclick = () => $(".sidebar").classList.toggle("open");
  try {
    await loadMeta();
    if (!S.meta.ready) return showSetup();
    S.team = await api("/api/team");
  } catch (e) {
    $("#view").innerHTML = `<div class="panel panel-b"><div class="callout warn">${ic("alert")}<div><b>Cannot load RevenueIQ.</b><br>${esc(e.message)}</div></div></div>`;
    renderIcons();
    return;
  }
  S.teamById = Object.fromEntries(S.team.map((t) => [t.id, t]));
  if (!S.teamById[S.user]) S.user = S.team.length ? S.team[S.team.length - 1].id : null;
  const sel = $("#user-select");
  sel.innerHTML = S.team.map((t) => `<option value="${t.id}" ${t.id === S.user ? "selected" : ""}>${esc(t.name)}</option>`).join("");
  renderUser();
  sel.onchange = () => {
    S.user = Number(sel.value);
    try { localStorage.setItem("riq_user", String(S.user)); } catch (e) { /* ignore */ }
    renderUser();
    toast(`Now acting as ${S.teamById[S.user].name}`);
    rerender();
  };
  refreshBoardCount();
  refreshSignalCount();
  router();
}
boot();
