// Picshoo's site: a working desktop. Screenshots of the page hang on the
// line under the menu bar; hold one to open capcap's editor on it.
"use strict";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const stage = $("#stage");
const scene = $("#scene");
const lineEl = $("#line");
const ropeEl = $("#rope");
const photosEl = $("#photos");
const shade = $("#shade");
const selEl = $("#sel");
const tourEl = $("#tour");
const menubar = $("#menubar");
const BAR = 32;
const GAP = 24;
const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

// ===================================================================
// Strings
// ===================================================================

const STR = {
  en: {
    menuFile: "File", menuEdit: "Edit", menuView: "View", menuHelp: "Help",
    menuHide: "Hide line", menuShow: "Show line", menuClear: "Take everything down", menuReadme: "Read me",
    lineEmpty: "Take a screenshot and it hangs here",
    h1a: "Screenshots,", h1b: "on the line",
    lede: "Every screenshot hangs on a line just above your screen. Hold one to mark it up in capcap's editor",
    btnDownload: "Download for Mac", btnReadme: "Read me",
    meta: "Free and MIT licensed · macOS 14 or later · Apple silicon and Intel",
    metaV: "Free and MIT licensed · Version {v} · macOS 14 or later · Apple silicon and Intel",
    free: "Free",
    chips: ["Double-tap ⌘", "Mark up", "Scrolling", "Beautify", "Pin", "OCR", "Translate"],
    badge1k: "Editor from", badge2k: "Line from",
    fileReadme: "Read me.txt", items: "{n} items", item: "1 item",
    winReport: "Weekly Report", reportTitle: "Captures this week", reportSub: "October 25 – 31",
    statCaptured: "Captured", statMarked: "Marked up", statSent: "Sent",
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    winNotes: "How it works", notesTitle: "On the line",
    n1: "Click a photo to copy it", n2: "Hold it to mark it up in capcap", n3: "Drag it to Ling, Keepers or the Trash",
    n4: "Click its cross to let it go", n5: "Double-tap ⌘ to take one",
    c1: "Morning! Is the new layout done?", c2: "Almost, it looks much cleaner",
    c3: "Can you circle the part you changed?", c4: "Marking up a screenshot for you now",
    cInput: "Message", today: "Today",
    replies: ["Got it", "Perfect, thanks", "Oh that's much better", "Haha nice", "Saving this one"],
    appNotes: "Notes", appChat: "Messages", appTrash: "Trash",
    capScreen: "Screen", capWindow: "Window", capSelection: "Selection",
    credit: "Designed and built by Bingyu", mit: "MIT License",
    selHint: "Drag across anything to capture it. Esc cancels",
    winHint: "Click a window to capture it. Esc cancels",
    cancel: "Cancel",
    tourOf: "{n} of 3 steps",
    tour1: "<b>Rest your pointer in the menu bar.</b> That's where Picshoo keeps the line",
    tour2: "<b>Now take a screenshot.</b> Double-tap ⌘, or choose Selection below",
    tour2Touch: "<b>Take a screenshot.</b> Choose Selection below and drag across anything",
    tour3: "<b>It's on the line.</b> Click it to copy, hold it to mark it up, or drag it to Ling, Keepers or the Trash",
    copied: "Copied", copyFail: "The browser blocked the copy",
    sentNotes: "Added to Notes", sentChat: "Sent to Ling",
    kept: "Kept in Keepers", trashed: "Moved to the Trash", putBack: "Put back",
    updated: "Written back to the line", saved: "Saved", captureFail: "That capture didn't work, try again",
    winKeepers: "Keepers", winPreview: "Preview", winReadme: "Read me.txt",
    keepersEmpty: "Drag a photo here to keep it", download: "Download",
    editorHint: "Esc cancels · Return writes it back to the line",
    tRect: "Rectangle", tEllipse: "Ellipse", tArrow: "Arrow", tPen: "Pen", tMarker: "Marker",
    tMosaic: "Mosaic", tNum: "Numbered", tText: "Text", tUndo: "Undo", tRedo: "Redo",
    tPin: "Pin to Screen", tSave: "Save to File", tCancel: "Cancel", tConfirm: "Write back to the line",
    readme: `<h3>Picshoo</h3>
      <p>capcap's editor, with Tendedero's line along the top of your screen</p>
      <h4>Install</h4>
      <ol>
        <li><a href="/download">Download Picshoo.zip</a> and unzip it</li>
        <li>Drag Picshoo.app into Applications</li>
        <li>It isn't notarized yet, so run this once in Terminal
          <div class="cmd"><code>xattr -dr com.apple.quarantine /Applications/Picshoo.app</code></div></li>
        <li>Allow Screen Recording and Accessibility, then click Start</li>
      </ol>
      <h4>On the line</h4>
      <ul>
        <li>Double-tap ⌘ and drag: capcap's editor opens for markup or a scrolling capture, and once you confirm it hangs on the line and lands on the clipboard</li>
        <li>⌘⇧3, ⌘⇧4 and ⌘⇧5 hang too, once Picshoo handles your screenshots</li>
        <li>Click to copy, hold to mark it up, double click to look closer</li>
        <li>Drag into an app to send a copy, into a folder to keep it</li>
        <li>⌃⌥T shows or hides the line</li>
      </ul>
      <h4>capcap inside</h4>
      <ul>
        <li>Rectangles, arrows, pen, marker, spotlight, mosaic, blur, magnifier, numbered steps, text and emoji</li>
        <li>Scrolling capture, beautify, pin to screen</li>
        <li>Text recognition and translation, history, image-host upload</li>
      </ul>
      <h4>Credits</h4>
      <p>Stitched together from two MIT-licensed apps, <a href="https://github.com/realskyrin/capcap" target="_blank" rel="noopener">capcap</a> by realskyrin and <a href="https://github.com/alejandrobujan/tendedero" target="_blank" rel="noopener">Tendedero</a> by Alejandro Buján, and not affiliated with either. Product Sans belongs to Google</p>`,
  },
  zh: {
    menuFile: "文件", menuEdit: "编辑", menuView: "显示", menuHelp: "帮助",
    menuHide: "隐藏绳子", menuShow: "显示绳子", menuClear: "全部取下", menuReadme: "读我",
    lineEmpty: "截一张图，它就挂在这里",
    h1a: "截图，", h1b: "挂在绳上",
    lede: "每张截图都挂在屏幕顶部的绳子上。长按一张，用 capcap 的编辑器标注",
    btnDownload: "下载 Mac 版", btnReadme: "读我",
    meta: "免费、MIT 开源 · macOS 14 或更高版本 · Apple 芯片和 Intel",
    metaV: "免费、MIT 开源 · 版本 {v} · macOS 14 或更高版本 · Apple 芯片和 Intel",
    free: "免费",
    chips: ["双击 ⌘", "标注", "长截图", "美化", "钉图", "文字识别", "翻译"],
    badge1k: "编辑器来自", badge2k: "晾衣绳来自",
    fileReadme: "读我.txt", items: "{n} 项", item: "1 项",
    winReport: "周报", reportTitle: "本周截图", reportSub: "10 月 25 日 – 31 日",
    statCaptured: "截图", statMarked: "标注", statSent: "发送",
    days: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
    winNotes: "怎么用", notesTitle: "晾衣绳",
    n1: "单击照片复制", n2: "长按用 capcap 标注", n3: "拖给 Ling、Keepers 或废纸篓",
    n4: "点叉丢掉", n5: "双击 ⌘ 截一张",
    c1: "早！新版面做好了吗", c2: "快了，清爽多了",
    c3: "能把你改的地方圈出来吗", c4: "正在给你标一张截图",
    cInput: "信息", today: "今天",
    replies: ["收到", "完美，谢谢", "这样好多了", "哈哈好", "这张我存了"],
    appNotes: "备忘录", appChat: "信息", appTrash: "废纸篓",
    capScreen: "全屏", capWindow: "窗口", capSelection: "框选",
    credit: "Bingyu 设计制作", mit: "MIT 许可",
    selHint: "拖动框选要截的区域，Esc 取消",
    winHint: "点一个窗口截下它，Esc 取消",
    cancel: "取消",
    tourOf: "第 {n} 步，共 3 步",
    tour1: "<b>把鼠标停在菜单栏上。</b>Picshoo 把绳子收在那里",
    tour2: "<b>现在截一张图。</b>双击 ⌘，或者点下面的「框选」",
    tour2Touch: "<b>截一张图。</b>点下面的「框选」，然后拖动选区",
    tour3: "<b>挂上了。</b>单击复制，长按标注，或者拖给 Ling、Keepers 或废纸篓",
    copied: "已复制", copyFail: "浏览器不让复制",
    sentNotes: "已加到备忘录", sentChat: "已发给 Ling",
    kept: "已收进 Keepers", trashed: "已移到废纸篓", putBack: "放回去",
    updated: "已写回绳上", saved: "已保存", captureFail: "这次没截成功，再试一次",
    winKeepers: "Keepers", winPreview: "预览", winReadme: "读我.txt",
    keepersEmpty: "把照片拖到这里收起来", download: "下载",
    editorHint: "Esc 取消 · 回车写回绳上",
    tRect: "矩形", tEllipse: "椭圆", tArrow: "箭头", tPen: "画笔", tMarker: "高亮笔",
    tMosaic: "马赛克", tNum: "序号", tText: "文字", tUndo: "撤销", tRedo: "恢复撤销",
    tPin: "钉在屏幕", tSave: "保存到文件", tCancel: "取消", tConfirm: "写回绳上",
    readme: `<h3>Picshoo</h3>
      <p>capcap 的编辑器，加上 Tendedero 挂在屏幕顶部的晾衣绳</p>
      <h4>安装</h4>
      <ol>
        <li><a href="/download">下载 Picshoo.zip</a> 并解压</li>
        <li>把 Picshoo.app 拖进「应用程序」</li>
        <li>还没有经过公证，在终端里运行一次
          <div class="cmd"><code>xattr -dr com.apple.quarantine /Applications/Picshoo.app</code></div></li>
        <li>授予「屏幕录制」和「辅助功能」权限，再点「启动」</li>
      </ol>
      <h4>晾衣绳</h4>
      <ul>
        <li>双击 ⌘ 并框选：打开编辑器，可标注或截长图，确认后挂上绳子并复制到剪贴板</li>
        <li>打开「接管截图」后，⌘⇧3、⌘⇧4、⌘⇧5 也会挂上绳子</li>
        <li>单击复制，长按标注，双击放大看</li>
        <li>拖到 app 里发送一份，拖到文件夹里保存并取下</li>
        <li>⌃⌥T 显示或隐藏绳子</li>
      </ul>
      <h4>capcap 内核</h4>
      <ul>
        <li>矩形、箭头、画笔、高亮笔、聚光灯、马赛克、模糊、放大镜、序号、文字和表情</li>
        <li>长截图、美化、钉在屏幕</li>
        <li>文字识别与翻译、历史记录、上传图床</li>
      </ul>
      <h4>致谢</h4>
      <p>由两个 MIT 开源项目拼接而成：realskyrin 的 <a href="https://github.com/realskyrin/capcap" target="_blank" rel="noopener">capcap</a> 和 Alejandro Buján 的 <a href="https://github.com/alejandrobujan/tendedero" target="_blank" rel="noopener">Tendedero</a>，与两位作者都没有关联。Product Sans 字体属于 Google</p>`,
  },
};

