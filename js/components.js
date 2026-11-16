/* ═══════════════ کامپوننت‌های رابط کاربری: توست، مودال، نمودار، چاپ، اکسل ═══════════════ */
(function(){
'use strict';

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]}) }
function el(html){ var d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstElementChild }

/* ─── توست ─── */
function toast(msg,type,icon){
  var root=document.getElementById('toastRoot');
  var ico=icon||(type==='ok'?'✅':type==='err'?'⛔':type==='warn'?'⚠️':'ℹ️');
  var t=el('<div class="toast '+(type||'')+'"><span class="t-ico">'+ico+'</span><span>'+esc(msg)+'</span></div>');
  root.appendChild(t);
  setTimeout(function(){ t.classList.add('out'); setTimeout(function(){t.remove()},320) },3200);
}

/* ─── مودال ─── */
function modal(opts){
  var root=document.getElementById('modalRoot');
  var ov=el('<div class="modal-overlay"></div>');
  var box=el('<div class="modal-box '+(opts.size||'')+'">'
    +'<div class="modal-head"><div class="modal-title">'+(opts.icon?'<span>'+opts.icon+'</span>':'')+'<span>'+esc(opts.title||'')+'</span></div>'
    +'<button class="modal-close" title="بستن">✕</button></div>'
    +'<div class="modal-body"></div>'
    +(opts.footer!==false?'<div class="modal-foot"></div>':'')
    +'</div>');
  ov.appendChild(box);
  var body=box.querySelector('.modal-body');
  if(typeof opts.body==='string')body.innerHTML=opts.body; else if(opts.body)body.appendChild(opts.body);
  var foot=box.querySelector('.modal-foot');
  if(foot&&opts.buttons){
    opts.buttons.forEach(function(b){
      var btn=el('<button class="btn '+(b.cls||'btn-ghost')+'">'+esc(b.label)+'</button>');
      btn.onclick=function(){ b.onClick&&b.onClick(box,close) };
      foot.appendChild(btn);
    });
  }
  function close(){ ov.classList.add('closing'); ov.style.animation='fadeIn .18s reverse both'; setTimeout(function(){ov.remove()},170) }
  box.querySelector('.modal-close').onclick=close;
  ov.addEventListener('click',function(e){ if(e.target===ov)close() });
  document.addEventListener('keydown',function esc2(e){ if(e.key==='Escape'){close();document.removeEventListener('keydown',esc2)} });
  root.appendChild(ov);
  Jal.scan(box);
  bindMoney(box);
  return {box:box,body:body,close:close};
}

function confirm(title,text,danger){
  return new Promise(function(res){
    var m=modal({title:title,icon:'❓',size:'sm',body:'<p style="font-size:13px;line-height:2;color:var(--text)">'+text+'</p>',buttons:[
      {label:'انصراف',cls:'btn-ghost',onClick:function(){m.close();res(false)}},
      {label:'بله، مطمئنم',cls:danger?'btn-danger':'btn-gold',onClick:function(){m.close();res(true)}}
    ]});
  });
}

/* ─── فیلدهای مبلغ ─── */
function bindMoney(root){
  (root||document).querySelectorAll('input.money-input:not([data-money])').forEach(function(inp){
    inp.setAttribute('data-money','1');
    inp.addEventListener('input',function(){
      var raw=Jal.toEn(inp.value).replace(/[^\d]/g,'');
      inp.value=raw;
      var pv=inp.parentElement.querySelector('.money-preview')||inp.parentElement.parentElement.querySelector('.money-preview');
      if(pv)pv.innerHTML=raw?Jal.fmtMoney(+raw)+(function(){var t=+raw/10;return ' <span style="color:var(--muted)">(معادل '+Jal.fmtNum(t)+' تومان)</span>'})():'';
    });
  });
}

