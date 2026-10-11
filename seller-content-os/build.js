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
body.simple-mode main{max-width:760px}
body.simple-mode main>section,body.simple-mode #workgrid,body.simple-mode #advancedToggle{display:none!important}
body.simple-mode #quickHome,body.simple-mode .quick-result{display:block!important}
body.simple-mode header .sub,body.simple-mode header .thai-intro,body.simple-mode header .small{display:none!important}
body.simple-mode header{padding:28px 4px 8px}
body.simple-mode header h1{font-size:30px;text-align:center}
#quickHome{display:none;background:#fff;border:1px solid #e3e8f0;border-radius:20px;padding:22px;box-shadow:0 8px 28px #1f3d6b12}
#quickHome h2{font-size:23px;margin:0 0 6px;text-align:center}
#quickHome .quick-lead{text-align:center;color:#5f6e84;margin:0 0 18px}
#qProduct{min-height:145px}
#qMedia{padding:14px;background:#f8fbff;border:2px dashed #a9bde0}
#qGo{width:100%;min-height:58px;font-size:19px;background:#1657c0;margin:14px 0 0}
#qStatus{min-height:24px;margin:10px 0 0;text-align:center;color:#52627a;font-size:14px}
#qExpert{display:block;margin:14px auto 0;background:transparent;color:#5b6b82;text-decoration:underline;box-shadow:none}
#backSimple{position:fixed;right:16px;bottom:16px;z-index:9999;background:#173e8d;color:#fff;border-radius:999px;padding:10px 14px;box-shadow:0 8px 24px #173e8d33;display:block}
body.simple-mode #backSimple{display:none}
body.simple-mode .quick-result h2{font-size:18px}
body.simple-mode .quick-result{margin-top:14px}
body.simple-mode #report,body.simple-mode #ready{display:none!important}
@media(max-width:650px){#quickHome{padding:16px;border-radius:16px}body.simple-mode main{padding:10px}#qProduct{min-height:125px}}
</style>`;

const quickHtml = String.raw`
<section id="quickHome">
  <h2>ใส่สินค้า แล้วกดสร้าง</h2>
  <p class="quick-lead">ไม่ต้องเลือกแพลตฟอร์ม ไม่ต้องเขียน Prompt</p>
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
<button id="backSimple" type="button">กลับโหมดง่าย</button>`;

const quickJs = String.raw`
<script id="quick-mode-script">
(function(){
  function ready(){
    var body=document.body, main=document.querySelector('main');
    if(!body||!main)return;
    body.classList.add('simple-mode');
    var header=main.querySelector('header');
    if(header&&header.querySelector('h1'))header.querySelector('h1').textContent='Seller Content OS';
    var home=document.getElementById('quickHome');
    if(header&&home)header.after(home);
    var content=document.getElementById('content');
    var summary=document.getElementById('summary');
    if(content&&content.closest('section'))content.closest('section').classList.add('quick-result');
    if(summary&&summary.closest('section'))summary.closest('section').classList.add('quick-result');

    var qExpert=document.getElementById('qExpert');
    var back=document.getElementById('backSimple');
    qExpert.onclick=function(){body.classList.remove('simple-mode');window.scrollTo({top:0,behavior:'smooth'});};
    back.onclick=function(){body.classList.add('simple-mode');window.scrollTo({top:0,behavior:'smooth'});};

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

    var qGo=document.getElementById('qGo');
    qGo.onclick=async function(){
      var status=document.getElementById('qStatus');
      var consent=document.getElementById('qConsent');
      status.textContent='';
      var parsed=fillQuickText(document.getElementById('qProduct').value);
      if(!parsed.ok){status.textContent=parsed.msg;return;}
      if(!consent.checked){status.textContent='กรุณาติ๊กยืนยันข้อมูลและสิทธิ์ก่อน';return;}
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
        var s=document.getElementById('summary');
        status.textContent=s?s.textContent:'เสร็จแล้ว';
        var result=document.getElementById('content');
        if(result&&result.closest('section'))result.closest('section').scrollIntoView({behavior:'smooth',block:'start'});
      }catch(e){status.textContent='เกิดข้อผิดพลาด: '+e.message;}
      finally{qGo.disabled=false;qGo.textContent='สร้างคอนเทนต์ให้เลย';}
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
</script>`;

html = html.replace('</head>', quickCss + '</head>');
html = html.replace('</body>', quickHtml + quickJs + '</body>');

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.html', html);
console.log('Seller Content OS quick build complete:', Buffer.byteLength(html), 'bytes');
