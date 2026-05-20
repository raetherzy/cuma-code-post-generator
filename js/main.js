const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

let state = {
  template: 'project',
  ratio: 'square',
  bgMode: 'solid',
  bgColor: '#F5F500',
  overlayColor: '#0d0d0d',
  overlayOpacity: 45,
  accentColor: '#F5F500',
  photo: null,
  projectPhoto: null,
  projectPhotoPos: 'none',
  projectPhotoSize: 80,
};

const P = 64;
const ACCENT_BAR_H = 14;
const BOTTOM_BAR_H = 100;
const GAP = 20;

// ── setters ──
function setTemplate(t) {
  state.template = t;
  document.getElementById('btn-project').classList.toggle('active', t === 'project');
  document.getElementById('btn-news').classList.toggle('active', t === 'news');
  document.getElementById('project-fields').style.display = t === 'project' ? '' : 'none';
  document.getElementById('news-fields').style.display = t === 'news' ? '' : 'none';
  render();
}

function setRatio(r) {
  state.ratio = r;
  document.getElementById('btn-sq').classList.toggle('active', r === 'square');
  document.getElementById('btn-pt').classList.toggle('active', r === 'portrait');
  render();
}

function setBgMode(m) {
  state.bgMode = m;
  document.getElementById('btn-solid').classList.toggle('active', m === 'solid');
  document.getElementById('btn-photo').classList.toggle('active', m === 'photo');
  document.getElementById('solid-opts').style.display = m === 'solid' ? '' : 'none';
  document.getElementById('photo-opts').style.display = m === 'photo' ? '' : 'none';
  render();
}

function setBgColor(c) {
  state.bgColor = c;
  document.querySelectorAll('#solid-opts .color-opt').forEach(el => {
    el.classList.toggle('selected', el.style.background === c);
  });
  render();
}

function setOverlayColor(c) { state.overlayColor = c; render(); }
function setAccent(c) { state.accentColor = c; render(); }
function updateOpacity(v) {
  state.overlayOpacity = parseInt(v);
  document.getElementById('opacityVal').textContent = v + '%';
  render();
}

// ── Background photo ──
function loadPhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => { state.photo = img; render(); };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

// ── Project photo ──
function loadProjectPhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      state.projectPhoto = img;
      if (state.projectPhotoPos === 'none') {
        setProjectPhotoPos('top');
      } else {
        render();
      }
      showProjectPhotoThumb(ev.target.result);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function showProjectPhotoThumb(src) {
  const thumb = document.getElementById('projectPhotoThumb');
  const removeBtn = document.getElementById('btnRemoveProjectPhoto');
  thumb.src = src;
  thumb.style.display = 'block';
  removeBtn.style.display = 'block';
  document.getElementById('projectPhotoUploadArea').style.display = 'none';
}

function removeProjectPhoto() {
  state.projectPhoto = null;
  state.projectPhotoPos = 'none';
  document.getElementById('projectPhotoThumb').style.display = 'none';
  document.getElementById('btnRemoveProjectPhoto').style.display = 'none';
  document.getElementById('projectPhotoUploadArea').style.display = '';
  document.getElementById('projectPhotoSizeField').style.display = 'none';
  updatePositionButtons('none');
  document.getElementById('projectPhotoInput').value = '';
  render();
}

function setProjectPhotoPos(pos) {
  state.projectPhotoPos = pos;
  updatePositionButtons(pos);
  document.getElementById('projectPhotoSizeField').style.display =
    (pos !== 'none' && state.projectPhoto) ? '' : 'none';
  render();
}

function updatePositionButtons(pos) {
  ['none', 'top', 'middle', 'bottom', 'split'].forEach(p => {
    const btn = document.getElementById('btn-ppos-' + p);
    if (btn) btn.classList.toggle('active', p === pos);
  });
}

function setProjectPhotoSize(v) {
  state.projectPhotoSize = parseInt(v);
  document.getElementById('photoSizeVal').textContent = v + '%';
  render();
}

// ── canvas size ──
function getSize() {
  return state.ratio === 'square' ? [1080, 1080] : [1080, 1350];
}

// ── helpers ──
function hexToRgba(hex, alpha) {
  let r = parseInt(hex.slice(1,3),16);
  let g = parseInt(hex.slice(3,5),16);
  let b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function isDark(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return (r*0.299 + g*0.587 + b*0.114) < 128;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lines = [];
  for (let w of words) {
    const test = line + w + ' ';
    if (ctx.measureText(test).width > maxWidth && line !== '') {
      lines.push(line.trim());
      line = w + ' ';
    } else { line = test; }
  }
  if (line.trim()) lines.push(line.trim());
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return lines.length;
}

function drawPhotoCover(img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = img.width * scale;
  const sh = img.height * scale;
  const sx = x + (w - sw) / 2;
  const sy = y + (h - sh) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh);
  ctx.restore();
}

