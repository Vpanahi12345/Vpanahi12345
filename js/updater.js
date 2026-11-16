/* ═══════════════ به‌روزرسانی آنلاین برنامه از گیت‌هاب — سه بخش: بررسی / دانلود و نصب / تاریخچه و بازیابی ═══════════════ */
(function(){
'use strict';

var DESKTOP = !!(window.amlakDesktop && window.amlakDesktop.isDesktop);
var DEFAULT_BASE = 'https://raw.githubusercontent.com/Vpanahi12345/Vpanahi12345/refs/heads/main';
var LOCAL_VERSION = (document.querySelector('meta[name="app-version"]')||{}).content || window.APP_VERSION || '1.0.0';
var DEFAULT_FILES = ['index.html','css/app.css','js/jalali.js','js/db.js','js/components.js','js/modules.js','js/app.js','js/updater.js','electron/main.cjs','package.json'];
var SAFE_EXT = /\.(html|css|js|cjs|json|md|png|ico)$/i;

var state = {base:null, checked:false, busy:false, remote:null, notes:'', verdict:null, files:[], effVer:null, lastErr:''};
var box = null;

function esc(s){ return UI.esc(s) }
function pageHead(title,subtitle,actionsHtml){
  return '<div class="dash-greet anim-up"><div><div class="dash-hi">'+title+'</div>'
    +(subtitle?'<div class="dash-date">'+subtitle+'</div>':'')+'</div>'
    +'<div style="display:flex;gap:9px;flex-wrap:wrap">'+(actionsHtml||'')+'</div></div>';
}
function effVer(){ return state.effVer || LOCAL_VERSION }

/* ─── ابزار ─── */
function cmpVer(a,b){
  if(!a||!b) return null;
  var pa=String(a).trim().split('.'), pb=String(b).trim().split('.');
  for(var i=0;i<Math.max(pa.length,pb.length);i++){
    var x=parseInt(pa[i],10)||0, y=parseInt(pb[i],10)||0;
    if(x>y)return 1; if(x<y)return -1;
  }
  return 0;
}
function faBytes(n){
  if(n==null)return '—';
  if(n>=1048576)return Jal.toFa((n/1048576).toFixed(1))+' مگابایت';
  if(n>=1024)return Jal.toFa(Math.round(n/1024))+' کیلوبایت';
  return Jal.toFa(n)+' بایت';
}
function okRel(f){
  return typeof f==='string' && f.length<150 && f.charAt(0)!=='/' && f.indexOf('..')<0 && f.indexOf('\\')<0 && SAFE_EXT.test(f);
}
function normBase(u){
  u=String(u||'').trim().replace(/\/+$/,'');
  u=u.replace(/index\.html$/i,'').replace(/\/+$/,'');
  return u;
}
function fetchTimeout(url,ms){
  var ctl=new AbortController();
  var t=setTimeout(function(){ctl.abort()},ms||15000);
  return fetch(url,{cache:'no-store',signal:ctl.signal}).then(
    function(r){ clearTimeout(t); return r },
    function(e){ clearTimeout(t); throw e }
  );
}
/* دریافت متن؛ اول fetch مرورگر، در خطا مسیر IPC دسکتاپ */
function getText(url){
  return fetchTimeout(url,15000).then(function(r){
    if(r.status===404) return {status:404};
    if(!r.ok) throw new Error('HTTP '+r.status);
    return r.text().then(function(t){ return {status:200,text:t} });
  }).catch(function(err){
    if(DESKTOP && window.amlakDesktop.fetch){
      return window.amlakDesktop.fetch(url).then(function(res){
        if(res && res.ok) return {status:200,text:res.text};
        if(res && res.status===404) return {status:404};
        throw new Error((res&&res.error)||'network error');
      });
    }
    throw err;
  });
}
/* تجزیه متحمل version.json (حتی با JSON ناقص) */
function parseRelease(text){
  var out={};
  try{
    var o=JSON.parse(text);
    if(o && typeof o==='object'){
      out.version=String(o.version||'').trim();
      out.notes=String(o.release_notes||o.notes||'').trim();
      if(Array.isArray(o.files)) out.files=o.files.map(String);
      return (out.version||out.files)?out:null;
    }
  }catch(e){}
  var m=text.match(/"version"\s*:\s*"([^"]+)"/); if(m)out.version=m[1];
  m=text.match(/"release_notes"\s*:\s*"([^"]*)"/); if(m)out.notes=m[1];
  m=text.match(/"files"\s*:\s*\[([\s\S]*?)\]/);
  if(m){ out.files=[]; var re=/"([^"]+)"/g,x; while((x=re.exec(m[1]))) out.files.push(x[1]) }
  return (out.version||out.notes||out.files)?out:null;
}
function describeLocal(list){
  if(!DESKTOP){
    list.forEach(function(f){ f.changed=null; f.localSize=null });
    return Promise.resolve(list);
  }
  return Promise.all(list.map(function(f){
    if(f.status!==200){ f.changed=false; f.localSize=null; return f }
    return window.amlakDesktop.readFile(f.rel).then(function(res){
      var local=(res&&res.ok)?res.content:null;
      f.localSize=local==null?null:new Blob([local]).size;
      f.changed=(local==null)||local!==f.text;
      return f;
    }).catch(function(){ f.changed=true; return f });
  }));
}
function verdict(){
  var rv=state.remote, lv=effVer();
  var c=cmpVer(rv,lv);
  var anyChanged=state.files.some(function(f){ return f.status===200 && f.changed });
  if(rv && c>0) state.verdict='available';
  else if(rv && c===0) state.verdict= anyChanged ? 'same-dirty' : 'latest';
  else if(rv && c<0) state.verdict='older';
  else state.verdict= anyChanged ? 'diff-unknown' : 'unknown-same';
}
function installable(){
  return DESKTOP && (state.verdict==='available' || state.verdict==='same-dirty' || state.verdict==='diff-unknown');
}

