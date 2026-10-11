import fs from 'node:fs';
import zlib from 'node:zlib';

const parts = [
  'payload/part1.txt',
  'payload/part2a.txt',
  'payload/part2b.txt',
  'payload/part3a.txt',
  'payload/part3b.txt'
];

const base64 = parts.map((file) => fs.readFileSync(file, 'utf8').trim()).join('');
const compressed = Buffer.from(base64, 'base64');
let html = zlib.gunzipSync(compressed).toString('utf8');

const quickCss = String.raw`
<style id="quick-mode-style">
body.simple-mode main{max-width:900px}
body.simple-mode main>section,body.simple-mode #workgrid,body.simple-mode #advancedToggle{display:none!important}
body.simple-mode #quickHome,body.simple-mode .quick-result{display:block!important}
body.simple-mode #socialCards{display:none!important}
body.simple-mode.has-social-results #socialCards{display:block!important}
body.simple-mode header .sub,body.simple-mode header .thai-intro,body.simple-mode header .small{display:none!important}
body.simple-mode header{padding:28px 4px 8px}
body.simple-mode header h1{font-size:30px;text-align:center}
#quickHome{display:none;background:#fff;border:1px solid #e3e8f0;border-radius:20px;padding:22px;box-shadow:0 8px 28px #1f3d6b12}
#quickHome h2{font-size:23px;margin:0 0 6px;text-align:center}
#quickHome .quick-lead{text-align:center;color:#5f6e84;margin:0 0 18px}
#qProduct{min-height:145px}
#qPlatform{margin-bottom:14px;font-weight:700;background:#fff}
#qMedia{padding:14px;background:#f8fbff;border:2px dashed #a9bde0}
#qGo{width:100%;min-height:58px;font-size:19px;background:#1657c0;margin:14px 0 0}
#qStatus{min-height:24px;margin:10px 0 0;text-align:center;color:#52627a;font-size:14px}
#qExpert{display:block;margin:14px auto 0;background:transparent;color:#5b6b82;text-decoration:underline;box-shadow:none}
#backSimple{position:fixed;right:16px;bottom:16px;z-index:9999;background:#173e8d;color:#fff;border-radius:999px;padding:10px 14px;box-shadow:0 8px 24px #173e8d33;display:block}
body.simple-mode #backSimple{display:none}
body.simple-mode .quick-result h2{font-size:18px}
body.simple-mode .quick-result{margin-top:14px}
body.simple-mode #report,body.simple-mode #ready{display:none!important}
#socialCards{border:0;background:transparent;box-shadow:none;padding:0}
#socialCards>h2{text-align:center;font-size:24px!important;margin:22px 0 4px}
#socialCards>.social-lead{text-align:center;color:#66748a;margin:0 0 16px}
.social-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.social-card{background:#fff;border:1px solid #e1e7f0;border-radius:18px;padding:18px;box-shadow:0 5px 20px #183a6b0d}
.social-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
.social-name{font-size:20px;font-weight:800;color:#173b80}
.social-status{font-size:12px;font-weight:800;padding:5px 9px;border-radius:999px;background:#eef3fb;color:#31517f}
.social-status.block{background:#fff0f0;color:#a02b2b}.social-status.review{background:#fff7df;color:#806016}.social-status.clear{background:#eafaf1;color:#187144}
.social-next{font-size:14px;color:#53647c;margin:4px 0 12px}
.social-step{border-top:1px solid #eef1f5;padding-top:11px;margin-top:11px}
.social-step b{display:block;font-size:14px;margin-bottom:7px}
.social-action{width:100%;margin:0 0 7px;min-height:46px;background:#1657c0}
.social-action.flow{background:#6545c5}.social-action.upload{background:#217a55}
.social-note{font-size:12px;color:#6a7688;line-height:1.5}
.social-copy{margin-top:10px}.social-copy summary{cursor:pointer;color:#315b99;font-weight:700}.social-copy pre{font-size:12px;max-height:210px;overflow:auto;margin-bottom:0}
#workflowHelp{background:#f6f9ff;border:1px solid #dce7f8;border-radius:15px;padding:14px 16px;margin-bottom:16px}
#workflowHelp strong{color:#173b80}
@media(max-width:720px){.social-grid{grid-template-columns:1fr}#quickHome{padding:16px;border-radius:16px}body.simple-mode main{padding:10px}#qProduct{min-height:125px}.social-card{padding:15px}}
</style>`;

