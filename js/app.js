/* ═══════════════ هسته برنامه: ورود، ناوبری، داشبورد، املاک، جستجوی پیشرفته ═══════════════ */
(function(){
'use strict';
var App={user:null,route:null,pages:{}};
window.App=App;

function esc(s){return UI.esc(s)}
function num(v){return Jal.fmtNum(v)}
function money(v){return Jal.fmtMoney(v)}
function todayStr(){var t=Jal.today();return Jal.fmt(t.jy,t.jm,t.jd)}
function debounce(fn,ms){var t;return function(){var a=arguments,s=this;clearTimeout(t);t=setTimeout(function(){fn.apply(s,a)},ms)}}
function shortMoney(v){
  if(!v||v<=0)return '—';
  if(v>=1e12)return num(Math.round(v/1e9))+' میلیارد ریال';
  if(v>=1e9)return num(Math.round(v/1e6))+' میلیون ریال';
  return money(v);
}
App.shortMoney=shortMoney;
App.esc=esc;App.num=num;App.money=money;

/* ─── آیکون‌های منو ─── */
var ICO={
  dash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/></svg>',
  props:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>',
  add:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>',
  customers:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5"/><circle cx="17.5" cy="9.5" r="2.5"/><path d="M16 14.6c2.8.2 4.8 1.8 5.5 4.4"/></svg>',
  visits:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M9.5 15.5l2 2 3.5-4"/></svg>',
  reports:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/></svg>',
  finance:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="6" width="19" height="13" rx="3"/><circle cx="12" cy="12.5" r="3"/><path d="M6 9.5h.01M18 15.5h.01"/></svg>',
  users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.2-3.8 4.2-6 8-6s6.8 2.2 8 6"/></svg>',
  settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 00-.15-1.4l2.1-1.6-2-3.4-2.5 1a7 7 0 00-2.4-1.4L13.7 2h-3.4l-.35 2.6A7 7 0 007.55 6l-2.5-1-2 3.4 2.1 1.6a7 7 0 000 2.8L3.05 14.4l2 3.4 2.5-1a7 7 0 002.4 1.4l.35 2.6h3.4l.35-2.6a7 7 0 002.4-1.4l2.5 1 2-3.4-2.1-1.6c.1-.45.15-.92.15-1.4z"/></svg>',
  updates:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12a9 9 0 11-2.6-6.3"/><path d="M21 3v6h-6"/><path d="M9 12.5l2 2 4-4.5"/></svg>'
};

/* ─── منو ─── */
var NAV=[
  {sec:'اصلی'},
  {id:'dashboard',label:'داشبورد',ico:ICO.dash},
  {sec:'املاک'},
  {id:'properties',label:'جستجو و فهرست املاک',ico:ICO.props},
  {id:'propNew',label:'ثبت ملک جدید',ico:ICO.add},
  {sec:'مشتریان و بازدید'},
  {id:'customers',label:'درخواست مشتریان',ico:ICO.customers},
  {id:'visits',label:'یادآور بازدید',ico:ICO.visits},
  {sec:'تحلیل و مالی'},
  {id:'reports',label:'گزارش‌های تحلیلی',ico:ICO.reports},
  {id:'finance',label:'ابزارهای مالی',ico:ICO.finance},
  {sec:'مدیریت سیستم',role:'admin'},
  {id:'users',label:'مدیریت کاربران',ico:ICO.users,role:'admin'},
  {id:'updates',label:'به‌روزرسانی برنامه',ico:ICO.updates,role:'admin'},
  {id:'settings',label:'تنظیمات و پشتیبان‌گیری',ico:ICO.settings,role:'admin'}
];

App.buildNav=function(){
  var nav=document.getElementById('sideNav');
  var html='';
  NAV.forEach(function(item){
    if(item.sec){
      if(item.role==='admin'&&(!App.user||App.user.role!=='admin'))return;
      html+='<div class="nav-title">'+item.sec+'</div>';
    }else{
      if(item.role==='admin'&&(!App.user||App.user.role!=='admin'))return;
      html+='<div class="nav-item" data-route="'+item.id+'">'+item.ico+'<span class="nl">'+item.label+'</span></div>';
    }
  });
  nav.innerHTML=html;
  nav.querySelectorAll('.nav-item').forEach(function(it){
    it.onclick=function(){App.go(it.dataset.route)};
  });
};

App.refreshUserChip=function(){
  var u=App.user;
  if(!u)return;
  document.getElementById('sideUserChip').innerHTML=
    '<div class="uc-avatar">'+esc((u.fullName||u.username).charAt(0))+'</div>'
    +'<div class="uc-info"><div class="uc-name">'+esc(u.fullName||u.username)+'</div>'
    +'<div class="uc-role">'+(u.role==='admin'?'👑 مدیر سیستم':'👤 کاربر عادی')+'</div></div>';
  document.getElementById('userBtn').innerHTML='<span style="font-size:15px">'+(u.role==='admin'?'👑':'👤')+'</span><span>'+esc(u.fullName||u.username)+'</span> ▾';
};

App.setTitle=function(t){document.getElementById('pageTitle').textContent=t};
App.setContent=function(el){
  var pc=document.getElementById('pageContent');
  pc.innerHTML='';
  pc.appendChild(el);
  Jal.scan(pc);
  UI.bindMoney(pc);
};

App.go=function(route){
  App.route=route;
  document.querySelectorAll('.nav-item').forEach(function(it){it.classList.toggle('active',it.dataset.route===route)});
  var titles={dashboard:'داشبورد',properties:'جستجو و فهرست املاک',propNew:'ثبت ملک جدید',customers:'درخواست مشتریان',visits:'یادآور بازدید',reports:'گزارش‌های تحلیلی',finance:'ابزارهای مالی',users:'مدیریت کاربران',updates:'به‌روزرسانی برنامه',settings:'تنظیمات و پشتیبان‌گیری'};
  document.getElementById('pageTitle').textContent=titles[route]||'';
  var fn=App.pages[route];
  if(fn)fn();
};

/* ─── کارت ملک ─── */
function specChips(p){
  var out=[];
  out.push(num(p.size)+' متر');
  if(p.rooms)out.push(num(p.rooms)+' خواب');
  if(p.ptype==='apartment'&&p.floor!==undefined&&p.floor!=='')out.push(p.floor==0?'همکف':'طبقه '+num(p.floor));
  if(p.buildYear)out.push('ساخت '+Jal.toFa(Jal.toEn(p.buildYear)));
  if(p.docType)out.push('📜 '+p.docType);
  if(p.landUse)out.push(p.landUse);
  if(p.cKind)out.push(p.cKind);
  if(p.gKind)out.push(p.gKind);
  return out.map(function(x){return '<span class="pc-spec">'+esc(x)+'</span>'}).join('');
}
function priceHTML(p){
  if(p.deal==='rent')
    return '<div class="pc-price" style="font-size:13px">رهن: '+num(p.rahnFull||0)+' <small>ریال</small><br>اجاره: '+num(p.rentMonthly||0)+' <small>ریال / ماه</small></div>';
  return '<div class="pc-price">'+num(p.salePrice||0)+' <small>ریال</small></div>';
}
App.propCardHTML=function(p,opts){
  opts=opts||{};
  var pt=CONST.PTYPES[p.ptype]||{ico:'🏠',t:p.ptype};
  var st=CONST.STATUS[p.status]||{t:p.status,c:'gray'};
  return '<div class="prop-card" data-pid="'+p.id+'">'
    +(opts.score?'<span class="chip gold" style="position:absolute;top:12px;left:12px">🎯 '+Jal.toFa(opts.score)+'٪ تطبیق</span>':'')
    +'<div class="pc-head"><div class="pc-ico i-gold">'+pt.ico+'</div>'
    +'<div><div class="pc-title">'+esc(p.title)+'</div><div class="pc-sub">📍 '+esc(p.region||'—')+'</div></div>'
    +'<span class="pc-code">'+esc(p.code)+'</span></div>'
    +'<div class="pc-specs">'+specChips(p)+'</div>'
    +priceHTML(p)
    +'<div class="pc-foot"><span class="pc-agent">👤 '+esc(p.sellerName||'—')+' · 📅 '+esc(p.createdAt||'')+'</span>'
    +'<span class="chip '+st.c+'">'+st.t+'</span></div>'
    +'</div>';
};

/* ─── مودال جزئیات ملک ─── */
App.openProperty=function(id,parentModal){
  DB.properties.get(id).then(function(p){
    if(!p){UI.toast('ملک یافت نشد','err');return}
    propertyDetail(p,parentModal);
  });
};
function kv(k,v){ if(v===undefined||v===null||v==='')return ''; return '<div class="dl-row"><span class="dl-k">'+esc(k)+'</span><span class="dl-v">'+esc(v)+'</span></div>' }
function propertyDetail(p,parentModal){
  var pt=CONST.PTYPES[p.ptype]||{ico:'🏠',t:p.ptype};
  var st=CONST.STATUS[p.status]||{t:p.status,c:'gray'};
  var admin=App.user.role==='admin';
  var body=UI.el('<div>'
    +'<div class="detail-price"><div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">'
    +'<div><div style="font-size:11px;color:var(--muted);margin-bottom:4px">'+esc(p.deal==='rent'?'رهن و اجاره':(CONST.DEALS[p.deal]||''))+'</div>'
    +'<div class="dp-v">'+(p.deal==='rent'?('رهن: '+num(p.rahnFull||0)+' ریال · اجاره: '+num(p.rentMonthly||0)+' ریال'):(num(p.salePrice||0)+' ریال'))+'</div>'
    +(p.deal!=='rent'&&p.size&&p.salePrice?'<div style="font-size:11.5px;color:var(--muted);margin-top:4px">قیمت هر متر: '+num(Math.round(p.salePrice/p.size))+' ریال</div>':'')
    +'</div><div style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip gray" style="font-size:12px">'+pt.ico+' '+pt.t+'</span>'+UI.dealChip(p.deal)+'<span class="chip '+st.c+'">'+st.t+'</span></div></div></div>'
    +'<div class="detail-grid">'
    +'<div class="detail-sec"><h4>اطلاعات کلی ملک</h4>'
      +kv('کد ملک',p.code)+kv('عنوان',p.title)+kv('منطقه / محله',p.region)+kv('آدرس',p.address)
      +kv('متراژ',p.size?num(p.size)+' متر':'')+kv('نوع سند',p.docType)+kv('توضیحات',p.desc)
    +'</div>'
    +'<div class="detail-sec"><h4>اطلاعات فروشنده و ثبت</h4>'
      +kv('نام فروشنده',p.sellerName)+kv('تلفن فروشنده',p.sellerPhone)
      +kv('تاریخ ثبت',p.createdAt)+kv('ثبت‌کننده',p.createdBy)
      +(p.updatedAt&&p.updatedAt!==p.createdAt?kv('آخرین ویرایش',p.updatedAt+' — '+p.updatedBy):'')
    +'</div>'
    +'<div class="detail-sec"><h4>مشخصات اختصاصی</h4>'
      +(p.ptype==='land'?landDetail(p):p.ptype==='garden'?gardenDetail(p):p.ptype==='commercial'||p.ptype==='office'?commDetail(p):resDetail(p))
    +'</div>'
    +'<div class="detail-sec"><h4>امکانات و ویژگی‌ها</h4>'+featsHTML(p)+'</div>'
    +'</div></div>');
  var buttons=[{label:'🖨 چاپ برگه ملک',cls:'btn-primary',onClick:function(){printPropertySheet(p)}}];
  if(admin){
    buttons.push({label:'✏️ ویرایش',cls:'btn-gold',onClick:function(){m.close();propertyForm(p,function(){App.go('properties')})}});
    buttons.push({label:'🗑 حذف ملک',cls:'btn-danger',onClick:function(){
      UI.confirm('حذف ملک','ملک «'+esc(p.title)+'» برای همیشه حذف می‌شود. مطمئن هستید؟',true).then(function(y){
        if(!y)return;
        DB.properties.del(p.id).then(function(){DB.log('حذف ملک',p.code+' - '+p.title);UI.toast('ملک حذف شد','ok');m.close();App.go(App.route)});
      });
    }});
  }
  var m=UI.modal({title:pt.ico+' '+esc(p.title)+' — '+esc(p.code),icon:'',size:'lg',body:body,buttons:buttons});
}

function resDetail(p){
  return kv('تعداد خواب',p.rooms?num(p.rooms)+' خواب':'')
    +kv('طبقه',p.floor!==undefined&&p.floor!==''?(p.floor==0?'همکف':'طبقه '+num(p.floor)):'')
    +kv('تعداد کل طبقات',p.totalFloors?num(p.totalFloors):'')
    +kv('واحد در هر طبقه',p.unitsPerFloor?num(p.unitsPerFloor):'')
    +kv('سال ساخت',p.buildYear?Jal.toFa(Jal.toEn(p.buildYear)):'')
    +kv('جهت‌گیری',p.direction)+kv('وضعیت اشتغال',p.occupancy)
    +kv('نما',p.facade)+kv('کف',p.flooring)+kv('آشپزخانه',p.kitchen)
    +kv('گرمایش',p.heating)+kv('سرمایش',p.cooling)+kv('سرویس بهداشتی',p.bath)
    +kv('بازسازی‌شده',p.renovated);
}
function landDetail(p){
  return kv('نوع ملک زمینی',p.landKind)+kv('کاربری',p.landUse)
    +kv('عرض بر',p.width?num(p.width)+' متر':'')+kv('طول',p.length?num(p.length)+' متر':'')
    +kv('تراکم ساختمانی',p.density?p.density+'٪':'')+kv('طبقات مجاز',p.maxFloors?num(p.maxFloors):'')
    +kv('دیوارکشی',p.walled)+kv('جواز ساخت',p.permit);
}
function commDetail(p){
  return kv('نوع کاربری',p.cKind)+kv('طبقه',p.cFloor)
    +kv('عرض سرانای',p.saran?num(p.saran)+' متر':'')+kv('ارتفاع سقف',p.height?num(p.height)+' متر':'')
    +kv('تعداد اتاق/فضا',p.rooms?num(p.rooms):'')
    +kv('سرقفلی',p.goodwill)+(p.goodwill==='دارد'?kv('مبلغ سرقفلی',p.goodwillPrice?num(p.goodwillPrice)+' ریال':''):'');
}
function gardenDetail(p){
  return kv('نوع ملک',p.gKind)+kv('متراژ زمین',p.size?num(p.size)+' متر':'')
    +kv('متراژ زیربنا',p.bSize?num(p.bSize)+' متر':'')+kv('تعداد خواب',p.rooms?num(p.rooms):'')
    +kv('طبقات',p.floors?num(p.floors):'')+kv('سال ساخت',p.buildYear?Jal.toFa(Jal.toEn(p.buildYear)):'')
    +kv('نما',p.facade)+kv('کف',p.flooring);
}
function featsHTML(p){
  var f=[];
  if(p.parking&&p.parking!=='ندارد')f.push('🚗 پارکینگ '+(p.parking==='تک'?'':p.parking));
  if(p.elevator==='دارد')f.push('🛗 آسانسور');
  if(p.storage==='دارد')f.push('📦 انباری');
  if(p.balcony==='دارد')f.push('🌤 بالکن');
  if(p.pool==='دارد')f.push('🏊 استخر'+(p.poolCovered?' ('+p.poolCovered+')':''));
  if(p.sauna==='دارد')f.push('♨️ سونا');
  if(p.jacuzzi==='دارد')f.push('🛁 جکوزی');
  if(p.gazebo==='دارد')f.push('⛺ آلاچیق');
  if(p.bbq==='دارد')f.push('🍖 باربیکیو');
  if(p.trees==='دارد')f.push('🌳 درخت مثمر');
  if(p.well==='دارد')f.push('💧 چاه آب');
  if(p.caretaker==='دارد')f.push('🧑‍🌾 سرایداری');
  if(p.walled==='بله')f.push('🧱 دیوارکشی');
  if(p.permit==='دارد')f.push('📄 جواز ساخت');
  if(p.has3Phase==='دارد')f.push('⚡ برق سه‌فاز');
  if(p.signBoard==='بله')f.push('🪧 تابلوخور');
  if(p.backYard==='دارد')f.push('🚪 پشت‌سرا');
  if(p.water==='دارد')f.push('🚰 آب');if(p.power==='دارد')f.push('🔌 برق');
  if(p.gas==='دارد')f.push('🔥 گاز');if(p.phone==='دارد')f.push('☎️ تلفن');
  if(p.goodwill==='دارد')f.push('🏷️ دارای سرقفلی');
  if(!f.length)return '<div style="color:var(--muted);font-size:12px">امکانات خاصی ثبت نشده</div>';
  return f.map(function(x){return '<span class="badge-feat">'+x+'</span>'}).join(' ');
}

function printPropertySheet(p){
  var pt=CONST.PTYPES[p.ptype]||{t:p.ptype};
  var admin=App.user.role==='admin';
  var priceBox=p.deal==='rent'
    ?'<div class="p-price">رهن: '+(p.rahnFull||0)+' ریال — اجاره ماهانه: '+(p.rentMonthly||0)+' ریال</div>'
    :'<div class="p-price">قیمت کل: '+(p.salePrice||0)+' ریال'+(p.size&&p.salePrice?' — هر متر: '+Math.round(p.salePrice/p.size)+' ریال':'')+'</div>';
  var sec1='<div class="p-sec">اطلاعات کلی</div><div class="p-kv">'
    +'<div><div class="k">کد ملک</div><div class="v">'+esc(p.code)+'</div></div>'
    +'<div><div class="k">نوع ملک</div><div class="v">'+pt.t+'</div></div>'
    +'<div><div class="k">نوع معامله</div><div class="v">'+(CONST.DEALS[p.deal]||'')+'</div></div>'
    +'<div><div class="k">عنوان</div><div class="v">'+esc(p.title)+'</div></div>'
    +'<div><div class="k">منطقه / محله</div><div class="v">'+esc(p.region||'')+'</div></div>'
    +'<div><div class="k">آدرس</div><div class="v">'+esc(p.address||'')+'</div></div>'
    +'<div><div class="k">متراژ</div><div class="v">'+num(p.size)+' متر</div></div>'
    +'<div><div class="k">نوع سند</div><div class="v">'+esc(p.docType||'')+'</div></div>'
    +'<div><div class="k">وضعیت</div><div class="v">'+(CONST.STATUS[p.status]?CONST.STATUS[p.status].t:'')+'</div></div></div>';
  var sec2='<div class="p-sec">مشخصات اختصاصی</div><div class="p-kv">';
  var d=(p.ptype==='land'?landDetail(p):p.ptype==='garden'?gardenDetail(p):(p.ptype==='commercial'||p.ptype==='office')?commDetail(p):resDetail(p));
  d.replace(/<div class="dl-row"><span class="dl-k">(.*?)<\/span><span class="dl-v">(.*?)<\/span><\/div>/g,function(_,k,v){
    sec2+='<div><div class="k">'+k+'</div><div class="v">'+v+'</div></div>';
  });
  sec2+='</div>';
  var feats=featsHTML(p).replace(/<span class="badge-feat">/g,'').replace(/<\/span>/g,' · ');
  var sec3='<div class="p-sec">امکانات</div><div class="p-kv"><div style="grid-column:span 3">'+feats+'</div></div>';
  UI.printHTML('برگه مشخصات ملک '+esc(p.code),
    sec1+sec2+sec3+priceBox
    +'<div class="p-note">توضیحات: '+esc(p.desc||'—')+'</div>'
    +'<div class="p-foot"><span>مشاور: '+esc(p.createdBy||'')+'</span><span>تلفن بنگاه: '+esc(document.getElementById('sideAgencyName').textContent||'')+'</span><span>امضای فروشنده</span></div>');
}

/* ═════════════════════════ داشبورد ═════════════════════════ */
function countUp(elms){
  elms.forEach(function(e){
    var target=+e.dataset.v||0,t0=null,dur=900;
    function step(ts){
      if(!t0)t0=ts;
      var p=Math.min(1,(ts-t0)/dur);
      e.textContent=num(Math.round(target*(1-Math.pow(1-p,3))));
      if(p<1)requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}
App.pages.dashboard=function(){
  var t=Jal.today();
  Promise.all([DB.properties.all(),DB.customers.all(),DB.visits.all()]).then(function(rs){
    var props=rs[0],customers=rs[1],visits=rs[2];
    var active=props.filter(function(p){return p.status==='active'});
    var closed=props.filter(function(p){return p.status==='sold'||p.status==='rented'});
    var totalSale=active.filter(function(p){return p.deal!=='rent'}).reduce(function(s,p){return s+(+p.salePrice||0)},0);
    var openC=customers.filter(function(c){return c.status==='open'}).length;
    var todayKey=Jal.key(t);
    var todayV=visits.filter(function(v){return v.status==='scheduled'&&Jal.keyOf(v.date)===todayKey});
    /* ۶ ماه اخیر */
    var months=[],mcnt=[];
    for(var i=5;i>=0;i--){
      var j=Jal.today();var m=j.jm-i,y=j.jy;
      while(m<1){m+=12;y--}
      months.push(Jal.monthName(m));
      mcnt.push(props.filter(function(p){var pj=Jal.parse(p.createdAt);return pj&&pj.jy===y&&pj.jm===m}).length);
    }
    var typeLabels=[],typeVals=[];
    Object.keys(CONST.PTYPES).forEach(function(k){
      var c=props.filter(function(p){return p.ptype===k}).length;
      if(c>0){typeLabels.push(CONST.PTYPES[k].t);typeVals.push(c)}
    });
    var stLabels=[],stVals=[];
    Object.keys(CONST.STATUS).forEach(function(k){
      var c=props.filter(function(p){return p.status===k}).length;
      if(c>0){stLabels.push(CONST.STATUS[k].t);stVals.push(c)}
    });
    var recent=props.slice().sort(function(a,b){return (b.createdAt||'').localeCompare(a.createdAt||'')}).slice(0,5);
    var upcoming=visits.filter(function(v){return v.status==='scheduled'&&Jal.keyOf(v.date)>=todayKey}).sort(function(a,b){return Jal.keyOf(a.date)-Jal.keyOf(b.date)}).slice(0,5);
    var pmap={};props.forEach(function(p){pmap[p.id]=p});

    var c=UI.el('<div>'
      +'<div class="dash-greet anim-up"><div><div class="dash-hi">سلام، <span>'+esc(App.user.fullName||App.user.username)+'</span> 👋</div>'
      +'<div class="dash-date">'+Jal.WD[Jal.weekday(t.jy,t.jm,t.jd)]+' '+Jal.toFa(t.jd)+' '+Jal.monthName(t.jm)+' '+Jal.toFa(t.jy)+' — خوش آمدید به سامانه مدیریت املاک</div></div>'
      +'<div style="display:flex;gap:9px"><button class="btn btn-gold" data-go="propNew">＋ ثبت ملک جدید</button></div></div>'
      +'<div class="stats-grid">'
        +stat('i-gold','🏙️','props','کل املاک ثبت‌شده','در پایگاه داده')
        +stat('i-ok','✅','active','املاک فعال','آماده معامله')
        +stat('i-danger','🤝','closed','معاملات انجام‌شده','فروش و اجاره')
        +stat('i-teal','💎','totalSale',shortMoney(totalSale),'ارزش املاک فعال فروش')
        +stat('i-blue','🎯','openC','مشتریان در انتظار','درخواست باز')
        +stat('i-violet','📅','todayV','بازدیدهای امروز','قرارهای امروز')
      +'</div>'
      +'<div class="charts-row">'
        +'<div class="card chart-box anim-up" style="--d:.08s"><div class="card-title"><span class="dot"></span>املاک به تفکیک نوع</div><canvas class="chart" id="chType" style="height:230px"></canvas></div>'
        +'<div class="card chart-box anim-up" style="--d:.14s"><div class="card-title"><span class="dot"></span>وضعیت املاک</div><canvas class="chart" id="chStatus" style="height:230px"></canvas><div id="lgStatus" style="margin-top:10px"></div></div>'
        +'<div class="card chart-box anim-up" style="--d:.2s"><div class="card-title"><span class="dot"></span>ثبت املاک در ۶ ماه اخیر</div><canvas class="chart" id="chMonths" style="height:230px"></canvas></div>'
      +'</div>'
      +'<div class="dash-lists">'
        +'<div class="card anim-up" style="--d:.26s"><div class="card-title"><span class="dot"></span>📅 بازدیدهای پیش‌رو</div><div id="lsVisits">'
        +(upcoming.length?upcoming.map(function(v){
            var p=pmap[v.propId]||{};
            return '<div class="mini-item" data-open="'+p.id+'"><div class="mini-ico i-blue">📅</div><div><div class="mini-t">'+esc(v.person)+' — '+esc(p.code||v.propId)+'</div><div class="mini-s">'+num(v.date)+' ساعت '+Jal.toFa(v.time||'')+' · '+esc((p.title||'').slice(0,30))+'</div></div></div>';
          }).join(''):'<div class="empty-box" style="padding:24px"><div class="eb-t" style="font-size:12.5px">بازدیدی ثبت نشده</div></div>')
        +'</div></div>'
        +'<div class="card anim-up" style="--d:.32s"><div class="card-title"><span class="dot"></span>🆕 آخرین املاک ثبت‌شده</div><div id="lsProps">'
        +(recent.length?recent.map(function(p){
            var pt=CONST.PTYPES[p.ptype]||{ico:'🏠'};
            return '<div class="mini-item" data-open="'+p.id+'"><div class="mini-ico i-gold">'+pt.ico+'</div><div><div class="mini-t">'+esc(p.title)+'</div><div class="mini-s">'+esc(p.code)+' · '+esc(p.region||'')+' · '+shortMoney(+p.salePrice||+p.rahnFull||0)+'</div></div></div>';
          }).join(''):'<div class="empty-box" style="padding:24px"><div class="eb-t" style="font-size:12.5px">ملکی ثبت نشده</div></div>')
        +'</div></div>'
      +'</div></div>');
    App.setContent(c);
    function stat(icoClass,ico,key,label,sub){
      var v={props:props.length,active:active.length,closed:closed.length,totalSale:Math.round(totalSale/1e9),openC:openC,todayV:todayV.length}[key];
      return '<div class="stat-card anim-up" style="--d:.05s"><div class="stat-ico '+icoClass+'">'+ico+'</div>'
        +'<div class="stat-num" data-v="'+v+'">'+num(v)+'</div><div class="stat-label">'+esc(label)+'</div><div class="stat-sub">'+esc(sub)+'</div></div>';
    }
    countUp(c.querySelectorAll('.stat-num[data-v]'));
    UI.barChart(c.querySelector('#chType'),{labels:typeLabels,values:typeVals});
    UI.donut(c.querySelector('#chStatus'),{labels:stLabels,values:stVals});
    c.querySelector('#lgStatus').innerHTML=UI.legendHTML(stLabels,stVals,UI.PALETTE);
    UI.barChart(c.querySelector('#chMonths'),{labels:months,values:mcnt,colors:['#4f7cff','#2dd4bf','#e8c15a','#a78bfa','#34d399','#fbbf24']});
    c.querySelectorAll('[data-go]').forEach(function(b){b.onclick=function(){App.go(b.dataset.go)}});
    c.querySelectorAll('[data-open]').forEach(function(it){
      it.onclick=function(){var id=it.dataset.open;if(id)App.openProperty(id)};
    });
  });
};

/* ═════════════════════════ فهرست و جستجوی املاک ═════════════════════════ */
App.pages.properties=function(){
  App.setTitle('جستجو و فهرست املاک');
  var st={q:'',ptype:'',deal:'',status:'',region:'',seller:'',sizeMin:'',sizeMax:'',priceMin:'',priceMax:'',rooms:'',floor:'',yearMin:'',doc:'',feats:[],from:'',to:'',sort:'new'};
  var view='cards',page=1,PER=12;
  var c=UI.el('<div>'
    +pageHead('🏘️ جستجو و فهرست املاک','جستجوی پیشرفته در کل پایگاه داده املاک',
      '<button class="btn btn-gold" id="pAdd">＋ ثبت ملک جدید</button>'
      +'<button class="btn btn-ghost" id="pPrint">🖨 چاپ فهرست</button>'
      +'<button class="btn btn-ghost" id="pCsv">📊 خروجی اکسل</button>')
    +'<div class="filter-bar anim-up" style="--d:.06s">'
      +'<div class="filter-row">'
        +'<div class="field col-2"><label>🔍 جستجوی متنی</label><input class="input" id="fQ" placeholder="کد ملک، عنوان، فروشنده، تلفن، آدرس، توضیحات..."></div>'
        +'<div class="field"><label>نوع ملک</label><select class="select" id="fType"><option value="">همه انواع</option>'+Object.keys(CONST.PTYPES).map(function(k){return '<option value="'+k+'">'+CONST.PTYPES[k].ico+' '+CONST.PTYPES[k].t+'</option>'}).join('')+'</select></div>'
        +'<div class="field"><label>نوع معامله</label><select class="select" id="fDeal"><option value="">همه</option>'+Object.keys(CONST.DEALS).map(function(k){return '<option value="'+k+'">'+CONST.DEALS[k]+'</option>'}).join('')+'</select></div>'
        +'<div class="field"><label>وضعیت</label><select class="select" id="fStatus"><option value="">همه</option>'+Object.keys(CONST.STATUS).map(function(k){return '<option value="'+k+'">'+CONST.STATUS[k].t+'</option>'}).join('')+'</select></div>'
        +'<div class="field"><label>مرتب‌سازی</label><select class="select" id="fSort"><option value="new">جدیدترین</option><option value="old">قدیمی‌ترین</option><option value="priceDesc">گران‌ترین</option><option value="priceAsc">ارزان‌ترین</option><option value="sizeDesc">بزرگ‌ترین متراژ</option><option value="code">کد ملک</option></select></div>'
      +'</div>'
      +'<div class="adv-toggle" id="advToggle">⚙️ فیلترهای پیشرفته (متراژ، قیمت، خواب، طبقه، امکانات، تاریخ...) ▾</div>'
      +'<div class="filter-more" id="advBox"><div class="filter-row" style="grid-template-columns:repeat(6,1fr)">'
        +'<div class="field"><label>متراژ از (متر)</label><input class="input" id="fSizeMin" type="number" min="0"></div>'
        +'<div class="field"><label>متراژ تا (متر)</label><input class="input" id="fSizeMax" type="number" min="0"></div>'
        +'<div class="field"><label>قیمت از (ریال)</label><div class="money-wrap"><input class="input money-input" id="fPriceMin" placeholder="مثال: 5000000000"><div class="money-preview"></div></div></div>'
        +'<div class="field"><label>قیمت تا (ریال)</label><div class="money-wrap"><input class="input money-input" id="fPriceMax"><div class="money-preview"></div></div></div>'
        +'<div class="field"><label>حداقل خواب</label><select class="select" id="fRooms"><option value="">مهم نیست</option><option value="0">بدون خواب</option><option value="1">۱</option><option value="2">۲</option><option value="3">۳</option><option value="4">۴+</option></select></div>'
        +'<div class="field"><label>طبقه</label><select class="select" id="fFloor"><option value="">همه</option><option value="0">همکف</option><option value="1">اول</option><option value="2">دوم</option><option value="3">سوم</option><option value="4">چهارم و بالاتر</option></select></div>'
        +'<div class="field"><label>سال ساخت از</label><input class="input" id="fYearMin" type="number" placeholder="مثال: 1395"></div>'
        +'<div class="field"><label>نوع سند</label><select class="select" id="fDoc"><option value="">همه</option>'+CONST.DOCS.map(function(d){return '<option>'+d+'</option>'}).join('')+'</select></div>'
        +'<div class="field"><label>ثبت از تاریخ</label><input class="input jdate" id="fFrom" placeholder="از تاریخ"></div>'
        +'<div class="field"><label>ثبت تا تاریخ</label><input class="input jdate" id="fTo" placeholder="تا تاریخ"></div>'
        +'<div class="field col-2"><label>امکانات</label><div style="display:flex;flex-wrap:wrap;gap:2px">'
          +'<label class="check-line" style="padding:2px 4px"><input type="checkbox" data-feat="parking">🚗 پارکینگ</label>'
          +'<label class="check-line" style="padding:2px 4px"><input type="checkbox" data-feat="elevator">🛗 آسانسور</label>'
          +'<label class="check-line" style="padding:2px 4px"><input type="checkbox" data-feat="storage">📦 انباری</label>'
          +'<label class="check-line" style="padding:2px 4px"><input type="checkbox" data-feat="balcony">🌤 بالکن</label>'
          +'<label class="check-line" style="padding:2px 4px"><input type="checkbox" data-feat="pool">🏊 استخر</label>'
          +'<label class="check-line" style="padding:2px 4px"><input type="checkbox" data-feat="goodwill">🏷️ سرقفلی</label>'
        +'</div></div>'
      +'</div></div>'
    +'</div>'
    +'<div class="results-meta anim-up" style="--d:.1s"><div class="results-count" id="resCount"></div>'
      +'<div style="display:flex;gap:8px;align-items:center"><div class="view-seg"><button id="vCards" class="on">▦ کارت</button><button id="vTable">☰ جدول</button></div></div>'
    +'</div>'
    +'<div id="resBox"></div>'
    +'<div id="pager" style="display:flex;justify-content:center;gap:8px;margin-top:16px"></div>'
    +'</div>');
  App.setContent(c);

  var adv=c.querySelector('#advBox');
  c.querySelector('#advToggle').onclick=function(){adv.classList.toggle('open');this.textContent=this.textContent.indexOf('▾')>=0?'⚙️ بستن فیلترهای پیشرفته ▴':'⚙️ فیلترهای پیشرفته (متراژ، قیمت، خواب، طبقه، امکانات، تاریخ...) ▾'};

  var debounced=debounce(load,250);
  c.querySelector('#fQ').oninput=function(){st.q=this.value.trim();page=1;debounced()};
  c.querySelector('#fType').onchange=function(){st.ptype=this.value;page=1;load()};
  c.querySelector('#fDeal').onchange=function(){st.deal=this.value;page=1;load()};
  c.querySelector('#fStatus').onchange=function(){st.status=this.value;page=1;load()};
  c.querySelector('#fSort').onchange=function(){st.sort=this.value;load()};
  ['fSizeMin','fSizeMax','fPriceMin','fPriceMax','fYearMin'].forEach(function(id){
    c.querySelector('#'+id).addEventListener('input',function(){
      st[id.slice(1).toLowerCase()]=this.value;page=1;debounced();
    });
  });
  c.querySelector('#fRooms').onchange=function(){st.rooms=this.value;page=1;load()};
  c.querySelector('#fFloor').onchange=function(){st.floor=this.value;page=1;load()};
  c.querySelector('#fDoc').onchange=function(){st.doc=this.value;page=1;load()};
  c.querySelector('#fFrom').addEventListener('jdatechange',function(){st.from=this.value;page=1;load()});
  c.querySelector('#fTo').addEventListener('jdatechange',function(){st.to=this.value;page=1;load()});
  c.querySelectorAll('[data-feat]').forEach(function(cb){cb.onchange=function(){
    if(cb.checked){if(st.feats.indexOf(cb.dataset.feat)<0)st.feats.push(cb.dataset.feat)}
    else st.feats=st.feats.filter(function(f){return f!==cb.dataset.feat});
    page=1;load();
  }});
  c.querySelector('#pAdd').onclick=function(){propertyForm(null,function(){load()})};
  c.querySelector('#pPrint').onclick=function(){load().then(printList)};
  c.querySelector('#pCsv').onclick=function(){load().then(exportCsv)};
  c.querySelector('#vCards').onclick=function(){view='cards';this.classList.add('on');c.querySelector('#vTable').classList.remove('on');load()};
  c.querySelector('#vTable').onclick=function(){view='table';this.classList.add('on');c.querySelector('#vCards').classList.remove('on');load()};

  function load(){
    return DB.properties.all().then(function(all){
      var list=all.filter(function(p){
        if(st.ptype&&p.ptype!==st.ptype)return false;
        if(st.deal&&p.deal!==st.deal)return false;
        if(st.status&&p.status!==st.status)return false;
        if(st.q){
          var hay=(p.code+' '+p.title+' '+p.region+' '+p.address+' '+p.sellerName+' '+p.sellerPhone+' '+(p.desc||'')).toLowerCase();
          if(hay.indexOf(st.q.toLowerCase())<0)return false;
        }
        if(st.sizeMin&&(+p.size||0)<+st.sizeMin)return false;
        if(st.sizeMax&&(+p.size||0)>+st.sizeMax)return false;
        if(st.pricemin||st.pricemax){
          var pv=p.deal==='rent'?(+p.rahnFull||0):(+p.salePrice||0);
          if(st.pricemin&&pv<+st.pricemin)return false;
          if(st.pricemax&&pv>+st.pricemax)return false;
        }
        if(st.rooms!==''){
          if(st.rooms==='0'){if(+p.rooms>0)return false}
          else if(st.rooms==='4'){if(+p.rooms<4)return false}
          else if(+p.rooms!==+st.rooms)return false;
        }
        if(st.floor!==''){
          if(p.floor===undefined||p.floor===''){if(st.floor!=='0')return false}
          else{
            var fl=+p.floor;
            if(st.floor==='4'){if(fl<4)return false}
            else if(fl!==+st.floor)return false;
          }
        }
        if(st.yearmin&&Jal.toEn(p.buildYear||'')&&+Jal.toEn(p.buildYear)<+st.yearmin)return false;
        if(st.doc&&p.docType!==st.doc)return false;
        if(st.from){if(Jal.keyOf(p.createdAt)<Jal.keyOf(st.from))return false}
        if(st.to){if(Jal.keyOf(p.createdAt)>Jal.keyOf(st.to))return false}
        for(var i=0;i<st.feats.length;i++){
          var f=st.feats[i];
          if(f==='parking'&&(!p.parking||p.parking==='ندارد'))return false;
          if(f==='elevator'&&p.elevator!=='دارد')return false;
          if(f==='storage'&&p.storage!=='دارد')return false;
          if(f==='balcony'&&p.balcony!=='دارد')return false;
          if(f==='pool'&&p.pool!=='دارد')return false;
          if(f==='goodwill'&&p.goodwill!=='دارد')return false;
        }
        return true;
      });
      list.sort(function(a,b){
        if(st.sort==='new')return (b.createdAt||'').localeCompare(a.createdAt||'');
        if(st.sort==='old')return (a.createdAt||'').localeCompare(b.createdAt||'');
        if(st.sort==='priceDesc')return ((+b.salePrice||+b.rahnFull||0)-(+a.salePrice||+a.rahnFull||0));
        if(st.sort==='priceAsc')return ((+a.salePrice||+a.rahnFull||0)-(+b.salePrice||+b.rahnFull||0));
        if(st.sort==='sizeDesc')return (+b.size||0)-(+a.size||0);
        return (a.code||'').localeCompare(b.code||'');
      });
      window.__lastProps=list;
      render(list);
      return list;
    });
  }
  function render(list){
    c.querySelector('#resCount').innerHTML='<b>'+num(list.length)+'</b> ملک یافت شد';
    var box=c.querySelector('#resBox');
    var pages=Math.max(1,Math.ceil(list.length/PER));
    if(page>pages)page=1;
    var slice=list.slice((page-1)*PER,page*PER);
    box.innerHTML='';
    if(!list.length){
      box.appendChild(UI.el('<div class="card">'+emptyBox('🔍','ملکی مطابق جستجو یافت نشد','فیلترها را تغییر دهید یا جستجوی جدیدی انجام دهید')+'</div>'));
      c.querySelector('#pager').innerHTML='';
      return;
    }
    if(view==='cards'){
      var grid=UI.el('<div class="prop-grid anim-up">'+slice.map(function(p){return App.propCardHTML(p)}).join('')+'</div>');
      box.appendChild(grid);
    }else{
      var rows=slice.map(function(p,i){
        var stc=CONST.STATUS[p.status]||{t:p.status,c:'gray'};
        return '<tr data-pid="'+p.id+'" style="cursor:pointer">'
          +'<td class="row-num">'+num((page-1)*PER+i+1)+'</td>'
          +'<td><span class="chip gold" style="font-size:10px">'+esc(p.code)+'</span></td>'
          +'<td style="white-space:normal;max-width:250px"><b>'+esc(p.title)+'</b></td>'
          +'<td>'+esc(CONST.PTYPES[p.ptype].t)+'</td>'
          +'<td>'+esc(CONST.DEALS[p.deal]||'')+'</td>'
          +'<td>'+num(p.size)+'</td>'
          +'<td>'+esc(p.region||'—')+'</td>'
          +'<td style="white-space:normal;min-width:160px">'+(p.deal==='rent'?('رهن: '+num(p.rahnFull||0)+'<br>اجاره: '+num(p.rentMonthly||0)):num(p.salePrice||0))+' ریال</td>'
          +'<td>'+esc(p.sellerName||'—')+'</td>'
          +'<td>'+esc(p.createdAt||'')+'</td>'
          +'<td><span class="chip '+stc.c+'">'+stc.t+'</span></td></tr>';
      }).join('');
      box.appendChild(UI.el('<div class="card anim-up"><div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>کد</th><th>عنوان</th><th>نوع</th><th>معامله</th><th>متراژ</th><th>منطقه</th><th>قیمت (ریال)</th><th>فروشنده</th><th>تاریخ ثبت</th><th>وضعیت</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'));
    }
    box.querySelectorAll('[data-pid]').forEach(function(card){
      card.onclick=function(){App.openProperty(card.dataset.pid)};
    });
    /* صفحه‌بندی */
    var pg=c.querySelector('#pager');
    if(pages>1){
      pg.innerHTML='';
      var prev=UI.el('<button class="btn btn-sm btn-ghost"'+(page===1?' disabled':'')+'>قبلی ›</button>');
      prev.onclick=function(){if(page>1){page--;render(list);window.scrollTo({top:0,behavior:'smooth'})}};
      pg.appendChild(prev);
      var info=UI.el('<span class="chip gray" style="align-self:center">صفحه '+Jal.toFa(page)+' از '+Jal.toFa(pages)+'</span>');
      pg.appendChild(info);
      var next=UI.el('<button class="btn btn-sm btn-ghost"'+(page===pages?' disabled':'')+'< next ‹</button>');
      next.onclick=function(){if(page<pages){page++;render(list);window.scrollTo({top:0,behavior:'smooth'})}};
      pg.appendChild(next);
    }else pg.innerHTML='';
  }
  function printList(){
    var list=window.__lastProps||[];
    if(!list.length){UI.toast('داده‌ای برای چاپ نیست','warn');return}
    var rows=list.map(function(p,i){
      return '<tr><td>'+(i+1)+'</td><td>'+esc(p.code)+'</td><td>'+esc(p.title)+'</td><td>'+CONST.PTYPES[p.ptype].t+'</td><td>'+(CONST.DEALS[p.deal]||'')+'</td><td>'+num(p.size)+'</td><td>'+esc(p.region||'')+'</td><td>'+(p.deal==='rent'?('رهن '+(p.rahnFull||0)+' / اجاره '+(p.rentMonthly||0)):(p.salePrice||0))+'</td><td>'+esc(p.sellerName||'')+'</td><td>'+esc(p.createdAt||'')+'</td></tr>';
    }).join('');
    UI.printHTML('فهرست املاک ('+num(list.length)+' مورد)',
      '<table class="p-table"><tr><th>#</th><th>کد</th><th>عنوان</th><th>نوع</th><th>معامله</th><th>متراژ</th><th>منطقه</th><th>قیمت (ریال)</th><th>فروشنده</th><th>تاریخ</th></tr>'+rows+'</table>');
  }
  function exportCsv(){
    var list=window.__lastProps||[];
    if(!list.length){UI.toast('داده‌ای برای خروجی نیست','warn');return}
    UI.csv('properties.csv',['کد','عنوان','نوع ملک','نوع معامله','متراژ','منطقه','آدرس','قیمت کل','قیمت هر متر','رهن','اجاره','خواب','طبقه','طبقات','سال ساخت','سند','فروشنده','تلفن','وضعیت','تاریخ ثبت','ثبت‌کننده','توضیحات'],
      list.map(function(p){return [p.code,p.title,CONST.PTYPES[p.ptype].t,CONST.DEALS[p.deal]||'',p.size,p.region,p.address,p.salePrice||'',(p.size&&p.salePrice?Math.round(p.salePrice/p.size):''),p.rahnFull||'',p.rentMonthly||'',p.rooms||'',p.floor===0?'همکف':p.floor||'',p.totalFloors||'',p.buildYear||'',p.docType||'',p.sellerName||'',p.sellerPhone||'',CONST.STATUS[p.status]?CONST.STATUS[p.status].t:p.status,p.createdAt,p.createdBy,p.desc||'']}));
  }
  load();
};

/* ═════════════════════════ فرم ثبت / ویرایش ملک ═════════════════════════ */
function propertyForm(existing,after){
  var p=existing||{};
  var isNew=!existing;
  var c=UI.el('<div>'
    +pageHead(isNew?'➕ ثبت ملک جدید':'✏️ ویرایش ملک — '+esc(p.code||''),'اطلاعات کامل ملک را وارد کنید؛ فیلدهای ستاره‌دار الزامی هستند')
    +'<div class="card anim-up" style="--d:.06s;margin-bottom:16px">'
      +'<div class="card-title"><span class="dot"></span>نوع ملک را انتخاب کنید</div>'
      +'<div class="type-pick" id="tpPick">'+Object.keys(CONST.PTYPES).map(function(k){
        return '<div class="tp'+(p.ptype===k?' on':'')+'" data-t="'+k+'"><span class="tp-ico">'+CONST.PTYPES[k].ico+'</span><span>'+CONST.PTYPES[k].t+'</span></div>';
      }).join('')+'</div>'
    +'</div>'
    +'<div class="card anim-up" style="--d:.12s;margin-bottom:16px">'
      +'<div class="card-title"><span class="dot"></span>اطلاعات اصلی</div>'
      +'<div class="form-grid">'
        +'<div class="field col-2"><label>عنوان آگهی <span class="req">*</span></label><input class="input" id="gTitle" placeholder="مثال: آپارتمان ۸۵ متری دو خواب نوساز نارمک" value="'+esc(p.title||'')+'"></div>'
        +'<div class="field"><label>نوع معامله</label><select class="select" id="gDeal">'+Object.keys(CONST.DEALS).map(function(k){return '<option value="'+k+'"'+(p.deal===k?' selected':'')+'>'+CONST.DEALS[k]+'</option>'}).join('')+'</select></div>'
        +'<div class="field"><label>وضعیت</label><select class="select" id="gStatus">'+Object.keys(CONST.STATUS).map(function(k){return '<option value="'+k+'"'+((p.status||'active')===k?' selected':'')+'>'+CONST.STATUS[k].t+'</option>'}).join('')+'</select></div>'
        +'<div class="field"><label>منطقه / محله <span class="req">*</span></label><input class="input" id="gRegion" placeholder="مثال: نارمک، فلکه اول" value="'+esc(p.region||'')+'"></div>'
        +'<div class="field"><label>متراژ (متر مربع) <span class="req">*</span></label><input class="input" id="gSize" type="number" min="0" value="'+(p.size||'')+'"></div>'
        +'<div class="field col-2"><label>آدرس دقیق</label><input class="input" id="gAddr" placeholder="خیابان، کوچه، پلاک" value="'+esc(p.address||'')+'"></div>'
        +'<div class="field"><label>نام فروشنده / مالک <span class="req">*</span></label><input class="input" id="gSeller" value="'+esc(p.sellerName||'')+'"></div>'
        +'<div class="field"><label>تلفن فروشنده</label><input class="input" id="gSellerPhone" dir="ltr" style="text-align:left" placeholder="09..." value="'+esc(p.sellerPhone||'')+'"></div>'
        +'<div class="field"><label>نوع سند</label><select class="select" id="gDoc"><option value="">— انتخاب کنید —</option>'+CONST.DOCS.map(function(d){return '<option'+(p.docType===d?' selected':'')+'>'+d+'</option>'}).join('')+'</select></div>'
        +'<div class="field"><label>تاریخ ثبت (شمسی)</label><input class="input jdate" id="gDate" value="'+esc(p.createdAt||todayStr())+'"></div>'
      +'</div>'
    +'</div>'
    +'<div class="card anim-up" style="--d:.18s;margin-bottom:16px">'
      +'<div class="card-title"><span class="dot"></span>اطلاعات مالی (همه مبالغ به ریال)</div>'
      +'<div class="form-grid" id="finWrap">'
        +'<div class="field money-wrap" id="wSale"><label>قیمت کل فروش <span class="req">*</span></label><div class="money-wrap"><input class="input money-input" id="gSalePrice" value="'+(p.salePrice||'')+'"></div><div class="money-preview"></div></div>'
        +'<div class="field money-wrap" id="wRahn"><label>مبلغ رهن / ودیعه کامل</label><div class="money-wrap"><input class="input money-input" id="gRahn" value="'+(p.rahnFull||'')+'"></div><div class="money-preview"></div></div>'
        +'<div class="field money-wrap" id="wRent"><label>اجاره ماهانه</label><div class="money-wrap"><input class="input money-input" id="gRent" value="'+(p.rentMonthly||'')+'"></div><div class="money-preview"></div></div>'
        +'<div class="field"><label>قیمت هر متر (خودکار)</label><input class="input" id="gPpm" readonly style="color:var(--gold);opacity:.85"></div>'
        +'<div class="field" id="wGw"><label>سرقفلی</label><div class="seg" id="gGw"><button type="button" data-v="ندارد" class="'+(p.goodwill!=='دارد'?'on':'')+'">ندارد</button><button type="button" data-v="دارد" class="'+(p.goodwill==='دارد'?'on':'')+'">دارد</button></div></div>'
        +'<div class="field money-wrap" id="wGwPrice"><label>مبلغ سرقفلی</label><div class="money-wrap"><input class="input money-input" id="gGwPrice" value="'+(p.goodwillPrice||'')+'"></div><div class="money-preview"></div></div>'
      +'</div>'
    +'</div>'
    +'<div class="card anim-up" style="--d:.24s;margin-bottom:16px">'
      +'<div class="card-title"><span class="dot"></span>مشخصات اختصاصی ملک</div>'
      +'<div id="typeSecs"></div>'
    +'</div>'
    +'<div class="card anim-up" style="--d:.3s;margin-bottom:16px">'
      +'<div class="card-title"><span class="dot"></span>توضیحات</div>'
      +'<textarea class="input" id="gDesc" rows="3" placeholder="توضیحات تکمیلی آگهی...">'+esc(p.desc||'')+'</textarea>'
    +'</div>'
    +'<div style="display:flex;gap:10px;margin-bottom:30px" class="anim-up">'
      +'<button class="btn btn-gold" id="gSave" style="min-width:170px">💾 ذخیره ملک</button>'
      +'<button class="btn btn-ghost" id="gCancel">انصراف</button>'
    +'</div></div>');
  App.setContent(c);

  var curType=p.ptype||'apartment';
  var body=c;
  function sel(id){return body.querySelector(id)}
  /* نوع ملک */
  sel('#tpPick').querySelectorAll('.tp').forEach(function(tp){
    tp.onclick=function(){
      sel('#tpPick').querySelectorAll('.tp').forEach(function(z){z.classList.remove('on')});
      tp.classList.add('on');
      curType=tp.dataset.t;
      renderTypeSecs();
      toggleFin();
    };
  });
  /* مالی */
  function toggleFin(){
    var deal=sel('#gDeal').value;
    var rent=deal==='rent';
    sel('#wSale').style.display=rent?'none':'';
    sel('#wRahn').style.display=rent?'':'none';
    sel('#wRent').style.display=rent?'':'none';
    var showGw=(curType==='commercial'||curType==='office');
    sel('#wGw').style.display=showGw?'':'none';
    sel('#wGwPrice').style.display=(showGw&&sel('#gGw .on').dataset.v==='دارد')?'':'none';
  }
  sel('#gDeal').onchange=toggleFin;
  sel('#gGw').querySelectorAll('button').forEach(function(b){b.onclick=function(){
    sel('#gGw').querySelectorAll('button').forEach(function(z){z.classList.remove('on')});
    b.classList.add('on');toggleFin();
  }});
  function calcPpm(){
    var size=+sel('#gSize').value||0;
    var price=+Jal.toEn(sel('#gSalePrice').value)||0;
    sel('#gPpm').value=(size&&price)?num(Math.round(price/size))+' ریال':'—';
  }
  sel('#gSize').addEventListener('input',calcPpm);
  sel('#gSalePrice').addEventListener('input',calcPpm);
  calcPpm();

  /* ── بخش‌های اختصاصی ── */
  function seg(id,label,opts,val){
    return '<div class="field"><label>'+label+'</label><div class="seg-sub" id="'+id+'">'
      +opts.map(function(o){return '<button type="button" data-v="'+esc(o)+'" class="'+(val===o?'on':'')+'">'+esc(o)+'</button>'}).join('')
      +'</div></div>';
  }
  function fld(id,label,val,type,placeholder){
    return '<div class="field"><label>'+label+'</label><input class="input" id="'+id+'" type="'+(type||'text')+'" value="'+esc(val==null?'':val)+'" placeholder="'+(placeholder||'')+'"></div>';
  }
  function drop(id,label,opts,val,extra){
    return '<div class="field"><label>'+label+'</label><select class="select" id="'+id+'"><option value="">— انتخاب کنید —</option>'
      +opts.map(function(o){return '<option'+(val===o?' selected':'')+'>'+esc(o)+'</option>'}).join('')+'</select>'+(extra||'')+'</div>';
  }
  var YESNO=['دارد','ندارد'],BL=['بله','خیر'];
  function renderTypeSecs(){
    var s=sel('#typeSecs');
    var v=function(k){return p[k]};
    var html='';
    if(curType==='apartment'||curType==='house'){
      html+='<div class="form-grid">';
      html+=fld('sRooms','تعداد خواب',v('rooms'),'number');
      if(curType==='apartment'){
        html+=fld('sFloor','طبقه',v('floor'),'number','۰ = همکف');
        html+=fld('sUnits','تعداد واحد در طبقه',v('unitsPerFloor'),'number');
      }
      html+=fld('sFloors','تعداد طبقات',v('totalFloors'),'number');
      html+=fld('sBuildYear','سال ساخت (شمسی)',v('buildYear'),'number','مثال: 1400');
      html+=drop('sDirection','جهت‌گیری',CONST.DIRECTION,v('direction'));
      html+=drop('sOccupancy','وضعیت اشتغال',CONST.OCCUPANCY,v('occupancy'));
      html+=drop('sFacade','نما',CONST.FACADE,v('facade'));
      html+=drop('sFlooring','کف',CONST.FLOORING,v('flooring'));
      html+=drop('sKitchen','آشپزخانه',CONST.KITCHEN,v('kitchen'));
      html+=drop('sHeating','گرمایش',CONST.HEATING,v('heating'));
      html+=drop('sCooling','سرمایش',CONST.COOLING,v('cooling'));
      html+=drop('sBath','سرویس بهداشتی',['ایرانی','فرنگی','ایرانی و فرنگی'],v('bath'));
      html+=seg('sParking','🚗 پارکینگ',['ندارد','تک','دوگانه','سه و بیشتر'],v('parking')||'ندارد');
      html+=seg('sElevator','🛗 آسانسور',YESNO,v('elevator')||(curType==='apartment'?'ندارد':''));
      html+=seg('sStorage','📦 انباری',YESNO,v('storage'));
      html+=seg('sBalcony','🌤 بالکن',YESNO,v('balcony'));
      html+=seg('sRenovated','🎨 بازسازی‌شده',BL,v('renovated'));
      if(curType==='house'){
        html+=seg('sWater','🚰 آب',YESNO,v('water'));
        html+=seg('sPower','🔌 برق',YESNO,v('power'));
        html+=seg('sGas','🔥 گاز',YESNO,v('gas'));
        html+=seg('sPhone','☎️ تلفن',YESNO,v('phone'));
      }
      html+='</div>';
    }
    else if(curType==='land'){
      html+='<div class="form-grid">';
      html+=drop('sLandKind','نوع ملک زمینی',CONST.LANDKIND,v('landKind'));
      html+=drop('sLandUse','کاربری',CONST.LANDUSE,v('landUse'));
      html+=fld('sWidth','عرض بر (متر)',v('width'),'number');
      html+=fld('sLength','طول (متر)',v('length'),'number');
      html+=fld('sDensity','تراکم ساختمانی (٪)',v('density'),'number','مثال: 120');
      html+=fld('sMaxFloors','تعداد طبقات مجاز',v('maxFloors'),'number');
      html+=seg('sWater','🚰 آب',YESNO,v('water'));
      html+=seg('sPower','🔌 برق',YESNO,v('power'));
      html+=seg('sGas','🔥 گاز',YESNO,v('gas'));
      html+=seg('sPhone','☎️ تلفن',YESNO,v('phone'));
      html+=seg('s3Phase','⚡ برق سه‌فاز',YESNO,v('has3Phase'));
      html+=seg('sWalled','🧱 دیوارکشی‌شده',BL,v('walled'));
      html+=seg('sPermit','📄 جواز ساخت',BL,v('permit'));
      html+='</div>';
    }
    else if(curType==='commercial'||curType==='office'){
      html+='<div class="form-grid">';
      html+=drop('sCKind','نوع کاربری',CONST.COMMKIND,v('cKind'));
      html+=fld('sCFloor','طبقه',v('cFloor'),'text','مثال: همکف یا 2');
      html+=fld('sSaran','عرض سرانای (متر)',v('saran'),'number');
      html+=fld('sHeight','ارتفاع سقف (متر)',v('height'),'number','مثال: 3.5');
      html+=fld('sCRooms','تعداد اتاق / فضا',v('rooms'),'number');
      html+=seg('sSignBoard','🪧 تابلوخور',BL,v('signBoard'));
      html+=seg('sBackYard','🚪 پشت‌سرا',BL,v('backYard'));
      html+=drop('sBath','سرویس بهداشتی',['دارد','ندارد','مشترک'],v('bath'));
      html+=seg('sParking','🚗 پارکینگ',['ندارد','تک','دوگانه','سه و بیشتر'],v('parking')||'ندارد');
      html+=seg('sElevator','🛗 آسانسور',YESNO,v('elevator'));
      html+='</div>';
    }
    else if(curType==='garden'){
      html+='<div class="form-grid">';
      html+=drop('sGKind','نوع ملک',CONST.GARDENKIND,v('gKind'));
      html+=fld('sBSize','متراژ زیربنا (متر)',v('bSize'),'number');
      html+=fld('sGRooms','تعداد خواب',v('rooms'),'number');
      html+=fld('sGFloors','تعداد طبقات',v('floors'),'number');
      html+=fld('sGBuildYear','سال ساخت (شمسی)',v('buildYear'),'number');
      html+=drop('sFacade','نما',CONST.FACADE,v('facade'));
      html+=drop('sFlooring','کف',CONST.FLOORING,v('flooring'));
      html+=seg('sPool','🏊 استخر',YESNO,v('pool'));
      html+='<div class="field" id="sPoolCoveredWrap"><label>نوع استخر</label><select class="select" id="sPoolCovered"><option value="">—</option><option'+(v('poolCovered')==='سرپوشیده'?' selected':'')+'>سرپوشیده</option><option'+(v('poolCovered')==='روباز'?' selected':'')+'>روباز</option></select></div>';
      html+=seg('sSauna','♨️ سونا',YESNO,v('sauna'));
      html+=seg('sJacuzzi','🛁 جکوزی',YESNO,v('jacuzzi'));
      html+=seg('sGazebo','⛺ آلاچیق',YESNO,v('gazebo'));
      html+=seg('sBbq','🍖 باربیکیو',YESNO,v('bbq'));
      html+=seg('sTrees','🌳 درخت مثمر',YESNO,v('trees'));
      html+=seg('sWell','💧 چاه آب',YESNO,v('well'));
      html+=seg('sWalled','🧱 دیوارکشی',BL,v('walled'));
      html+=seg('sCaretaker','🧑‍🌾 سرایداری',YESNO,v('caretaker'));
      html+=seg('sWater','🚰 آب',YESNO,v('water'));
      html+=seg('sPower','🔌 برق',YESNO,v('power'));
      html+=seg('sGas','🔥 گاز',YESNO,v('gas'));
      html+='</div>';
    }
    s.innerHTML=html||'<div style="color:var(--muted);font-size:12.5px">نوع ملک را انتخاب کنید</div>';
    /* seg-sub events */
    s.querySelectorAll('.seg-sub').forEach(function(sg){
      sg.querySelectorAll('button').forEach(function(b){b.onclick=function(){
        sg.querySelectorAll('button').forEach(function(z){z.classList.remove('on')});b.classList.add('on');
      }});
    });
    var pw=s.querySelector('#sPoolCoveredWrap');
    var poolSeg=s.querySelector('#sPool');
    if(pw&&poolSeg){
      pw.style.display=poolSeg.querySelector('.on')&&poolSeg.querySelector('.on').dataset.v==='دارد'?'':'none';
      poolSeg.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){
        pw.style.display=b.dataset.v==='دارد'?'':'none';
      })});
    }
  }
  renderTypeSecs();
  toggleFin();
  function getSegVal(id){var sg=body.querySelector(id);return sg?(sg.querySelector('.on')?sg.querySelector('.on').dataset.v:''):''}
  function getVal(id){var f=body.querySelector(id);return f?f.value.trim():''}

  sel('#gCancel').onclick=function(){App.go('properties')};
  sel('#gSave').onclick=function(){
    var errs=[];
    var title=sel('#gTitle').value.trim(),region=sel('#gRegion').value.trim();
    var size=+sel('#gSize').value||0;
    var seller=sel('#gSeller').value.trim();
    var deal=sel('#gDeal').value;
    var salePrice=+Jal.toEn(sel('#gSalePrice').value)||0;
    var rahn=+Jal.toEn(sel('#gRahn').value)||0;
    var rent=+Jal.toEn(sel('#gRent').value)||0;
    if(!title)errs.push('عنوان آگهی');
    if(!region)errs.push('منطقه / محله');
    if(!size)errs.push('متراژ');
    if(!seller)errs.push('نام فروشنده');
    if(deal==='rent'){if(!rahn&&!rent)errs.push('مبلغ رهن یا اجاره')}
    else if(!salePrice)errs.push('قیمت کل فروش');
    if(errs.length){UI.toast('تکمیل این فیلدها الزامی است: '+errs.join('، '),'err');return}
    function save(code){
      var o=Object.assign({},p,{
        ptype:curType,deal:deal,status:sel('#gStatus').value,
        title:title,region:region,size:size,address:sel('#gAddr').value.trim(),
        sellerName:seller,sellerPhone:sel('#gSellerPhone').value.trim(),
        docType:sel('#gDoc').value,desc:sel('#gDesc').value.trim(),
        salePrice:deal==='rent'?'':salePrice,
        rahnFull:deal==='rent'?rahn:(rahn||''),
        rentMonthly:deal==='rent'?rent:(rent||''),
        pricePerMeter:(size&&salePrice)?Math.round(salePrice/size):'',
        createdAt:sel('#gDate').value||todayStr()
      });
      if(!isNew){
        o.updatedAt=todayStr();
        o.updatedBy=App.user.fullName;
      }else{
        o.createdBy=App.user.fullName;
        o.code=code;
      }
      /* خواندن فیلدهای اختصاصی هر نوع ملک */
      var g=function(id){var f=body.querySelector(id);return f?f.value.trim():''};
      if(curType==='apartment'||curType==='house'){
        o.rooms=+g('#sRooms')||0;
        if(curType==='apartment'){o.floor=+g('#sFloor')||0;o.unitsPerFloor=+g('#sUnits')||0}
        o.totalFloors=+g('#sFloors')||0;
        o.buildYear=g('#sBuildYear');
        o.direction=g('#sDirection');o.occupancy=g('#sOccupancy');o.facade=g('#sFacade');
        o.flooring=g('#sFlooring');o.kitchen=g('#sKitchen');o.heating=g('#sHeating');
        o.cooling=g('#sCooling');o.bath=g('#sBath');
        o.parking=getSegVal('#sParking')||'ندارد';o.elevator=getSegVal('#sElevator');
        o.storage=getSegVal('#sStorage');o.balcony=getSegVal('#sBalcony');o.renovated=getSegVal('#sRenovated');
        if(curType==='house'){o.water=getSegVal('#sWater');o.power=getSegVal('#sPower');o.gas=getSegVal('#sGas');o.phone=getSegVal('#sPhone')}
      }
      else if(curType==='land'){
        o.landKind=g('#sLandKind');o.landUse=g('#sLandUse');
        o.width=+g('#sWidth')||'';o.length=+g('#sLength')||'';o.density=g('#sDensity');o.maxFloors=g('#sMaxFloors');
        o.water=getSegVal('#sWater');o.power=getSegVal('#sPower');o.gas=getSegVal('#sGas');
        o.phone=getSegVal('#sPhone');o.has3Phase=getSegVal('#s3Phase');
        o.walled=getSegVal('#sWalled');o.permit=getSegVal('#sPermit');
      }
      else if(curType==='commercial'||curType==='office'){
        o.cKind=g('#sCKind');o.cFloor=g('#sCFloor');
        o.saran=+g('#sSaran')||'';o.height=g('#sHeight');o.rooms=+g('#sCRooms')||'';
        o.signBoard=getSegVal('#sSignBoard');o.backYard=getSegVal('#sBackYard');
        o.bath=g('#sBath');o.parking=getSegVal('#sParking')||'ندارد';o.elevator=getSegVal('#sElevator');
        o.goodwill=getSegVal('#gGw');o.goodwillPrice=+Jal.toEn(g('#gGwPrice'))||'';
      }
      else if(curType==='garden'){
        o.gKind=g('#sGKind');
        o.bSize=+g('#sBSize')||'';o.rooms=+g('#sGRooms')||'';o.floors=+g('#sGFloors')||'';o.buildYear=g('#sGBuildYear');
        o.facade=g('#sFacade');o.flooring=g('#sFlooring');
        o.pool=getSegVal('#sPool');o.poolCovered=g('#sPoolCovered');
        o.sauna=getSegVal('#sSauna');o.jacuzzi=getSegVal('#sJacuzzi');o.gazebo=getSegVal('#sGazebo');
        o.bbq=getSegVal('#sBbq');o.trees=getSegVal('#sTrees');o.well=getSegVal('#sWell');
        o.walled=getSegVal('#sWalled');o.caretaker=getSegVal('#sCaretaker');
        o.water=getSegVal('#sWater');o.power=getSegVal('#sPower');o.gas=getSegVal('#sGas');
      }
      DB.properties.save(o).then(function(){
        DB.log(isNew?'ثبت ملک جدید':'ویرایش ملک',o.code+' — '+o.title);
        UI.toast(isNew?'ملک با کد '+o.code+' ثبت شد':'تغییرات ذخیره شد','ok');
        after?after():App.go('properties');
      });
    }
    if(isNew)DB.nextCode(curType).then(save);
    else save(p.code);
  };
}
App.pages.propNew=function(){propertyForm(null)};

/* ═════════════════════════ جستجوی سراسری ═════════════════════════ */
(function(){
  var input=document.getElementById('globalSearchInput'),box=document.getElementById('gsResults');
  input.addEventListener('input',debounce(function(){
    var q=input.value.trim().toLowerCase();
    if(q.length<2){box.classList.remove('open');return}
    Promise.all([DB.properties.all(),DB.customers.all()]).then(function(rs){
      var props=rs[0].filter(function(p){
        var hay=(p.code+' '+p.title+' '+p.region+' '+p.address+' '+p.sellerName+' '+p.sellerPhone+' '+(p.desc||'')+' '+(p.landUse||'')+' '+(p.cKind||'')).toLowerCase();
        return hay.indexOf(q)>=0;
      }).slice(0,8);
      var custs=rs[1].filter(function(x){
        return (x.name+' '+x.phone+' '+(x.region||'')).toLowerCase().indexOf(q)>=0;
      }).slice(0,4);
      var html='';
      if(props.length)html+='<div style="padding:9px 14px;font-size:10.5px;color:var(--dim);border-bottom:1px solid rgba(255,255,255,.05)">🏠 املاک ('+num(props.length)+')</div>'
        +props.map(function(p){
          var pt=CONST.PTYPES[p.ptype]||{ico:'🏠'};
          var stc=CONST.STATUS[p.status]||{t:p.status,c:'gray'};
          return '<div class="gs-item" data-pid="'+p.id+'"><div class="gsi-ico i-gold">'+pt.ico+'</div>'
            +'<div style="flex:1;min-width:0"><div class="gsi-t">'+esc(p.title)+'</div>'
            +'<div class="gsi-s">'+esc(p.code)+' · '+esc(p.region||'')+' · '+esc(p.sellerName||'')+'</div></div>'
            +'<span class="chip '+stc.c+'">'+stc.t+'</span></div>';
        }).join('');
      if(custs.length)html+='<div style="padding:9px 14px;font-size:10.5px;color:var(--dim);border-bottom:1px solid rgba(255,255,255,.05)">🎯 مشتریان ('+num(custs.length)+')</div>'
        +custs.map(function(x){
          return '<div class="gs-item" data-cust="'+x.id+'"><div class="gsi-ico i-blue">🎯</div>'
            +'<div><div class="gsi-t">'+esc(x.name)+'</div><div class="gsi-s">'+esc(x.phone)+' · '+(x.reqType==='buy'?'خرید':'اجاره')+'</div></div></div>';
        }).join('');
      if(!html)html='<div class="gs-empty">نتیجه‌ای برای «'+UI.esc(input.value)+'» یافت نشد</div>';
      box.innerHTML=html;
      box.classList.add('open');
      box.querySelectorAll('[data-pid]').forEach(function(it){it.addEventListener('mousedown',function(e){e.preventDefault();App.openProperty(it.dataset.pid);box.classList.remove('open')})});
      box.querySelectorAll('[data-cust]').forEach(function(it){it.addEventListener('mousedown',function(e){e.preventDefault();box.classList.remove('open');App.go('customers')})});
    });
  },200));
  document.addEventListener('click',function(e){if(!e.target.closest('#globalSearch'))box.classList.remove('open')});
})();

/* ═════════════════════════ ورود و حساب کاربری ═════════════════════════ */
function changePass(){
  var body=UI.el('<div><div class="field"><label>گذرواژه فعلی</label><input class="input" id="cp0" type="password"></div>'
    +'<div class="field" style="margin-top:10px"><label>گذرواژه جدید (حداقل ۴ کاراکتر)</label><input class="input" id="cp1" type="password"></div>'
    +'<div class="field" style="margin-top:10px"><label>تکرار گذرواژه جدید</label><input class="input" id="cp2" type="password"></div></div>');
  var m=UI.modal({title:'🔑 تغییر گذرواژه',icon:'',size:'sm',body:body,buttons:[
    {label:'انصراف',cls:'btn-ghost',onClick:function(){m.close()}},
    {label:'ذخیره',cls:'btn-gold',onClick:function(){
      var p0=body.querySelector('#cp0').value,p1=body.querySelector('#cp1').value,p2=body.querySelector('#cp2').value;
      if(DB.hash(p0)!==App.user.pass){UI.toast('گذرواژه فعلی اشتباه است','err');return}
      if(!p1||p1.length<4){UI.toast('گذرواژه جدید حداقل ۴ کاراکتر باشد','err');return}
      if(p1!==p2){UI.toast('تکرار گذرواژه مطابقت ندارد','err');return}
      App.user.pass=DB.hash(p1);
      DB.users.save(App.user).then(function(){DB.log('تغییر گذرواژه (خود)','');UI.toast('گذرواژه با موفقیت تغییر کرد','ok');m.close()});
    }}
  ]});
}

function enterApp(){
  document.getElementById('loginScreen').style.display='none';
  var shell=document.getElementById('appShell');
  shell.style.display='flex';
  requestAnimationFrame(function(){shell.classList.add('ready')});
  App.buildNav();
  App.refreshUserChip();
  var t=Jal.today();
  document.getElementById('todayChip').textContent=Jal.WD[Jal.weekday(t.jy,t.jm,t.jd)]+' '+Jal.toFa(t.jd)+' '+Jal.monthName(t.jm)+' '+Jal.toFa(t.jy);
  DB.getSetting('agencyName').then(function(n){document.getElementById('sideAgencyName').textContent=n||'املاک‌پلاس'});
  DB.log('ورود به سیستم','');
  App.go('dashboard');
}

function logout(){
  UI.confirm('خروج از حساب','آیا می‌خواهید از حساب کاربری خارج شوید؟').then(function(y){
    if(!y)return;
    DB.log('خروج از سیستم','');
    App.user=null;
    document.getElementById('appShell').style.display='none';
    document.getElementById('appShell').classList.remove('ready');
    var ls=document.getElementById('loginScreen');
    ls.style.display='flex';
    ls.querySelector('#loginPass').value='';
  });
}

/* ─── راه‌اندازی ─── */
App.pages={dashboard:App.pages.dashboard,properties:App.pages.properties,propNew:App.pages.propNew};
Object.assign(App.pages,window.Pages);
App.openProperty=App.openProperty;

document.addEventListener('DOMContentLoaded',function(){
  UI.bindMoney(document);
  Jal.scan(document);
  document.getElementById('userBtn').onclick=function(e){
    e.stopPropagation();
    document.getElementById('userDropdown').classList.toggle('open');
  };
  document.addEventListener('click',function(){document.getElementById('userDropdown').classList.remove('open')});
  document.getElementById('userDropdown').addEventListener('click',function(e){
    var act=e.target.dataset.act;
    if(act==='changepass')changePass();
    if(act==='logout')logout();
  });
  document.getElementById('loginForm').addEventListener('submit',function(e){
    e.preventDefault();
    var u=document.getElementById('loginUser').value.trim().toLowerCase();
    var p=document.getElementById('loginPass').value;
    var err=document.getElementById('loginErr');
    DB.users.all().then(function(users){
      var found=users.find(function(x){return x.username.toLowerCase()===u});
      if(!found||found.pass!==DB.hash(p)){
        err.textContent='نام کاربری یا گذرواژه اشتباه است!';
        err.classList.remove('show');void err.offsetWidth;err.classList.add('show');
        return;
      }
      if(!found.active){err.textContent='حساب کاربری شما غیرفعال شده است. با مدیر تماس بگیرید.';return}
      App.user=found;
      document.getElementById('loginErr').textContent='';
      enterApp();
    });
  });
  /* بارگذاری پایگاه داده */
  DB.seedIfEmpty().then(function(){});
});
})();