function drawProjectPhotoFrame(x, y, w, h) {
  ctx.strokeStyle = state.accentColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = hexToRgba(state.accentColor, 0.12);
  ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
  ctx.strokeStyle = state.accentColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(x - 6, y - 6, w + 12, h + 12);
}

// ── MAIN RENDER ──
function render() {
  const [W, H] = getSize();
  canvas.width = W;
  canvas.height = H;

  const textColor = state.bgMode === 'photo'
    ? (isDark(state.overlayColor) ? '#F8F8F2' : '#0d0d0d')
    : (isDark(state.bgColor) ? '#F8F8F2' : '#0d0d0d');
  const isLightText = textColor === '#F8F8F2';

  // 1. BG
  if (state.bgMode === 'solid' || !state.photo) {
    ctx.fillStyle = state.bgMode === 'solid' ? state.bgColor : '#1a1a1a';
    ctx.fillRect(0, 0, W, H);
  } else {
    const img = state.photo;
    const scale = Math.max(W / img.width, H / img.height);
    const sw = img.width * scale, sh = img.height * scale;
    const sx = (W - sw) / 2, sy = (H - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh);
    ctx.fillStyle = hexToRgba(state.overlayColor, state.overlayOpacity / 100);
    ctx.fillRect(0, 0, W, H);
  }

  // 2. Grid lines
  ctx.strokeStyle = hexToRgba(textColor, 0.06);
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 108) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }

  // === PROJECT TEMPLATE ===
  if (state.template === 'project') {
    const title = document.getElementById('proj-title').value || 'Judul Project';
    const tech  = document.getElementById('proj-tech').value || 'Tech Stack';
    const client = document.getElementById('proj-client').value || 'Nama Klien';
    const desc  = document.getElementById('proj-desc').value || 'Deskripsi project.';

    const hasPhoto = state.projectPhoto && state.projectPhotoPos !== 'none';
    const photoPos = state.projectPhotoPos;
    const photoSize = state.projectPhotoSize / 100;

    if (hasPhoto) {
      renderProjectWithPhoto(W, H, textColor, isLightText, title, tech, client, desc, photoPos, photoSize);
    } else {
      renderProjectOriginal(W, H, textColor, isLightText, title, tech, client, desc);
    }

  // === NEWS TEMPLATE ===
  } else {
    const title = document.getElementById('news-title').value || 'Headline';
    const sub   = document.getElementById('news-sub').value || 'Sub-headline';
    const body  = document.getElementById('news-body').value || 'Body text.';
    const tag   = document.getElementById('news-tag').value || 'NEWS';

    renderNews(W, H, textColor, isLightText, title, sub, body, tag);
  }

  document.getElementById('canvasInfo').textContent =
    `${W} × ${H} px · ${state.ratio === 'square' ? 'Square 1:1' : 'Portrait 4:5'}`;
}

// ── PROJECT: Original (no photo) ──
function renderProjectOriginal(W, H, textColor, isLightText, title, tech, client, desc) {
  // Top accent bar
  ctx.fillStyle = state.accentColor;
  ctx.fillRect(0, 0, W, 14);

  // "PROJECT SHOWCASE" label
  const labelBg = textColor;
  const labelText = isLightText ? '#0d0d0d' : '#F8F8F2';
  ctx.fillStyle = labelBg;
  ctx.fillRect(P, 50, 360, 48);
  ctx.font = `700 22px 'Space Mono', monospace`;
  ctx.fillStyle = labelText;
  ctx.fillText('PROJECT SHOWCASE', P + 16, 82);

  // Title
  ctx.font = `900 ${H === 1350 ? 108 : 96}px 'Bebas Neue', cursive`;
  ctx.fillStyle = textColor;
  const titleLines = wrapText(ctx, title.toUpperCase(), P, H * 0.32, W - P*2, H === 1350 ? 108 : 100);

  // Separator
  const sepY = H * 0.32 + titleLines * (H === 1350 ? 108 : 100) + 20;
  ctx.fillStyle = state.accentColor;
  ctx.fillRect(P, sepY, W - P*2, 8);

  // Tech stack
  ctx.font = `700 28px 'Space Mono', monospace`;
  ctx.fillStyle = hexToRgba(textColor, 0.55);
  ctx.fillText(tech, P, sepY + 52);

  // Desc
  ctx.font = `400 ${H === 1350 ? 38 : 34}px 'DM Sans', sans-serif`;
  ctx.fillStyle = hexToRgba(textColor, 0.85);
  wrapText(ctx, desc, P, sepY + 105, W - P*2, 48);

  // Corner decoration
  ctx.strokeStyle = state.accentColor;
  ctx.lineWidth = 5;
  ctx.strokeRect(P - 10, H * 0.28 - 20, W - P*2 + 20, 8);

  // Bottom bar
  renderBottomBarProject(W, H, textColor, client);

  ctx.textAlign = 'left';
}