const quickHtml = String.raw`
<section id="quickHome">
  <h2>ใส่สินค้า แล้วกดสร้าง</h2>
  <p class="quick-lead">เลือกช่องทางที่ต้องการ แล้วระบบเตรียมงานให้ตามช่องทางนั้น</p>
  <label>ต้องการทำ Social Media ไหน
    <select id="qPlatform">
      <option value="ALL">ทั้งหมด (ALL)</option>
      <option value="TikTok">TikTok</option>
      <option value="TikTok Shop">TikTok Shop</option>
      <option value="Facebook">Facebook</option>
      <option value="Instagram">Instagram</option>
      <option value="YouTube Shorts">YouTube Shorts</option>
      <option value="Shopee Video">Shopee Video</option>
    </select>
  </label>
  <label>ลิงก์สินค้า หรือชื่อสินค้า + จุดเด่น
    <textarea id="qProduct" placeholder="ตัวอย่าง&#10;เก้าอี้แคมป์ปิ้งพับได้&#10;พนักพิงสูง&#10;รับน้ำหนักได้ตามข้อมูลผู้ขาย&#10;https://..."></textarea>
  </label>
  <label>รูปหรือวิดีโอสินค้า <span class="small">(ถ้ามี)</span>
    <input id="qMedia" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" multiple>
  </label>
  <label class="check"><input id="qConsent" type="checkbox">ฉันยืนยันว่าข้อมูลที่ให้เป็นจริงตามที่ทราบ มีสิทธิ์ใช้สื่อ และจะตรวจผล/เปิด Disclosure ก่อนโพสต์เมื่อแพลตฟอร์มกำหนด</label>
  <button id="qGo" type="button">สร้างคอนเทนต์ให้เลย</button>
  <p id="qStatus" aria-live="polite"></p>
  <button id="qExpert" type="button">ต้องการตั้งค่าแบบละเอียด</button>
</section>
<section id="socialCards" class="quick-result">
  <h2>ทำต่อทีละ Social Media</h2>
  <p class="social-lead">แต่ละกล่องบอกขั้นตอนถัดไปให้เลย</p>
  <div id="workflowHelp"><strong>ทางลัด:</strong> 1) เปิด ChatGPT เพื่อทำสคริปต์ → 2) เปิด Google Flow เพื่อสร้างวิดีโอ → 3) อัปโหลดวิดีโอกลับมาตรวจอีกครั้ง</div>
  <div id="socialGrid" class="social-grid"></div>
</section>
<button id="backSimple" type="button">กลับโหมดง่าย</button>`;