let lang = store.get("picshoo.lang") || ((navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en");
let version = null;

function t(key, vars) {
  let s = (STR[lang] && STR[lang][key]) ?? STR.en[key] ?? key;
  if (vars) for (const k in vars) s = s.replace(`{${k}}`, vars[k]);
  return s;
}

const CHIP_ICONS = [
  '<path d="M9 9V6.5A2.5 2.5 0 1 0 6.5 9H9zm0 0v6m0-6h6m-6 6H6.5A2.5 2.5 0 1 0 9 17.5V15zm0 0h6m0-6V6.5A2.5 2.5 0 1 1 17.5 9H15zm0 0v6m0 0h2.5a2.5 2.5 0 1 1-2.5 2.5V15z"/>',
  '<path d="M5 19L17 7M11 7h6v6"/>',
  '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M12 9v6M9.5 12.5L12 15l2.5-2.5"/>',
  '<path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>',
  '<path d="M9 3h6l-1 6 4 4H6l4-4zM12 13v8"/>',
  '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 9h8M12 9v7"/>',
  '<path d="M4 6h9M8.5 4v2M11 6c-.8 3.5-3 6-6 7.5M6.5 9.5c1 1.8 2.6 3 4.5 3.8M13 20l4-9 4 9M14.5 17h5"/>',
];

function applyLang() {
  document.documentElement.lang = lang === "zh" ? "zh-Hans" : "en";
  for (const el of $$("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const b of $$(".langs button")) b.classList.toggle("is-current", b.dataset.lang === lang);
  $("#meta").textContent = version ? t("metaV", { v: version }) : t("meta");
  $("#versionPill").textContent = version ? `v${version}` : t("free");
  $("#chips").innerHTML = t("chips").map((c, i) => `<span class="chip"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CHIP_ICONS[i]}</svg>${c}</span>`).join("");
  const days = t("days");
  const today = new Date().getDay();
  $("#days").innerHTML = Array.from({ length: 7 }, (_, i) => `<span>${days[(today + 1 + i) % 7]}</span>`).join("");
  $("#menuLine").textContent = t(lineDown ? "menuHide" : "menuShow");
  const readme = $('.win[data-id="readme"] .readme');
  if (readme) readme.innerHTML = t("readme");
  renderKeepers();
  renderTour();
  updateShadeHint();
  tick();
}

for (const b of $$(".langs button")) {
  b.addEventListener("click", () => {
    lang = b.dataset.lang;
    store.set("picshoo.lang", lang);
    applyLang();
  });
}

// ----- clock -----
function tick() {
  const now = new Date();
  const fmt = lang === "zh"
    ? new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false })
    : new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  $("#clock").textContent = fmt.format(now).replace(",", "");
  const hm = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(now);
  $("#chatTime").textContent = `${t("today")} ${hm}`;
}
setInterval(tick, 15000);

// ----- the version comes from the deploy, when there is one -----
fetch("/latest.json").then((r) => (r.ok ? r.json() : null)).then((j) => {
  if (j && j.version) { version = j.version; applyLang(); }
}).catch(() => {});

// ----- copy buttons on the install command -----
const CHECK = '<svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
for (const b of $$("[data-copy]")) {
  const icon = b.innerHTML;
  b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); } catch { return; }
    b.innerHTML = CHECK;
    b.classList.add("is-done");
    setTimeout(() => { b.innerHTML = icon; b.classList.remove("is-done"); }, 1500);
  });
}

