/* ═══════════════ ماژول‌ها: مشتریان، بازدیدها، گزارش‌ها، مالی، کاربران، تنظیمات ═══════════════ */
(function(){
'use strict';
var Pages={};

function esc(s){return UI.esc(s)}
function money(v){return Jal.fmtMoney(v)}
function num(v){return Jal.fmtNum(v)}
function adminOnly(){return App.user&&App.user.role==='admin'}

function pageHead(title,subtitle,actionsHtml){
  return '<div class="dash-greet anim-up"><div><div class="dash-hi">'+title+'</div>'
    +(subtitle?'<div class="dash-date">'+subtitle+'</div>':'')+'</div>'
    +'<div style="display:flex;gap:9px;flex-wrap:wrap">'+(actionsHtml||'')+'</div></div>';
}

function emptyBox(ico,t,s){
  return '<div class="empty-box"><div class="eb-ico">'+ico+'</div><div class="eb-t">'+t+'</div><div class="eb-s">'+s+'</div></div>';
}

/* ═════════════════════════ مشتریان ═════════════════════════ */
Pages.customers=function(){
  App.setTitle('درخواست مشتریان');
  var st={q:'',status:'',req:''};
  var c=UI.el('<div>'
    +pageHead('🎯 درخواست مشتریان','ثبت درخواست خرید و اجاره مشتریان و تطبیق هوشمند با املاک موجود',
      '<button class="btn btn-gold" id="cAdd">＋ مشتری جدید</button>'
      +'<button class="btn btn-ghost" id="cPrint">🖨 چاپ فهرست</button>'
      +'<button class="btn btn-ghost" id="cCsv">📊 خروجی اکسل</button>')
    +'<div class="filter-bar anim-up" style="--d:.06s"><div class="filter-row">'
      +'<div class="field col-2"><label>جستجو (نام، تلفن، محله)</label><input class="input" id="cQ" placeholder="جستجو..."></div>'
      +'<div class="field"><label>نوع درخواست</label><select class="select" id="cReq"><option value="">همه</option><option value="buy">خرید</option><option value="rent">اجاره</option></select></div>'
      +'<div class="field"><label>وضعیت</label><select class="select" id="cStatus"><option value="">همه</option><option value="open">در انتظار</option><option value="done">انجام شد</option><option value="canceled">لغو شده</option></select></div>'
    +'</div></div>'
    +'<div id="cTable" class="anim-up" style="--d:.12s"></div>'
    +'</div>');
  App.setContent(c);
  function statusC(s){var m={open:'<span class="chip warn">در انتظار</span>',done:'<span class="chip ok">انجام شد</span>',canceled:'<span class="chip gray">لغو شده</span>'};return m[s]||s}
  function load(){
    DB.customers.all().then(function(list){
      list=list.filter(function(x){
        if(st.status&&x.status!==st.status)return false;
        if(st.req&&x.reqType!==st.req)return false;
        if(st.q){var q=st.q.toLowerCase();var hay=(x.name+' '+x.phone+' '+(x.region||'')+' '+(x.note||'')).toLowerCase();if(hay.indexOf(q)<0)return false}
        return true;
      }).sort(function(a,b){return (b.createdAt||'').localeCompare(a.createdAt||'')});
      var tbl;
      if(!list.length){ tbl=UI.el('<div class="card">'+emptyBox('🎯','مشتری‌ای یافت نشد','با دکمه «مشتری جدید» اولین درخواست را ثبت کنید')+'</div>') }
      else{
        var rows=list.map(function(x,i){
          var rt=x.reqType==='buy'?'<span class="chip gold">خرید</span>':'<span class="chip info">اجاره</span>';
          var bud=x.reqType==='buy'?money(x.budget):('رهن: '+money(x.rahnBudget)+'<br>اجاره: '+money(x.rentBudget));
          return '<tr>'
            +'<td class="row-num">'+num(i+1)+'</td>'
            +'<td><b>'+esc(x.name)+'</b></td><td dir="ltr" style="text-align:left">'+esc(x.phone)+'</td>'
            +'<td>'+rt+'</td><td>'+esc(CONST.PTYPES[x.pType]?CONST.PTYPES[x.pType].t:'—')+'</td>'
            +'<td>'+(x.sizeMin||x.sizeMax?num(x.sizeMin||0)+' تا '+num(x.sizeMax||0)+' متر':'—')+'</td>'
            +'<td style="white-space:normal;min-width:190px">'+bud+'</td>'
            +'<td style="white-space:normal;max-width:170px">'+esc(x.region||'—')+'</td>'
            +'<td>'+statusC(x.status)+'</td><td>'+esc(x.createdAt||'')+'</td>'
            +'<td><div style="display:flex;gap:4px">'
              +'<button class="btn btn-xs btn-ghost" data-match="'+x.id+'" title="تطبیق با املاک">🎯 تطبیق</button>'
              +(adminOnly()?'<button class="btn btn-xs btn-ghost" data-edit="'+x.id+'">✏️</button><button class="btn btn-xs btn-ghost" data-del="'+x.id+'" style="color:var(--danger)">🗑</button>':'')
            +'</div></td></tr>';
        }).join('');
        tbl=UI.el('<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr>'
          +'<th>#</th><th>نام مشتری</th><th>تلفن</th><th>نوع</th><th>نوع ملک</th><th>متراژ</th><th>بودجه</th><th>منطقه</th><th>وضعیت</th><th>تاریخ ثبت</th><th>عملیات</th>'
          +'</tr></thead><tbody>'+rows+'</tbody></table></div></div>');
      }
      var box=c.querySelector('#cTable');box.innerHTML='';box.appendChild(tbl);
      tbl.querySelectorAll('[data-match]').forEach(function(b){b.onclick=function(){matchCustomer(list.find(function(x){return x.id===b.dataset.match}))}});
      tbl.querySelectorAll('[data-edit]').forEach(function(b){b.onclick=function(){customerForm(list.find(function(x){return x.id===b.dataset.edit}),load)}});
      tbl.querySelectorAll('[data-del]').forEach(function(b){b.onclick=function(){
        UI.confirm('حذف مشتری','آیا از حذف این درخواست مشتری مطمئن هستید؟ این عمل قابل بازگشت نیست.',true).then(function(y){
          if(!y)return;
          DB.customers.del(b.dataset.del).then(function(){DB.log('حذف مشتری','');UI.toast('مشتری حذف شد','ok');load()});
        });
      }});
    });
  }
  c.querySelector('#cQ').oninput=function(){st.q=this.value;load()};
  c.querySelector('#cStatus').onchange=function(){st.status=this.value;load()};
  c.querySelector('#cReq').onchange=function(){st.req=this.value;load()};
  c.querySelector('#cAdd').onclick=function(){customerForm(null,load)};
  c.querySelector('#cPrint').onclick=function(){
    DB.customers.all().then(function(list){
      var rows=list.map(function(x,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(x.name)+'</td><td>'+esc(x.phone)+'</td><td>'+(x.reqType==='buy'?'خرید':'اجاره')+'</td><td>'+esc(CONST.PTYPES[x.pType]?CONST.PTYPES[x.pType].t:'')+'</td><td>'+num(x.budget||x.rahnBudget||0)+'</td><td>'+esc(x.region||'')+'</td><td>'+esc(x.createdAt||'')+'</td></tr>'}).join('');
      UI.printHTML('فهرست درخواست مشتریان','<table class="p-table"><tr><th>#</th><th>نام</th><th>تلفن</th><th>نوع</th><th>نوع ملک</th><th>بودجه (ریال)</th><th>منطقه</th><th>تاریخ</th></tr>'+rows+'</table>');
    });
  };
  c.querySelector('#cCsv').onclick=function(){
    DB.customers.all().then(function(list){
      UI.csv('customers-'+Jal.fmt(Jal.today().jy,Jal.today().jm,Jal.today().jd).replace(/\//g,'-')+'.csv',
        ['نام','تلفن','نوع درخواست','نوع ملک','متراژ از','متراژ تا','بودجه خرید','بودجه رهن','بودجه اجاره','منطقه','وضعیت','تاریخ ثبت','یادداشت'],
        list.map(function(x){return [x.name,x.phone,x.reqType==='buy'?'خرید':'اجاره',CONST.PTYPES[x.pType]?CONST.PTYPES[x.pType].t:'',x.sizeMin||'',x.sizeMax||'',x.budget||'',x.rahnBudget||'',x.rentBudget||'',x.region||'',x.status==='open'?'در انتظار':x.status==='done'?'انجام شد':'لغو شده',x.createdAt||'',x.note||'']}));
    });
  };
  load();
};

function customerForm(existing,after){
  var x=existing||{};
  var body=UI.el('<div><div class="form-grid" style="grid-template-columns:1fr 1fr">'
    +'<div class="field"><label>نام مشتری <span class="req">*</span></label><input class="input" id="fName" value="'+esc(x.name||'')+'"></div>'
    +'<div class="field"><label>شماره تماس <span class="req">*</span></label><input class="input" id="fPhone" dir="ltr" style="text-align:left" value="'+esc(x.phone||'')+'"></div>'
    +'<div class="field"><label>نوع درخواست</label><div class="seg" id="fReq"><button type="button" data-v="buy" class="'+(x.reqType!=='rent'?'on':'')+'">🛒 خرید</button><button type="button" data-v="rent" class="'+(x.reqType==='rent'?'on':'')+'">🔑 اجاره</button></div></div>'
    +'<div class="field"><label>نوع ملک مورد نظر</label><select class="select" id="fPType">'+Object.keys(CONST.PTYPES).map(function(k){return '<option value="'+k+'"'+(x.pType===k?' selected':'')+'>'+CONST.PTYPES[k].ico+' '+CONST.PTYPES[k].t+'</option>'}).join('')+'</select></div>'
    +'<div class="field"><label>متراژ از</label><input class="input" id="fSizeMin" type="number" min="0" value="'+(x.sizeMin||'')+'"></div>'
    +'<div class="field"><label>متراژ تا</label><input class="input" id="fSizeMax" type="number" min="0" value="'+(x.sizeMax||'')+'"></div>'
    +'<div class="field" id="fRoomsWrap"><label>تعداد خواب</label><select class="select" id="fRooms"><option value="">مهم نیست</option>'+[1,2,3,4,5].map(function(n){return '<option value="'+n+'"'+(x.rooms==n?' selected':'')+'>'+n+'</option>'}).join('')+'</select></div>'
    +'<div class="field"><label>منطقه / محله مورد نظر</label><input class="input" id="fRegion" value="'+esc(x.region||'')+'" placeholder="مثال: نارمک، تهرانپارس"></div>'
    +'<div class="field col-2 money-wrap" id="fBudgetWrap"><label>حداکثر بودجه خرید (ریال)</label><input class="input money-input" id="fBudget" value="'+(x.budget||'')+'"><div class="money-preview"></div></div>'
    +'<div class="field money-wrap" id="fRahnWrap"><label>حداکثر ودیعه/رهن (ریال)</label><input class="input money-input" id="fRahn" value="'+(x.rahnBudget||'')+'"><div class="money-preview"></div></div>'
    +'<div class="field money-wrap" id="fRentWrap"><label>حداکثر اجاره ماهانه (ریال)</label><input class="input money-input" id="fRent" value="'+(x.rentBudget||'')+'"><div class="money-preview"></div></div>'
    +'<div class="field col-2"><label>یادداشت</label><textarea class="input" id="fNote" rows="2">'+esc(x.note||'')+'</textarea></div>'
    +(existing?'<div class="field"><label>وضعیت</label><select class="select" id="fStatus"><option value="open"'+(x.status==='open'?' selected':'')+'>در انتظار</option><option value="done"'+(x.status==='done'?' selected':'')+'>انجام شد</option><option value="canceled"'+(x.status==='canceled'?' selected':'')+'>لغو شده</option></select></div>':'')
    +'</div></div>');
  var m=UI.modal({title:existing?'ویرایش درخواست مشتری':'ثبت درخواست مشتری جدید',icon:'🎯',body:body,buttons:[
    {label:'انصراف',cls:'btn-ghost',onClick:function(){m.close()}},
    {label:existing?'ذخیره تغییرات':'ثبت درخواست',cls:'btn-gold',onClick:function(){
      var name=body.querySelector('#fName').value.trim(),phone=body.querySelector('#fPhone').value.trim();
      if(!name||!phone){UI.toast('نام و شماره تماس الزامی است','err');return}
      var o=Object.assign({},x,{
        name:name,phone:phone,
        reqType:body.querySelector('#fReq .on').dataset.v,
        pType:body.querySelector('#fPType').value,
        sizeMin:+body.querySelector('#fSizeMin').value||'',
        sizeMax:+body.querySelector('#fSizeMax').value||'',
        rooms:body.querySelector('#fRooms').value||'',
        region:body.querySelector('#fRegion').value.trim(),
        budget:+Jal.toEn(body.querySelector('#fBudget').value)||'',
        rahnBudget:+Jal.toEn(body.querySelector('#fRahn').value)||'',
        rentBudget:+Jal.toEn(body.querySelector('#fRent').value)||'',
        note:body.querySelector('#fNote').value.trim()
      });
      if(existing){o.status=body.querySelector('#fStatus').value;o.updatedAt=Jal.fmt(Jal.today().jy,Jal.today().jm,Jal.today.jd);}
      else{o.status='open';o.createdAt=Jal.fmt(Jal.today().jy,Jal.today().jm,Jal.today().jd);o.createdBy=App.user.fullName}
      DB.customers.save(o).then(function(){
        DB.log(existing?'ویرایش مشتری':'ثبت مشتری جدید',name);
        UI.toast(existing?'درخواست مشتری ویرایش شد':'درخواست مشتری ثبت شد','ok');
        m.close();after&&after();
      });
    }}
  ]});
  var seg=body.querySelector('#fReq');
  seg.querySelectorAll('button').forEach(function(b){b.onclick=function(){seg.querySelectorAll('button').forEach(function(z){z.classList.remove('on')});b.classList.add('on');toggleWrap()}});
  function toggleWrap(){
    var rent=seg.querySelector('.on').dataset.v==='rent';
    body.querySelector('#fBudgetWrap').style.display=rent?'none':'';
    body.querySelector('#fRahnWrap').style.display=rent?'':'none';
    body.querySelector('#fRentWrap').style.display=rent?'':'none';
  }
  toggleWrap();
}

function matchCustomer(cu){
  DB.properties.all().then(function(props){
    var wantRent=cu.reqType==='rent';
    var dealOk=wantRent?['rent']:['sale','presale','partner','exchange','goodwill'];
    var matched=props.filter(function(p){
      if(p.status!=='active')return false;
      if(dealOk.indexOf(p.deal)<0)return false;
      if(cu.pType&&p.ptype!==cu.pType)return false;
      if(cu.sizeMin&&(+p.size||0)<+cu.sizeMin)return false;
      if(cu.sizeMax&&(+p.size||0)>+cu.sizeMax)return false;
      if(cu.rooms&&(+p.rooms||0)!==+cu.rooms)return false;
      if(!wantRent&&cu.budget&&(+p.salePrice||0)>+cu.budget)return false;
      if(wantRent&&cu.rahnBudget&&(+p.rahnFull||0)>+cu.rahnBudget)return false;
      if(wantRent&&cu.rentBudget&&(+p.rentMonthly||0)>+cu.rentBudget)return false;
      return true;
    });
    function score(p){
      var s=55;
      if(cu.sizeMin||cu.sizeMax)s+=8;
      if(cu.rooms&&+p.rooms===+cu.rooms)s+=12;
      if(cu.region&&(p.region||'').indexOf(cu.region.split(/[،,]/)[0].trim())>=0)s+=18;
      else if(cu.region){var ws=cu.region.split(/[،,]/);for(var i=1;i<ws.length;i++)if((p.region||'').indexOf(ws[i].trim())>=0){s+=12;break}}
      if(!wantRent&&cu.budget){var r=(+p.salePrice||0)/+cu.budget;if(r<0.85)s+=12;else if(r<0.95)s+=7}
      return Math.min(99,s);
    }
    matched.sort(function(a,b){return score(b)-score(a)});
    var body=UI.el('<div><div style="font-size:12.5px;color:var(--muted);margin-bottom:12px">تطبیق درخواست <b style="color:var(--gold)">'+esc(cu.name)+'</b> — '+num(matched.length)+' ملک منطبق یافت شد</div>'
      +(matched.length?'<div class="prop-grid">'+matched.map(function(p){return App.propCardHTML(p,{score:score(p)})}).join('')+'</div>':emptyBox('🔍','ملک منطبقی یافت شد','فیلترهای درخواست را با مدیر بنگاه مرور کنید'))
      +'</div>');
    var m=UI.modal({title:'🎯 تطبیق هوشمند',icon:'🤝',size:'lg',body:body,buttons:[{label:'بستن',cls:'btn-ghost',onClick:function(){m.close()}}]});
    body.querySelectorAll('.prop-card').forEach(function(card){
      card.onclick=function(){App.openProperty(card.dataset.pid,m)};
    });
  });
}

/* ═════════════════════════ بازدیدها ═════════════════════════ */
Pages.visits=function(){
  App.setTitle('یادآور بازدید');
  var st={q:'',status:'',from:'',to:''};
  var c=UI.el('<div>'
    +pageHead('📅 یادآور بازدید','مدیریت قرارهای بازدید مشتریان از املاک',
      '<button class="btn btn-gold" id="vAdd">＋ قرار بازدید جدید</button>')
    +'<div class="filter-bar anim-up" style="--d:.06s"><div class="filter-row">'
      +'<div class="field col-2"><label>جستجو (نام، تلفن، ملک)</label><input class="input" id="vQ" placeholder="جستجو..."></div>'
      +'<div class="field"><label>وضعیت</label><select class="select" id="vStatus"><option value="">همه</option><option value="scheduled">برنامه‌ریزی‌شده</option><option value="done">انجام شد</option><option value="canceled">لغو شد</option></select></div>'
      +'<div class="field"><label>از تاریخ</label><input class="input jdate" id="vFrom" placeholder="انتخاب تاریخ"></div>'
      +'<div class="field"><label>تا تاریخ</label><input class="input jdate" id="vTo" placeholder="انتخاب تاریخ"></div>'
    +'</div></div>'
    +'<div id="vTable" class="anim-up" style="--d:.12s"></div></div>');
  App.setContent(c);
  c.querySelector('#vFrom').addEventListener('jdatechange',function(){st.from=this.value;load()});
  c.querySelector('#vTo').addEventListener('jdatechange',function(){st.to=this.value;load()});
  c.querySelector('#vQ').oninput=function(){st.q=this.value;load()};
  c.querySelector('#vStatus').onchange=function(){st.status=this.value;load()};
  c.querySelector('#vAdd').onclick=function(){visitForm(null,load)};
  function load(){
    Promise.all([DB.visits.all(),DB.properties.all()]).then(function(rs){
      var visits=rs[0],props=rs[1];
      var pmap={};props.forEach(function(p){pmap[p.code]=p});
      visits=visits.filter(function(x){
        if(st.status&&x.status!==st.status)return false;
        if(st.from){var k=Jal.keyOf(x.date);if(k<Jal.keyOf(st.from))return false}
        if(st.to){var k2=Jal.keyOf(x.date);if(k2>Jal.keyOf(st.to))return false}
        if(st.q){var p=pmap[x.propId]||{};var hay=(x.person+' '+x.phone+' '+(p.title||'')+' '+x.propId+' '+(x.note||'')).toLowerCase();if(hay.indexOf(st.q.toLowerCase())<0)return false}
        return true;
      }).sort(function(a,b){return (Jal.keyOf(a.date)-Jal.keyOf(b.date))||(a.time||'').localeCompare(b.time||'')});
      var todayKey=Jal.key(Jal.today());
      var tbl;
      if(!visits.length){tbl=UI.el('<div class="card">'+emptyBox('📅','قرار بازدیدی ثبت نشده','با دکمه «قرار بازدید جدید» اولین قرار را ثبت کنید')+'</div>')}
      else{
        var rows=visits.map(function(x){
          var p=pmap[x.propId]||{};
          var k=Jal.keyOf(x.date);
          var dayCls=k===todayKey?'<span class="chip warn">امروز</span>':(k<todayKey?'':'');
          var sc=x.status==='scheduled'?'<span class="chip info">برنامه‌ریزی‌شده</span>':x.status==='done'?'<span class="chip ok">انجام شد</span>':'<span class="chip gray">لغو شد</span>';
          return '<tr>'
            +'<td class="row-num">'+num(x.date)+'<br><span style="font-size:10px;color:var(--cyan)">'+esc(x.time||'')+'</span></td>'
            +'<td><b>'+esc(p.code||x.propId)+'</b><br><span style="font-size:11px;color:var(--muted)">'+esc((p.title||'ملک حذف‌شده').slice(0,34))+'</span></td>'
            +'<td>'+esc(x.person)+'</td><td dir="ltr" style="text-align:left">'+esc(x.phone||'')+'</td>'
            +'<td style="white-space:normal;max-width:210px">'+esc(x.note||'—')+'</td>'
            +'<td>'+sc+' '+dayCls+'</td>'
            +'<td><div style="display:flex;gap:4px">'
              +(x.status==='scheduled'?'<button class="btn btn-xs btn-ok" data-done="'+x.id+'">✔ انجام شد</button><button class="btn btn-xs btn-ghost" data-cancel="'+x.id+'">✖ لغو</button>':'')
              +(adminOnly()?'<button class="btn btn-xs btn-ghost" data-del="'+x.id+'" style="color:var(--danger)">🗑</button>':'')
            +'</div></td></tr>';
        }).join('');
        tbl=UI.el('<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>تاریخ / ساعت</th><th>ملک</th><th>مشتری</th><th>تلفن</th><th>یادداشت</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>');
      }
      var box=c.querySelector('#vTable');box.innerHTML='';box.appendChild(tbl);
      tbl.querySelectorAll('[data-done]').forEach(function(b){b.onclick=function(){DB.visits.get(b.dataset.done).then(function(v){v.status='done';DB.visits.save(v).then(function(){DB.log('بازدید انجام شد',v.person);UI.toast('وضعیت بازدید به «انجام شد» تغییر کرد','ok');load()})})}});
      tbl.querySelectorAll('[data-cancel]').forEach(function(b){b.onclick=function(){DB.visits.get(b.dataset.cancel).then(function(v){v.status='canceled';DB.visits.save(v).then(function(){UI.toast('بازدید لغو شد','warn');load()})})}});
      tbl.querySelectorAll('[data-del]').forEach(function(b){b.onclick=function(){UI.confirm('حذف بازدید','آیا از حذف این قرار بازدید مطمئن هستید؟',true).then(function(y){if(!y)return;DB.visits.del(b.dataset.del).then(function(){UI.toast('بازدید حذف شد','ok');load()})})}});
    });
  }
  load();
};

function visitForm(existing,after){
  DB.properties.all().then(function(props){
    var actives=props.filter(function(p){return p.status==='active'}).sort(function(a,b){return a.code<b.code?-1:1});
    var x=existing||{};
    var body=UI.el('<div><div class="form-grid" style="grid-template-columns:1fr 1fr">'
      +'<div class="field col-2"><label>ملک <span class="req">*</span></label><select class="select" id="fProp">'
      +actives.map(function(p){return '<option value="'+esc(p.code)+'"'+(x.propId===p.code?' selected':'')+'>'+esc(p.code)+' — '+esc(p.title)+'</option>'}).join('')
      +'</select></div>'
      +'<div class="field"><label>نام مشتری <span class="req">*</span></label><input class="input" id="fPerson" value="'+esc(x.person||'')+'"></div>'
      +'<div class="field"><label>تلفن مشتری</label><input class="input" id="fVPhone" dir="ltr" style="text-align:left" value="'+esc(x.phone||'')+'"></div>'
      +'<div class="field"><label>تاریخ بازدید (شمسی) <span class="req">*</span></label><input class="input jdate" id="fDate" value="'+esc(x.date||Jal.fmt(Jal.today().jy,Jal.today().jm,Jal.today().jd))+'"></div>'
      +'<div class="field"><label>ساعت</label><input class="input" id="fTime" type="time" value="'+esc(x.time||'17:00')+'"></div>'
      +'<div class="field col-2"><label>یادداشت</label><textarea class="input" id="fVNote" rows="2">'+esc(x.note||'')+'</textarea></div>'
      +'</div></div>');
    var m=UI.modal({title:existing?'ویرایش قرار بازدید':'ثبت قرار بازدید جدید',icon:'📅',body:body,buttons:[
      {label:'انصراف',cls:'btn-ghost',onClick:function(){m.close()}},
      {label:'ثبت قرار',cls:'btn-gold',onClick:function(){
        var prop=body.querySelector('#fProp').value,person=body.querySelector('#fPerson').value.trim(),date=body.querySelector('#fDate').value.trim();
        if(!prop||!person||!date){UI.toast('ملک، نام مشتری و تاریخ الزامی است','err');return}
        var o=Object.assign({},x,{propId:prop,person:person,phone:body.querySelector('#fVPhone').value.trim(),
          date:date,time:body.querySelector('#fTime').value,note:body.querySelector('#fVNote').value.trim()});
        if(!existing){o.status='scheduled';o.createdAt=Jal.fmt(Jal.today().jy,Jal.today().jm,Jal.today().jd);o.createdBy=App.user.fullName}
        DB.visits.save(o).then(function(){DB.log(existing?'ویرایش بازدید':'ثبت بازدید',person+' برای '+prop);UI.toast('قرار بازدید ثبت شد','ok');m.close();after&&after()});
      }}
    ]});
  });
}

/* ═════════════════════════ گزارش‌ها ═════════════════════════ */
function valueOf(p){ return +p.salePrice||+p.rahnFull||0 }

var REPORT_DEFS=[
  {id:'ptype',ico:'🏢',title:'بر اساس نوع ملک',group:function(p){return CONST.PTYPES[p.ptype]?CONST.PTYPES[p.ptype].t:'سایر'}},
  {id:'deal',ico:'🔄',title:'بر اساس نوع معامله',group:function(p){return CONST.DEALS[p.deal]||'سایر'}},
  {id:'status',ico:'📌',title:'بر اساس وضعیت',group:function(p){return CONST.STATUS[p.status]?CONST.STATUS[p.status].t:'سایر'}},
  {id:'seller',ico:'👤',title:'بر اساس نام فروشنده',group:function(p){return p.sellerName||'نامشخص'}},
  {id:'region',ico:'📍',title:'بر اساس منطقه / محله',group:function(p){return (p.region||'نامشخص').split(/[،,]/)[0].trim()}},
  {id:'agent',ico:'🧑‍💼',title:'بر اساس کاربر ثبت‌کننده',group:function(p){return p.createdBy||'—'}},
  {id:'floor',ico:'🪜',title:'بر اساس طبقه (آپارتمان)',group:function(p){
    if(p.ptype!=='apartment')return null;
    var f=+p.floor;return f===0?'همکف':f>=1?'طبقه '+Jal.toFa(f):'نامشخص'}},
  {id:'year',ico:'🏗️',title:'بر اساس سال ساخت',group:function(p){
    if(!p.buildYear)return null;
    return 'سال '+Jal.toFa(Jal.toEn(p.buildYear))}},
  {id:'month',ico:'🗓️',title:'بر اساس ماه ثبت',group:function(p){
    var j=Jal.parse(p.createdAt);return j?Jal.toFa(j.jy)+'/'+Jal.toFa(Jal.pad2(j.jm))+' ('+Jal.monthName(j.jm)+')':'نامشخص'}},
  {id:'doc',ico:'📜',title:'بر اساس نوع سند',group:function(p){return p.docType||'نامشخص'}},
  {id:'landuse',ico:'🌍',title:'بر اساس کاربری زمین',group:function(p){
    if(p.ptype!=='land')return null;return p.landUse||'نامشخص'}},
  {id:'price',ico:'💰',title:'بر اساس بازه قیمت',group:function(p){
    var v=valueOf(p);
    if(!v)return null;
    if(v<1e10)return 'کمتر از ۱ میلیارد ریال';
    if(v<5e10)return '۱ تا ۵ میلیارد ریال';
    if(v<2e11)return '۵ تا ۲۰ میلیارد ریال';
    if(v<1e12)return '۲۰ تا ۱۰۰ میلیارد ریال';
    if(v<1e13)return '۱۰۰ تا ۱٬۰۰۰ میلیارد ریال';
    return 'بیش از ۱٬۰۰۰ میلیارد ریال'}},
  {id:'features',ico:'✨',title:'گزارش امکانات املاک',special:'features'},
  {id:'customersR',ico:'🎯',title:'گزارش درخواست مشتریان',special:'customersR'},
  {id:'visitsR',ico:'📅',title:'گزارش بازدیدها',special:'visitsR'},
  {id:'finance',ico:'💵',title:'گزارش مالی و کمیسیون',special:'finance'}
];

var PRICE_ORDER=['کمتر از ۱ میلیارد ریال','۱ تا ۵ میلیارد ریال','۵ تا ۲۰ میلیارد ریال','۲۰ تا ۱۰۰ میلیارد ریال','۱۰۰ تا ۱٬۰۰۰ میلیارد ریال','بیش از ۱٬۰۰۰ میلیارد ریال'];

Pages.reports=function(){
  App.setTitle('گزارش‌ها');
  var cur=REPORT_DEFS[0];
  var c=UI.el('<div>'
    +pageHead('📊 گزارش‌های تحلیلی','گروه‌بندی و تحلیل املاک، مشتریان، بازدیدها و مالی با نمودار و چاپ')
    +'<div class="report-layout"><div class="report-nav card anim-up"><div class="card-title"><span class="dot"></span>انواع گزارش</div><div id="rNav"></div></div>'
    +'<div><div class="filter-bar anim-up" style="--d:.06s">'
      +'<div class="report-cfg" id="rCfg">'
        +'<div class="field"><label>ثبت از تاریخ</label><input class="input jdate" id="rFrom"></div>'
        +'<div class="field"><label>ثبت تا تاریخ</label><input class="input jdate" id="rTo"></div>'
        +'<div class="field"><label>نوع ملک</label><select class="select" id="rPType"><option value="">همه</option>'+Object.keys(CONST.PTYPES).map(function(k){return '<option value="'+k+'">'+CONST.PTYPES[k].t+'</option>'}).join('')+'</select></div>'
        +'<div class="field"><label>وضعیت</label><select class="select" id="rStatus"><option value="">همه</option>'+Object.keys(CONST.STATUS).map(function(k){return '<option value="'+k+'">'+CONST.STATUS[k].t+'</option>'}).join('')+'</select></div>'
      +'</div>'
      +'<div style="display:flex;gap:9px;align-items:center;flex-wrap:wrap">'
        +'<button class="btn btn-primary" id="rRun">▶ اجرای گزارش</button>'
        +'<button class="btn btn-ghost" id="rPrint">🖨 چاپ / PDF</button>'
        +'<button class="btn btn-ghost" id="rCsv">📊 اکسل</button>'
      +'</div>'
    +'</div><div id="rOut"></div></div></div></div>');
  App.setContent(c);
  var nav=c.querySelector('#rNav');
  nav.innerHTML=REPORT_DEFS.map(function(r,i){return '<div class="rn-item'+(i===0?' on':'')+'" data-r="'+r.id+'"><span class="rn-ico">'+r.ico+'</span><span>'+r.title+'</span></div>'}).join('');
  var lastResult=null;
  nav.querySelectorAll('.rn-item').forEach(function(it){
    it.onclick=function(){
      nav.querySelectorAll('.rn-item').forEach(function(z){z.classList.remove('on')});
      it.classList.add('on');
      cur=REPORT_DEFS.find(function(r){return r.id===it.dataset.r});
      c.querySelector('#rOut').innerHTML='';
      c.querySelector('#rCfg').style.opacity=cur.special?'.45':1;
    };
  });
  c.querySelector('#rRun').onclick=run;
  c.querySelector('#rPrint').onclick=function(){ if(lastResult)lastResult.print() ;else UI.toast('اول گزارش را اجرا کنید','warn')};
  c.querySelector('#rCsv').onclick=function(){ if(lastResult)lastResult.csv();else UI.toast('اول گزارش را اجرا کنید','warn')};
  function filters(){
    return{from:c.querySelector('#rFrom').value,to:c.querySelector('#rTo').value,
      ptype:c.querySelector('#rPType').value,status:c.querySelector('#rStatus').value};
  }
  function applyFilters(list){
    var f=filters();
    return list.filter(function(p){
      if(f.ptype&&p.ptype!==f.ptype)return false;
      if(f.status&&p.status!==f.status)return false;
      if(f.from){var k=Jal.keyOf(p.createdAt);if(k<Jal.keyOf(f.from))return false}
      if(f.to){var k2=Jal.keyOf(p.createdAt);if(k2>Jal.keyOf(f.to))return false}
      return true;
    });
  }
  function run(){
    Promise.all([DB.properties.all(),DB.customers.all(),DB.visits.all(),DB.getSetting('commBuy'),DB.getSetting('commRent')]).then(function(rs){
      var props=rs[0],customers=rs[1],visits=rs[2],commB=+rs[3]||0.5,commR=+rs[4]||25;
      var out=c.querySelector('#rOut');
      out.innerHTML='';
      if(cur.special==='features')return renderFeatures(props);
      if(cur.special==='customersR')return renderCustomers(customers);
      if(cur.special==='visitsR')return renderVisits(visits);
      if(cur.special==='finance')return renderFinance(props,commB,commR);
      var list=applyFilters(props).filter(function(p){return cur.group(p)!==null});
      if(!list.length){out.appendChild(UI.el('<div class="card">'+emptyBox('📭','داده‌ای برای این گزارش یافت نشد','فیلترها را تغییر دهید یا املاک جدید ثبت کنید')+'</div>'));return}
      var groups={};
      list.forEach(function(p){
        var g=cur.group(p);
        if(!groups[g])groups[g]={count:0,sum:0,items:[]};
        groups[g].count++;groups[g].sum+=valueOf(p);groups[g].items.push(p);
      });
      var keys=Object.keys(groups);
      if(cur.id==='price')keys.sort(function(a,b){return PRICE_ORDER.indexOf(a)-PRICE_ORDER.indexOf(b)});
      else if(cur.id==='month')keys.sort();
      else keys.sort(function(a,b){return groups[b].count-groups[a].count});
      var totalValue=keys.reduce(function(s,k){return s+groups[k].sum},0);
      var maxCount=Math.max.apply(null,keys.map(function(k){return groups[k].count}));
      var html='<div class="sum-cards">'
        +'<div class="sum-card"><div class="sc-n">'+num(keys.length)+'</div><div class="sc-l">تعداد گروه‌ها</div></div>'
        +'<div class="sum-card"><div class="sc-n">'+num(list.length)+'</div><div class="sc-l">تعداد املاک</div></div>'
        +'<div class="sum-card"><div class="sc-n" style="font-size:15px">'+money(totalValue)+'</div><div class="sc-l">مجموع ارزش (ریال)</div></div>'
        +'<div class="sum-card"><div class="sc-n" style="font-size:15px">'+money(list.length?Math.round(totalValue/list.length):0)+'</div><div class="sc-l">میانگین ارزش</div></div>'
        +'</div>';
      html+='<div class="card" style="margin-bottom:14px"><div class="card-title"><span class="dot"></span>نمودار '+cur.title+'</div><div style="padding:4px 6px">';
      keys.slice(0,12).forEach(function(k){
        var g=groups[k],pc=Math.round(g.count/list.length*100);
        html+='<div class="bar-row"><div class="bar-label" title="'+esc(k)+'">'+esc(k)+'</div>'
          +'<div class="bar-track"><div class="bar-fill gold" data-w="'+(g.count/maxCount*100)+'">'+num(g.count)+'</div></div>'
          +'<div class="bar-val">'+Jal.toFa(pc)+'٪</div></div>';
      });
      html+='</div></div>';
      var trows=keys.map(function(k,i){
        var g=groups[k];
        return '<tr><td class="row-num">'+num(i+1)+'</td><td><b>'+esc(k)+'</b></td><td>'+num(g.count)+'</td>'
          +'<td style="white-space:normal;min-width:170px">'+money(g.sum)+'</td>'
          +'<td style="white-space:normal">'+money(g.count?Math.round(g.sum/g.count):0)+'</td>'
          +'<td>'+Jal.toFa(Math.round(g.count/list.length*100))+'٪</td></tr>';
      }).join('');
      html+='<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>'+esc(cur.title.replace('بر اساس ','گروه: '))+'</th><th>تعداد</th><th>مجموع ارزش (ریال)</th><th>میانگین ارزش</th><th>سهم</th></tr></thead><tbody>'+trows+'</tbody></table></div></div>';
      out.appendChild(UI.el('<div>'+html+'</div>'));
      requestAnimationFrame(function(){out.querySelectorAll('.bar-fill').forEach(function(b){b.style.width=b.dataset.w+'%'})});
      var f=filters();
      lastResult={
        print:function(){
          var trows2=keys.map(function(k,i){var g=groups[k];return '<tr><td>'+(i+1)+'</td><td>'+esc(k)+'</td><td>'+num(g.count)+'</td><td>'+Jal.toEn(num(g.sum))+'</td><td>'+Jal.toFa(Math.round(g.count/list.length*100))+'٪</td></tr>'}).join('');
          var flt='فیلترها: ';
          if(f.ptype)flt+='نوع ملک: '+CONST.PTYPES[f.ptype].t+' | ';
          if(f.status)flt+='وضعیت: '+CONST.STATUS[f.status].t+' | ';
          if(f.from)flt+='از '+f.from+' | ';
          if(f.to)flt+='تا '+f.to+' | ';
          UI.printHTML('گزارش املاک — '+cur.title,
            '<div class="p-note">'+esc(flt||'بدون فیلتر')+'</div>'
            +'<table class="p-table"><tr><th>#</th><th>'+esc(cur.title.replace('بر اساس ',''))+'</th><th>تعداد</th><th>مجموع ارزش (ریال)</th><th>سهم</th></tr>'+trows2+'</table>'
            +'<div class="p-note">جمع کل: '+num(list.length)+' ملک — مجموع ارزش: '+Jal.toEn(num(totalValue))+' ریال</div>');
        },
        csv:function(){
          UI.csv('report-'+cur.id+'.csv',[cur.title.replace('بر اساس ',''),'تعداد','مجموع ارزش (ریال)','میانگین ارزش (ریال)','سهم %'],
            keys.map(function(k){var g=groups[k];return [k,g.count,g.sum,g.count?Math.round(g.sum/g.count):0,Math.round(g.count/list.length*100)]}));
        }
      };
    });
  }
  function renderFeatures(props){
    var list=applyFilters(props);
    var feats=[
      {k:'parking',t:'🚗 پارکینگ',test:function(p){return p.parking&&p.parking!=='ندارد'}},
      {k:'elevator',t:'🛗 آسانسور',test:function(p){return p.elevator==='دارد'}},
      {k:'storage',t:'📦 انباری',test:function(p){return p.storage==='دارد'}},
      {k:'balcony',t:'🌤 بالکن',test:function(p){return p.balcony==='دارد'}},
      {k:'pool',t:'🏊 استخر',test:function(p){return p.pool==='دارد'}},
      {k:'sauna',t:'♨️ سونا',test:function(p){return p.sauna==='دارد'}},
      {k:'jacuzzi',t:'🛁 جکوزی',test:function(p){return p.jacuzzi==='دارد'}},
      {k:'gazebo',t:'⛺ آلاچیق',test:function(p){return p.gazebo==='دارد'}},
      {k:'goodwill',t:'🏷️ سرقفلی',test:function(p){return p.goodwill==='دارد'}},
      {k:'walled',t:'🧱 دیوارکشی (زمین)',test:function(p){return p.walled==='بله'}},
      {k:'permit',t:'📄 جواز ساخت',test:function(p){return p.permit==='دارد'}},
      {k:'3phase',t:'⚡ برق سه‌فاز',test:function(p){return p.has3Phase==='دارد'}}
    ];
    var rows=feats.map(function(f,i){
      var cnt=list.filter(f.test).length;
      var pc=list.length?Math.round(cnt/list.length*100):0;
      return {i:i,t:f.t,cnt:cnt,pc:pc};
    }).filter(function(r){return r.cnt>0||list.length===0});
    var html='<div class="sum-cards"><div class="sum-card"><div class="sc-n">'+num(list.length)+'</div><div class="sc-l">املاک بررسی‌شده</div></div>'
      +'<div class="sum-card"><div class="sc-n">'+num(rows.length)+'</div><div class="sc-l">انواع امکانات یافت‌شده</div></div></div>';
    var maxC=Math.max.apply(null,rows.map(function(r){return r.cnt}).concat([1]));
    html+='<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>امکانات</th><th>تعداد املاک</th><th>نمودار</th><th>سهم از کل</th></tr></thead><tbody>'
      +rows.map(function(r){return '<tr><td class="row-num">'+num(r.i+1)+'</td><td><b>'+r.t+'</b></td><td>'+num(r.cnt)+'</td><td style="width:40%"><div class="bar-track"><div class="bar-fill" data-w="'+(maxC?r.cnt/maxC*100:0)+'">'+num(r.cnt)+'</div></div></td><td>'+Jal.toFa(r.pc)+'٪</td></tr>'}).join('')
      +'</tbody></table></div></div>';
    var out=c.querySelector('#rOut');out.innerHTML=html;
    requestAnimationFrame(function(){out.querySelectorAll('.bar-fill').forEach(function(b){b.style.width=b.dataset.w+'%'})});
    lastResult={
      print:function(){UI.printHTML('گزارش امکانات املاک','<table class="p-table"><tr><th>#</th><th>امکانات</th><th>تعداد</th><th>سهم از کل</th></tr>'+rows.map(function(r,i){return '<tr><td>'+(i+1)+'</td><td>'+r.t+'</td><td>'+num(r.cnt)+'</td><td>'+Jal.toFa(r.pc)+'٪</td></tr>'}).join('')+'</table>')},
      csv:function(){UI.csv('report-features.csv',['امکانات','تعداد','سهم %'],rows.map(function(r){return [r.t,r.cnt,r.pc]}))}
    };
  }
  function renderCustomers(customers){
    var groups={};
    customers.forEach(function(x){
      var g=CONST.PTYPES[x.pType]?CONST.PTYPES[x.pType].t:'سایر';
      if(!groups[g])groups[g]={count:0,buy:0,rent:0,budget:0};
      groups[g].count++;
      if(x.reqType==='buy'){groups[g].buy++;groups[g].budget+=+x.budget||0}
      else{groups[g].rent++;groups[g].budget+=+x.rahnBudget||0}
    });
    var keys=Object.keys(groups).sort(function(a,b){return groups[b].count-groups[a].count});
    var html='<div class="sum-cards"><div class="sum-card"><div class="sc-n">'+num(customers.length)+'</div><div class="sc-l">کل درخواست‌ها</div></div>'
      +'<div class="sum-card"><div class="sc-n">'+num(customers.filter(function(x){return x.reqType==='buy'}).length)+'</div><div class="sc-l">درخواست خرید</div></div>'
      +'<div class="sum-card"><div class="sc-n">'+num(customers.filter(function(x){return x.reqType==='rent'}).length)+'</div><div class="sc-l">درخواست اجاره</div></div>'
      +'<div class="sum-card"><div class="sc-n">'+num(customers.filter(function(x){return x.status==='open'}).length)+'</div><div class="sc-l">در انتظار</div></div></div>';
    html+='<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>نوع ملک</th><th>کل</th><th>خرید</th><th>اجاره</th><th>میانگین بودجه (ریال)</th><th>نمودار</th></tr></thead><tbody>';
    var maxC=Math.max.apply(null,keys.map(function(k){return groups[k].count}).concat([1]));
    html+=keys.map(function(k,i){var g=groups[k];return '<tr><td class="row-num">'+num(i+1)+'</td><td><b>'+esc(k)+'</b></td><td>'+num(g.count)+'</td><td>'+num(g.buy)+'</td><td>'+num(g.rent)+'</td><td style="white-space:normal">'+money(g.count?Math.round(g.budget/g.count):0)+'</td><td style="width:30%"><div class="bar-track"><div class="bar-fill gold" data-w="'+(g.count/maxC*100)+'">'+num(g.count)+'</div></div></td></tr>'}).join('');
    html+='</tbody></table></div></div>';
    var out=c.querySelector('#rOut');out.innerHTML=html;
    requestAnimationFrame(function(){out.querySelectorAll('.bar-fill').forEach(function(b){b.style.width=b.dataset.w+'%'})});
    lastResult={
      print:function(){UI.printHTML('گزارش درخواست مشتریان','<table class="p-table"><tr><th>نوع ملک</th><th>کل</th><th>خرید</th><th>اجاره</th><th>میانگین بودجه (ریال)</th></tr>'+keys.map(function(k){var g=groups[k];return '<tr><td>'+esc(k)+'</td><td>'+num(g.count)+'</td><td>'+num(g.buy)+'</td><td>'+num(g.rent)+'</td><td>'+Jal.toEn(num(g.count?Math.round(g.budget/g.count):0))+'</td></tr>'}).join('')+'</table>')},
      csv:function(){UI.csv('report-customers.csv',['نوع ملک','کل','خرید','اجاره','میانگین بودجه'],keys.map(function(k){return [k,groups[k].count,groups[k].buy,groups[k].rent,groups[k].count?Math.round(groups[k].budget/groups[k].count):0]}))}
    };
  }
  function renderVisits(visits){
    var groups={};
    visits.forEach(function(x){
      var j=Jal.parse(x.date);var g=j?(Jal.toFa(j.jy)+'/'+Jal.toFa(Jal.pad2(j.jm))):'نامشخص';
      if(!groups[g])groups[g]={count:0,done:0,sched:0,cancel:0};
      groups[g].count++;
      if(x.status==='done')groups[g].done++;else if(x.status==='scheduled')groups[g].sched++;else groups[g].cancel++;
    });
    var keys=Object.keys(groups).sort();
    var html='<div class="sum-cards"><div class="sum-card"><div class="sc-n">'+num(visits.length)+'</div><div class="sc-l">کل بازدیدها</div></div>'
      +'<div class="sum-card"><div class="sc-n">'+num(visits.filter(function(x){return x.status==='done'}).length)+'</div><div class="sc-l">انجام‌شده</div></div>'
      +'<div class="sum-card"><div class="sc-n">'+num(visits.filter(function(x){return x.status==='scheduled'}).length)+'</div><div class="sc-l">پیش‌رو</div></div>'
      +'<div class="sum-card"><div class="sc-n">'+num(visits.filter(function(x){return x.status==='canceled'}).length)+'</div><div class="sc-l">لغو‌شده</div></div></div>';
    html+='<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>ماه</th><th>کل</th><th>انجام‌شده</th><th>پیش‌رو</th><th>لغو</th><th>نرخ انجام</th></tr></thead><tbody>';
    html+=keys.map(function(k,i){var g=groups[k];return '<tr><td class="row-num">'+num(i+1)+'</td><td><b>'+esc(k)+'</b></td><td>'+num(g.count)+'</td><td>'+num(g.done)+'</td><td>'+num(g.sched)+'</td><td>'+num(g.cancel)+'</td><td>'+Jal.toFa(g.count?Math.round(g.done/g.count*100):0)+'٪</td></tr>'}).join('');
    html+='</tbody></table></div></div>';
    var out=c.querySelector('#rOut');out.innerHTML=html;
    lastResult={
      print:function(){UI.printHTML('گزارش بازدیدها','<table class="p-table"><tr><th>ماه</th><th>کل</th><th>انجام‌شده</th><th>پیش‌رو</th><th>لغو</th></tr>'+keys.map(function(k){return '<tr><td>'+esc(k)+'</td><td>'+num(groups[k].count)+'</td><td>'+num(groups[k].done)+'</td><td>'+num(groups[k].sched)+'</td><td>'+num(groups[k].cancel)+'</td></tr>'}).join('')+'</table>')},
      csv:function(){UI.csv('report-visits.csv',['ماه','کل','انجام‌شده','پیش‌رو','لغو'],keys.map(function(k){return [k,groups[k].count,groups[k].done,groups[k].sched,groups[k].cancel]}))}
    };
  }
  function renderFinance(props,commB,commR){
    var done=props.filter(function(p){return p.status==='sold'||p.status==='rented'});
    var rows=done.map(function(p){
      var isRent=p.status==='rented';
      var base=isRent?(+p.rentMonthly||0):valueOf(p);
      var comm=isRent?Math.round(base*commR/100):Math.round(base*commB/100*2);
      return{p:p,isRent:isRent,base:base,comm:comm};
    });
    var totalComm=rows.reduce(function(s,r){return s+r.comm},0);
    var totalVal=rows.reduce(function(s,r){return s+r.base},0);
    var html='<div class="sum-cards">'
      +'<div class="sum-card"><div class="sc-n">'+num(done.length)+'</div><div class="sc-l">معاملات انجام‌شده</div></div>'
      +'<div class="sum-card"><div class="sc-n" style="font-size:14px">'+money(totalVal)+'</div><div class="sc-l">ارزش معاملات</div></div>'
      +'<div class="sum-card"><div class="sc-n" style="font-size:14px">'+money(totalComm)+'</div><div class="sc-l">کمیسیون برآوردی بنگاه</div></div>'
      +'<div class="sum-card"><div class="sc-n">'+num(props.filter(function(p){return p.status==='active'}).length)+'</div><div class="sc-l">املاک فعال در انتظار</div></div></div>';
    if(!rows.length)html+=emptyBox('💵','هنوز معامله‌ای نهایی نشده','وضعیت املاک فروش‌رفته یا اجاره‌داده‌شده را در بخش املاک تغییر دهید');
    else{
      html+='<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>کد</th><th>عنوان</th><th>نوع معامله</th><th>پایه محاسبه (ریال)</th><th>کمیسیون برآوردی (ریال)</th></tr></thead><tbody>';
      html+=rows.map(function(r,i){return '<tr><td class="row-num">'+num(i+1)+'</td><td><b>'+esc(r.p.code)+'</b></td><td style="white-space:normal;max-width:240px">'+esc(r.p.title)+'</td><td>'+(r.isRent?'🔑 اجاره':'💰 فروش')+'</td><td style="white-space:normal">'+money(r.base)+'</td><td style="white-space:normal;color:var(--gold);font-weight:700">'+money(r.comm)+'</td></tr>'}).join('');
      html+='</tbody></table></div><div class="hint" style="margin-top:9px">نرخ کمیسیون فروش: '+Jal.toFa(commB)+'٪ (از هر دو طرف) — نرخ کمیسیون اجاره: '+Jal.toFa(commR)+'٪ اجاره ماهانه. در بخش ابزار مالی قابل تنظیم است.</div></div>';
    }
    var out=c.querySelector('#rOut');out.innerHTML=html;
    lastResult={
      print:function(){UI.printHTML('گزارش مالی و کمیسیون','<table class="p-table"><tr><th>#</th><th>کد</th><th>عنوان</th><th>نوع</th><th>پایه (ریال)</th><th>کمیسیون (ریال)</th></tr>'+rows.map(function(r,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(r.p.code)+'</td><td>'+esc(r.p.title)+'</td><td>'+(r.isRent?'اجاره':'فروش')+'</td><td>'+Jal.toEn(num(r.base))+'</td><td>'+Jal.toEn(num(r.comm))+'</td></tr>'}).join('')+'</table><div class="p-note">جمع کمیسیون برآوردی: '+Jal.toEn(num(totalComm))+' ریال</div>')},
      csv:function(){UI.csv('report-finance.csv',['کد','عنوان','نوع','پایه (ریال)','کمیسیون (ریال)'],rows.map(function(r){return [r.p.code,r.p.title,r.isRent?'اجاره':'فروش',r.base,r.comm]}))}
    };
  }
};

/* ═════════════════════════ ابزار مالی ═════════════════════════ */
Pages.finance=function(){
  App.setTitle('ابزارهای مالی');
  var c=UI.el('<div>'
    +pageHead('🧮 ابزارهای مالی','محاسبه کمیسیون بنگاه، اقساط وام و تبدیل رهن و اجاره')
    +'<div class="fin-tools">'
    +'<div class="card anim-up" style="--d:.04s"><div class="card-title"><span class="dot"></span>💵 محاسبه کمیسیون بنگاه</div>'
      +'<div class="field"><label>نوع معامله</label><div class="seg" id="commSeg"><button type="button" data-v="sale" class="on">فروش</button><button type="button" data-v="rent">اجاره</button></div></div>'
      +'<div class="field" style="margin-top:10px"><label>مبلغ معامله (ریال)</label><div class="money-wrap"><input class="input money-input" id="commAmt"></div></div>'
      +'<div class="field money-wrap" style="margin-top:10px;display:none" id="commRentRow"><label>مبلغ اجاره ماهانه (ریال)</label><div class="money-wrap"><input class="input money-input" id="commRent"></div></div>'
      +'<div class="field" style="margin-top:10px"><label>نرخ کمیسیون (٪)</label><input class="input" id="commRate" type="number" step="0.1" value="0.5"></div>'
      +'<div class="check-line"><input type="checkbox" id="commBoth" checked><span>محاسبه از هر دو طرف معامله (خریدار و فروشنده)</span></div>'
      +'<div class="fin-result" id="commOut"><div style="color:var(--muted);font-size:12px">مبلغ را وارد کنید...</div></div>'
      +'<button class="btn btn-ghost btn-sm" id="commPrint" style="margin-top:12px">🖨 چاپ رسید کمیسیون</button>'
    +'</div>'
    +'<div class="card anim-up" style="--d:.1s"><div class="card-title"><span class="dot"></span>🏦 جدول اقساط وام</div>'
      +'<div class="form-grid" style="grid-template-columns:1fr 1fr">'
      +'<div class="field"><label>مبلغ وام (ریال)</label><div class="money-wrap"><input class="input money-input" id="loanAmt"></div></div>'
      +'<div class="field"><label>نرخ سود سالانه (٪)</label><input class="input" id="loanRate" type="number" step="0.1" value="23"></div>'
      +'<div class="field col-2"><label>مدت بازپرداخت (ماه)</label><input class="input" id="loanLen" type="number" value="120"></div>'
      +'</div>'
      +'<div class="fin-result" id="loanOut"><div style="color:var(--muted);font-size:12px">اطلاعات وام را وارد کنید...</div></div>'
      +'<button class="btn btn-ghost btn-sm" id="loanPrint" style="margin-top:12px">🖨 چاپ جدول اقساط</button>'
    +'</div>'
    +'<div class="card anim-up" style="--d:.16s"><div class="card-title"><span class="dot"></span>🔄 تبدیل رهن و اجاره</div>'
      +'<div class="field"><label>جهت تبدیل</label><div class="seg" id="cvSeg"><button type="button" data-v="toRent" class="on">رهن → اجاره</button><button type="button" data-v="toRahn">اجاره → رهن</button></div></div>'
      +'<div class="field" style="margin-top:10px"><label><span id="cvLabel">مبلغ رهن (ریال)</span></label><div class="money-wrap"><input class="input money-input" id="cvAmt"></div></div>'
      +'<div class="field" style="margin-top:10px"><label>هر ۱۰۰٬۰۰۰٬۰۰۰ ریال رهن = چند ریال اجاره؟</label><input class="input" id="cvRate" type="number" value="3000000"><div class="hint">عرف بازار تهران حدود ۳٬۰۰۰٬۰۰۰ ریال (۳۰۰ هزار تومان) است</div></div>'
      +'<div class="fin-result" id="cvOut"><div style="color:var(--muted);font-size:12px">مبلغ را وارد کنید...</div></div>'
    +'</div>'
    +'</div></div>');
  App.setContent(c);
  /* کمیسیون */
  var commData=null;
  c.querySelector('#commSeg').querySelectorAll('button').forEach(function(b){
    b.onclick=function(){
      c.querySelector('#commSeg').querySelectorAll('button').forEach(function(z){z.classList.remove('on')});
      b.classList.add('on');
      var rent=b.dataset.v==='rent';
      c.querySelector('#commRentRow').style.display=rent?'':'none';
      c.querySelector('#commAmt').parentElement.parentElement.style.display=rent?'none':'';
      c.querySelector('#commRate').value=rent?25:0.5;
      calcComm();
    };
  });
  function calcComm(){
    var rent=c.querySelector('#commSeg .on').dataset.v==='rent';
    var amt=+Jal.toEn(rent?c.querySelector('#commRent').value:c.querySelector('#commAmt').value)||0;
    var rate=+Jal.toEn(c.querySelector('#commRate').value)||0;
    var both=c.querySelector('#commBoth').checked;
    if(!amt){c.querySelector('#commOut').innerHTML='<div style="color:var(--muted);font-size:12px">مبلغ را وارد کنید...</div>';commData=null;return}
    var one=Math.round(amt*rate/100);
    var total=both?one*2:one;
    c.querySelector('#commOut').innerHTML=
      '<div class="fr-row"><span>نوع معامله</span><b>'+(rent?'رهن و اجاره':'فروش')+'</b></div>'
      +'<div class="fr-row"><span>پایه محاسبه</span><b>'+money(amt)+'</b></div>'
      +'<div class="fr-row"><span>نرخ کمیسیون</span><b>'+Jal.toFa(rate)+'٪</b></div>'
      +'<div class="fr-row"><span>کمیسیون هر طرف</span><b>'+money(one)+'</b></div>'
      +(both?'<div class="fr-row"><span>کمیسیون کل (دو طرف)</span><b style="color:var(--gold);font-size:15px">'+money(total)+'</b></div>':'');
    commData={rent:rent,amt:amt,rate:rate,one:one,total:total,both:both};
  }
  c.querySelector('#commAmt').oninput=calcComm;
  c.querySelector('#commRent').oninput=calcComm;
  c.querySelector('#commRate').oninput=calcComm;
  c.querySelector('#commBoth').onchange=calcComm;
  c.querySelector('#commPrint').onclick=function(){
    if(!commData){UI.toast('اول مبلغ را وارد کنید','warn');return}
    UI.printHTML('رسید کمیسیون بنگاه',
      '<div class="p-price">نوع معامله: '+(commData.rent?'رهن و اجاره':'فروش')+'</div>'
      +'<div class="p-kv"><div><div class="k">پایه محاسبه</div><div class="v">'+commData.amt+' ریال</div></div>'
      +'<div><div class="k">نرخ کمیسیون</div><div class="v">'+Jal.toEn(Jal.toFa(commData.rate))+'٪</div></div>'
      +'<div><div class="k">کمیسیون هر طرف</div><div class="v">'+commData.one+' ریال</div></div>'
      +'<div><div class="k">کمیسیون کل</div><div class="v">'+commData.total+' ریال</div></div>'
      +'<div><div class="k">کاربر</div><div class="v">'+esc(App.user.fullName)+'</div></div>'
      +'<div><div class="k">تاریخ</div><div class="v">'+Jal.fmt(Jal.today().jy,Jal.today().jm,Jal.today().jd)+'</div></div></div>'
      +'<div class="p-foot"><span>امضای فروشنده/موجر: ...............</span><span>امضای خریدار/مستأجر: ...............</span><span>مهر بنگاه</span></div>');
  };
  /* وام */
  var loanData=null;
  function calcLoan(){
    var P=+Jal.toEn(c.querySelector('#loanAmt').value)||0;
    var annual=+Jal.toEn(c.querySelector('#loanRate').value)||0;
    var n=+Jal.toEn(c.querySelector('#loanLen').value)||0;
    if(!P||!n){c.querySelector('#loanOut').innerHTML='<div style="color:var(--muted);font-size:12px">اطلاعات وام را وارد کنید...</div>';loanData=null;return}
    var r=annual/100/12;
    var A=r>0?Math.round(P*r/(1-Math.pow(1+r,-n))):Math.round(P/n);
    var totalPay=A*n,totalInt=totalPay-P;
    c.querySelector('#loanOut').innerHTML=
      '<div class="fr-row"><span>قسط ماهانه</span><b style="font-size:15px;color:var(--gold)">'+money(A)+'</b></div>'
      +'<div class="fr-row"><span>کل بازپرداخت</span><b>'+money(totalPay)+'</b></div>'
      +'<div class="fr-row"><span>کل سود</span><b style="color:var(--danger)">'+money(totalInt)+'</b></div>'
      +'<div class="fr-row"><span>تعداد اقساط</span><b>'+num(n)+' ماه</b></div>';
    loanData={P:P,annual:annual,n:n,r:r,A:A,totalPay:totalPay,totalInt:totalInt};
  }
  c.querySelector('#loanAmt').oninput=calcLoan;
  c.querySelector('#loanRate').oninput=calcLoan;
  c.querySelector('#loanLen').oninput=calcLoan;
  c.querySelector('#loanPrint').onclick=function(){
    if(!loanData){UI.toast('اول اطلاعات وام را وارد کنید','warn');return}
    var d=loanData,bal=d.P,rows='';
    for(var i=1;i<=d.n;i++){
      var int=Math.round(bal*d.r),pr=d.A-int;bal-=pr;if(bal<0)bal=0;
      rows+='<tr><td>'+Jal.toFa(i)+'</td><td>'+d.A+'</td><td>'+int+'</td><td>'+pr+'</td><td>'+bal+'</td></tr>';
    }
    UI.printHTML('جدول اقساط وام',
      '<div class="p-price">قسط ماهانه: '+d.A+' ریال — مدت: '+Jal.toFa(d.n)+' ماه — نرخ سود سالانه: '+Jal.toFa(d.annual)+'٪</div>'
      +'<table class="p-table"><tr><th>قسط</th><th>مبلغ قسط (ریال)</th><th>سود (ریال)</th><th>اصل (ریال)</th><th>مانده (ریال)</th></tr>'+rows+'</table>');
  };
  /* تبدیل */
  function calcCv(){
    var toRent=c.querySelector('#cvSeg .on').dataset.v==='toRent';
    var amt=+Jal.toEn(c.querySelector('#cvAmt').value)||0;
    var rate=+Jal.toEn(c.querySelector('#cvRate').value)||3000000;
    if(!amt){c.querySelector('#cvOut').innerHTML='<div style="color:var(--muted);font-size:12px">مبلغ را وارد کنید...</div>';return}
    var res=Math.round(amt/100000000*rate);
    c.querySelector('#cvOut').innerHTML=toRent
      ?'<div class="fr-row"><span>مبلغ رهن</span><b>'+money(amt)+'</b></div><div class="fr-row"><span>معادل اجاره ماهانه</span><b style="color:var(--gold);font-size:15px">'+money(res)+'</b></div>'
      :'<div class="fr-row"><span>مبلغ اجاره ماهانه</span><b>'+money(amt)+'</b></div><div class="fr-row"><span>معادل رهن</span><b style="color:var(--gold);font-size:15px">'+money(res)+'</b></div>';
  }
  c.querySelector('#cvSeg').querySelectorAll('button').forEach(function(b){
    b.onclick=function(){
      c.querySelector('#cvSeg').querySelectorAll('button').forEach(function(z){z.classList.remove('on')});
      b.classList.add('on');
      c.querySelector('#cvLabel').textContent=b.dataset.v==='toRent'?'مبلغ رهن (ریال)':'مبلغ اجاره ماهانه (ریال)';
      calcCv();
    };
  });
  c.querySelector('#cvAmt').oninput=calcCv;
  c.querySelector('#cvRate').oninput=calcCv;
};

/* ═════════════════════════ کاربران (مدیر) ═════════════════════════ */
Pages.users=function(){
  App.setTitle('مدیریت کاربران');
  var c=UI.el('<div>'
    +pageHead('👥 مدیریت کاربران','تعریف کاربران، سطوح دسترسی و مشاهده گزارش فعالیت‌ها',
      '<button class="btn btn-gold" id="uAdd">＋ کاربر جدید</button>')
    +'<div class="card anim-up" style="--d:.06s" id="uTable"></div>'
    +'<div class="card anim-up" style="--d:.12s;margin-top:16px"><div class="card-title"><span class="dot"></span>📜 گزارش فعالیت‌های کاربران</div><div id="uLogs"></div></div>'
    +'</div>');
  App.setContent(c);
  function load(){
    DB.users.all().then(function(users){
      users.sort(function(a,b){return a.role===b.role?a.username.localeCompare(b.username):(a.role==='admin'?-1:1)});
      var rows=users.map(function(u){
        return '<tr>'
          +'<td><div style="display:flex;align-items:center;gap:10px"><div class="uc-avatar" style="width:33px;height:33px;font-size:13px">'+esc((u.fullName||u.username).charAt(0))+'</div><div><b>'+esc(u.fullName||u.username)+'</b><br><span style="font-size:11px;color:var(--muted)" dir="ltr">@'+esc(u.username)+'</span></div></div></td>'
          +'<td><span class="role-badge '+(u.role==='admin'?'admin':'user')+'">'+(u.role==='admin'?'👑 مدیر':'👤 کاربر')+'</span></td>'
          +'<td>'+(u.active?'<span class="chip ok">فعال</span>':'<span class="chip gray">غیرفعال</span>')+'</td>'
          +'<td>'+esc(u.createdAt||'—')+'</td>'
          +'<td><div style="display:flex;gap:4px">'
            +'<button class="btn btn-xs btn-ghost" data-edit="'+u.id+'">✏️ ویرایش</button>'
            +'<button class="btn btn-xs btn-ghost" data-pass="'+u.id+'">🔑 رمز</button>'
            +'<button class="btn btn-xs btn-ghost" data-toggle="'+u.id+'">'+(u.active?'⏸ غیرفعال':'▶ فعال')+'</button>'
            +(u.username!==App.user.username?'<button class="btn btn-xs btn-ghost" data-del="'+u.id+'" style="color:var(--danger)">🗑</button>':'')
          +'</div></td></tr>';
      }).join('');
      var box=c.querySelector('#uTable');
      box.innerHTML='<div class="table-wrap"><table class="data-table"><thead><tr><th>کاربر</th><th>نقش</th><th>وضعیت</th><th>تاریخ ایجاد</th><th>عملیات</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
      box.querySelectorAll('[data-edit]').forEach(function(b){b.onclick=function(){userForm(users.find(function(u){return u.id===b.dataset.edit}),load)}});
      box.querySelectorAll('[data-pass]').forEach(function(b){b.onclick=function(){passForm(users.find(function(u){return u.id===b.dataset.pass}))}});
      box.querySelectorAll('[data-toggle]').forEach(function(b){b.onclick=function(){
        var u=users.find(function(z){return z.id===b.dataset.toggle});
        u.active=!u.active;
        DB.users.save(u).then(function(){DB.log(u.active?'فعال‌سازی کاربر':'غیرفعال‌سازی کاربر',u.username);UI.toast('وضعیت کاربر تغییر کرد','ok');load()});
      }});
      box.querySelectorAll('[data-del]').forEach(function(b){b.onclick=function(){
        var u=users.find(function(z){return z.id===b.dataset.del});
        UI.confirm('حذف کاربر','آیا از حذف کاربر «'+esc(u.fullName||u.username)+'» مطمئن هستید؟',true).then(function(y){
          if(!y)return;
          DB.users.del(u.id).then(function(){DB.log('حذف کاربر',u.username);UI.toast('کاربر حذف شد','ok');load()});
        });
      }});
    });
    DB.logs.all().then(function(logs){
      logs.sort(function(a,b){return b.at-a.at});
      logs=logs.slice(0,60);
      var html=logs.length?'<div class="table-wrap"><table class="data-table"><thead><tr><th>زمان</th><th>کاربر</th><th>عملیات</th><th>جزئیات</th></tr></thead><tbody>'
        +logs.map(function(l){
          var d=new Date(l.at);
          var t=Jal.toFa(d.getHours())+':'+Jal.toFa(('0'+d.getMinutes()).slice(-2));
          return '<tr><td style="font-size:11px">'+t+'</td><td>'+esc(l.user)+'</td><td><span class="chip gold" style="font-size:10px">'+esc(l.action)+'</span></td><td style="white-space:normal;color:var(--muted);font-size:11.5px">'+esc(l.detail||'—')+'</td></tr>';
        }).join('')+'</tbody></table></div>':emptyBox('📜','فعالیتی ثبت نشده');
      c.querySelector('#uLogs').innerHTML=html;
    });
  }
  c.querySelector('#uAdd').onclick=function(){userForm(null,load)};
  load();
};

function userForm(existing,after){
  var x=existing||{};
  var body=UI.el('<div><div class="form-grid" style="grid-template-columns:1fr 1fr">'
    +'<div class="field"><label>نام و نام خانوادگی <span class="req">*</span></label><input class="input" id="uName" value="'+esc(x.fullName||'')+'"></div>'
    +'<div class="field"><label>نام کاربری <span class="req">*</span></label><input class="input" id="uUser" dir="ltr" style="text-align:left" value="'+esc(x.username||'')+'"'+(existing?' readonly':'')+'></div>'
    +'<div class="field"><label>نقش کاربر</label><select class="select" id="uRole"><option value="user"'+(x.role!=='admin'?' selected':'')+'>👤 کاربر عادی (ثبت اطلاعات، گزارش و چاپ)</option><option value="admin"'+(x.role==='admin'?' selected':'')+'>👑 مدیر (دسترسی کامل)</option></select></div>'
    +(existing?'':'<div class="field"><label>گذرواژه <span class="req">*</span></label><input class="input" id="uPass" type="password" placeholder="حداقل ۴ کاراکتر"></div>')
    +'</div><div class="check-line" style="margin-top:8px"><input type="checkbox" id="uActive" checked '+(x.active!==false?'checked':'')+'><span>کاربر فعال باشد</span></div></div>');
  var m=UI.modal({title:existing?'ویرایش کاربر':'ایجاد کاربر جدید',icon:'👥',size:'sm',body:body,buttons:[
    {label:'انصراف',cls:'btn-ghost',onClick:function(){m.close()}},
    {label:'ذخیره',cls:'btn-gold',onClick:function(){
      var fullName=body.querySelector('#uName').value.trim();
      var username=body.querySelector('#uUser').value.trim().toLowerCase();
      var pass=existing?null:body.querySelector('#uPass').value;
      if(!fullName||!username){UI.toast('نام و نام کاربری الزامی است','err');return}
      if(!existing&&(!pass||pass.length<4)){UI.toast('گذرواژه حداقل ۴ کاراکتر باشد','err');return}
      DB.users.all().then(function(us){
        if(us.some(function(u){return u.username===username&&u.id!==x.id})){UI.toast('این نام کاربری قبلاً استفاده شده','err');return}
        var o=Object.assign({},x,{fullName:fullName,username:username,role:body.querySelector('#uRole').value,active:body.querySelector('#uActive').checked});
        if(!existing){o.pass=DB.hash(pass);o.createdAt=Jal.fmt(Jal.today().jy,Jal.today().jm,Jal.today().jd)}
        DB.users.save(o).then(function(){DB.log(existing?'ویرایش کاربر':'ایجاد کاربر',username);UI.toast('کاربر ذخیره شد','ok');m.close();after&&after()});
      });
    }}
  ]});
}

function passForm(u){
  var body=UI.el('<div><div class="field"><label>گذرواژه جدید <span class="req">*</span></label><input class="input" id="p1" type="password"></div><div class="field" style="margin-top:10px"><label>تکرار گذرواژه</label><input class="input" id="p2" type="password"></div></div>');
  var m=UI.modal({title:'🔑 تغییر گذرواژه — '+esc(u.fullName||u.username),icon:'🔑',size:'sm',body:body,buttons:[
    {label:'انصراف',cls:'btn-ghost',onClick:function(){m.close()}},
    {label:'تغییر رمز',cls:'btn-gold',onClick:function(){
      var p1=body.querySelector('#p1').value,p2=body.querySelector('#p2').value;
      if(!p1||p1.length<4){UI.toast('گذرواژه حداقل ۴ کاراکتر باشد','err');return}
      if(p1!==p2){UI.toast('تکرار گذرواژه مطابقت ندارد','err');return}
      u.pass=DB.hash(p1);
      DB.users.save(u).then(function(){DB.log('تغییر گذرواژه',u.username);UI.toast('گذرواژه تغییر کرد','ok');m.close()});
    }}
  ]});
}

/* ═════════════════════════ تنظیمات و پشتیبان‌گیری (مدیر) ═════════════════════════ */
Pages.settings=function(){
  App.setTitle('تنظیمات و پشتیبان‌گیری');
  var c=UI.el('<div>'
    +pageHead('⚙️ تنظیمات و پشتیبان‌گیری','اطلاعات بنگاه برای چاپ گزارش‌ها، نرخ کمیسیون و مدیریت داده‌ها')
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start">'
    +'<div class="card anim-up" style="--d:.04s"><div class="card-title"><span class="dot"></span>🏢 اطلاعات بنگاه (در چاپ‌ها نمایش داده می‌شود)</div>'
      +'<div class="field"><label>نام بنگاه</label><input class="input" id="sName"></div>'
      +'<div class="field" style="margin-top:10px"><label>تلفن</label><input class="input" id="sPhone"></div>'
      +'<div class="field" style="margin-top:10px"><label>آدرس</label><input class="input" id="sAddr"></div>'
      +'<div class="form-grid" style="grid-template-columns:1fr 1fr;margin-top:10px">'
      +'<div class="field"><label>نرخ کمیسیون فروش (٪)</label><input class="input" id="sCommB" type="number" step="0.1"></div>'
      +'<div class="field"><label>نرخ کمیسیون اجاره (٪)</label><input class="input" id="sCommR" type="number" step="0.1"></div>'
      +'</div>'
      +'<button class="btn btn-gold" id="sSave" style="margin-top:14px">💾 ذخیره تنظیمات</button>'
    +'</div>'
    +'<div><div class="card anim-up" style="--d:.1s"><div class="card-title"><span class="dot"></span>💾 پشتیبان‌گیری و بازیابی</div>'
      +'<p style="font-size:12.5px;color:var(--muted);line-height:2;margin-bottom:12px">از کل پایگاه داده (املاک، مشتریان، بازدیدها، کاربران و تنظیمات) فایل پشتیبان تهیه کنید و در محل امن نگهداری نمایید.</p>'
      +'<div style="display:flex;gap:9px;flex-wrap:wrap">'
      +'<button class="btn btn-primary" id="bExport">⬇ خروجی پشتیبان (JSON)</button>'
      +'<label class="btn btn-ghost" style="cursor:pointer">⬆ بازیابی از فایل<input type="file" id="bImport" accept=".json" style="display:none"></label>'
      +'</div></div>'
      +'<div class="card anim-up" style="--d:.16s;margin-top:16px;border-color:rgba(255,93,115,.3)"><div class="card-title" style="color:var(--danger)"><span class="dot" style="background:var(--grad-danger)"></span>⚠️ منطقه خطر</div>'
      +'<p style="font-size:12.5px;color:var(--muted);line-height:2;margin-bottom:12px">پاک‌سازی کامل تمام داده‌های برنامه. این عمل قابل بازگشت نیست!</p>'
      +'<button class="btn btn-danger" id="bWipe">🗑 پاک‌سازی کامل پایگاه داده</button>'
      +'<button class="btn btn-ghost" id="bSeed" style="margin-right:8px">♻️ بارگذاری مجدد داده نمونه</button>'
      +'</div></div>'
    +'</div></div>');
  App.setContent(c);
  Promise.all([DB.getSetting('agencyName'),DB.getSetting('agencyPhone'),DB.getSetting('agencyAddr'),DB.getSetting('commBuy'),DB.getSetting('commRent')]).then(function(rs){
    c.querySelector('#sName').value=rs[0]||'';
    c.querySelector('#sPhone').value=rs[1]||'';
    c.querySelector('#sAddr').value=rs[2]||'';
    c.querySelector('#sCommB').value=rs[3]||0.5;
    c.querySelector('#sCommR').value=rs[4]||25;
  });
  c.querySelector('#sSave').onclick=function(){
    Promise.all([
      DB.setSetting('agencyName',c.querySelector('#sName').value.trim()),
      DB.setSetting('agencyPhone',c.querySelector('#sPhone').value.trim()),
      DB.setSetting('agencyAddr',c.querySelector('#sAddr').value.trim()),
      DB.setSetting('commBuy',c.querySelector('#sCommB').value||'0.5'),
      DB.setSetting('commRent',c.querySelector('#sCommR').value||'25')
    ]).then(function(){
      document.getElementById('sideAgencyName').textContent=c.querySelector('#sName').value.trim()||'املاک‌پلاس';
      DB.log('ذخیره تنظیمات','');UI.toast('تنظیمات ذخیره شد','ok');
    });
  };
  c.querySelector('#bExport').onclick=function(){
    Promise.all([DB.properties.all(),DB.customers.all(),DB.visits.all(),DB.users.all(),DB.logs.all()]).then(function(rs){
      var backup={app:'AmlakPro',version:1,exportedAt:new Date().getTime(),
        settings:{},properties:rs[0],customers:rs[1],visits:rs[2],users:rs[3],logs:rs[4]};
      var need={agencyName:1,agencyPhone:1,agencyAddr:1,commBuy:1,commRent:1};
      var jobs=Object.keys(need).map(function(k){return DB.getSetting(k).then(function(v){backup.settings[k]=v})});
      Promise.all(jobs).then(function(){
        var blob=new Blob([JSON.stringify(backup,null,1)],{type:'application/json'});
        var a=document.createElement('a');
        a.href=URL.createObjectURL(blob);
        a.download='AmlakPro-Backup-'+Jal.fmt(Jal.today().jy,Jal.today().jm,Jal.today().jd).replace(/\//g,'-')+'.json';
        a.click();
        setTimeout(function(){URL.revokeObjectURL(a.href)},4000);
        DB.log('تهیه پشتیبان','');UI.toast('فایل پشتیبان دانلود شد','ok');
      });
    });
  };
  c.querySelector('#bImport').onchange=function(e){
    var f=e.target.files[0];
    if(!f)return;
    var reader=new FileReader();
    reader.onload=function(){
      var data;
      try{data=JSON.parse(reader.responseText)}catch(err){UI.toast('فایل پشتیبان معتبر نیست','err');return}
      if(!data||data.app!=='AmlakPro'){UI.toast('این فایل پشتیبان املاک‌پلاس نیست','err');return}
      UI.confirm('بازیابی پشتیبان','همه داده‌های فعلی با محتوای فایل پشتیبان جایگزین می‌شود. مطمئن هستید؟',true).then(function(y){
        if(!y)return;
        restore(data).then(function(){DB.log('بازیابی پشتیبان','');UI.toast('پشتیبان با موفقیت بازیابی شد','ok');App.refreshUserChip()});
      });
    };
    reader.readAsText(f);
    e.target.value='';
  };
  function restore(data){
    return Promise.all([
      DB.properties.clear(),DB.customers.clear(),DB.visits.clear(),DB.users.clear(),DB.logs.clear()
    ]).then(function(){
      var jobs=[];
      (data.properties||[]).forEach(function(p){jobs.push(DB.properties.save(p))});
      (data.customers||[]).forEach(function(p){jobs.push(DB.customers.save(p))});
      (data.visits||[]).forEach(function(p){jobs.push(DB.visits.save(p))});
      (data.users||[]).forEach(function(p){jobs.push(DB.users.save(p))});
      (data.logs||[]).forEach(function(p){jobs.push(DB.logs.save(p))});
      Object.keys(data.settings||{}).forEach(function(k){jobs.push(DB.setSetting(k,data.settings[k]))});
      return Promise.all(jobs);
    });
  }
  c.querySelector('#bWipe').onclick=function(){
    UI.confirm('پاک‌سازی کامل','تمام املاک، مشتریان، بازدیدها و کاربران برای همیشه حذف می‌شوند. مطمئن هستید؟',true).then(function(y){
      if(!y)return;
      UI.confirm('تأیید نهایی','واقعاً مطمئنید؟ توصیه می‌شود اول پشتیبان تهیه کنید!',true).then(function(y2){
        if(!y2)return;
        Promise.all([DB.properties.clear(),DB.customers.clear(),DB.visits.clear(),DB.users.clear(),DB.logs.clear()])
          .then(function(){DB.setSetting('seeded',0)}).then(function(){UI.toast('همه داده‌ها پاک شد','warn')});
      });
    });
  };
  c.querySelector('#bSeed').onclick=function(){
    DB.users.count().then(function(cn){
      if(cn>0){UI.toast('پایگاه داده خالی نیست — اول پاک‌سازی کنید','warn');return}
      DB.seedIfEmpty().then(function(){UI.toast('داده نمونه بارگذاری شد','ok')});
    });
  };
};

window.Pages=Pages;
window.pageHead=pageHead;
window.emptyBox=emptyBox;
})();
