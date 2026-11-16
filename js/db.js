/* ═══════════════ پایگاه داده محلی (IndexedDB) + ثابت‌ها + داده نمونه ═══════════════ */
(function(){
'use strict';

/* ───────── ثابت‌های برنامه ───────── */
var CONST={
  PTYPES:{
    apartment:{t:'آپارتمان',ico:'🏢'},
    house:{t:'خانه ویلایی',ico:'🏠'},
    land:{t:'زمین و کلنگی',ico:'🌍'},
    commercial:{t:'مغازه و تجاری',ico:'🏪'},
    office:{t:'دفتر اداری',ico:'🏛️'},
    garden:{t:'باغ و ویلا',ico:'🌳'}
  },
  DEALS:{
    sale:'فروش', rent:'رهن و اجاره', presale:'پیش‌فروش',
    partner:'مشارکت در ساخت', exchange:'مبادله', goodwill:'فروش سرقفلی'
  },
  STATUS:{
    active:{t:'فعال',c:'ok'}, reserved:{t:'رزرو شده',c:'warn'},
    sold:{t:'فروش رفته',c:'danger'}, rented:{t:'اجاره داده شده',c:'violet'}, canceled:{t:'لغو شده',c:'gray'}
  },
  DOCS:['تک‌برگ','منگوله‌دار','شش‌دانگ تک‌برگ','قولنامه‌ای','وکالتی','عرصه و اعیان','اوقافی','بدون سند'],
  DIRECTION:['شمالی','جنوبی','شرقی','غربی','دوکفه'],
  OCCUPANCY:['خالی','در حال سکونت مالک','مستأجر دارد'],
  FACADE:['سنگ','آجر','سیمان','کامپوزیت','کاشی','شیشه'],
  FLOORING:['سرامیک','پارکت','سنگ','موکت','بتن اکسپوز'],
  KITCHEN:['مخفی','اپن','هود و گاز رومیزی','بدون کابینت'],
  HEATING:['پکیج','شوفاژ مرکزی','شوفاژ دیواری','فن‌کویل','کولر گازی','گرمایش از کف','بخاری'],
  COOLING:['اسپلیت','کولر گازی','کولر آبی','چیلر مرکزی','ندارد'],
  LANDUSE:['مسکونی','تجاری','اداری','صنعتی','زراعی','باغی','تفریحی'],
  LANDKIND:['کلنگی','زمین مسکونی','زمین تجاری','زمین زراعی','باغ'],
  COMMKIND:['مغازه','غرفه بازار','دفتر اداری','سوله','انبار','رستوران و کافه'],
  GARDENKIND:['باغ','باغ‌ویلا','ویلا','خانه ویلایی'],
  CODE_PREFIX:{apartment:'A',house:'H',land:'L',commercial:'C',office:'O',garden:'G'}
};
window.CONST=CONST;

/* ───────── لایه IndexedDB ───────── */
var DB_NAME='amlakpro_db', DB_VER=2;
var STORES=['properties','customers','visits','users','settings','logs','updates'];
var _db=null;

function open(){
  if(_db) return Promise.resolve(_db);
  return new Promise(function(res,rej){
    var rq=indexedDB.open(DB_NAME,DB_VER);
    rq.onupgradeneeded=function(e){
      var db=e.target.result;
      STORES.forEach(function(s){ if(!db.objectStoreNames.contains(s)) db.createObjectStore(s,{keyPath:'id'}) });
    };
    rq.onsuccess=function(){ _db=rq.result; res(_db) };
    rq.onerror=function(){ rej(rq.error) };
  });
}
function tx(store,mode){ return open().then(function(db){ return db.transaction(store,mode).objectStore(store) }) }
function wrap(rq){ return new Promise(function(res,rej){ rq.onsuccess=function(){res(rq.result)}; rq.onerror=function(){rej(rq.error)} }) }

function makeStoreAPI(name){
  return {
    all:function(){ return tx(name,'readonly').then(function(s){ return wrap(s.getAll()) }) },
    get:function(id){ return tx(name,'readonly').then(function(s){ return wrap(s.get(id)) }) },
    save:function(o){ if(!o.id)o.id=uid(); return tx(name,'readwrite').then(function(s){ return wrap(s.put(o)) }).then(function(){ return o }) },
    del:function(id){ return tx(name,'readwrite').then(function(s){ return wrap(s.delete(id)) }) },
    clear:function(){ return tx(name,'readwrite').then(function(s){ return wrap(s.clear()) }) },
    count:function(){ return tx(name,'readonly').then(function(s){ return wrap(s.count()) }) }
  };
}
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8) }
function hash(str){ var h=5381,i=0; for(;i<str.length;i++){h=((h<<5)+h)+str.charCodeAt(i);h|=0} return 'h'+(h>>>0).toString(36) }