/* ─── بررسی ─── */
function doCheck(btn){
  if(state.busy)return;
  var input=box.querySelector('#upUrl');
  var base=normBase(input.value);
  if(!/^https?:\/\/.+/i.test(base)){ UI.toast('آدرس به‌روزرسانی نامعتبر است','err'); input.focus(); return }
  state.busy=true; state.base=base;
  DB.setSetting('updateUrl',base);
  btn.disabled=true; btn.innerHTML='<span class="spin"></span> در حال بررسی...';
  renderBanner('info','⏳ در حال دریافت اطلاعات از سرور...');
  var release=null, anchor=null;
  getText(base+'/version.json')
    .then(function(r){ if(r.status===200) release=parseRelease(r.text) })
    .catch(function(){})
    .then(function(){ return getText(base+'/index.html') })
    .then(function(r){
      if(r.status!==200) throw new Error('index.html روی سرور یافت نشد');
      anchor=r.text;
    })
    .then(function(){
      var files=(release&&release.files?release.files.filter(okRel):DEFAULT_FILES.slice());
      if(files.indexOf('index.html')<0) files.unshift('index.html');
      return Promise.all(files.map(function(f){
        return getText(base+'/'+f).then(function(r){ return {rel:f,status:r.status,text:r.status===200?r.text:null,size:null} })
          .catch(function(){ return {rel:f,status:0,text:null,size:null} });
      }));
    })
    .then(function(list){ return describeLocal(list) })
    .then(function(list){
      list.forEach(function(f){ if(f.status===200) f.size=new Blob([f.text]).size });
      state.files=list; state.checked=true;
      state.remote=release?release.version:null;
      state.notes=release?release.notes:'';
      if(!state.remote && anchor){
        var m=anchor.match(/<meta\s+name=["']app-version["']\s+content=["']([^"']+)["']/i);
        if(m) state.remote=m[1];
      }
      verdict();
      renderBanner(); renderFiles();
      DB.setSetting('lastUpdateCheck',Date.now());
      DB.log('بررسی به‌روزرسانی', state.base+(state.remote?' — نسخه سرور: '+state.remote:''));
      refreshMeta();
    })
    .catch(function(err){
      state.checked=false;
      renderBanner('err','⛔ عدم دسترسی به سرور به‌روزرسانی — '+(err&&err.message?esc(err.message):'اتصال اینترنت را بررسی کنید'));
    })
    .then(function(){
      state.busy=false;
      btn.disabled=false;
      btn.innerHTML='🔄 بررسی به‌روزرسانی';
    });
}

/* ─── نصب ─── */
function doInstall(btn){
  if(!DESKTOP){ UI.toast('نصب خودکار فقط در نسخه نصب‌شده ویندوزی (Electron) فعال است','warn'); return }
  var warn=(state.verdict==='same-dirty'||state.verdict==='diff-unknown')
    ?'\n\n⚠️ توجه: شماره نسخه سرور بالاتر از نسخه فعلی نیست. مطمئن شوید فایل‌های روی گیت‌هاب همان نسخه جدید و تست‌شده هستند.'
    :'';
  var files=state.files.filter(function(f){ return f.status===200 && f.changed });
  if(!files.length){ UI.toast('فایلی برای به‌روزرسانی وجود ندارد','warn'); return }
  UI.confirm('نصب به‌روزرسانی','تعداد '+Jal.toFa(files.length)+' فایل جایگزین می‌شود و از نسخه فعلی پشتیبان خودکار گرفته می‌شود.'+warn).then(function(y){
    if(!y)return;
    btn.disabled=true; btn.innerHTML='<span class="spin"></span> در حال دانلود و نصب...';
    var payload=files.map(function(f){ return {rel:f.rel, content:f.text} });
    Promise.resolve(window.amlakDesktop.writeFiles(payload)).then(function(res){
      if(!res||!res.ok) throw new Error((res&&res.error)||'خطای نوشتن فایل');
      state.effVer=state.remote||state.effVer;
      var rec={id:DB.uid(), at:Date.now(), from:LOCAL_VERSION, to:state.remote||'نامشخص',
        files:res.written||payload.map(function(p){return p.rel}), backup:res.backup||'', ok:true};
      return DB.updates.save(rec).then(function(){ return DB.log('نصب به‌روزرسانی','از نسخه '+rec.from+' به '+rec.to) });
    }).then(function(){
      UI.toast('به‌روزرسانی با موفقیت نصب شد ✅','ok');
      verdict(); renderBanner(); renderFiles();
      loadHistory();
      var rb=box.querySelector('#upRestartZone');
      if(rb) rb.innerHTML='<div class="up-restart">🔁 برای فعال‌شدن نسخه جدید، برنامه را راه‌اندازی مجدد کنید.'
        +'<button class="btn btn-gold" id="upRelaunchBtn">راه‌اندازی مجدد برنامه</button></div>';
      var rbtn=box.querySelector('#upRelaunchBtn');
      if(rbtn) rbtn.onclick=function(){
        UI.confirm('راه‌اندازی مجدد','برنامه اکنون بسته و مجدداً باز می‌شود. ادامه؟').then(function(y2){
          if(y2&&window.amlakDesktop) window.amlakDesktop.relaunch();
        });
      };
    }).catch(function(err){
      UI.toast('خطا در نصب به‌روزرسانی: '+(err&&err.message?err.message:'نامشخص'),'err');
    }).then(function(){
      btn.disabled=false;
      btn.innerHTML='⬇ دانلود و نصب ('+Jal.toFa(files.length)+' فایل)';
    });
  });
}

/* ─── رندر بخش‌ها ─── */
function renderBanner(force,forceText){
  var el=box.querySelector('#upBanner');
  if(force){ el.className='up-banner '+force; el.innerHTML=forceText; return }
  var v=state.verdict, html='', cls='';
  if(v==='latest'){ cls='ok'; html='✅ برنامه شما به‌روز است — نسخه '+esc(state.remote)+' روی سرور با نسخه نصب‌شده یکسان است.' }
  else if(v==='available'){ cls='new'; html='🚀 نسخه جدید <b>'+esc(state.remote)+'</b> روی سرور موجود است!'
    +(state.notes?'<div class="up-notes">📝 '+esc(state.notes)+'</div>':'') }
  else if(v==='older'){ cls='old'; html='ℹ️ نسخه روی سرور (<b>'+esc(state.remote)+'</b>) قدیمی‌تر از نسخه نصب‌شده (<b>'+esc(effVer())+'</b>) است — نیازی به نصب نیست.' }
  else if(v==='same-dirty'){ cls='warn'; html='⚠️ شماره نسخه سرور ('+esc(state.remote)+') با نسخه فعلی یکسان است، اما محتوای برخی فایل‌ها متفاوت است.' }
  else if(v==='diff-unknown'){ cls='warn'; html='⚠️ شماره نسخه روی سرور یافت نشد، اما فایل‌های متفاوتی روی سرور وجود دارد.' }
  else { cls='ok'; html='✅ فایل‌های سرور با نسخه نصب‌شده یکسان به نظر می‌رسند.' }
  el.className='up-banner '+cls;
  el.innerHTML=html;
  var ib=box.querySelector('#upInstallBtn');
  if(ib){
    ib.style.display=installable()?'':'none';
    ib.disabled=!installable();
  }
}
function renderFiles(){
  var el=box.querySelector('#upFiles');
  if(!state.checked){
    el.innerHTML='<div class="empty-box"><div class="eb-ico">☁️</div><div class="eb-t">هنوز بررسی نشده</div>'
      +'<div class="eb-s">برای مشاهده وضعیت فایل‌ها، ابتدا از بخش اول «بررسی به‌روزرسانی» را بزنید.</div></div>';
    return;
  }
  var rows=state.files.map(function(f,i){
    var st=f.status===200?'<span class="chip ok">موجود</span>':f.status===404?'<span class="chip gray">در سرور نیست</span>':'<span class="chip danger">خطا</span>';
    var ch=f.changed===true?'<span class="chip danger">تغییر کرده</span>':f.changed===false?'<span class="chip ok">یکسان</span>':'<span class="chip gray">نامشخص</span>';
    return '<tr><td class="row-num">'+Jal.toFa(i+1)+'</td><td style="direction:ltr;text-align:right">'+esc(f.rel)+'</td>'
      +'<td>'+st+'</td><td>'+ch+'</td><td>'+faBytes(f.size)+'</td><td>'+faBytes(f.localSize)+'</td></tr>';
  }).join('');
  el.innerHTML='<div style="overflow-x:auto"><table class="data-table"><thead><tr>'
    +'<th>#</th><th>مسیر فایل</th><th>وضعیت در سرور</th><th>مقایسه با محلی</th><th>حجم روی سرور</th><th>حجم محلی</th>'
    +'</tr></thead><tbody>'+rows+'</tbody></table></div>';
  var changed=state.files.filter(function(f){return f.status===200&&f.changed}).length;
  var ib=box.querySelector('#upInstallBtn');
  if(ib){
    ib.style.display=installable()?'':'none';
    ib.disabled=!installable()||!changed;
    ib.innerHTML='⬇ دانلود و نصب ('+Jal.toFa(changed)+' فایل)';
  }
}
function refreshMeta(){
  DB.getSetting('lastUpdateCheck').then(function(t){
    var el=box.querySelector('#upLastCheck');
    if(!el)return;
    if(!t){ el.innerHTML='<span class="chip gray">هنوز بررسی نشده</span>'; return }
    var d=new Date(t), j=Jal.toJalali(d.getFullYear(),d.getMonth()+1,d.getDate());
    var hh=('0'+d.getHours()).slice(-2), mm=('0'+d.getMinutes()).slice(-2);
    el.innerHTML='<span class="chip info">آخرین بررسی: '+Jal.fmt(j.jy,j.jm,j.jd)+' — '+Jal.toFa(hh)+':'+Jal.toFa(mm)+'</span>';
  });
}
function loadHistory(){
  var el=box.querySelector('#upHist');
  if(!el)return;
  DB.updates.all().then(function(list){
    list.sort(function(a,b){ return (b.at||0)-(a.at||0) });
    if(!list.length){
      el.innerHTML='<div class="empty-box"><div class="eb-ico">🗂️</div><div class="eb-t">تاریخچه خالی است</div>'
        +'<div class="eb-s">به‌روزرسانی‌های نصب‌شده پس از اولین نصب، اینجا ثبت می‌شوند.</div></div>';
      return;
    }
    var rows=list.map(function(h,i){
      var d=new Date(h.at||0), j=Jal.toJalali(d.getFullYear(),d.getMonth()+1,d.getDate());
      var hh=('0'+d.getHours()).slice(-2), mm=('0'+d.getMinutes()).slice(-2);
      return '<tr><td class="row-num">'+Jal.toFa(i+1)+'</td>'
        +'<td>'+Jal.fmt(j.jy,j.jm,j.jd)+' <span style="color:var(--dim)">'+Jal.toFa(hh)+':'+Jal.toFa(mm)+'</span></td>'
        +'<td>'+esc(h.from||'—')+' ← <b style="color:var(--gold)">'+esc(h.to||'—')+'</b></td>'
        +'<td>'+Jal.toFa((h.files||[]).length)+' فایل</td>'
        +'<td style="direction:ltr;text-align:right;color:var(--dim)">'+esc(h.backup||'—')+'</td>'
        +'<td>'+(h.ok!==false?'<span class="chip ok">موفق</span>':'<span class="chip danger">ناموفق</span>')+'</td></tr>';
    }).join('');
    el.innerHTML='<div style="overflow-x:auto"><table class="data-table"><thead><tr>'
      +'<th>#</th><th>تاریخ</th><th>نسخه</th><th>تعداد</th><th>پشتیبان</th><th>وضعیت</th>'
      +'</tr></thead><tbody>'+rows+'</tbody></table></div>';
  });
}
function loadBackups(){
  var el=box.querySelector('#upBackups');
  if(!el)return;
  if(!DESKTOP){
    el.innerHTML='<div class="up-note">پشتیبان‌گیری خودکار و بازیابی فقط در نسخه نصب‌شده ویندوزی (Electron) فعال است.</div>';
    return;
  }
  window.amlakDesktop.listBackups().then(function(res){
    var list=(res&&res.ok)?(res.backups||[]):[];
    if(!list.length){
      el.innerHTML='<div class="up-note">هنوز پشتیبانی گرفته نشده است. با اولین نصب به‌روزرسانی، پشتیبان خودکار ساخته می‌شود.</div>';
      return;
    }
    el.innerHTML=list.map(function(b,i){
      return '<div class="up-bk"><div><b style="direction:ltr;display:inline-block">'+esc(b.stamp)+'</b>'
        +'<span style="color:var(--dim);margin-right:10px">'+Jal.toFa((b.files||[]).length)+' فایل</span></div>'
        +'<button class="btn btn-ghost btn-sm" data-bk="'+esc(b.stamp)+'">↩ بازیابی</button></div>';
    }).join('');
    el.querySelectorAll('[data-bk]').forEach(function(btn){
      btn.onclick=function(){
        var stamp=btn.dataset.bk;
        UI.confirm('بازیابی پشتیبان','فایل‌های برنامه به وضعیت پشتیبان «'+stamp+'» برمی‌گردند و برنامه مجدداً راه‌اندازی می‌شود. ادامه؟').then(function(y){
          if(!y)return;
          window.amlakDesktop.restore(stamp).then(function(res){
            if(!res||!res.ok){ UI.toast('خطا در بازیابی: '+((res&&res.error)||'نامشخص'),'err'); return }
            DB.log('بازیابی پشتیبان',stamp);
            UI.toast('بازیابی انجام شد — در حال راه‌اندازی مجدد...','ok');
            setTimeout(function(){ window.amlakDesktop.relaunch() },900);
          });
        });
      };
    });
  });
}

/* ─── صفحه ─── */
window.Pages = window.Pages || {};
window.Pages.updates=function(){
  if(!App.user||App.user.role!=='admin'){ UI.toast('این بخش فقط برای مدیر سیستم قابل دسترسی است','warn'); App.go('dashboard'); return }
  App.setTitle('به‌روزرسانی برنامه');
  var c=UI.el('<div>'
    +pageHead('🔄 به‌روزرسانی برنامه','دریافت نسخه‌های جدید به‌صورت آنلاین از مخزن گیت‌هاب — بدون نیاز به نصب مجدد',
      '<span class="chip '+(DESKTOP?'ok':'warn')+'">'+(DESKTOP?'🖥 نسخه ویندوزی نصب‌شده':'🌐 حالت مرورگر — نصب خودکار غیرفعال')+'</span>'
      +'<span class="chip gold">نسخه فعلی: v'+esc(effVer())+'</span>')
    /* ── بخش ۱: بررسی ── */
    +'<div class="card anim-up" style="--d:.04s;margin-top:4px"><div class="card-title"><span class="dot"></span>۱) بررسی به‌روزرسانی</div>'
      +'<div class="field"><label>آدرس پایه مخزن گیت‌هاب (منبع به‌روزرسانی)</label>'
      +'<input class="input" id="upUrl" style="direction:ltr;text-align:left" placeholder="'+esc(DEFAULT_BASE)+'"></div>'
      +'<div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:12px;align-items:center">'
        +'<button class="btn btn-primary" id="upCheckBtn">🔄 بررسی به‌روزرسانی</button>'
        +'<button class="btn btn-ghost" id="upDefaultBtn">بازگردانی آدرس پیش‌فرض</button>'
        +'<span id="upLastCheck"></span>'
      +'</div>'
      +'<div id="upBanner" class="up-banner old" style="margin-top:14px">برای شروع، دکمه «بررسی به‌روزرسانی» را بزنید.</div>'
    +'</div>'
    /* ── بخش ۲: دانلود و نصب ── */
    +'<div class="card anim-up" style="--d:.1s;margin-top:16px"><div class="card-title"><span class="dot"></span>۲) دانلود و نصب به‌روزرسانی</div>'
      +'<div id="upFiles"></div>'
      +'<div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:14px;align-items:center">'
        +'<button class="btn btn-gold" id="upInstallBtn" style="display:none">⬇ دانلود و نصب</button>'
        +'<span id="upRestartZone"></span>'
      +'</div>'
    +'</div>'
    /* ── بخش ۳: تاریخچه و بازیابی ── */
    +'<div class="card anim-up" style="--d:.16s;margin-top:16px"><div class="card-title"><span class="dot"></span>۳) تاریخچه به‌روزرسانی‌ها و بازیابی پشتیبان</div>'
      +'<div id="upHist"></div>'
      +'<div style="margin-top:18px"><div class="card-title" style="font-size:12.5px"><span class="dot" style="background:var(--grad-cyan,linear-gradient(90deg,#22d3ee,#0891b2))"></span>نسخه‌های پشتیبان خودکار</div>'
      +'<div id="upBackups"></div></div>'
    +'</div>'
    +'<div class="up-note" style="margin-top:14px">💡 نحوه انتشار نسخه جدید: فایل‌های تغییر‌یافته را در همان مسیرهای برنامه روی مخزن گیت‌هاب قرار دهید، فایل <b>version.json</b> را با شماره نسخه بالاتر به‌روز کنید و فهرست <b>files</b> را کامل نگه دارید. جزئیات کامل در فایل README آمده است.</div>'
    +'</div>');
  box=c;
  App.setContent(c);

  DB.getSetting('updateUrl').then(function(v){ c.querySelector('#upUrl').value=normBase(v||DEFAULT_BASE) });
  c.querySelector('#upCheckBtn').onclick=function(){ doCheck(c.querySelector('#upCheckBtn')) };
  c.querySelector('#upDefaultBtn').onclick=function(){ c.querySelector('#upUrl').value=DEFAULT_BASE; UI.toast('آدرس پیش‌فرض بازگردانی شد — برای ذخیره، «بررسی» را بزنید','info') };
  c.querySelector('#upInstallBtn').onclick=function(){ doInstall(c.querySelector('#upInstallBtn')) };

  if(state.checked){ renderBanner(); renderFiles() } else renderFiles();
  refreshMeta();
  loadHistory();
  loadBackups();
};
})();