// ----- the scene scales like an SVG viewBox: the whole 1440 × 900 fits -----
let scale = 1;
function fit() {
  const W = stage.clientWidth;
  const H = stage.clientHeight;
  // Narrow screens only show the hero, so it's the hero that has to fit
  scale = W < 760 ? Math.min(W / 620, H / 900) : Math.min(W / 1440, H / 900);
  scene.style.setProperty("--s", scale);
}

// ===================================================================
// The line
// ===================================================================

let photos = []; // newest first
let nextId = 1;
let lineDown = true;
let showTimer = 0;
let hideTimer = 0;
let holdLineUntil = 0;
let dragging = null;
let pressing = null;
let capturing = false;
let editorOpen = false;

const sag = (W) => Math.min(52, W * 0.036);
const ropeY = (x, W) => { const u = x / W; return 10 + sag(W) * 4 * u * (1 - u); };

function drawRope() {
  const W = lineEl.clientWidth;
  if (!W) return;
  ropeEl.setAttribute("viewBox", `0 0 ${W} 60`);
  const d = `M-20 ${ropeY(-20, W).toFixed(2)} Q${W / 2} ${(10 + sag(W) * 2).toFixed(2)} ${W + 20} ${ropeY(W + 20, W).toFixed(2)}`;
  ropeEl.innerHTML = `
    <path d="${d}" fill="none" stroke="rgba(0,0,0,0.18)" stroke-width="1.6" transform="translate(0 1.4)" style="filter:blur(1.2px)"/>
    <path d="${d}" fill="none" stroke="#001489" stroke-width="1.6"/>
    <path d="${d}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="0.4" transform="translate(0 -0.4)"/>`;
}

function sizeThumb(p) {
  const cw = p.canvas.width / p.k;
  const ch = p.canvas.height / p.k;
  const s = Math.min(142 / cw, 108 / ch, 1.6);
  p.tw = Math.max(34, Math.round(cw * s));
  p.th = Math.max(26, Math.round(ch * s));
}

function layout() {
  const W = lineEl.clientWidth;
  const outer = (p) => p.tw + 8;
  const total = () => photos.reduce((a, p) => a + outer(p), 0) + GAP * Math.max(0, photos.length - 1);
  // As many as fit: the oldest come down when the line is full
  while (photos.length > 1 && total() > W - 60) photos.pop().el.remove();
  let x = (W - total()) / 2;
  photos.forEach((p, i) => {
    const cx = x + outer(p) / 2;
    p.x = x;
    p.y = ropeY(cx, W) - 6;
    Object.assign(p.el.style, { left: `${p.x}px`, top: `${p.y}px`, width: `${outer(p)}px` });
    p.el.querySelector(".card").style.height = `${p.th + 8}px`;
    p.el.querySelector(".swing").style.setProperty("--r", `${(i % 2 ? 1 : -1) * (0.9 + (p.id % 3) * 0.5)}deg`);
    x += outer(p) + GAP;
  });
  $(".line__hint").style.opacity = photos.length ? 0 : 1;
}

// Where a photo's picture sits, in stage coordinates, once the line is down
function cardRect(p) {
  return { x: p.x + 4, y: BAR + p.y + 14 + 4, w: p.tw, h: p.th };
}

function setLine(down) {
  lineDown = down;
  lineEl.classList.toggle("is-up", !down);
  $("#menuLine").textContent = t(down ? "menuHide" : "menuShow");
  if (down) menubar.classList.remove("is-beckon");
  if (down && tourStep === 1) showTour(2);
}

function holdLine(ms) {
  holdLineUntil = Math.max(holdLineUntil, performance.now() + ms);
}

// The line stays down while something needs it, including the tour's last
// step, which points at a photo on it
const busy = () => dragging || pressing || capturing || editorOpen || tourStep === 3;

function scheduleHide() {
  if (!canHover || hideTimer || !lineDown) return;
  hideTimer = setTimeout(function again() {
    if (busy() || performance.now() < holdLineUntil) { hideTimer = setTimeout(again, 600); return; }
    hideTimer = 0;
    setLine(false);
  }, 1300);
}
function cancelHide() { clearTimeout(hideTimer); hideTimer = 0; }

function lineZoneBottom() {
  return BAR + Math.max(80, ...photos.map((p) => p.y + p.th + 40));
}

if (canHover) {
  stage.addEventListener("pointermove", (e) => {
    const y = e.clientY - stage.getBoundingClientRect().top;
    if (y < BAR) {
      cancelHide();
      if (!lineDown && !showTimer) showTimer = setTimeout(() => { showTimer = 0; setLine(true); }, 160);
      return;
    }
    clearTimeout(showTimer);
    showTimer = 0;
    if (lineDown && y < lineZoneBottom()) cancelHide();
    else scheduleHide();
  });
  stage.addEventListener("pointerleave", () => { clearTimeout(showTimer); showTimer = 0; scheduleHide(); });
}

new ResizeObserver(() => { fit(); drawRope(); layout(); renderTour(); }).observe(stage);

// ----- photos -----

