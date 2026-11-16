/* ═══════════════ تقویم شمسی (جلالی) + دیت‌پیکر + قالب‌بندی اعداد ═══════════════ */
(function(){
'use strict';

function div(a,b){return ~~(a/b)}
function mod(a,b){return a-~~(a/b)*b}
var BREAKS=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178];

function jalCal(jy){
  var bl=BREAKS.length, gy=jy+621, leapJ=-14, jp=BREAKS[0], jm, jump=0, n, i;
  if(jy<jp||jy>=BREAKS[bl-1]) throw new Error('سال شمسی نامعتبر: '+jy);
  for(i=1;i<bl;i++){jm=BREAKS[i];jump=jm-jp;if(jy<jm)break;leapJ=leapJ+div(jump,33)*8+div(mod(jump,33),4);jp=jm}
  n=jy-jp;
  leapJ=leapJ+div(n,33)*8+div(mod(n,33)+3,4);
  if(mod(jump,33)===4&&jump-n===4)leapJ+=1;
  var leapG=div(gy,4)-div((div(gy,100)+1)*3,4)-150;
  var march=20+leapJ-leapG;
  if(jump-n<6)n=n-jump+div(jump+4,33)*33;
  var leap=mod(mod(n+1,33)-1,4);
  if(leap===-1)leap=4;
  return{leap:leap,gy:gy,march:march};
}
function g2d(gy,gm,gd){
  var d=div((gy+div(gm-8,6)+100100)*1461,4)+div(153*mod(gm+9,12)+2,5)+gd-34840408;
  d=d-div(div(gy+100100+div(gm-8,6),100)*3,4)+752;
  return d;
}
function d2g(jdn){
  var j,i,gd,gm,gy;
  j=4*jdn+139361631;
  j=j+div(div(4*jdn+183187720,146097)*3,4)*4-3908;
  i=div(mod(j,1461),4)*5+308;
  gd=div(mod(i,153),5)+1;
  gm=mod(div(i,153),12)+1;
  gy=div(j,1461)-100100+div(8-gm,6);
  return{gy:gy,gm:gm,gd:gd};
}
function j2d(jy,jm,jd){var r=jalCal(jy);return g2d(r.gy,3,r.march)+(jm-1)*31-div(jm,7)*(jm-7)+jd-1}
function d2j(jdn){
  var gy=d2g(jdn).gy, jy=gy-621, r=jalCal(jy), jdn1f=g2d(gy,3,r.march), jd, jm, k;
  k=jdn-jdn1f;
  if(k>=0){ if(k<=185){jm=1+div(k,31);jd=mod(k,31)+1;return{jy:jy,jm:jm,jd:jd}} else k-=186; }
  else { jy-=1; k+=179; if(r.leap===1)k+=1; }
  jm=7+div(k,30); jd=mod(k,30)+1;
  return{jy:jy,jm:jm,jd:jd};
}

var MONTHS=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
var WD=['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];
var WD_SHORT=['ش','ی','د','س','چ','پ','ج'];

var FA_D='۰۱۲۳۴۵۶۷۸۹', AR_D='٠١٢٣٤٥٦٧٨٩';
function toFa(x){return String(x==null?'':x).replace(/[0-9]/g,function(d){return FA_D[+d]})}
function toEn(s){return String(s==null?'':s).replace(/[۰-۹]/g,function(d){return FA_D.indexOf(d)}).replace(/[٠-٩]/g,function(d){return AR_D.indexOf(d)})}

function fmtNum(n){ // عدد با جداکننده و ارقام فارسی
  if(n===''||n==null||isNaN(n))return '—';
  try{ return new Intl.NumberFormat('fa-IR').format(n) }catch(e){
    return toFa(String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'٬'));
  }
}
function fmtMoney(n){ return (n===''||n==null||isNaN(n))?'—':fmtNum(n)+' ریال' }
function fmtMoneyLatin(n){ return (n===''||n==null||isNaN(n))?'—':toEn(fmtNum(n))+' ریال' }

var Jal={
  MONTHS:MONTHS, WD:WD, WD_SHORT:WD_SHORT,
  toFa:toFa, toEn:toEn, fmtNum:fmtNum, fmtMoney:fmtMoney, fmtMoneyLatin:fmtMoneyLatin,
  isLeapJ:function(jy){ return jalCal(jy).leap===0 },
  monthLen:function(jy,jm){ if(jm<=6)return 31; if(jm<=11)return 30; return jalCal(jy).leap===0?30:29 },
  toJalali:function(gy,gm,gd){ return d2j(g2d(gy,gm,gd)) },
  toGregorian:function(jy,jm,jd){ return d2g(j2d(jy,jm,jd)) },
  today:function(){ var d=new Date(); return d2j(g2d(d.getFullYear(),d.getMonth()+1,d.getDate())) },
  weekday:function(jy,jm,jd){ // 0=شنبه ... 6=جمعه
    var g=d2g(j2d(jy,jm,jd));
    return (new Date(g.gy,g.gm-1,g.gd).getDay()+1)%7;
  },
  pad2:function(n){ return (n<10?'0':'')+n },
  fmt:function(jy,jm,jd,mode){ // mode: num | slash | long
    if(mode==='long') return WD[weekday(jy,jm,jd)]+' '+toFa(jd)+' '+MONTHS[jm-1]+' '+toFa(jy);
    if(mode==='slashName') return toFa(jd)+' '+MONTHS[jm-1]+' '+toFa(jy);
    return toFa(jy)+'/'+toFa(Jal.pad2(jm))+'/'+toFa(Jal.pad2(jd));
  },
  parse:function(str){ // "1404/05/12" → {jy,jm,jd} یا null
    if(!str)return null;
    var m=toEn(str).match(/(\d{3,4})\D+(\d{1,2})\D+(\d{1,2})/);
    if(!m)return null;
    var jy=+m[1],jm=+m[2],jd=+m[3];
    if(jy<1000||jy>1500||jm<1||jm>12||jd<1||jd>31)return null;
    if(jd>Jal.monthLen(jy,jm))return null;
    return{jy:jy,jm:jm,jd:jd};
  },
  key:function(j){ return j? (j.jy*10000+j.jm*100+j.jd) : 0 }, // برای مرتب‌سازی
  keyOf:function(str){ return Jal.key(Jal.parse(str)) },
  monthName:function(m){ return MONTHS[m-1] },
  diffDays:function(a,b){ return j2d(b.jy,b.jm,b.jd)-j2d(a.jy,a.jm,a.jd) }, // b - a
  addDays:function(j,n){ var jdn=j2d(j.jy,j.jm,j.jd)+n; return d2j(jdn) }
};
function weekday(jy,jm,jd){return Jal.weekday(jy,jm,jd)}

/* ───────── دیت‌پیکر شمسی ───────── */
var DP={ el:null, target:null, view:null };
function dpClose(){ if(DP.el){ DP.el.remove(); DP.el=null; DP.target=null } }
document.addEventListener('click',function(e){
  if(DP.el && !e.target.closest('.dp-anchor') && !e.target.closest('.jdate')) dpClose();
});
function dpOpen(input){
  dpClose();
  var cur=Jal.parse(input.value);
  var t=Jal.today();
  DP.view=cur?{jy:cur.jy,jm:cur.jm}:{jy:t.jy,jm:t.jm};
  DP.sel=cur; DP.target=input;
  var anchor=document.createElement('div');
  anchor.className='dp-anchor';
  var panel=document.createElement('div');
  panel.className='dp-panel';
  anchor.appendChild(panel);
  document.getElementById('dpRoot').appendChild(anchor);
  DP.el=anchor;
  var r=input.getBoundingClientRect();
  var ph=360;
  var top=r.bottom+window.scrollY+7;
  if(r.bottom+ph>window.innerHeight) top=r.top+window.scrollY-ph-7;
  var left=r.right+window.scrollX-288;
  if(left<8) left=8;
  anchor.style.top=top+'px'; anchor.style.left=left+'px';
  dpRender();
}
function dpRender(){
  var v=DP.view, y=v.jy, m=v.jm;
  var t=Jal.today();
  var panel=DP.el.querySelector('.dp-panel');
  var len=Jal.monthLen(y,m);
  var firstWD=Jal.weekday(y,m,1);
  var html='';
  html+='<div class="dp-head">'
    +'<button type="button" class="dp-nav" data-nav="prev">‹</button>'
    +'<div class="dp-mon"><select id="dpMon">'+MONTHS.map(function(mn,i){return '<option value="'+(i+1)+'"'+((i+1)===m?' selected':'')+'>'+mn+'</option>'}).join('')+'</select>'
    +'<select id="dpYear">'+dpYearOpts(y)+'</select></div>'
    +'<button type="button" class="dp-nav" data-nav="next">›</button></div>';
  html+='<div class="dp-grid">';
  html+=WD_SHORT.map(function(w){return '<div class="dp-wd">'+w+'</div>'}).join('');
  for(var i=0;i<firstWD;i++) html+='<div class="dp-day off">·</div>';
  for(var d=1;d<=len;d++){
    var cls='dp-day';
    if(t.jy===y&&t.jm===m&&t.jd===d)cls+=' today';
    if(DP.sel&&DP.sel.jy===y&&DP.sel.jm===m&&DP.sel.jd===d)cls+=' sel';
    html+='<div class="'+cls+'" data-d="'+d+'">'+toFa(d)+'</div>';
  }
  html+='</div>';
  html+='<div class="dp-foot">'
    +'<button type="button" class="btn btn-ghost btn-xs" data-act="clear">پاک کردن</button>'
    +'<button type="button" class="btn btn-gold btn-xs" data-act="today">امروز</button></div>';
  panel.innerHTML=html;
}
function dpYearOpts(y){
  var t=Jal.today(), out='';
  for(var i=t.jy+8;i>=t.jy-75;i--) out+='<option value="'+i+'"'+(i===y?' selected':'')+'>'+toFa(i)+'</option>';
  return out;
}
document.addEventListener('click',function(e){
  if(!DP.el)return;
  var t=e.target;
  if(t.closest('[data-nav="prev"]')){ DP.view.jm--; if(DP.view.jm<1){DP.view.jm=12;DP.view.jy--} dpRender(); }
  else if(t.closest('[data-nav="next"]')){ DP.view.jm++; if(DP.view.jm>12){DP.view.jm=1;DP.view.jy++} dpRender(); }
  else if(t.classList.contains('dp-day')&&t.dataset.d){ 
    DP.sel={jy:DP.view.jy,jm:DP.view.jm,jd:+t.dataset.d};
    DP.target.value=Jal.fmt(DP.sel.jy,DP.sel.jm,DP.sel.jd);
    DP.target.dispatchEvent(new Event('jdatechange',{bubbles:true}));
    dpClose();
  }
  else if(t.closest('[data-act="today"]')){
    var td=Jal.today();
    DP.sel=td; DP.target.value=Jal.fmt(td.jy,td.jm,td.jd);
    DP.target.dispatchEvent(new Event('jdatechange',{bubbles:true}));
    dpClose();
  }
  else if(t.closest('[data-act="clear"]')){
    DP.target.value=''; DP.sel=null;
    DP.target.dispatchEvent(new Event('jdatechange',{bubbles:true}));
    dpClose();
  }
});
document.addEventListener('change',function(e){
  if(!DP.el)return;
  if(e.target.id==='dpMon'){ DP.view.jm=+e.target.value; dpRender(); }
  if(e.target.id==='dpYear'){ DP.view.jy=+e.target.value; dpRender(); }
});
function scan(root){
  (root||document).querySelectorAll('input.jdate:not([data-dp])').forEach(function(inp){
    inp.setAttribute('data-dp','1');
    inp.readOnly=true;
    inp.classList.add('readonly-dp');
    inp.addEventListener('click',function(){ dpOpen(inp) });
    inp.addEventListener('focus',function(){ dpOpen(inp) });
    inp.addEventListener('keydown',function(e){ e.preventDefault() });
  });
}

window.Jal=Jal;
window.Jal.scan=scan;
window.Jal.dpClose=dpClose;
})();