// ── PROJECT: With photo ──
function renderProjectWithPhoto(W, H, textColor, isLightText, title, tech, client, desc, photoPos, photoSize) {
  const img = state.projectPhoto;
  if (!img) return;

  // Top accent bar always
  ctx.fillStyle = state.accentColor;
  ctx.fillRect(0, 0, W, 14);

  if (photoPos === 'top') {
    // Photo at top
    const photoH = H * 0.42 * photoSize;
    const photoY = ACCENT_BAR_H + GAP;
    drawPhotoCover(img, P, photoY, W - P*2, photoH);
    drawProjectPhotoFrame(P, photoY, W - P*2, photoH);

    let curY = photoY + photoH + GAP + 10;

    // Label
    const labelBg = textColor;
    const labelText = isLightText ? '#0d0d0d' : '#F8F8F2';
    ctx.fillStyle = labelBg;
    ctx.fillRect(P, curY, 360, 48);
    ctx.font = `700 22px 'Space Mono', monospace`;
    ctx.fillStyle = labelText;
    ctx.fillText('PROJECT SHOWCASE', P + 16, curY + 32);
    curY += 68;

    // Title
    const titleFontSize = H === 1350 ? 80 : 68;
    ctx.font = `900 ${titleFontSize}px 'Bebas Neue', cursive`;
    ctx.fillStyle = textColor;
    const titleLines = wrapText(ctx, title.toUpperCase(), P, curY, W - P*2, titleFontSize);
    curY += titleLines * titleFontSize + GAP;

    // Separator
    ctx.fillStyle = state.accentColor;
    ctx.fillRect(P, curY, W - P*2, 6);
    curY += 26;

    // Tech
    ctx.font = `700 24px 'Space Mono', monospace`;
    ctx.fillStyle = hexToRgba(textColor, 0.55);
    ctx.fillText(tech, P, curY);
    curY += 38;

    // Desc
    const descFontSize = H === 1350 ? 32 : 28;
    ctx.font = `400 ${descFontSize}px 'DM Sans', sans-serif`;
    ctx.fillStyle = hexToRgba(textColor, 0.85);
    wrapText(ctx, desc, P, curY, W - P*2, descFontSize * 1.5);

    // Bottom bar
    renderBottomBarProject(W, H, textColor, client);

  } else if (photoPos === 'middle') {
    // Label at top
    const labelBg = textColor;
    const labelText = isLightText ? '#0d0d0d' : '#F8F8F2';
    ctx.fillStyle = labelBg;
    ctx.fillRect(P, 50, 360, 48);
    ctx.font = `700 22px 'Space Mono', monospace`;
    ctx.fillStyle = labelText;
    ctx.fillText('PROJECT SHOWCASE', P + 16, 82);

    // Title
    const titleFontSize = H === 1350 ? 72 : 64;
    ctx.font = `900 ${titleFontSize}px 'Bebas Neue', cursive`;
    ctx.fillStyle = textColor;
    const titleLines = wrapText(ctx, title.toUpperCase(), P, 130, W - P*2, titleFontSize);
    let curY = 130 + titleLines * titleFontSize + GAP;

    // Photo in middle
    const photoH = H * 0.35 * photoSize;
    drawPhotoCover(img, P, curY, W - P*2, photoH);
    drawProjectPhotoFrame(P, curY, W - P*2, photoH);
    curY += photoH + GAP + 10;

    // Accent line
    ctx.fillStyle = state.accentColor;
    ctx.fillRect(P, curY, W - P*2, 6);
    curY += 26;

    // Tech
    ctx.font = `700 24px 'Space Mono', monospace`;
    ctx.fillStyle = hexToRgba(textColor, 0.55);
    ctx.fillText(tech, P, curY);
    curY += 36;

    // Desc
    const descFontSize = H === 1350 ? 30 : 26;
    ctx.font = `400 ${descFontSize}px 'DM Sans', sans-serif`;
    ctx.fillStyle = hexToRgba(textColor, 0.85);
    wrapText(ctx, desc, P, curY, W - P*2, descFontSize * 1.4);

    // Bottom bar
    renderBottomBarProject(W, H, textColor, client);

  } else if (photoPos === 'bottom') {
    // Label
    const labelBg = textColor;
    const labelText = isLightText ? '#0d0d0d' : '#F8F8F2';
    ctx.fillStyle = labelBg;
    ctx.fillRect(P, 50, 360, 48);
    ctx.font = `700 22px 'Space Mono', monospace`;
    ctx.fillStyle = labelText;
    ctx.fillText('PROJECT SHOWCASE', P + 16, 82);

    // Title
    const titleFontSize = H === 1350 ? 72 : 64;
    ctx.font = `900 ${titleFontSize}px 'Bebas Neue', cursive`;
    ctx.fillStyle = textColor;
    const titleLines = wrapText(ctx, title.toUpperCase(), P, 140, W - P*2, titleFontSize);
    let curY = 140 + titleLines * titleFontSize + GAP;

    // Separator
    ctx.fillStyle = state.accentColor;
    ctx.fillRect(P, curY, W - P*2, 6);
    curY += 26;

    // Tech
    ctx.font = `700 24px 'Space Mono', monospace`;
    ctx.fillStyle = hexToRgba(textColor, 0.55);
    ctx.fillText(tech, P, curY);
    curY += 36;

    // Desc
    const descFontSize = H === 1350 ? 30 : 26;
    ctx.font = `400 ${descFontSize}px 'DM Sans', sans-serif`;
    ctx.fillStyle = hexToRgba(textColor, 0.85);
    const descLines = wrapText(ctx, desc, P, curY, W - P*2, descFontSize * 1.4);
    curY += descLines * descFontSize * 1.4 + GAP;

    // Photo at bottom (above bottom bar)
    const photoMaxH = H - BOTTOM_BAR_H - curY - 10;
    const photoH = Math.min(photoMaxH, H * 0.35) * photoSize;
    if (photoH > 50) {
      drawPhotoCover(img, P, curY, W - P*2, photoH);
      drawProjectPhotoFrame(P, curY, W - P*2, photoH);
    }

    // Bottom bar
    renderBottomBarProject(W, H, textColor, client);

  } else if (photoPos === 'split') {
    const splitRatio = 0.48;
    const photoW = (W - P*3) * splitRatio;
    const photoH = H - ACCENT_BAR_H - BOTTOM_BAR_H - GAP*3;
    const photoX = P;
    const photoY = ACCENT_BAR_H + GAP;

    // Photo on left
    drawPhotoCover(img, photoX, photoY, photoW, photoH);
    drawProjectPhotoFrame(photoX, photoY, photoW, photoH);

    // Text on right
    const textX = photoX + photoW + GAP + 10;
    const textW = W - textX - P;

    // Label
    const labelBg = textColor;
    const labelText = isLightText ? '#0d0d0d' : '#F8F8F2';
    ctx.fillStyle = labelBg;
    const labelW = Math.min(textW, 300);
    ctx.fillRect(textX, 50, labelW, 44);
    ctx.font = `700 20px 'Space Mono', monospace`;
    ctx.fillStyle = labelText;
    ctx.fillText('PROJECT SHOWCASE', textX + 14, 80);

    // Title
    const titleFontSize = H === 1350 ? 64 : 54;
    ctx.font = `900 ${titleFontSize}px 'Bebas Neue', cursive`;
    ctx.fillStyle = textColor;
    const titleLines = wrapText(ctx, title.toUpperCase(), textX, 140, textW, titleFontSize);
    let curY = 140 + titleLines * titleFontSize + GAP;

    // Accent line
    ctx.fillStyle = state.accentColor;
    ctx.fillRect(textX, curY, 100, 5);
    curY += 22;

    // Tech
    ctx.font = `700 20px 'Space Mono', monospace`;
    ctx.fillStyle = hexToRgba(textColor, 0.55);
    ctx.fillText(tech, textX, curY);
    curY += 32;

    // Desc
    const descFontSize = H === 1350 ? 26 : 22;
    ctx.font = `400 ${descFontSize}px 'DM Sans', sans-serif`;
    ctx.fillStyle = hexToRgba(textColor, 0.85);
    wrapText(ctx, desc, textX, curY, textW, descFontSize * 1.4);

    // Bottom bar
    renderBottomBarProject(W, H, textColor, client);
  }

  ctx.textAlign = 'left';
}

