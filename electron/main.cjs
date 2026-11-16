const {app, BrowserWindow, Menu, ipcMain} = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

const APP_ROOT = path.join(__dirname, '..');

/* ───────── سامانه به‌روزرسانی آنلاین (IPC) ───────── */
const SAFE_EXT = ['.html', '.css', '.js', '.cjs', '.json', '.md', '.png', '.ico'];
const SAFE_TOP = ['index.html', 'css', 'js', 'electron', 'assets', 'version.json'];

function safeRel(rel) {
  rel = String(rel || '').replace(/\\/g, '/').trim().replace(/^\/+/, '');
  if (!rel || rel.length > 150 || rel.includes('..')) return null;
  const top = rel.split('/')[0];
  if (!SAFE_TOP.includes(top)) return null;
  if (!SAFE_EXT.includes(path.extname(rel).toLowerCase())) return null;
  return rel;
}
function backupStamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}
function uniqueStamp(suffix) {
  const base = backupStamp() + (suffix ? '-' + suffix : '');
  let stamp = base, i = 1;
  while (fs.existsSync(path.join(APP_ROOT, 'backup', stamp))) stamp = base + '_' + (++i);
  return stamp;
}
function flat(rel) { return rel.replace(/\//g, '__'); }

ipcMain.handle('up:fetch', function (e, url) {
  return new Promise(function (resolve) {
    let u;
    try { u = new URL(String(url)); } catch (err) { resolve({ok: false, error: 'bad url'}); return; }
    if (!/^https?:$/.test(u.protocol)) { resolve({ok: false, error: 'bad protocol'}); return; }
    const collect = (res, resolve2) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve2({ok: res.statusCode === 200, status: res.statusCode, text: Buffer.concat(chunks).toString('utf8')}));
      res.on('error', er => resolve2({ok: false, error: String(er)}));
    };
    const req = https.get(u, {timeout: 20000}, function (res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let u2;
        try { u2 = new URL(res.headers.location, u); } catch (err) { resolve({ok: false, error: 'bad redirect'}); return; }
        const req2 = https.get(u2, {timeout: 20000}, res2 => collect(res2, resolve));
        req2.on('timeout', () => { req2.destroy(); resolve({ok: false, error: 'timeout'}); });
        req2.on('error', er => resolve({ok: false, error: String(er)}));
        res.resume();
        return;
      }
      collect(res, resolve);
    });
    req.on('timeout', () => { req.destroy(); resolve({ok: false, error: 'timeout'}); });
    req.on('error', er => resolve({ok: false, error: String(er)}));
  });
});

ipcMain.handle('up:read-file', function (e, rel) {
  rel = safeRel(rel);
  if (!rel) return {ok: false, error: 'unsafe path'};
  try {
    return {ok: true, content: fs.readFileSync(path.join(APP_ROOT, rel), 'utf8')};
  } catch (err) {
    return {ok: false, error: 'not found'};
  }
});

ipcMain.handle('up:write-files', function (e, files) {
  try {
    if (!Array.isArray(files) || !files.length) return {ok: false, error: 'no files'};
    const valid = [];
    for (const f of files) {
      const rel = safeRel(f && f.rel);
      if (!rel || typeof f.content !== 'string') return {ok: false, error: 'unsafe file: ' + ((f && f.rel) || '?')};
      valid.push({rel, content: f.content});
    }
    const stamp = uniqueStamp();
    const bdir = path.join(APP_ROOT, 'backup', stamp);
    fs.mkdirSync(bdir, {recursive: true});
    const written = [];
    for (const v of valid) {
      const dest = path.join(APP_ROOT, v.rel);
      if (fs.existsSync(dest)) fs.writeFileSync(path.join(bdir, flat(v.rel)), fs.readFileSync(dest));
      fs.mkdirSync(path.dirname(dest), {recursive: true});
      fs.writeFileSync(dest, v.content, 'utf8');
      written.push(v.rel);
    }
    fs.writeFileSync(path.join(bdir, '_info.json'), JSON.stringify({at: new Date().toISOString(), files: written}), 'utf8');
    return {ok: true, backup: stamp, written};
  } catch (err) {
    return {ok: false, error: String((err && err.message) || err)};
  }
});

ipcMain.handle('up:list-backups', function () {
  try {
    const broot = path.join(APP_ROOT, 'backup');
    if (!fs.existsSync(broot)) return {ok: true, backups: []};
    const out = [];
    for (const name of fs.readdirSync(broot)) {
      const dir = path.join(broot, name);
      if (!fs.statSync(dir).isDirectory()) continue;
      let files = [];
      try {
        files = JSON.parse(fs.readFileSync(path.join(dir, '_info.json'), 'utf8')).files || [];
      } catch (e2) {
        files = fs.readdirSync(dir).filter(f => f !== '_info.json').map(f => f.replace(/__/g, '/'));
      }
      out.push({stamp: name, files});
    }
    out.sort((a, b) => b.stamp.localeCompare(a.stamp));
    return {ok: true, backups: out};
  } catch (err) {
    return {ok: false, error: String((err && err.message) || err), backups: []};
  }
});

ipcMain.handle('up:restore', function (e, stamp) {
  try {
    stamp = String(stamp || '').replace(/[^0-9A-Za-z\-]/g, '');
    const bdir = path.join(APP_ROOT, 'backup', stamp);
    if (!fs.existsSync(bdir)) return {ok: false, error: 'backup not found'};
    let files = [];
    try {
      files = JSON.parse(fs.readFileSync(path.join(bdir, '_info.json'), 'utf8')).files || [];
    } catch (e2) {
      files = fs.readdirSync(bdir).filter(f => f !== '_info.json').map(f => f.replace(/__/g, '/'));
    }
    const restamp = uniqueStamp('restore');
    const rdir = path.join(APP_ROOT, 'backup', restamp);
    fs.mkdirSync(rdir, {recursive: true});
    const restored = [];
    for (const rel of files) {
      if (!safeRel(rel)) continue;
      const src = path.join(bdir, flat(rel));
      if (!fs.existsSync(src)) continue;
      const dest = path.join(APP_ROOT, rel);
      if (fs.existsSync(dest)) fs.writeFileSync(path.join(rdir, flat(rel)), fs.readFileSync(dest));
      fs.mkdirSync(path.dirname(dest), {recursive: true});
      fs.copyFileSync(src, dest);
      restored.push(rel);
    }
    fs.writeFileSync(path.join(rdir, '_info.json'), JSON.stringify({at: new Date().toISOString(), files: restored}), 'utf8');
    return {ok: true, restored, backup: restamp};
  } catch (err) {
    return {ok: false, error: String((err && err.message) || err)};
  }
});

ipcMain.handle('up:relaunch', function () {
  app.relaunch();
  app.exit(0);
  return {ok: true};
});

function createWindow () {
  const win = new BrowserWindow({
    width: 1500,
    height: 940,
    minWidth: 1200,
    minHeight: 760,
    show: false,
    backgroundColor: '#070b16',
    title: 'املاک‌پلاس — سامانه مدیریت املاک',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
      spellcheck: false
    }
  });
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, '..', 'index.html'));
}

app.setAppUserModelId('ir.amlakpro.app');
app.disableHardwareAcceleration = false;

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  app.quit();
});