function stamp(d) {
  const z = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} at ${z(d.getHours())}.${z(d.getMinutes())}.${z(d.getSeconds())}`;
}

async function setCanvas(p, canvas) {
  p.canvas = canvas;
  p.url = canvas.toDataURL("image/png");
  p.blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
  if (p.el) p.el.querySelector("img").src = p.url;
}

function makePhotoEl(p) {
  const el = document.createElement("div");
  el.className = "peg";
  el.innerHTML = `<div class="swing"><div class="clip"></div><div class="card"><img alt=""><button class="cross" type="button" aria-label="Discard">✕</button></div></div>`;
  el.querySelector(".swing").style.setProperty("--d", `${-Math.random() * 5}s`);
  el.querySelector("img").src = p.url;
  el.querySelector(".cross").addEventListener("pointerdown", (e) => e.stopPropagation());
  el.querySelector(".cross").addEventListener("click", (e) => { e.stopPropagation(); trash(p); });
  el.addEventListener("contextmenu", (e) => e.preventDefault());
  el.addEventListener("pointerdown", (e) => onPhotoDown(p, e));
  return el;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function addPhoto(canvas, from, { quiet = false } = {}) {
  const p = { id: nextId++, k: canvas.k, time: new Date() };
  await setCanvas(p, canvas);
  p.name = `Picshoo ${stamp(p.time)}.png`;
  sizeThumb(p);
  p.el = makePhotoEl(p);
  photos.unshift(p);
  photosEl.appendChild(p.el);
  layout();
  if (quiet) return p;

  p.el.classList.add("is-new");
  setLine(true);
  holdLine(3200);
  copyPhoto(p, false);

  // Fly from where it was taken to its peg. The line's resting position is
  // known, so this doesn't wait for the line to finish sliding down
  const sr = stage.getBoundingClientRect();
  const to = cardRect(p);
  const f = new Image();
  f.src = p.url;
  f.className = "flyer";
  Object.assign(f.style, { left: `${sr.left + from.x}px`, top: `${sr.top + from.y}px`, width: `${from.w}px`, height: `${from.h}px`, transformOrigin: "0 0" });
  document.body.appendChild(f);
  // Animations stall in a background tab, so the photo never waits on one
  await Promise.race([
    f.animate(
      [{ transform: "none" }, { transform: `translate(${to.x - from.x}px, ${to.y - from.y}px) scale(${to.w / from.w}, ${to.h / from.h})` }],
      { duration: 640, easing: "cubic-bezier(0.3, 0.7, 0.2, 1)", fill: "forwards" },
    ).finished.catch(() => {}),
    sleep(900),
  ]);
  f.remove();
  p.el.classList.remove("is-new");
  if (tourStep && tourStep < 3) showTour(3);
  return p;
}

function removeFromLine(p) {
  const i = photos.indexOf(p);
  if (i < 0) return;
  photos.splice(i, 1);
  p.el.remove();
  layout();
}

async function copyPhoto(p, say = true) {
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": p.blob })]);
    if (say) toastAt(p, t("copied"));
  } catch {
    if (say) toastAt(p, t("copyFail"));
  }
}

function trash(p) {
  removeFromLine(p);
  $("#trashIcon").classList.add("is-full");
  bump($("#trashIcon"));
  toast(t("trashed"), { action: t("putBack"), onAction: () => putBack(p) });
  finishTour();
}

function putBack(p) {
  if (photos.includes(p)) return;
  p.el.classList.remove("is-lifted", "is-pressing");
  photos.unshift(p);
  photosEl.appendChild(p.el);
  layout();
  setLine(true);
  holdLine(2500);
}

// ----- click, double click, hold, drag -----

function onPhotoDown(p, e) {
  if (e.button !== 0 || editorOpen) return;
  e.preventDefault();
  const el = p.el;
  try { el.setPointerCapture(e.pointerId); } catch {}
  const start = { x: e.clientX, y: e.clientY };
  const rect = el.querySelector(".card").getBoundingClientRect();
  const offset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  let state = "press";
  pressing = p;
  el.classList.add("is-pressing");
  const hold = setTimeout(() => {
    state = "hold";
    el.classList.remove("is-pressing");
    openEditor(p);
  }, 480);

  const move = (ev) => {
    if (state === "press" && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 6) {
      clearTimeout(hold);
      el.classList.remove("is-pressing");
      state = "drag";
      beginDrag(p, offset);
    }
    if (state === "drag") moveDrag(ev);
  };
  const up = (ev) => {
    clearTimeout(hold);
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", up);
    el.classList.remove("is-pressing");
    pressing = null;
    if (state === "press" && ev.type === "pointerup") {
      const now = performance.now();
      if (now - (p.lastClick || 0) < 320) { p.lastClick = 0; openPreview(p); }
      else { p.lastClick = now; copyPhoto(p); finishTour(); }
    } else if (state === "drag") {
      endDrag(ev);
    }
  };
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
}

let ghost = null;
let ghostOffset = null;
let overEl = null;

function beginDrag(p, offset) {
  dragging = p;
  p.el.classList.add("is-lifted");
  ghost = document.createElement("div");
  ghost.className = "ghost";
  ghost.innerHTML = `<img alt="">`;
  ghost.querySelector("img").src = p.url;
  ghostOffset = offset;
  Object.assign(ghost.style, { width: `${p.tw + 8}px`, height: `${p.th + 8}px` });
  document.body.appendChild(ghost);
}

function dropTargetAt(x, y) {
  for (const el of document.elementsFromPoint(x, y)) {
    const target = el.closest("[data-drop]");
    if (target) return target;
  }
  return null;
}

function moveDrag(e) {
  ghost.style.left = `${e.clientX - ghostOffset.x}px`;
  ghost.style.top = `${e.clientY - ghostOffset.y}px`;
  const target = dropTargetAt(e.clientX, e.clientY);
  if (target !== overEl) {
    overEl?.classList.remove("is-over");
    target?.classList.add("is-over");
    overEl = target;
  }
  ghost.classList.toggle("is-target", !!target);
}

async function endDrag(e) {
  const p = dragging;
  const target = dropTargetAt(e.clientX, e.clientY);
  overEl?.classList.remove("is-over");
  overEl = null;
  const g = ghost;
  ghost = null;
  if (target) {
    const r = target.getBoundingClientRect();
    const gr = g.getBoundingClientRect();
    g.animate(
      [{ transform: "none", opacity: 1 }, { transform: `translate(${r.left + r.width / 2 - gr.left - gr.width / 2}px, ${r.top + r.height / 2 - gr.top - gr.height / 2}px) scale(0.15)`, opacity: 0 }],
      { duration: 280, easing: "ease-in", fill: "forwards" },
    );
    setTimeout(() => g.remove(), 320);
    p.el.classList.remove("is-lifted");
    dropOn(p, target.dataset.drop);
  } else {
    const to = p.el.querySelector(".card").getBoundingClientRect();
    const gr = g.getBoundingClientRect();
    await Promise.race([
      g.animate([{ transform: "none" }, { transform: `translate(${to.left - gr.left}px, ${to.top - gr.top}px)`, rotate: "0deg" }], { duration: 260, easing: "ease-out", fill: "forwards" }).finished.catch(() => {}),
      sleep(400),
    ]);
    g.remove();
    p.el.classList.remove("is-lifted");
  }
  dragging = null;
}

function dropOn(p, kind) {
  finishTour();
  if (kind === "notes") {
    const win = showWin("notes");
    win.querySelector(".notes__imgs").insertAdjacentHTML("beforeend", `<img src="${p.url}" alt="">`);
    const body = win.querySelector(".notes");
    body.scrollTop = body.scrollHeight;
    bump($('.dock-app[data-app="notes"]'));
    toast(t("sentNotes"));
  } else if (kind === "chat") {
    sendChat(p.url);
    bump($('.dock-app[data-app="chat"]'));
    toast(t("sentChat"));
  } else if (kind === "keepers") {
    removeFromLine(p);
    keepers.push(p);
    renderKeepers();
    toast(t("kept"));
  } else if (kind === "trash") {
    trash(p);
  }
}

function bump(el) {
  if (!el) return;
  el.classList.remove("is-bump");
  void el.offsetWidth;
  el.classList.add("is-bump");
}

// ===================================================================
// Toasts
// ===================================================================

function toast(msg, { x, y, action, onAction, ms = 2200 } = {}) {
  const box = $("#toasts");
  box.querySelectorAll(".toast").forEach((n) => n.remove());
  const el = document.createElement("div");
  el.className = "toast glass";
  el.textContent = msg;
  if (action) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = action;
    b.addEventListener("click", () => { onAction(); el.remove(); });
    el.appendChild(b);
    ms = 5000;
  }
  el.style.left = `${x ?? stage.clientWidth / 2}px`;
  el.style.top = `${y ?? $("#toolbar").offsetTop - 46}px`;
  box.appendChild(el);
  setTimeout(() => { el.style.opacity = 0; setTimeout(() => el.remove(), 300); }, ms);
}

function toastAt(p, msg) {
  if (!photos.includes(p) || !lineDown) return toast(msg);
  const r = cardRect(p);
  toast(msg, { x: r.x + r.w / 2, y: r.y + r.h + 12 });
}

// ===================================================================
// Windows
// ===================================================================

let zTop = 20;

function frontWin(win) {
  win.style.zIndex = ++zTop;
}

function wireWin(win) {
  const id = win.dataset.id;
  win.addEventListener("pointerdown", () => frontWin(win));
  win.querySelector(".l-close").addEventListener("click", (e) => {
    e.stopPropagation();
    closeWin(win);
  });
  draggable(win, win.querySelector(".win__bar"), true);
  if (win.offsetWidth) $(`.dock-app[data-app="${id}"]`)?.classList.add("is-open");
}

function closeWin(win) {
  const id = win.dataset.id;
  if (win.dataset.static) { win.hidden = true; win.classList.remove("is-shown"); }
  else win.remove();
  $(`.dock-app[data-app="${id}"]`)?.classList.remove("is-open");
}

// The three windows in the page open again from the Dock; the rest are made
// when asked for
function showWin(id) {
  const win = scene.querySelector(`.win[data-id="${id}"]`);
  if (!win) return null;
  if (win.hidden || !win.offsetWidth) {
    win.hidden = false;
    win.classList.add("is-shown");
    $(`.dock-app[data-app="${id}"]`)?.classList.add("is-open");
  }
  frontWin(win);
  return win;
}

function openWindow(id, { title, w, x, y, drop, body }) {
  const open = scene.querySelector(`.win[data-id="${id}"]`);
  if (open) { frontWin(open); return open; }
  const win = document.createElement("section");
  win.className = "win";
  win.dataset.id = id;
  win.dataset.window = "";
  if (drop) win.dataset.drop = drop;
  win.innerHTML = `<header class="win__bar"><span class="lights"><i class="l-close"></i><i></i><i></i></span><span class="win__title" data-i18n="${title}">${t(title)}</span></header>`;
  win.appendChild(body);
  // On a narrow screen the scene is cropped to the hero, so new windows go
  // in its middle
  const narrow = stage.clientWidth < 760;
  const ww = narrow ? 520 : w;
  const wx = narrow ? 460 : Math.max(20, Math.min(x, 1440 - ww - 20));
  Object.assign(win.style, { width: `${ww}px`, left: `${wx}px`, top: `${narrow ? 150 : y}px` });
  scene.appendChild(win);
  frontWin(win);
  wireWin(win);
  return win;
}

function draggable(el, handle, inScene) {
  handle.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest("button, .lights")) return;
    e.preventDefault();
    try { handle.setPointerCapture(e.pointerId); } catch {}
    const k = inScene ? scale : 1;
    const sx = e.clientX;
    const sy = e.clientY;
    const l0 = el.offsetLeft;
    const t0 = el.offsetTop;
    const move = (ev) => {
      el.style.left = `${l0 + (ev.clientX - sx) / k}px`;
      el.style.top = `${Math.max(inScene ? 0 : BAR, t0 + (ev.clientY - sy) / k)}px`;
    };
    const up = () => { handle.removeEventListener("pointermove", move); handle.removeEventListener("pointerup", up); };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
  });
}

for (const win of $$(".scene .win")) {
  win.dataset.static = "1";
  wireWin(win);
}

function sendChat(url) {
  const win = showWin("chat");
  const log = win.querySelector(".chat__log");
  log.insertAdjacentHTML("beforeend", `<div class="bubble bubble--out bubble--img"><img src="${url}" alt=""></div>`);
  log.scrollTop = log.scrollHeight;
  setTimeout(() => {
    const list = t("replies");
    const b = document.createElement("div");
    b.className = "bubble bubble--in";
    b.textContent = list[Math.floor(Math.random() * list.length)];
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
  }, 900);
}

const keepers = [];

function openKeepers() {
  const body = document.createElement("div");
  body.className = "keepers";
  const win = openWindow("keepers", { title: "winKeepers", w: 360, x: 1010, y: 330, drop: "keepers", body });
  renderKeepers();
  return win;
}

function renderKeepers() {
  $("#keepersCount").textContent = keepers.length ? (keepers.length === 1 ? t("item") : t("items", { n: keepers.length })) : "";
  const grid = scene.querySelector('.win[data-id="keepers"] .keepers');
  if (!grid) return;
  grid.innerHTML = keepers.length ? "" : `<p class="keepers__empty">${t("keepersEmpty")}</p>`;
  for (const p of keepers) {
    const item = document.createElement("div");
    item.className = "keepers__item";
    item.innerHTML = `<img alt=""><a></a>`;
    item.querySelector("img").src = p.url;
    const a = item.querySelector("a");
    a.textContent = t("download");
    a.href = p.url;
    a.download = p.name;
    grid.appendChild(item);
  }
}

function openReadme() {
  const body = document.createElement("div");
  body.className = "readme";
  body.innerHTML = t("readme");
  return openWindow("readme", { title: "winReadme", w: 440, x: 500, y: 210, body });
}

function openPreview(p) {
  const body = document.createElement("div");
  body.className = "preview";
  body.innerHTML = `<img alt="">`;
  body.querySelector("img").src = p.url;
  const w = Math.min(760, Math.max(300, p.canvas.width / p.k + 22));
  openWindow(`preview-${p.id}`, { title: "winPreview", w, x: (1440 - w) / 2, y: 160, body });
}

$("#keepersIcon").addEventListener("click", openKeepers);
for (const el of $$("[data-open=readme]")) el.addEventListener("click", openReadme);
for (const b of $$(".dock-app")) {
  b.addEventListener("click", () => {
    const app = b.dataset.app;
    if (app === "keepers") openKeepers();
    else if (app === "trash") bump(b);
    else showWin(app);
  });
}

// ----- the status menu, like Picshoo's own -----
const statusBtn = $("#statusBtn");
const statusMenu = $("#statusMenu");
statusBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = statusMenu.hidden;
  statusMenu.hidden = !open;
  statusBtn.classList.toggle("is-open", open);
  if (open) {
    const r = statusBtn.getBoundingClientRect();
    statusMenu.style.left = `${Math.max(8, Math.min(r.left, stage.clientWidth - statusMenu.offsetWidth - 8))}px`;
  }
});
addEventListener("pointerdown", (e) => {
  if (!statusMenu.hidden && !e.target.closest("#statusMenu, #statusBtn")) {
    statusMenu.hidden = true;
    statusBtn.classList.remove("is-open");
  }
});
statusMenu.addEventListener("click", (e) => {
  const b = e.target.closest("[data-cmd]");
  statusMenu.hidden = true;
  statusBtn.classList.remove("is-open");
  if (!b) return;
  if (b.dataset.cmd === "line") { setLine(!lineDown); if (lineDown) holdLine(2500); }
  if (b.dataset.cmd === "clear") { for (const p of [...photos]) removeFromLine(p); }
  if (b.dataset.cmd === "readme") openReadme();
});

// Pinned captures, as capcap pins them: float above everything, drag to
// move, scroll to zoom, double click to put away
function pinImage(canvas) {
  const W = stage.clientWidth;
  const w0 = Math.min(canvas.width / canvas.k, W * 0.5, 520);
  const el = document.createElement("div");
  el.className = "pin";
  el.dataset.window = "";
  el.innerHTML = `<img alt=""><button class="cross" type="button" aria-label="Close">✕</button>`;
  el.querySelector("img").src = canvas.toDataURL("image/png");
  Object.assign(el.style, { width: `${w0}px`, left: `${(W - w0) / 2 + 40}px`, top: `${BAR + 200}px` });
  stage.appendChild(el);
  el.querySelector(".cross").addEventListener("pointerdown", (e) => e.stopPropagation());
  el.querySelector(".cross").addEventListener("click", () => el.remove());
  el.addEventListener("dblclick", () => el.remove());
  el.addEventListener("wheel", (e) => {
    e.preventDefault();
    el.style.width = `${Math.max(60, Math.min(W, el.offsetWidth * (e.deltaY < 0 ? 1.08 : 0.93)))}px`;
  }, { passive: false });
  draggable(el, el, false);
}

// ===================================================================
// Capturing the page
// ===================================================================

let mode = null;
let selStart = null;
let winTarget = null;
let fontCSS = null;

const embedFonts = () => (fontCSS ||= window.htmlToImage.getFontEmbedCSS(stage).catch(() => ""));
const captureFilter = (n) => !(n.classList && n.classList.contains("no-capture"));

function snapshot() {
  const lib = window.htmlToImage;
  if (!lib) return Promise.reject(new Error("html-to-image did not load"));
  return embedFonts().then((css) => lib.toCanvas(stage, {
    pixelRatio: Math.min(2, window.devicePixelRatio || 1),
    fontEmbedCSS: css,
    backgroundColor: "#f4f7fd",
    filter: captureFilter,
  }));
}

function stageRect() { return stage.getBoundingClientRect(); }

function startCapture(kind) {
  if (editorOpen || capturing) return;
  if (kind === "screen") {
    const sr = stageRect();
    doCapture({ x: 0, y: 0, w: sr.width, h: sr.height });
    return;
  }
  mode = kind;
  shade.hidden = false;
  shade.className = `shade no-capture is-${kind}`;
  updateShadeHint();
}

function updateShadeHint() {
  $("#shadeHint").textContent = mode === "window" ? t("winHint") : t("selHint");
}

function endCapture() {
  mode = null;
  selStart = null;
  winTarget = null;
  shade.hidden = true;
  shade.className = "shade no-capture";
}

function placeSel(r) {
  Object.assign(selEl.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
  $("#selSize").textContent = `${Math.round(r.w)} × ${Math.round(r.h)}`;
}

function windowAt(x, y) {
  for (const el of document.elementsFromPoint(x, y)) {
    if (el.closest(".no-capture")) continue;
    const w = el.closest("[data-window]");
    if (w) return w;
  }
  return null;
}

function rectOf(el) {
  const sr = stageRect();
  const r = el.getBoundingClientRect();
  const x = Math.max(0, r.left - sr.left);
  const y = Math.max(0, r.top - sr.top);
  return { x, y, w: Math.min(sr.width, r.right - sr.left) - x, h: Math.min(sr.height, r.bottom - sr.top) - y };
}

shade.addEventListener("pointerdown", (e) => {
  if (e.target.closest(".shade__hint")) return;
  e.preventDefault();
  if (mode === "selection") {
    const sr = stageRect();
    selStart = { x: e.clientX - sr.left, y: e.clientY - sr.top };
    try { shade.setPointerCapture(e.pointerId); } catch {}
    shade.classList.add("is-dragging");
    placeSel({ ...selStart, w: 0, h: 0 });
  } else if (mode === "window") {
    const target = windowAt(e.clientX, e.clientY);
    if (!target) return;
    const r = rectOf(target);
    endCapture();
    doCapture(r);
  }
});

shade.addEventListener("pointermove", (e) => {
  const sr = stageRect();
  if (mode === "selection" && selStart) {
    const x = Math.max(0, Math.min(e.clientX - sr.left, sr.width));
    const y = Math.max(0, Math.min(e.clientY - sr.top, sr.height));
    placeSel({ x: Math.min(x, selStart.x), y: Math.min(y, selStart.y), w: Math.abs(x - selStart.x), h: Math.abs(y - selStart.y) });
  } else if (mode === "window") {
    winTarget = windowAt(e.clientX, e.clientY);
    shade.classList.toggle("has-target", !!winTarget);
    if (winTarget) placeSel(rectOf(winTarget));
  }
});

shade.addEventListener("pointerup", () => {
  if (mode !== "selection" || !selStart) return;
  const r = { x: selEl.offsetLeft, y: selEl.offsetTop, w: selEl.offsetWidth, h: selEl.offsetHeight };
  selStart = null;
  shade.classList.remove("is-dragging");
  if (r.w < 8 || r.h < 8) return;
  endCapture();
  doCapture(r);
});

$("#shadeCancel").addEventListener("click", endCapture);

for (const b of $$("#toolbar button")) {
  b.addEventListener("click", () => startCapture(b.dataset.mode));
}

async function doCapture(r) {
  capturing = true;
  const flash = document.createElement("div");
  flash.className = "flash no-capture";
  Object.assign(flash.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
  stage.appendChild(flash);
  setTimeout(() => flash.remove(), 400);
  try {
    const full = await snapshot();
    const k = full.width / stage.clientWidth;
    const out = document.createElement("canvas");
    out.width = Math.max(1, Math.round(r.w * k));
    out.height = Math.max(1, Math.round(r.h * k));
    out.getContext("2d").drawImage(full, r.x * k, r.y * k, r.w * k, r.h * k, 0, 0, out.width, out.height);
    out.k = k;
    await addPhoto(out, r);
  } catch (err) {
    console.error(err);
    toast(t("captureFail"));
  }
  capturing = false;
}

// ----- keyboard: double-tap ⌘ (or Ctrl) is capcap's trigger -----
let lastTap = 0;
let cleanTap = false;
addEventListener("keydown", (e) => {
  if (e.key === "Meta" || e.key === "Control") { if (!e.repeat) cleanTap = true; }
  else cleanTap = false;
  if (e.key === "Escape" && mode) endCapture();
  if (e.ctrlKey && e.altKey && e.code === "KeyT" && !editorOpen) {
    e.preventDefault();
    setLine(!lineDown);
    if (lineDown) holdLine(2500);
  }
});
addEventListener("keyup", (e) => {
  if ((e.key === "Meta" || e.key === "Control") && cleanTap) {
    const now = performance.now();
    if (now - lastTap < 380) {
      lastTap = 0;
      if (!mode && !editorOpen) startCapture("selection");
    } else {
      lastTap = now;
    }
  }
  cleanTap = false;
});
addEventListener("blur", () => { cleanTap = false; });

// ===================================================================
// capcap's editor
// ===================================================================

const ICON = {
  rect: '<rect x="3.5" y="5" width="13" height="10" rx="1.5"/>',
  ellipse: '<ellipse cx="10" cy="10" rx="7" ry="5.5"/>',
  arrow: '<path d="M4 16L15 5M8.5 5H15v6.5"/>',
  pen: '<path d="M4 16l1-4 8-8 3 3-8 8zM11.5 5.5l3 3"/>',
  marker: '<path d="M6 13l1.5-5 5.5-5 4 4-5.5 5.5zM3.5 17h8"/>',
  mosaic: '<rect x="3.5" y="3.5" width="13" height="13" rx="2"/><path d="M3.5 3.5h4.3v4.3H3.5zM12.2 3.5h4.3v4.3h-4.3zM7.8 7.8h4.4v4.4H7.8zM3.5 12.2h4.3v4.3H3.5zM12.2 12.2h4.3v4.3h-4.3z" fill="currentColor" stroke="none"/>',
  num: '<circle cx="10" cy="10" r="7"/><path d="M8.7 7.6L10.4 6.5v7"/>',
  text: '<path d="M4 5.5v-2h12v2M10 3.5v13M7.5 16.5h5"/>',
  undo: '<path d="M7 4.5L3.5 8 7 11.5M4 8h8a4.5 4.5 0 0 1 0 9H9"/>',
  redo: '<path d="M13 4.5L16.5 8 13 11.5M16 8H8a4.5 4.5 0 0 0 0 9h3"/>',
  pin: '<path d="M7.5 3h5l-1 5 3 3h-9l3-3zM10 11v6"/>',
  save: '<path d="M10 3v10M6 9l4 4 4-4M4 16.5h12"/>',
  cancel: '<path d="M5 5l10 10M15 5L5 15"/>',
  ok: '<path d="M4 10.5l4 4 8-9"/>',
};
const TOOLS = [["rect", "tRect"], ["ellipse", "tEllipse"], ["arrow", "tArrow"], ["pen", "tPen"], ["marker", "tMarker"], ["mosaic", "tMosaic"], ["num", "tNum"], ["text", "tText"]];
const COLORS = ["#001489", "#ff3b30", "#1d1d1f", "#ffffff"];
const svg = (name) => `<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;