// ── Bottom bar for PROJECT ──
function renderBottomBarProject(W, H, textColor, client) {
  ctx.fillStyle = hexToRgba(textColor, 0.08);
  ctx.fillRect(0, H - BOTTOM_BAR_H, W, BOTTOM_BAR_H);
  ctx.fillStyle = state.accentColor;
  ctx.fillRect(0, H - BOTTOM_BAR_H, W, 5);

  ctx.font = `700 36px 'Space Mono', monospace`;
  ctx.fillStyle = textColor;
  ctx.fillText('CUMACODE', P, H - BOTTOM_BAR_H + 58);

  ctx.font = `400 22px 'DM Sans', sans-serif`;
  ctx.fillStyle = hexToRgba(textColor, 0.65);
  ctx.textAlign = 'right';
  ctx.fillText(client, W - P, H - BOTTOM_BAR_H + 42);

  ctx.font = `700 18px 'Space Mono', monospace`;
  ctx.fillStyle = hexToRgba(state.accentColor, 0.9);
  ctx.fillText('#BayarCumaCuma', W - P, H - BOTTOM_BAR_H + 70);
  ctx.textAlign = 'left';
}

// ── NEWS template ──
function renderNews(W, H, textColor, isLightText, title, sub, body, tag) {
  ctx.strokeStyle = state.accentColor;
  ctx.lineWidth = 12;
  ctx.strokeRect(32, 32, W - 64, H - 64);

  ctx.strokeStyle = hexToRgba(textColor, 0.15);
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  const tagW = ctx.measureText(tag).width + 60;
  ctx.fillStyle = state.accentColor;
  const tagBg = isDark(state.accentColor) ? '#F8F8F2' : '#0d0d0d';
  ctx.fillRect(P, P + 20, tagW, 46);
  ctx.font = `700 20px 'Space Mono', monospace`;
  ctx.fillStyle = tagBg;
  ctx.fillText(tag, P + 20, P + 50);

  ctx.font = `900 280px 'Bebas Neue', cursive`;
  ctx.fillStyle = hexToRgba(textColor, 0.04);
  ctx.fillText('CC', W - 340, H * 0.52);

  ctx.font = `900 ${H === 1350 ? 112 : 100}px 'Bebas Neue', cursive`;
  ctx.fillStyle = textColor;
  const titleLines = wrapText(ctx, title.toUpperCase(), P, H * 0.28, W - P*2, H === 1350 ? 114 : 102);

  const lineY = H * 0.28 + titleLines * (H === 1350 ? 114 : 102) + 16;
  ctx.fillStyle = state.accentColor;
  ctx.fillRect(P, lineY, 120, 8);

  ctx.font = `700 36px 'DM Sans', sans-serif`;
  ctx.fillStyle = hexToRgba(textColor, 0.75);
  ctx.fillText(sub, P, lineY + 56);

  ctx.font = `400 ${H === 1350 ? 34 : 30}px 'DM Sans', sans-serif`;
  ctx.fillStyle = hexToRgba(textColor, 0.7);
  wrapText(ctx, body, P, lineY + 110, W - P*2, 44);

  const footY = H - 80;
  ctx.fillStyle = state.accentColor;
  ctx.fillRect(P, footY - 8, W - P*2, 5);

  ctx.font = `700 34px 'Space Mono', monospace`;
  ctx.fillStyle = textColor;
  ctx.fillText('CUMACODE', P, footY + 38);

  ctx.font = `700 18px 'Space Mono', monospace`;
  ctx.fillStyle = hexToRgba(state.accentColor, 0.9);
  ctx.textAlign = 'right';
  ctx.fillText('#BayarCumaCuma', W - P, footY + 20);

  ctx.font = `400 18px 'DM Sans', sans-serif`;
  ctx.fillStyle = hexToRgba(textColor, 0.5);
  ctx.fillText('cumacode.id', W - P, footY + 44);
  ctx.textAlign = 'left';
}

// ── Download ──
function download(type) {
  const [W, H] = getSize();
  const name = `cumacode-${state.template}-${state.ratio}-${Date.now()}`;
  if (type === 'png') {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = name + '.png';
    a.click();
  } else {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/jpeg', 0.95);
    a.download = name + '.jpg';
    a.click();
  }
}

// Initial render
render();