var DB={
  properties:makeStoreAPI('properties'),
  customers:makeStoreAPI('customers'),
  visits:makeStoreAPI('visits'),
  users:makeStoreAPI('users'),
  logs:makeStoreAPI('logs'),
  updates:makeStoreAPI('updates'),
  getSetting:function(k){ return tx('settings','readonly').then(function(s){ return wrap(s.get(k)) }).then(function(r){ return r?r.v:undefined }) },
  setSetting:function(k,v){ return tx('settings','readwrite').then(function(s){ return wrap(s.put({id:k,v:v})) }) },
  log:function(action,detail){
    if(!window.App||!App.user)return;
    return DB.logs.save({at:new Date().getTime(), user:App.user.fullName||App.user.username, action:action, detail:detail||''}).catch(function(){});
  },
  uid:uid, hash:hash,
  nextCode:function(ptype){
    return DB.properties.all().then(function(list){
      var pre=CONST.CODE_PREFIX[ptype]||'X';
      var max=1000;
      list.forEach(function(p){ var m=String(p.code||'').match(/-(\d+)$/); if(m) max=Math.max(max,+m[1]) });
      return pre+'-'+(max+1);
    });
  }
};
window.DB=DB;
window.APP_VERSION='1.0.3';

/* ───────── داده نمونه ───────── */
function jstr(daysAgo){ var j=Jal.addDays(Jal.today(),-(daysAgo||0)); return Jal.fmt(j.jy,j.jm,j.jd) }
function jstrFwd(days){ var j=Jal.addDays(Jal.today(),days||0); return Jal.fmt(j.jy,j.jm,j.jd) }

function seedProperty(p){
  var t=Jal.today();
  var created=jstr(p._ago||1);
  return Object.assign({
    id:uid(), status:'active', createdBy:'مدیر سیستم', createdAt:created,
    updatedAt:created, updatedBy:'مدیر سیستم', desc:''
  },p);
}

var SEED_USERS=[
  {id:uid(),username:'admin',pass:hash('admin123'),fullName:'مدیر سیستم',role:'admin',active:true,createdAt:jstr(120)},
  {id:uid(),username:'user',pass:hash('123456'),fullName:'کاربر نمونه',role:'user',active:true,createdAt:jstr(90)}
];

var SEED_SETTINGS=[
  {id:'agencyName',v:'املاک‌پلاس'},
  {id:'agencyPhone',v:'۰۲۱-۲۲۳۳۴۴۵۵'},
  {id:'agencyAddr',v:'تهران، خیابان اصلی، پلاک ۱۰۰'},
  {id:'commBuy',v:'0.5'},
  {id:'commRent',v:'25'},
  {id:'seeded',v:1}
];