function openEditor(p) {
  editorOpen = true;
  finishTour();
  const base = p.canvas;
  const u = p.k; // image pixels per CSS pixel
  const st = { tool: "rect", color: COLORS[0], items: [], undo: [], redo: [] };

  const root = document.createElement("div");
  root.className = "editor no-capture";
  root.innerHTML = `
    <div class="editor__frame"><canvas></canvas></div>
    <div class="etool">
      ${TOOLS.map(([id, tip]) => `<button type="button" data-tool="${id}" title="${t(tip)}">${svg(id)}</button>`).join("")}
      <span class="etool__sep"></span>
      ${COLORS.map((c) => `<button type="button" class="is-swatch" data-color="${c}"><span class="etool__swatch" style="background:${c}"></span></button>`).join("")}
      <span class="etool__sep"></span>
      <button type="button" data-act="undo" title="${t("tUndo")}">${svg("undo")}</button>
      <button type="button" data-act="redo" title="${t("tRedo")}">${svg("redo")}</button>
      <span class="etool__sep"></span>
      <button type="button" data-act="pin" title="${t("tPin")}">${svg("pin")}</button>
      <button type="button" data-act="save" title="${t("tSave")}">${svg("save")}</button>
      <button type="button" data-act="cancel" title="${t("tCancel")}">${svg("cancel")}</button>
      <button type="button" data-act="ok" class="etool__ok" title="${t("tConfirm")}">${svg("ok")}</button>
    </div>
    <p class="editor__hint">${t("editorHint")}</p>`;
  document.body.appendChild(root);

  const frame = root.querySelector(".editor__frame");
  const cv = root.querySelector("canvas");
  const ctx = cv.getContext("2d");
  cv.width = base.width;
  cv.height = base.height;
  const cw = base.width / u;
  const ch = base.height / u;
  const fit = Math.min((innerWidth - 40) / cw, (innerHeight - 170) / ch, 2);
  cv.style.width = `${cw * fit}px`;
  cv.style.height = `${ch * fit}px`;

  const render = (draft) => {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(base, 0, 0);
    for (const it of st.items) drawItem(ctx, it, base, u);
    if (draft) drawItem(ctx, draft, base, u);
  };
  const sync = () => {
    for (const b of root.querySelectorAll("[data-tool]")) b.classList.toggle("is-active", b.dataset.tool === st.tool);
    for (const b of root.querySelectorAll("[data-color]")) b.classList.toggle("is-active", b.dataset.color === st.color);
    root.querySelector('[data-act="undo"]').disabled = !st.undo.length;
    root.querySelector('[data-act="redo"]').disabled = !st.redo.length;
  };
  const commit = (item) => {
    st.undo.push(st.items);
    st.items = [...st.items, item];
    st.redo = [];
    render();
    sync();
  };
  const composite = () => {
    const out = document.createElement("canvas");
    out.width = base.width;
    out.height = base.height;
    const c = out.getContext("2d");
    c.drawImage(base, 0, 0);
    for (const it of st.items) drawItem(c, it, base, u);
    out.k = u;
    return out;
  };
  const close = () => {
    root.remove();
    removeEventListener("keydown", onKey, true);
    editorOpen = false;
  };
  const act = async (name) => {
    if (name === "undo" && st.undo.length) { st.redo.push(st.items); st.items = st.undo.pop(); render(); sync(); }
    else if (name === "redo" && st.redo.length) { st.undo.push(st.items); st.items = st.redo.pop(); render(); sync(); }
    else if (name === "cancel") close();
    else if (name === "pin") { pinImage(composite()); close(); }
    else if (name === "save") {
      const a = document.createElement("a");
      a.href = composite().toDataURL("image/png");
      a.download = p.name;
      a.click();
      close();
      toast(t("saved"));
    } else if (name === "ok") {
      const out = composite();
      close();
      if (st.items.length) {
        await setCanvas(p, out);
        p.el.classList.add("is-flash");
        setTimeout(() => p.el.classList.remove("is-flash"), 900);
        copyPhoto(p, false);
        setLine(true);
        holdLine(2500);
        toastAt(p, t("updated"));
      }
    }
  };

  root.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.tool) st.tool = b.dataset.tool;
    if (b.dataset.color) st.color = b.dataset.color;
    if (b.dataset.act) act(b.dataset.act);
    sync();
  });

  const toImage = (e) => {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height };
  };

  let draft = null;
  let typing = null;
  cv.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    if (typing) { typing.blur(); return; }
    const pt = toImage(e);
    if (st.tool === "num") {
      const n = st.items.filter((it) => it.type === "num").length + 1;
      commit({ type: "num", x: pt.x, y: pt.y, n, color: st.color });
      return;
    }
    if (st.tool === "text") { typing = placeText(pt, e); return; }
    try { cv.setPointerCapture(e.pointerId); } catch {}
    draft = { type: st.tool, color: st.color, x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y, pts: [pt] };
  });
  cv.addEventListener("pointermove", (e) => {
    if (!draft) return;
    const pt = toImage(e);
    draft.x2 = pt.x;
    draft.y2 = pt.y;
    if (draft.type === "pen" || draft.type === "marker") draft.pts.push(pt);
    render(draft);
  });
  const finish = () => {
    if (!draft) return;
    const d = draft;
    draft = null;
    const moved = Math.hypot(d.x2 - d.x1, d.y2 - d.y1) > 3 * u || d.pts.length > 3;
    if (moved) commit(d);
    else render();
  };
  cv.addEventListener("pointerup", finish);
  cv.addEventListener("pointercancel", finish);

  function placeText(pt, e) {
    const r = cv.getBoundingClientRect();
    const fr = frame.getBoundingClientRect();
    const k = r.width / cv.width;
    const size = 18 * u;
    const input = document.createElement("input");
    input.className = "editor__text";
    Object.assign(input.style, {
      left: `${e.clientX - fr.left}px`,
      top: `${e.clientY - fr.top - size * k * 0.55}px`,
      fontSize: `${size * k}px`,
      color: st.color,
    });
    frame.appendChild(input);
    setTimeout(() => input.focus(), 0);
    let done = false;
    const end = (keep) => {
      if (done) return;
      done = true;
      const text = input.value.trim();
      input.remove();
      typing = null;
      if (keep && text) commit({ type: "text", x: pt.x, y: pt.y - size * 0.55, text, size, color: st.color });
    };
    input.addEventListener("keydown", (ev) => {
      ev.stopPropagation();
      if (ev.key === "Enter") end(true);
      if (ev.key === "Escape") end(false);
    });
    input.addEventListener("blur", () => end(true));
    return input;
  }

  const onKey = (e) => {
    if (typing) return;
    const cmd = e.metaKey || e.ctrlKey;
    if (e.key === "Escape") { e.preventDefault(); act("cancel"); }
    else if (e.key === "Enter") { e.preventDefault(); act("ok"); }
    else if (cmd && e.key.toLowerCase() === "z") { e.preventDefault(); act(e.shiftKey ? "redo" : "undo"); }
    e.stopPropagation();
  };
  addEventListener("keydown", onKey, true);

  render();
  sync();
}