/* ─── نمودارها ─── */
var PALETTE=['#e8c15a','#2dd4bf','#4f7cff','#ff5d73','#a78bfa','#34d399','#fbbf24','#22d3ee','#f472b6','#94a1ba','#fb923c','#60a5fa'];
function setupCanvas(cv){
  var dpr=window.devicePixelRatio||1;
  var w=cv.clientWidth||cv.parentElement.clientWidth||300;
  var h=cv.clientHeight||220;
  cv.width=w*dpr; cv.height=h*dpr;
  var ctx=cv.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return{ctx:ctx,w:w,h:h};
}
function ease(t){return 1-Math.pow(1-t,3)}
function barChart(cv,opts){
  var labels=opts.labels,values=opts.values,max=Math.max.apply(null,values.concat([1]));
  var st=setupCanvas(cv),ctx=st.ctx,w=st.w,h=st.h;
  var padT=26,padB=34,padX=8;
  var n=labels.length,slot=(w-padX*2)/n,bw=Math.min(46,slot*.55);
  var colors=opts.colors||PALETTE;
  var start=null,dur=900;
  function draw(ts){
    if(!start)start=ts;
    var p=ease(Math.min(1,(ts-start)/dur));
    ctx.clearRect(0,0,w,h);
    // خط‌های افقی
    ctx.strokeStyle='rgba(255,255,255,.07)';ctx.lineWidth=1;
    for(var g=0;g<=4;g++){var gy=padT+(h-padT-padB)*g/4;ctx.beginPath();ctx.moveTo(padX,gy);ctx.lineTo(w-padX,gy);ctx.stroke()}
    for(var i=0;i<n;i++){
      var bh=(h-padT-padB)*(values[i]/max)*p;
      var x=padX+slot*i+(slot-bw)/2, y=h-padB-bh;
      var grad=ctx.createLinearGradient(0,y,0,h-padB);
      grad.addColorStop(0,colors[i%colors.length]);grad.addColorStop(1,colors[i%colors.length]+'55');
      ctx.fillStyle=grad;
      var r=Math.min(8,bw/2,bh);
      ctx.beginPath();ctx.moveTo(x,h-padB);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.lineTo(x+bw-r,y);ctx.quadraticCurveTo(x+bw,y,x+bw,y+r);ctx.lineTo(x+bw,h-padB);ctx.closePath();ctx.fill();
      if(values[i]>0){
        ctx.fillStyle='#e9eef8';ctx.font='700 11px Vazirmatn,Tahoma';ctx.textAlign='center';
        ctx.fillText(Jal.fmtNum(values[i]),x+bw/2,y-6);
      }
      ctx.fillStyle='#94a1ba';ctx.font='10.5px Vazirmatn,Tahoma';ctx.textAlign='center';
      var lb=String(labels[i]);if(lb.length>9)lb=lb.slice(0,9)+'…';
      ctx.fillText(lb,x+bw/2,h-padB+16);
    }
    if(p<1)requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}
function donut(cv,opts){
  var labels=opts.labels,values=opts.values,colors=opts.colors||PALETTE;
  var st=setupCanvas(cv),ctx=st.ctx,w=st.w,h=st.h;
  var cx=w/2,cy=h/2,R=Math.min(w,h)/2-14,r=R*.62;
  var total=values.reduce(function(a,b){return a+b},0)||1;
  var start=null,dur=900;
  function draw(ts){
    if(!start)start=ts;
    var p=ease(Math.min(1,(ts-start)/dur));
    ctx.clearRect(0,0,w,h);
    var ang=-Math.PI/2;
    for(var i=0;i<values.length;i++){
      var seg=values[i]/total*2*Math.PI*p;
      if(values[i]===0){continue}
      ctx.beginPath();ctx.arc(cx,cy,R,ang,ang+seg);ctx.arc(cx,cy,r,ang+seg,ang,true);ctx.closePath();
      ctx.fillStyle=colors[i%colors.length];ctx.fill();
      ctx.strokeStyle='rgba(7,11,22,.85)';ctx.lineWidth=2;ctx.stroke();
      ang+=seg;
    }
    ctx.fillStyle='#e9eef8';ctx.font='700 20px Vazirmatn,Tahoma';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(Jal.fmtNum(Math.round(total*p)),cx,cy-9);
    ctx.fillStyle='#94a1ba';ctx.font='10.5px Vazirmatn,Tahoma';
    ctx.fillText('مجموع',cx,cy+13);
    if(p<1)requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}
function legendHTML(labels,values,colors){
  var total=values.reduce(function(a,b){return a+b},0)||1;
  return labels.map(function(l,i){
    var pc=Math.round(values[i]/total*100);
    return '<div style="display:flex;align-items:center;gap:8px;font-size:11.5px;padding:4px 0">'
      +'<span style="width:10px;height:10px;border-radius:3px;background:'+colors[i%colors.length]+';flex-shrink:0"></span>'
      +'<span style="flex:1;color:var(--muted)">'+esc(l)+'</span>'
      +'<b style="color:var(--text)">'+Jal.fmtNum(values[i])+'</b>'
      +'<span style="color:var(--dim);width:38px;text-align:left">'+Jal.toFa(pc)+'٪</span></div>';
  }).join('');
}

/* ─── خروجی اکسل (CSV) ─── */
function csv(filename,headers,rows){
  var lines=[headers];
  rows.forEach(function(r){lines.push(r)});
  var csvText='\uFEFF'+lines.map(function(row){
    return row.map(function(c){c=String(c==null?'':c);return '"'+c.replace(/"/g,'""')+'"'}).join(',');
  }).join('\r\n');
  var blob=new Blob([csvText],{type:'text/csv;charset=utf-8'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=filename;
  a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href)},4000);
  toast('فایل اکسل (CSV) دانلود شد','ok');
}

/* ─── چاپ ─── */
function printHTML(docTitle,inner){
  return DB.getSetting('agencyName').then(function(name){
    var t=Jal.today();
    var head='<div class="p-head"><div class="p-agency"><h1>'+esc(name||'املاک‌پلاس')+'</h1>'
      +'<div class="p-meta">نرم‌افزار مدیریت املاک املاک‌پلاس</div></div>'
      +'<div class="p-doc-type"><div class="p-dt">'+esc(docTitle)+'</div><div class="p-dt2">تاریخ چاپ: '+Jal.fmt(t.jy,t.jm,t.jd)+'</div></div></div>';
    var pa=document.getElementById('printArea');
    pa.innerHTML=head+inner;
    document.body.classList.add('printing');
    setTimeout(function(){ window.print(); setTimeout(function(){ document.body.classList.remove('printing'); pa.innerHTML='' },400) },80);
  });
}

/* ─── Ripple دکمه‌ها ─── */
document.addEventListener('click',function(e){
  var btn=e.target.closest('.btn');
  if(!btn||btn.disabled)return;
  var r=btn.getBoundingClientRect();
  var d=Math.max(r.width,r.height);
  var rip=document.createElement('span');
  rip.className='ripple';
  rip.style.width=rip.style.height=d+'px';
  rip.style.left=(e.clientX-r.left-d/2)+'px';
  rip.style.top=(e.clientY-r.top-d/2)+'px';
  btn.appendChild(rip);
  setTimeout(function(){rip.remove()},600);
});

/* ─── چیپ‌های وضعیت ─── */
function statusChip(s){
  var st=CONST.STATUS[s]||{t:s||'—',c:'gray'};
  return '<span class="chip '+st.c+'">'+st.t+'</span>';
}
function dealChip(d){
  var map={sale:'gold',rent:'info',presale:'violet',partner:'ok',exchange:'gray',goodwill:'warn'};
  return '<span class="chip '+(map[d]||'gray')+'">'+esc(CONST.DEALS[d]||d||'—')+'</span>';
}
function ptypeChip(p){
  var t=CONST.PTYPES[p]||{t:p,ico:''};
  return '<span class="chip gray">'+t.ico+' '+esc(t.t)+'</span>';
}

window.UI={
  esc:esc,el:el,toast:toast,modal:modal,confirm:confirm,
  barChart:barChart,donut:donut,legendHTML:legendHTML,PALETTE:PALETTE,
  csv:csv,printHTML:printHTML,bindMoney:bindMoney,
  statusChip:statusChip,dealChip:dealChip,ptypeChip:ptypeChip
};
})();