var SEED_PROPS=[
  /* ── آپارتمان‌ها ── */
  seedProperty({code:'A-1001',ptype:'apartment',deal:'sale',title:'آپارتمان ۸۵ متری دو خواب نوساز نارمک',region:'نارمک، فلکه اول',
    address:'خیابان گلبرگ، کوچه مریم، پلاک ۱۲',size:85,rooms:2,floor:3,totalFloors:5,unitsPerFloor:2,buildYear:'1403',
    direction:'جنوبی',occupancy:'خالی',balcony:'دارد',parking:'تک',elevator:'دارد',storage:'دارد',facade:'سنگ',flooring:'پارکت',
    kitchen:'مخفی',heating:'پکیج',cooling:'اسپلیت',bath:'ایرانی و فرنگی',docType:'تک‌برگ',
    sellerName:'حاج رضا محمدی',sellerPhone:'09121234567',salePrice:5525000000000,pricePerMeter:65000000000,_ago:2,
    desc:'نوساز، ویو ابدی، تحویل فوری، مناسب سکونت و سرمایه‌گذاری'}),
  seedProperty({code:'A-1002',ptype:'apartment',deal:'sale',title:'آپارتمان ۱۲۰ متری لوکس سعادت‌آباد',region:'سعادت‌آباد، بلوار دریا',
    address:'خیابان صراف‌ها، برج نگین، طبقه ۸',size:120,rooms:3,floor:8,totalFloors:12,unitsPerFloor:3,buildYear:'1401',
    direction:'شمالی',occupancy:'خالی',balcony:'دارد',parking:'دوگانه',elevator:'دارد',storage:'دارد',facade:'کامپوزیت',flooring:'سنگ',
    kitchen:'اپن',heating:'فن‌کویل',cooling:'چیلر مرکزی',bath:'ایرانی و فرنگی',renovated:'بله',docType:'شش‌دانگ تک‌برگ',
    sellerName:'مهندس شیرین کاظمی',sellerPhone:'09129876543',salePrice:20400000000000,pricePerMeter:170000000000,_ago:5,
    desc:'لابی مجلل، سونا و جکوزی در مجتمع، نگهبانی ۲۴ ساعته'}),
  seedProperty({code:'A-1003',ptype:'apartment',deal:'rent',title:'آپارتمان ۷۵ متری بازسازی‌شده شهرک غرب',region:'شهرک غرب، فاز ۲',
    address:'خیابان علامه شمالی، کوچه ۱۴',size:75,rooms:2,floor:2,totalFloors:4,unitsPerFloor:1,buildYear:'1390',
    direction:'شرقی',occupancy:'خالی',balcony:'دارد',parking:'تک',elevator:'دارد',storage:'دارد',facade:'آجر',flooring:'سرامیک',
    kitchen:'هود و گاز رومیزی',heating:'شوفاژ مرکزی',cooling:'کولر آبی',bath:'فرنگی',renovated:'بله',docType:'منگوله‌دار',
    sellerName:'آقای حسین رستمی',sellerPhone:'09351112233',rahnFull:4000000000,rentMonthly:20000000,_ago:8,
    desc:'بازسازی کامل، آشپزخانه جدید، مناسب زوج جوان'}),
  seedProperty({code:'A-1004',ptype:'apartment',deal:'sale',title:'آپارتمان ۹۰ متری سه خواب تهرانپارس',region:'تهرانپارس، فلکه دوم',
    address:'خیابان جشنواره، مجتمع صدف',size:90,rooms:3,floor:1,totalFloors:4,unitsPerFloor:2,buildYear:'1394',
    direction:'جنوبی',occupancy:'مستأجر دارد',balcony:'دارد',parking:'ندارد',elevator:'دارد',storage:'دارد',facade:'سیمان',flooring:'سرامیک',
    kitchen:'مخفی',heating:'شوفاژ دیواری',cooling:'اسپلیت',bath:'ایرانی و فرنگی',docType:'تک‌برگ',status:'sold',
    sellerName:'خانم فاطمه احمدی',sellerPhone:'09127778899',salePrice:3712500000000,pricePerMeter:41250000000,_ago:12,
    desc:'قیمت بسیار مناسب، نزدیک مترو'}),
  seedProperty({code:'A-1005',ptype:'apartment',deal:'presale',title:'پیش‌فروش آپارتمان ۱۰۵ متری پونک',region:'پونک، سردار جنگل',
    address:'خیابان اشرفی اصفهانی، پروژه البرز ۳',size:105,rooms:2,floor:5,totalFloors:10,unitsPerFloor:4,buildYear:'در حال ساخت',
    direction:'دوکفه',occupancy:'خالی',parking:'تک',elevator:'دارد',storage:'دارد',facade:'کامپوزیت',docType:'قولنامه‌ای',
    sellerName:'شرکت ساختمانی آبان',sellerPhone:'02144556677',salePrice:13650000000000,pricePerMeter:130000000000,_ago:15,
    desc:'تحویل ۱۴۰۶، پیش‌پرداخت ۴۰ درصد، اقساط ۲۴ ماهه'}),
  seedProperty({code:'A-1006',ptype:'apartment',deal:'rent',title:'آپارتمان مبله ۶۰ متری یوسف‌آباد',region:'یوسف‌آباد، خیابان اسدآبادی',
    address:'کوچه نجم‌آبادی، ساختمان نیلوفر',size:60,rooms:1,floor:4,totalFloors:6,unitsPerFloor:3,buildYear:'1396',
    direction:'غربی',occupancy:'خالی',balcony:'ندارد',parking:'ندارد',elevator:'دارد',storage:'ندارد',facade:'سیمان',flooring:'پارکت',
    kitchen:'اپن',heating:'پکیج',cooling:'اسپلیت',bath:'فرنگی',docType:'تک‌برگ',status:'rented',
    sellerName:'آقای مهدی صادقی',sellerPhone:'09193334455',rahnFull:1500000000,rentMonthly:25000000,_ago:20,
    desc:'کاملاً مبله، مناسب مجردی و زوج کم‌جمعیت'}),

  /* ── خانه ویلایی ── */
  seedProperty({code:'H-2001',ptype:'house',deal:'sale',title:'خانه ویلایی ۲۲۰ متری کلنگی شهرآرا',region:'شهرآرا، ستارخان',
    address:'خیابان دکتر فاطمی، بن‌بست گلها',size:220,rooms:3,floor:0,totalFloors:1,buildYear:'1370',
    direction:'جنوبی',occupancy:'در حال سکونت مالک',parking:'دارد',facade:'آجر',flooring:'موکت',
    heating:'بخاری',cooling:'کولر آبی',bath:'ایرانی',docType:'منگوله‌دار',water:'دارد',power:'دارد',gas:'دارد',phone:'دارد',
    sellerName:'حاج آقا نوری',sellerPhone:'09124445566',salePrice:11800000000000,pricePerMeter:53636363636,_ago:4,
    desc:'کلنگی، موقعیت عالی برای ساخت ۵ طبقه، تراکم بالا'}),
  seedProperty({code:'H-2002',ptype:'house',deal:'sale',title:'خانه دو طبقه نوساز افسریه',region:'افسریه، ۳۵ متری دوم',
    address:'خیابان شهید بهشتی، پلاک ۴۵',size:180,rooms:4,floor:0,totalFloors:2,buildYear:'1400',
    direction:'شمالی',occupancy:'خالی',parking:'دارد',facade:'سیمان',flooring:'سرامیک',
    kitchen:'مخفی',heating:'پکیج',cooling:'اسپلیت',bath:'ایرانی و فرنگی',docType:'تک‌برگ',water:'دارد',power:'دارد',gas:'دارد',
    sellerName:'آقای کریم زارع',sellerPhone:'09362223344',salePrice:5760000000000,pricePerMeter:32000000000,_ago:18,
    desc:'ورودی جداگانه، حیاط اختصاصی، مناسب خانواده پرجمعیت'}),

  /* ── زمین و کلنگی ── */
  seedProperty({code:'L-3001',ptype:'land',deal:'sale',title:'زمین ۴۰۰ متری کلنگی پرند',region:'پرند، فاز ۴',
    address:'بلوار شهدای گمنام، خیابان نخل',size:400,width:15,length:27,landUse:'مسکونی',landKind:'کلنگی',
    density:'120',maxFloors:'3',water:'دارد',power:'دارد',gas:'دارد',phone:'دارد',walled:'بله',permit:'دارد',
    docType:'تک‌برگ',sellerName:'آقای عبدالله کریمی',sellerPhone:'09123334455',salePrice:6000000000000,pricePerMeter:15000000000,_ago:3,
    desc:'زمین کاملاً مسطح، انشعابات کامل، جواز ساخت صادر شده'}),
  seedProperty({code:'L-3002',ptype:'land',deal:'sale',title:'زمین ۲۵۰۰ متری زراعی ورامین',region:'ورامین، جاده قدیم',
    address:'کیلومتر ۸ جاده ورامین-پیشوا',size:2500,width:30,length:83,landUse:'زراعی',landKind:'زمین زراعی',
    water:'دارد',power:'دارد',gas:'ندارد',phone:'ندارد',walled:'خیر',permit:'ندارد',docType:'منگوله‌دار',
    sellerName:'میرزا حسین فرهادی',sellerPhone:'09179998877',salePrice:375000000000,pricePerMeter:150000000,_ago:10,
    desc:'دارای چاه آب کشاورزی، برق سه فاز، مناسب گلخانه'}),
  seedProperty({code:'L-3003',ptype:'land',deal:'partner',title:'مشارکت زمین ۳۲۰ متری نارمک',region:'نارمک، هفت‌حوض',
    address:'خیابان آیت، کوچه ۹',size:320,width:16,length:20,landUse:'مسکونی',landKind:'کلنگی',
    density:'120',maxFloors:'5',water:'دارد',power:'دارد',gas:'دارد',phone:'دارد',walled:'بله',permit:'دارد',
    docType:'شش‌دانگ تک‌برگ',sellerName:'خانم مریم سلطانی',sellerPhone:'09125556677',salePrice:12800000000000,pricePerMeter:40000000000,_ago:22,
    desc:'مشارکت در ساخت، زمین صاف، در عرض ۱۶ متری'}),
  seedProperty({code:'L-3004',ptype:'land',deal:'sale',title:'زمین ۹۰۰ متری تجاری جاده مخصوص',region:'شهرک قدس، جاده مخصوص',
    address:'ضلع غربی، پلاک ثبتی ۲۲۴',size:900,width:20,length:45,landUse:'تجاری',landKind:'زمین تجاری',
    density:'180',maxFloors:'8',water:'دارد',power:'دارد',gas:'دارد',phone:'دارد',has3Phase:'دارد',walled:'بله',permit:'دارد',
    docType:'تک‌برگ',status:'reserved',sellerName:'شرکت عمران پارس',sellerPhone:'02188776655',salePrice:90000000000000,pricePerMeter:100000000000,_ago:28,
    desc:'موقعیت طلایی برای مجتمع تجاری، دید کامل از جاده'}),

  /* ── مغازه و تجاری ── */
  seedProperty({code:'C-4001',ptype:'commercial',deal:'sale',title:'مغازه ۲۵ متری تابلوخور بازار تهران',region:'بازار بزرگ تهران',
    address:'راسته آپیله‌نو، مغازه شماره ۱۲',size:25,cKind:'مغازه',cFloor:'همکف',saran:'3.5',height:'3.5',
    goodwill:'دارد',goodwillPrice:18000000000000,signBoard:'بله',backYard:'خیر',bath:'مشترک',
    docType:'سرقفلی',sellerName:'آقای ابراهیم طاهری',sellerPhone:'09121112222',salePrice:20000000000000,_ago:6,
    desc:'سرانای ۳/۵ متر، موقعیت اصلی بازار، مناسب طلافروشی و پوشاک'}),
  seedProperty({code:'C-4002',ptype:'commercial',deal:'rent',title:'مغازه ۴۰ متری شهرآرا',region:'شهرآرا، خیابان ستارخان',
    address:'خیابان حبیب‌اللهی، مجتمع تجاری نور',size:40,cKind:'مغازه',cFloor:'همکف',saran:'5',height:'4',
    goodwill:'ندارد',signBoard:'بله',backYard:'دارد',bath:'دارد',docType:'اجاره‌نامه رسمی',
    sellerName:'خانم زهرا موسوی',sellerPhone:'09128889900',rahnFull:800000000,rentMonthly:45000000,_ago:7,
    desc:'دارای پشت‌سرا، نورگیر کامل، محل تردد بالای محله'}),
  seedProperty({code:'C-4003',ptype:'commercial',deal:'rent',title:'سوله ۳۵۰ متری انباری شهرک صنعتی',region:'شهرک صنعتی شمس‌آباد',
    address:'خیابان صنعتی ۱۲، سوله ۸',size:350,cKind:'سوله',cFloor:'همکف',saran:'10',height:'7',
    goodwill:'ندارد',signBoard:'خیر',backYard:'دارد',bath:'دارد',docType:'رسمی',
    sellerName:'شرکت بارانداز تهران',sellerPhone:'02155443322',rahnFull:3000000000,rentMonthly:60000000,_ago:25,
    desc:'برق سه فاز، بارگیری تریلی، محوطه اختصاصی ۲۰۰ متری'}),

  /* ── دفتر اداری ── */
  seedProperty({code:'O-5001',ptype:'office',deal:'rent',title:'دفتر اداری ۱۳۵ متری ونک',region:'ونک، میدان ونک',
    address:'خیابان گاندی، برج آسمان، طبقه ۷',size:135,cKind:'دفتر اداری',cFloor:'۷',saran:'6',height:'3.2',
    rooms:4,goodwill:'ندارد',signBoard:'بله',bath:'دارد',parking:'دوگانه',elevator:'دارد',
    docType:'رسمی',sellerName:'شرکت هلدینگ راهبرد',sellerPhone:'02190123456',rahnFull:6000000000,rentMonthly:90000000,_ago:9,
    desc:'ویو عالی، فضا باز با ۴ اتاق، آماده تحویل، رسیور اختصاصی'}),
  seedProperty({code:'O-5002',ptype:'office',deal:'sale',title:'دفتر ۸۰ متری جردن',region:'جردن، بلوار نلسون ماندلا',
    address:'خیابان مطهری شمالی، مجتمع اداری نور',size:80,cKind:'دفتر اداری',cFloor:'۳',saran:'4.5',height:'3',
    rooms:2,goodwill:'ندارد',signBoard:'بله',bath:'دارد',parking:'تک',elevator:'دارد',
    docType:'تک‌برگ',sellerName:'آقای بهنام رحیمی',sellerPhone:'09121113333',salePrice:9600000000000,pricePerMeter:120000000000,_ago:14,
    desc:'برج اداری با امتیازات کامل، مناسب شرکت و کلینیک'}),

  /* ── باغ و ویلا ── */
  seedProperty({code:'G-6001',ptype:'garden',deal:'sale',title:'باغ‌ویلای ۸۰۰ متری لواسان',region:'لواسان بزرگ، بلندترین نقطه',
    address:'خیابان اصلی لواسان، کوچه گلستان',size:800,bSize:250,gKind:'باغ‌ویلا',rooms:3,floors:2,buildYear:'1398',
    pool:'دارد',poolCovered:'سرپوشیده',sauna:'دارد',jacuzzi:'دارد',gazebo:'دارد',bbq:'دارد',trees:'دارد',well:'دارد',
    walled:'بله',caretaker:'دارد',water:'دارد',power:'دارد',gas:'دارد',facade:'سنگ',flooring:'سنگ',
    docType:'تک‌برگ',sellerName:'آقای فرهاد مجیدی',sellerPhone:'09127770011',salePrice:37500000000000,_ago:1,
    desc:'استخر چهارفصل سرپوشیده با گرمایش، ویو کامل تهران، مبله'}),
  seedProperty({code:'G-6002',ptype:'garden',deal:'rent',title:'ویلای ۳۰۰ متری اجاره‌ای کردان',region:'کردان، شهرک چاله‌باغ',
    address:'بلوار ولایت، خیابان ۱۲',size:300,bSize:120,gKind:'ویلا',rooms:2,floors:1,buildYear:'1395',
    pool:'ندارد',gazebo:'دارد',bbq:'دارد',trees:'دارد',walled:'بله',caretaker:'ندارد',
    water:'دارد',power:'دارد',gas:'دارد',facade:'سیمان',flooring:'سرامیک',docType:'منگوله‌دار',
    sellerName:'خانم لیلا محمدخانی',sellerPhone:'09173335577',rahnFull:1500000000,rentMonthly:15000000,_ago:16,
    desc:'محوطه سرسبز، مناسب استراحت خانوادگی، ماشین رو تا درب ملک'}),
  seedProperty({code:'G-6003',ptype:'garden',deal:'sale',title:'باغ ۲۰۰۰ متری مثمر آبسرد',region:'آبسرد، دماوند',
    address:'جاده آبسرد، کیلومتر ۳',size:2000,bSize:60,gKind:'باغ',rooms:1,floors:1,buildYear:'1380',
    pool:'ندارد',trees:'دارد',well:'دارد',walled:'بله',water:'دارد',power:'دارد',gas:'دارد',
    docType:'عرصه و اعیان',sellerName:'حاج آقا حسینی',sellerPhone:'09125550099',salePrice:4500000000000,_ago:30,
    desc:'حدود ۸۰ اصله درخت گردو و سیب، چاه اختصاصی، آبشار طبیعی مجاور'})
];