// Annotations are plain values; drawing them is the only thing they do
function drawItem(ctx, it, base, u) {
  ctx.save();
  ctx.strokeStyle = it.color;
  ctx.fillStyle = it.color;
  ctx.lineWidth = 3 * u;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const x = Math.min(it.x1, it.x2);
  const y = Math.min(it.y1, it.y2);
  const w = Math.abs(it.x2 - it.x1);
  const h = Math.abs(it.y2 - it.y1);
  switch (it.type) {
    case "rect":
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 4 * u);
      ctx.stroke();
      break;
    case "ellipse":
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case "arrow": {
      const a = Math.atan2(it.y2 - it.y1, it.x2 - it.x1);
      const len = Math.hypot(it.x2 - it.x1, it.y2 - it.y1);
      const head = Math.min(len * 0.6, 16 * u);
      const bx = it.x2 - Math.cos(a) * head * 0.8;
      const by = it.y2 - Math.sin(a) * head * 0.8;
      ctx.beginPath();
      ctx.moveTo(it.x1, it.y1);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(it.x2, it.y2);
      ctx.lineTo(it.x2 - Math.cos(a - 0.45) * head, it.y2 - Math.sin(a - 0.45) * head);
      ctx.lineTo(it.x2 - Math.cos(a + 0.45) * head, it.y2 - Math.sin(a + 0.45) * head);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "pen":
    case "marker":
      if (it.type === "marker") {
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 14 * u;
        ctx.lineCap = "square";
      }
      ctx.beginPath();
      it.pts.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
      ctx.stroke();
      break;
    case "mosaic": {
      if (w < 1 || h < 1) break;
      const block = 9 * u;
      const tmp = document.createElement("canvas");
      tmp.width = Math.max(1, Math.ceil(w / block));
      tmp.height = Math.max(1, Math.ceil(h / block));
      tmp.getContext("2d").drawImage(base, x, y, w, h, 0, 0, tmp.width, tmp.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, x, y, w, h);
      break;
    }
    case "num": {
      const r = 12 * u;
      ctx.beginPath();
      ctx.arc(it.x, it.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = it.color.toLowerCase() === "#ffffff" ? "#001489" : "#ffffff";
      ctx.font = `700 ${13 * u}px "Product Sans", "PingFang", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(it.n), it.x, it.y + u * 0.5);
      break;
    }
    case "text":
      ctx.font = `700 ${it.size}px "Product Sans", "PingFang", sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText(it.text, it.x, it.y);
      break;
  }
  ctx.restore();
}

// ===================================================================
// The tour
// ===================================================================

let tourStep = 0;
const tourDone = () => store.get("picshoo.tour") === "done";

function showTour(n) {
  if (tourDone()) return;
  tourStep = n;
  tourEl.hidden = false;
  menubar.classList.toggle("is-beckon", n === 1 && !lineDown);
  renderTour();
}

function renderTour() {
  if (!tourStep || tourEl.hidden) return;
  $("#tourStep").textContent = t("tourOf", { n: tourStep });
  $("#tourText").innerHTML = t(tourStep === 1 ? "tour1" : tourStep === 2 ? (canHover ? "tour2" : "tour2Touch") : "tour3");
  const W = stage.clientWidth;
  const tw = tourEl.offsetWidth;
  let x = W / 2 - tw / 2;
  let y = BAR + 12;
  if (tourStep === 2) y = $("#toolbar").offsetTop - tourEl.offsetHeight - 14;
  if (tourStep === 3 && photos[0]) {
    const r = cardRect(photos[0]);
    x = r.x + r.w / 2 - tw / 2;
    y = r.y + r.h + 18;
  }
  tourEl.style.left = `${Math.max(12, Math.min(x, W - tw - 12))}px`;
  tourEl.style.top = `${y}px`;
}

function finishTour() {
  if (!tourStep) return;
  tourStep = 0;
  tourEl.hidden = true;
  menubar.classList.remove("is-beckon");
  store.set("picshoo.tour", "done");
}
$("#tourClose").addEventListener("click", finishTour);

// ===================================================================
// Start
// ===================================================================

fit();
applyLang();
drawRope();
layout();

// Like the real line on a fresh install: the three windows hang on it as
// photos, then it tucks up under the menu bar where the tour points
async function hangStarters() {
  try {
    await document.fonts.ready;
    for (let i = 0; i < 50 && !window.htmlToImage; i++) await sleep(100);
    if (!window.htmlToImage) return;
    const css = await embedFonts();
    for (const id of ["report", "notes", "chat"]) {
      const el = scene.querySelector(`.win[data-id="${id}"]`);
      if (!el || el.hidden || !el.offsetWidth) continue;
      // Rendered on its own, an absolutely placed window lands outside the
      // picture, so its copy is taken out of the layout. It may still be
      // fading in, and the copy would keep that opacity
      const canvas = await htmlToImage.toCanvas(el, { pixelRatio: 2, fontEmbedCSS: css, filter: captureFilter, style: { position: "static", animation: "none", opacity: "1", transform: "none" } });
      canvas.k = 2;
      await addPhoto(canvas, null, { quiet: true });
    }
  } catch (err) {
    console.error(err);
  }
}

(async () => {
  await sleep(500);
  await hangStarters();
  holdLine(2600);
  await sleep(2600);
  if (!canHover) { showTour(2); return; }
  if (!busy()) setLine(false);
  showTour(1);
})();