const quickJs = String.raw`
<script id="quick-mode-script">
(function(){
  var recheckAfterFile=false;
  function ready(){
    var body=document.body, main=document.querySelector('main');
    if(!body||!main)return;
    body.classList.add('simple-mode');
    var header=main.querySelector('header');
    if(header&&header.querySelector('h1'))header.querySelector('h1').textContent='Seller Content OS';
    var home=document.getElementById('quickHome');
    if(header&&home)header.after(home);
    var board=document.getElementById('socialCards');
    if(home&&board)home.after(board);
    var summary=document.getElementById('summary');
    if(summary&&summary.closest('section'))summary.closest('section').classList.add('quick-result');

    var qExpert=document.getElementById('qExpert');
    var back=document.getElementById('backSimple');
    qExpert.onclick=function(){body.classList.remove('simple-mode');window.scrollTo({top:0,behavior:'smooth'});};
    back.onclick=function(){body.classList.add('simple-mode');window.scrollTo({top:0,behavior:'smooth'});};

    function syncPlatformSelection(){
      var pick=document.getElementById('qPlatform');
      var wanted=pick?pick.value:'ALL';
      document.querySelectorAll('[name="platform"]').forEach(function(cb){
        cb.checked=(wanted==='ALL'||cb.value===wanted);
      });
      return wanted;
    }

    function cloneFiles(source,target){
      if(!source||!target||!source.files)return;
      try{
        var dt=new DataTransfer();
        Array.from(source.files).forEach(function(f){dt.items.add(f);});
        target.files=dt.files;
      }catch(e){try{target.files=source.files;}catch(ignore){}}
    }

    function fillQuickText(raw){
      var text=(raw||'').trim();
      if(!text)return {ok:false,msg:'ใส่ชื่อสินค้า หรือวางข้อมูลสินค้าก่อน'};
      var lines=text.split(/\n+/).map(function(s){return s.trim();}).filter(Boolean);
      var url='';
      var normal=[];
      lines.forEach(function(line){
        var m=line.match(/https:\/\/[^\s]+/i);
        if(m&&!url)url=m[0];
        var cleaned=line.replace(/https:\/\/[^\s]+/ig,'').replace(/^[•*\-]\s*/,'').trim();
        if(cleaned)normal.push(cleaned);
      });
      if(url){
        var fast=document.getElementById('fasturl'),u=document.getElementById('url'),ev=document.getElementById('evidence');
        if(fast)fast.value=url;
        if(u)u.value=url;
        if(ev)ev.value=url;
      }
      if(!normal.length){
        return {ok:false,msg:'ลิงก์อย่างเดียวยังดึงรายละเอียดไม่ได้จนกว่าจะเชื่อม API ทางการ กรุณาเพิ่มชื่อสินค้าอีก 1 บรรทัด'};
      }
      var name=document.getElementById('name'),facts=document.getElementById('facts');
      if(name)name.value=normal[0].slice(0,180);
      var fs=normal.length>1?normal.slice(1):[normal[0]];
      if(facts)facts.value=fs.join('\n').slice(0,4000);
      return {ok:true};
    }

    function statusForPlatform(p){
      try{
        var found=report&&Array.isArray(report.platforms)?report.platforms.find(function(x){return x.platform===p;}):null;
        return found?found.status:'REVIEW';
      }catch(e){return 'REVIEW';}
    }

    function statusClass(s){
      if(s==='BLOCK')return 'block';
      if(s==='PRECHECK_CLEAR')return 'clear';
      return 'review';
    }

    function copyText(text){
      if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text);
      var ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();return Promise.resolve();
    }

    function inferCreativeType(){
      var text=((val('name')||'')+' '+facts().join(' ')).toLowerCase();
      var rules=[
        ['fashion',/(เสื้อ|กางเกง|รองเท้า|กระเป๋า|แฟชั่น|dress|shirt|shoe|bag)/i],
        ['beauty',/(ครีม|เซรั่ม|โฟม|ลิป|เมคอัพ|สกินแคร์|กันแดด|beauty|serum|cream|lip)/i],
        ['food',/(อาหาร|ขนม|กาแฟ|ชา|เครื่องดื่ม|ซอส|food|coffee|tea|snack)/i],
        ['electronics',/(หูฟัง|ลำโพง|ชาร์จ|แบต|สายชาร์จ|พาวเวอร์แบงก์|ไฟฟ้า|อิเล็กทรอนิกส์|speaker|charger|battery|earbuds)/i],
        ['home',/(เก้าอี้|โต๊ะ|ชั้น|ตู้|ครัว|บ้าน|แคมป์|ทำความสะอาด|ไม้ถู|เฟอร์นิเจอร์|chair|table|home|camp)/i],
        ['health',/(อาหารเสริม|วิตามิน|สุขภาพ|supplement|vitamin)/i]
      ];
      for(var i=0;i<rules.length;i++)if(rules[i][1].test(text))return rules[i][0];
      var chosen=val('category');
      return chosen&&chosen!=='normal'?chosen:'general';
    }

    function productCreativeBrief(platform){
      var type=inferCreativeType();
      var creativeMap={
        fashion:{format:'Try-on / Detail Showcase',angle:'โชว์ทรง วัสดุ รายละเอียด และการใช้งานจริง โดยไม่อ้างคุณสมบัติที่ไม่มีหลักฐาน',shots:'เปิดด้วยภาพสินค้าบนตัวหรือในมือ → close-up เนื้อผ้า/รายละเอียด → มุมใช้งาน → CTA'},
        beauty:{format:'Texture / Application Demo',angle:'เน้นแพ็กเกจ เนื้อสัมผัส และวิธีใช้จากข้อมูลจริง ห้ามสร้างผลลัพธ์ก่อน-หลังหรือสรรพคุณเพิ่ม',shots:'แพ็กเกจชัด → texture close-up → วิธีใช้ → CTA'},
        food:{format:'Food Close-up / ASMR',angle:'เน้นหน้าตา เนื้อสัมผัส การเสิร์ฟ และข้อมูลจริง ห้ามแต่งรสชาติหรือคุณประโยชน์ที่ไม่ได้ให้มา',shots:'เปิดด้วยภาพน่ากิน → close-up เนื้อสัมผัส → วิธีเสิร์ฟ/ใช้ → CTA'},
        electronics:{format:'Hands-on Feature Demo',angle:'สาธิตฟังก์ชันและสเปกที่มีอยู่จริง ให้เห็นการใช้งานแทนการกล่าวอ้างกว้าง ๆ',shots:'Hook ด้วยการใช้งาน → close-up จุดเด่น → demo ฟังก์ชัน → CTA'},
        home:{format:'Problem-Solution Demonstration',angle:'เริ่มจากสถานการณ์ใช้งานจริง แล้วสาธิตสินค้าให้เห็นขนาด รูปทรง และฟังก์ชันตามข้อมูล',shots:'สถานการณ์ใช้งาน → เปิด/พับ/ใช้งานจริง → close-up จุดเด่น → CTA'},
        health:{format:'Label / Product Information',angle:'เน้นฉลาก บรรจุภัณฑ์ และข้อมูลที่ตรวจสอบได้เท่านั้น ห้ามกล่าวอ้างรักษา ป้องกันโรค หรือผลลัพธ์',shots:'แพ็กเกจ → ฉลาก/ข้อมูล → วิธีใช้ตามข้อมูล → CTA'},
        general:{format:'Product Demonstration / POV',angle:'ให้เห็นสินค้าจริงและจุดเด่นที่ผู้ใช้ระบุ โดยเลือกภาพสาธิตที่ตรงกับลักษณะสินค้า',shots:'Hook จากสินค้าจริง → จุดเด่นข้อ 1 → จุดเด่นข้อ 2/การใช้งาน → CTA'}
      };
      var category=creativeMap[type]||creativeMap.general;
      var social={
        'TikTok':{duration:'9–12 วินาที',style:'UGC hook-first จังหวะเร็ว ภาษาพูดธรรมชาติ',hook:'เปิด 1–2 วินาทีแรกด้วยปัญหา/ความน่าสนใจที่สัมพันธ์กับสินค้านี้',cta:'ชวนดูรายละเอียดต่อ โดยไม่กดดันหรือสร้าง FOMO เท็จ'},
        'TikTok Shop':{duration:'10–15 วินาที',style:'Product demo เน้นสินค้าที่ผูกกับวิดีโอและข้อมูลตรงหน้าสินค้า',hook:'ให้สินค้าและการใช้งานจริงปรากฏตั้งแต่ต้น',cta:'ชวนตรวจรายละเอียดสินค้าที่ผูกกับวิดีโอก่อนสั่งซื้อ'},
        'Facebook':{duration:'12–18 วินาที',style:'Problem-solution ชัด อ่านง่าย เหมาะกับดูแบบเปิด/ปิดเสียง',hook:'เริ่มจากสถานการณ์ใช้งานที่คนทั่วไปเข้าใจทันที',cta:'ชวนอ่านรายละเอียดหรือสอบถามเพิ่มเติม'},
        'Instagram':{duration:'10–15 วินาที',style:'Reels แบบ visual-first ภาพสะอาด กระชับ ดูพรีเมียม',hook:'เปิดด้วย hero shot หรือรายละเอียดที่เด่นที่สุดของสินค้า',cta:'ชวนดูรายละเอียดในโพสต์/ลิงก์ที่ระบุ'},
        'YouTube Shorts':{duration:'15–20 วินาที',style:'Mini explainer / demo เข้าเรื่องเร็วแต่ให้ข้อมูลชัด',hook:'ตั้งโจทย์สั้น ๆ แล้วตอบด้วยการสาธิตสินค้า',cta:'ชวนดูข้อมูลเพิ่มเติมในคำอธิบาย'},
        'Shopee Video':{duration:'10–15 วินาที',style:'Marketplace product demo เห็นสินค้าเต็มและรายละเอียดชัด',hook:'เริ่มด้วยสินค้าจริงพร้อมจุดเด่นที่ตรวจสอบได้',cta:'ชวนตรวจรายละเอียดสินค้าที่ลิงก์ใน Shopee'}
      }[platform]||{duration:'10–15 วินาที',style:'Product demo กระชับ',hook:'เปิดด้วยสินค้าจริง',cta:'ชวนดูรายละเอียด'};
      return {type:type,category:category,social:social};
    }

    function promptProductFacts(){
      var fs=facts();
      return fs.length?fs.map(function(x,i){return (i+1)+'. '+x;}).join('\n'):'1. ไม่มีข้อมูลจุดเด่นเพิ่มเติม';
    }

    function chatPrompt(platform,content){
      var b=productCreativeBrief(platform);
      var product=val('name')||'สินค้า';
      var audience=val('aud')||'ผู้ซื้อทั่วไปในไทย';
      return 'สร้างสคริปต์ใหม่สำหรับสินค้านี้โดยเฉพาะ ห้ามใช้สคริปต์สำเร็จรูปซ้ำกับสินค้าอื่น\n\n'+
        'สินค้า: '+product+'\nแพลตฟอร์ม: '+platform+'\nกลุ่มเป้าหมาย: '+audience+'\nประเภทครีเอทีฟที่เหมาะกับสินค้านี้: '+b.category.format+'\n'+
        'มุมขาย: '+b.category.angle+'\nสไตล์ของแพลตฟอร์ม: '+b.social.style+'\nความยาวเป้าหมาย: '+b.social.duration+'\n'+
        'ข้อเท็จจริงที่อนุญาตให้ใช้เท่านั้น:\n'+promptProductFacts()+'\n\n'+
        'ให้สร้าง: 1) Hook เฉพาะสินค้านี้ 2) Shot list 4–5 ช็อต 3) บทพูดภาษาไทยธรรมชาติ 4) ข้อความบนจอ 5) CTA ที่เหมาะกับ '+platform+'\n'+
        'แนว Hook: '+b.social.hook+'\nแนวภาพ: '+b.category.shots+'\nCTA: '+b.social.cta+'\n\n'+
        'กฎ: ห้ามเพิ่มสเปก ราคา โปรโมชัน รีวิว ผลลัพธ์ หรือสรรพคุณที่ไม่มีในข้อเท็จจริง ห้ามคำรับประกันเกินจริง และระบุจุดที่ต้องเปิด Disclosure ถ้ามีความสัมพันธ์เชิงพาณิชย์\n\n'+
        'ร่างจากระบบสำหรับใช้อ้างอิง:\n'+content;
    }

    function flowPrompt(platform,content){
      var b=productCreativeBrief(platform);
      var product=val('name')||'สินค้า';
      return 'สร้างวิดีโอสำหรับสินค้า "'+product+'" โดยเฉพาะ ไม่ใช้ shot pattern แบบเดียวกับสินค้าชนิดอื่น\n\n'+
        'PLATFORM: '+platform+'\nFORMAT: '+b.category.format+'\nDURATION: '+b.social.duration+'\nASPECT RATIO: 9:16\nSTYLE: '+b.social.style+'\n'+
        'PRODUCT-SPECIFIC DIRECTION: '+b.category.angle+'\nSHOT FLOW: '+b.category.shots+'\nHOOK DIRECTION: '+b.social.hook+'\nCTA DIRECTION: '+b.social.cta+'\n\n'+
        'FACTS THAT MAY APPEAR ON SCREEN OR BE IMPLIED:\n'+promptProductFacts()+'\n\n'+
        'VISUAL RULES: ใช้ภาพสินค้าจริงเป็น reference ถ้ามี; รักษารูปร่าง สี โลโก้ วัสดุ จำนวนชิ้น และรายละเอียดสินค้าให้ตรงต้นฉบับ; ห้ามสร้างฟังก์ชัน ส่วนประกอบ ราคา โปรโมชัน รีวิว หรือผลลัพธ์ใหม่; ห้ามเปลี่ยนสินค้าเป็นคนละรุ่น; ข้อความบนจอต้องสั้นและมาจาก facts เท่านั้น.\n\n'+
        'CONTENT REFERENCE:\n'+content;
    }

    function renderSocialCards(){
      var grid=document.getElementById('socialGrid');
      if(!grid)return;
      grid.replaceChildren();
      var keys=[];
      try{keys=Object.keys(packs||{});}catch(e){}
      if(!keys.length)return;
      keys.forEach(function(p){
        var content=packs[p]||'';
        var st=statusForPlatform(p);
        var card=document.createElement('article');card.className='social-card';
        var head=document.createElement('div');head.className='social-card-head';
        var name=document.createElement('div');name.className='social-name';name.textContent=p;
        var badge=document.createElement('span');badge.className='social-status '+statusClass(st);badge.textContent=st;
        head.append(name,badge);card.append(head);
        var next=document.createElement('p');next.className='social-next';next.textContent='ทำตาม 3 ขั้นตอนนี้ได้เลย';card.append(next);

        var step1=document.createElement('div');step1.className='social-step';
        var t1=document.createElement('b');t1.textContent='ขั้นที่ 1 · ให้ ChatGPT ทำสคริปต์';
        var b1=document.createElement('button');b1.className='social-action';b1.type='button';b1.textContent='คัดลอก Prompt + เปิด ChatGPT';
        var n1=document.createElement('div');n1.className='social-note';n1.textContent='เปิดแล้วกด Paste เพื่อให้ ChatGPT จัดสคริปต์ของช่องทางนี้';
        b1.onclick=function(){var w=window.open('https://chatgpt.com/','_blank','noopener');copyText(chatPrompt(p,content)).then(function(){n1.textContent='คัดลอกแล้ว — ไปที่ ChatGPT และกด Paste';}).catch(function(){n1.textContent='เปิด ChatGPT แล้ว แต่คัดลอกอัตโนมัติไม่สำเร็จ';});};
        step1.append(t1,b1,n1);card.append(step1);

        var step2=document.createElement('div');step2.className='social-step';
        var t2=document.createElement('b');t2.textContent='ขั้นที่ 2 · สร้างวิดีโอใน Google Flow';
        var b2=document.createElement('button');b2.className='social-action flow';b2.type='button';b2.textContent='คัดลอก Prompt + เปิด Google Flow';
        var n2=document.createElement('div');n2.className='social-note';n2.textContent='นำ Prompt ไปวางใน Flow และใส่รูปสินค้าจริงเป็น reference ถ้ามี';
        b2.onclick=function(){var w=window.open('https://flow.google/','_blank','noopener');copyText(flowPrompt(p,content)).then(function(){n2.textContent='คัดลอกแล้ว — ไปที่ Google Flow และกด Paste';}).catch(function(){n2.textContent='เปิด Google Flow แล้ว แต่คัดลอกอัตโนมัติไม่สำเร็จ';});};
        step2.append(t2,b2,n2);card.append(step2);

        var step3=document.createElement('div');step3.className='social-step';
        var t3=document.createElement('b');t3.textContent='ขั้นที่ 3 · ได้วิดีโอแล้ว ตรวจอีกครั้ง';
        var b3=document.createElement('button');b3.className='social-action upload';b3.type='button';b3.textContent='อัปโหลดวิดีโอกลับมาตรวจ';
        var n3=document.createElement('div');n3.className='social-note';n3.textContent='เลือกไฟล์แล้วระบบจะรัน Media QC + Policy Precheck ซ้ำอัตโนมัติ';
        b3.onclick=function(){recheckAfterFile=true;document.getElementById('qMedia').click();};
        step3.append(t3,b3,n3);card.append(step3);

        var details=document.createElement('details');details.className='social-copy';
        var sum=document.createElement('summary');sum.textContent='ดูข้อความที่สร้างสำหรับ '+p;
        var pre=document.createElement('pre');pre.textContent=content;
        details.append(sum,pre);card.append(details);
        grid.append(card);
      });
      body.classList.add('has-social-results');
    }

    var qGo=document.getElementById('qGo');
    qGo.onclick=async function(){
      var status=document.getElementById('qStatus');
      var consent=document.getElementById('qConsent');
      status.textContent='';
      var parsed=fillQuickText(document.getElementById('qProduct').value);
      if(!parsed.ok){status.textContent=parsed.msg;return;}
      if(!consent.checked){status.textContent='กรุณาติ๊กยืนยันข้อมูลและสิทธิ์ก่อน';return;}
      var selectedPlatform=syncPlatformSelection();
      var verified=document.getElementById('verified'),rights=document.getElementById('rights'),disclosure=document.getElementById('disclosure'),manual=document.getElementById('manual');
      if(verified)verified.checked=true;
      if(rights)rights.checked=true;
      if(disclosure)disclosure.checked=true;
      if(manual)manual.checked=true;
      cloneFiles(document.getElementById('qMedia'),document.getElementById('quickmedia'));
      cloneFiles(document.getElementById('qMedia'),document.getElementById('media'));
      qGo.disabled=true;
      qGo.textContent='กำลังสร้างและตรวจ...';
      status.textContent='กำลังตรวจข้อมูลสินค้า สื่อ และ Policy';
      try{
        var original=document.getElementById('generate');
        if(original&&typeof original.onclick==='function')await original.onclick();
        renderSocialCards();
        var s=document.getElementById('summary');
        status.textContent=selectedPlatform==='ALL'?'เสร็จแล้ว — สร้างครบทุก Social Media':'เสร็จแล้ว — '+selectedPlatform+' พร้อมทำขั้นตอนต่อไป';
        var social=document.getElementById('socialCards');
        if(social)social.scrollIntoView({behavior:'smooth',block:'start'});
      }catch(e){status.textContent='เกิดข้อผิดพลาด: '+e.message;}
      finally{qGo.disabled=false;qGo.textContent='สร้างคอนเทนต์ให้เลย';}
    };

    document.getElementById('qPlatform').addEventListener('change',function(){
      body.classList.remove('has-social-results');
      var grid=document.getElementById('socialGrid');if(grid)grid.replaceChildren();
      var status=document.getElementById('qStatus');if(status)status.textContent='เลือก '+(this.value==='ALL'?'ทุก Social Media':this.value)+' แล้ว — กดสร้างคอนเทนต์ให้เลย';
    });

    document.getElementById('qMedia').addEventListener('change',function(){
      if(recheckAfterFile){recheckAfterFile=false;setTimeout(function(){qGo.click();},100);}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
</script>`;

html = html.replace('</head>', quickCss + '</head>');
html = html.replace('</body>', quickHtml + quickJs + '</body>');

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.html', html);
console.log('Seller Content OS guided social cards build complete:', Buffer.byteLength(html), 'bytes');