var SEED_CUSTOMERS=[
  {id:uid(),name:'آقای علی نادری',phone:'09123456789',reqType:'buy',pType:'apartment',sizeMin:80,sizeMax:110,rooms:2,
   budget:6000000000000,region:'نارمک، تهرانپارس',note:'حداکثر سن بنا ۵ سال، حتماً آسانسور',status:'open',createdAt:jstr(3),createdBy:'کاربر نمونه'},
  {id:uid(),name:'خانم سارا عزیزی',phone:'09129998877',reqType:'rent',pType:'apartment',sizeMin:60,sizeMax:80,rooms:2,
   rahnBudget:3000000000,rentBudget:30000000,region:'سعادت‌آباد، شهرک غرب',note:'مبله ترجیحاً',status:'open',createdAt:jstr(6),createdBy:'مدیر سیستم'},
  {id:uid(),name:'شرکت فناوری داده‌کاوان',phone:'02188990011',reqType:'rent',pType:'office',sizeMin:100,sizeMax:200,rooms:0,
   rahnBudget:5000000000,rentBudget:80000000,region:'ونک، جردن، شهرک غرب',note:'نیاز به پارکینگ حداقل ۲ دستگاه',status:'open',createdAt:jstr(8),createdBy:'مدیر سیستم'},
  {id:uid(),name:'آقای حسین مقصودی',phone:'09354445566',reqType:'buy',pType:'land',sizeMin:300,sizeMax:600,rooms:0,
   budget:7000000000000,region:'پرند، رباط‌کریم',note:'فقط زمین با انشعابات کامل و جواز',status:'done',createdAt:jstr(15),createdBy:'کاربر نمونه'},
  {id:uid(),name:'آقای مهدی فرهادی',phone:'09127776655',reqType:'buy',pType:'garden',sizeMin:500,sizeMax:1000,rooms:2,
   budget:40000000000000,region:'لواسان، فشم، آبعلی',note:'استخر سرپوشیده الزامی',status:'open',createdAt:jstr(10),createdBy:'مدیر سیستم'},
  {id:uid(),name:'خانم نرگس حیدری',phone:'09123334455',reqType:'buy',pType:'commercial',sizeMin:20,sizeMax:40,rooms:0,
   budget:25000000000000,region:'بازار، شهرآرا',note:'با سرقفلی، سرانای حداقل ۳ متر',status:'canceled',createdAt:jstr(25),createdBy:'مدیر سیستم'}
];

var SEED_VISITS=[
  {id:uid(),propId:'A-1001',person:'آقای علی نادری',phone:'09123456789',date:jstrFwd(0),time:'17:00',
   note:'قرار بازدید دوم، همراه همسرش می‌آیند',status:'scheduled',createdAt:jstr(1),createdBy:'کاربر نمونه'},
  {id:uid(),propId:'G-6001',person:'آقای مهدی فرهادی',phone:'09127776655',date:jstrFwd(2),time:'10:30',
   note:'بازدید باغ‌ویلا با خودرو شخصی',status:'scheduled',createdAt:jstr(2),createdBy:'مدیر سیستم'},
  {id:uid(),propId:'A-1004',person:'خانم الهام کریمی',phone:'09351119988',date:jstrFwd(3),time:'14:00',
   note:'تمایل به مذاکره قیمت دارد',status:'scheduled',createdAt:jstr(2),createdBy:'مدیر سیستم'},
  {id:uid(),propId:'C-4002',person:'آقای رضا کمالی',phone:'09198887766',date:jstrFwd(-1),time:'11:00',
   note:'بازدید انجام شد، راضی بود',status:'done',createdAt:jstr(3),createdBy:'کاربر نمونه'},
  {id:uid(),propId:'L-3001',person:'آقای حسین مقصودی',phone:'09354445566',date:jstrFwd(5),time:'09:00',
   note:'بازدید زمین با مشاور فنی',status:'scheduled',createdAt:jstr(4),createdBy:'مدیر سیستم'}
];

var SEED_LOGS=[
  {id:uid(),at:Date.now()-86400000*2,user:'مدیر سیستم',action:'راه‌اندازی اولیه',detail:'پایگاه داده با داده‌های نمونه ایجاد شد'}
];

/* ───────── مقداردهی اولیه ───────── */
DB.seedIfEmpty=function(){
  return open().then(function(){
    return DB.users.count();
  }).then(function(c){
    if(c>0) return false;
    var jobs=[];
    SEED_USERS.forEach(function(u){ jobs.push(DB.users.save(u)) });
    SEED_SETTINGS.forEach(function(s){ jobs.push(DB.setSetting(s.id,s.v)) });
    SEED_PROPS.forEach(function(p){ jobs.push(DB.properties.save(p)) });
    SEED_CUSTOMERS.forEach(function(c){ jobs.push(DB.customers.save(c)) });
    SEED_VISITS.forEach(function(v){ jobs.push(DB.visits.save(v)) });
    SEED_LOGS.forEach(function(l){ jobs.push(DB.logs.save(l)) });
    return Promise.all(jobs).then(function(){ return true });
  });
};
})();
