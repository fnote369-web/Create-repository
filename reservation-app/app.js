/* ============================================================
   データ（プロトタイプ：メモリ上で保持）
   ============================================================ */
// オーナー（あなた）＝ 1人。ログインできる本人。
// ★name＝お客様へのメールに載る「担当者（セラピスト）名」。ご自身のお名前に変えてください。
// ★email＝新規予約・変更・キャンセルの通知メールを受け取るアドレス。
const owner = { name:'あなた', email:'you@example.com', password:'owner1234',
  availability:[
    {date:'2026-08-20', start:'10:00', end:'13:00'},
    {date:'2026-08-25', start:'10:00', end:'18:00'},
    {date:'2026-08-27', start:'13:00', end:'17:00'},
  ],
  // 手動ブロック（この時間は予約を受けない）。自動計算とは別に、本人が自由に追加/削除できる。
  blocks:[
    {date:'2026-08-25', start:'16:00', end:'18:00'},
  ]};

// ★お支払い方法（メニューごとに選べる）
//   prepaid=予約時カード決済（前払い） / transfer=事前振込 / onsite=当日払い（後払い） / free=無料
const PAYTYPES = {
  prepaid: {label:'予約時にカード決済', short:'事前決済'},
  transfer:{label:'事前に銀行振込',     short:'振込'},
  onsite:  {label:'当日お支払い',       short:'当日払い'},
  free:    {label:'無料',              short:'無料'},
};
// ★メニュー：オーナー（本人）が自由に追加・変更できる（料金・時間・支払い方法・形式を固定値にしない）
//   mode: 'online'=オンライン（Zoom自動発行） / 'inperson'=対面（リアル・場所案内）
//   minutes=所要時間 / buffer=次の予約までの余白（着替え・片付け・休憩など。0でもOK）
let menus = [
  {id:'m1', name:'オンラインセッション',      minutes:60, buffer:0,  price:11000, payType:'prepaid',  mode:'online',   desc:'ビデオ通話でのカウンセリング。全国どこからでも受けられます。'},
  {id:'m2', name:'リアルセッション（対面）',   minutes:60, buffer:15, price:12000, payType:'prepaid',  mode:'inperson', desc:'サロンでの対面セッション。じっくり向き合いたい方に。'},
  {id:'m3', name:'ボディワーク（当日払い）',   minutes:90, buffer:30, price:11000, payType:'onsite',   mode:'inperson', desc:'施術後にその場でお支払いいただけます。前後にお着替え等の時間をいただきます。'},
  {id:'m4', name:'継続セッション（振込）',     minutes:60, buffer:0,  price:10000, payType:'transfer', mode:'online',   desc:'2回目以降の方向け。事前振込でのご案内です。'},
  {id:'m5', name:'はじめての方の無料相談',     minutes:30, buffer:0,  price:0,     payType:'free',     mode:'online',   desc:'まずはお試しで。初めての方向けの短時間相談です。'},
];
let settings = {
  onlineMethod:'Zoom',                                   // オンライン会議の種類：'Zoom' / 'Google Meet'
  // ★オンライン会議URLの決め方：
  //   'fixed' =毎回同じ固定URL（あなたの定期ミーティングルーム）を案内
  //   'auto'  =予約ごとに自動発行（プロトタイプはダミー。本番はZoom/Google APIで発行）
  //   'none'  =URLを入れない（後日メールで別途ご案内）
  onlineUrlMode:'auto',
  onlineFixedUrl:'',                                     // fixed のときに案内する固定URL（例：https://zoom.us/j/あなたの番号）
  bankInfo:'○○銀行 △△支店 普通 1234567 ナマエ（カナ）',  // 振込先（振込メニュー用）
  location:'東京都〇〇区△△ 1-2-3 サロン□□（予約後に詳細をご案内します）', // 対面の場所
  slotStep:30,                                           // 予約開始時刻の刻み幅（分）15/30/60
};
const yen = n => Number(n).toLocaleString('ja-JP') + '円（税込）';

// ★★★ ここにメール送信バックエンド（Google Apps Script）のURLを貼り付けてください ★★★
//   ・空のまま → 送信されず、内容がブラウザのコンソールにプレビュー表示されます（テスト用）。
//   ・URLを設定 → 予約の確定・変更・キャンセル時に、お客様とあなたへ実際にメールが届きます。
//     さらにGAS側の設定で、前日・当日の自動リマインドメールも送られます。
//   設定手順は同梱の「セットアップ手順」をご覧ください。
//   ※このリポジトリは公開（Public）のため、実際のURLはここには書かず、
//     手元の環境（本番デプロイ先やローカル）でのみ設定してください。
const MAIL_ENDPOINT = ''; // ←あなたのGASのURLをここに設定（公開リポジトリにはコミットしないこと）

const menuById = id => menus.find(m=>m.id===id);
const priceLabel = m => m.payType==='free' ? '無料' : yen(m.price);
const payTypeLabel = pt => PAYTYPES[pt] ? PAYTYPES[pt].label : '-';
const isOnlineMode = x => (x && x.mode ? x.mode : x) !== 'inperson';   // 既定はオンライン
const formatLabel = mode => mode==='inperson' ? '対面（リアル）' : 'オンライン';
// 予約の支払い状況ラベル
function payStatusLabel(bk){
  if(bk.payType==='free')     return '無料';
  if(bk.payType==='onsite')   return '当日お支払い（未収）';
  if(bk.payType==='transfer') return bk.paymentStatus==='paid' ? '入金確認済み' : '入金待ち';
  return bk.paymentStatus==='paid' ? '決済完了' : (bk.paymentStatus||'-');
}

// 予約（menuId / menuName / minutes / price / payType を保存）
let bookings = [
  {id:'bk1', date:'2026-08-20', time:'10:00', name:'佐藤 美咲', email:'sato@example.com', tel:'090-0000-0001', msg:'',
   menuId:'m1', menuName:'オンラインセッション', minutes:60, buffer:0, price:11000, payType:'prepaid', mode:'online', location:'',
   paymentStatus:'paid', paymentAt:'2026-08-01 10:12', onlineMethod:'Zoom', onlineUrl:'https://zoom.us/j/8412345678?pwd=demo12', status:'confirmed'},
];

const DAYS_AHEAD = 90;

/* ============================================================
   共通ロジック
   ============================================================ */
const WD=['日','月','火','水','木','金','土'];
const pad=n=>(n<10?'0':'')+n;
const t2m=t=>{const p=t.split(':').map(Number);return p[0]*60+p[1];};
const m2l=m=>pad(Math.floor(m/60))+':'+pad(m%60);
const today=(()=>{const d=new Date();d.setHours(0,0,0,0);return d;})();
const lastDay=new Date(today.getTime()+DAYS_AHEAD*86400000);
const parseDate=s=>{const p=s.split('-').map(Number);return new Date(p[0],p[1]-1,p[2]);};
let seq=100;
// 予約ID等は「毎回ユニーク」に採番する（時刻＋連番＋乱数）。
// 以前は seq がページを開くたびに 100 へ戻り、bk100… が重複 → 台帳で上書きされ記録が積み上がらなかった。
// これにより、予約はずっと台帳に残り、キャンセル済みの行も別IDに上書きされず保持される。
const uid=p=>p+Date.now().toString(36)+(seq++).toString(36)+Math.random().toString(36).slice(2,6);
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
// 自前の確認ダイアログ（プレビュー等で標準の confirm() が無効化される環境でも動く）
function askConfirm(message, onYes){
  const root=document.getElementById('modalRoot');
  root.innerHTML='<div class="overlay"><div class="sheet"><h2 style="margin-top:4px;">確認</h2>'+
    '<p class="profTxt" style="white-space:pre-wrap;margin-bottom:14px;">'+escapeHtml(message)+'</p>'+
    '<button class="btn danger" id="acYes">はい</button>'+
    '<button class="btn ghost" id="acNo">いいえ</button></div></div>';
  const close=()=>root.innerHTML='';
  root.querySelector('#acNo').addEventListener('click',close);
  root.querySelector('.overlay').addEventListener('click',ev=>{if(ev.target.classList.contains('overlay'))close();});
  root.querySelector('#acYes').addEventListener('click',()=>{ close(); onYes(); });
}
function sumRow(k,val,big){ return '<div class="row"><div class="k">'+k+'</div><div class="v'+(big?' big':'')+'">'+escapeHtml(val)+'</div></div>'; }
function fmtDateJ(dateStr){const d=parseDate(dateStr);return d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日（'+WD[d.getDay()]+'）';}
function e(el,t){el.textContent=t;el.style.display='block';}
function v(id){return document.getElementById(id).value.trim();}

// 予約・ホールドは「時間帯（区間）」で管理。メニュー時間が違っても重なりを正しく判定する。
const HOLD_MINUTES=10; let holds=[];
// 予約・ホールドは「所要時間＋バッファ」の区間を占有する。手動ブロックはその範囲を占有。
// excludeId：変更（リスケ）中の予約を「空き」として扱うために除外する
function busyIntervals(date, excludeId){
  const iv=[];
  bookings.forEach(b=>{ if(b.date===date&&b.status==='confirmed'&&b.id!==excludeId) iv.push([t2m(b.time), t2m(b.time)+(b.minutes||60)+(b.buffer||0)]); });
  holds.forEach(h=>{ if(h.date===date&&h.expires>Date.now()) iv.push([t2m(h.time), t2m(h.time)+(h.minutes||60)+(h.buffer||0)]); });
  (owner.blocks||[]).forEach(bl=>{ if(bl.date===date) iv.push([t2m(bl.start), t2m(bl.end)]); }); // 手動ブロック
  return iv;
}
// [start, start+minutes+buffer] が、既存の占有区間（予約＋バッファ／ホールド／手動ブロック）と重なるか
function slotBusy(date, startMin, minutes, buffer, excludeId){
  const s=startMin, en=startMin+minutes+(buffer||0);
  return busyIntervals(date,excludeId).some(iv=> s<iv[1] && en>iv[0]);
}
function slotFree(date,time,minutes,buffer,excludeId){ return !slotBusy(date,t2m(time),minutes,buffer,excludeId); }

// リマインド予定：前日18:00 と 当日「開始1時間前」
function reminderSchedule(bk){
  const d=parseDate(bk.date), prev=new Date(d.getTime()-86400000);
  const prevStr=(prev.getMonth()+1)+'月'+prev.getDate()+'日 18:00';
  const dayMin=Math.max(0, t2m(bk.time)-60);
  const dayStr=(d.getMonth()+1)+'月'+d.getDate()+'日 '+m2l(dayMin);
  return {prev:prevStr, day:dayStr};
}
function placeHold(date,time,minutes,buffer){ holds.push({date,time,minutes,buffer:buffer||0,expires:Date.now()+HOLD_MINUTES*60000}); }
function releaseHold(){ holds=holds.filter(h=>!(h.date===cState.selDate&&h.time===cState.selTime)); }

// 指定日・指定メニュー時間のスロット（{time,booked}）。includeBooked=trueで予約済みも含める
// 指定日・メニュー(所要minutes＋バッファbuffer)で、刻み幅(slotStep)ごとに予約可能な開始時刻を計算
function daySlots(dateStr, minutes, buffer, includeBooked){
  const step = settings.slotStep || 30;
  const set={};
  owner.availability.filter(b=>b.date===dateStr).forEach(b=>{
    const bs=t2m(b.start), be=t2m(b.end);
    // セッション本体(所要時間)は営業時間内に収める。バッファは営業時間を超えてもよい。
    for(let t=bs; t+minutes<=be; t+=step){ if(!(t in set)) set[t]=slotBusy(dateStr,t,minutes,buffer, cState.rescheduleId); }
  });
  return Object.keys(set).map(Number).sort((a,b)=>a-b).filter(t=>includeBooked||!set[t]).map(t=>({time:m2l(t),booked:set[t]}));
}
function dayStatus(dateStr, minutes, buffer){
  const d=parseDate(dateStr);
  if(d<today) return 'past';
  if(d>lastDay) return 'closed';
  const all=daySlots(dateStr, minutes, buffer, true);
  if(all.length===0) return 'closed';
  return all.some(s=>!s.booked) ? 'open' : 'full';
}
// メニュー未選択のカレンダー用：登録されたどれかのメニューで予約できるか
function dayStatusAny(dateStr){
  const d=parseDate(dateStr);
  if(d<today) return 'past';
  if(d>lastDay) return 'closed';
  if(!owner.availability.some(b=>b.date===dateStr)) return 'closed';
  const anyFree = menus.some(m=>daySlots(dateStr, m.minutes, m.buffer||0, false).length>0);
  if(anyFree) return 'open';
  const anyBlockSlots = menus.some(m=>daySlots(dateStr, m.minutes, m.buffer||0, true).length>0);
  return anyBlockSlots ? 'full' : 'closed';
}

/* ============================================================
   役割切替 と 表示モード
   ★本番化：DEV_MODE を false にすると切替バーが消え、
     お客様＝このページ（予約のみ）、オーナー＝ URL末尾 #/owner から専用ログイン。
   ============================================================ */
const DEV_MODE = true;   // ← 本番では false
function activateRole(role){
  document.querySelectorAll('#devRoleBar > button[data-role]').forEach(x=>x.classList.toggle('on', x.dataset.role===role));
  ['customer','owner'].forEach(r=>document.getElementById('role-'+r).classList.toggle('hidden', r!==role));
  window.scrollTo(0,0);
  if(role==='owner') renderOwnerTab(); else cRestart();
}
document.querySelectorAll('#devRoleBar > button[data-role]').forEach(b=>b.addEventListener('click',()=>activateRole(b.dataset.role)));
function roleFromHash(){ return location.hash.replace(/^#\/?/,'')==='owner' ? 'owner' : 'customer'; }
function applyMode(){
  const bar=document.getElementById('devRoleBar'), hint=document.getElementById('devRoleHint'), flow=document.getElementById('devFlowHint');
  if(DEV_MODE){ bar.classList.remove('hidden'); hint.classList.remove('hidden'); flow.classList.remove('hidden'); activateRole('customer'); }
  else { bar.classList.add('hidden'); hint.classList.add('hidden'); flow.classList.add('hidden'); activateRole(roleFromHash()); window.addEventListener('hashchange',()=>activateRole(roleFromHash())); }
}

/* ============================================================
   お客様側
   ============================================================ */
const cState={view:new Date(today.getFullYear(),today.getMonth(),1), selMenu:null, selDate:null, selTime:null, data:{}, rescheduleId:null, lastBookingId:null};
function cShow(x){ ['c-cal','c-lookup','c-form','c-confirm','c-payment','c-done'].forEach(v=>document.getElementById(v).classList.toggle('hidden', v!=='c-'+x)); window.scrollTo(0,0); }

function cRenderCal(){
  document.getElementById('cTitle').textContent='セッション予約';
  if(!cState.rescheduleId) document.getElementById('cLead').textContent=owner.name+' ／ 日付とメニューを選んでご予約ください';
  const rescM = cState.rescheduleId && cState.selMenu ? cState.selMenu : null;
  const y=cState.view.getFullYear(), m=cState.view.getMonth();
  document.getElementById('cCalTitle').textContent=y+'年'+(m+1)+'月';
  const grid=document.getElementById('cGrid'); grid.innerHTML='';
  const startDow=new Date(y,m,1).getDay(), days=new Date(y,m+1,0).getDate();
  for(let i=0;i<startDow;i++){const b=document.createElement('div');b.className='cell';grid.appendChild(b);}
  for(let d=1;d<=days;d++){
    const ds=y+'-'+pad(m+1)+'-'+pad(d), st = rescM ? dayStatus(ds,rescM.minutes,rescM.buffer||0) : dayStatusAny(ds);
    const cell=document.createElement('div'); cell.className='cell '+st;
    const num=document.createElement('div'); num.textContent=d; cell.appendChild(num);
    if(st==='open'){const dot=document.createElement('div');dot.className='dot';cell.appendChild(dot);cell.addEventListener('click',()=>cSelectDate(ds,cell));}
    else if(st==='full'){const tg=document.createElement('div');tg.className='tag';tg.textContent='満';cell.appendChild(tg);}
    if(cState.selDate===ds&&st==='open')cell.classList.add('selected');
    grid.appendChild(cell);
  }
  const cur=y*100+(m+1);
  document.getElementById('cPrev').disabled=cur<=today.getFullYear()*100+today.getMonth()+1;
  document.getElementById('cNext').disabled=cur>=lastDay.getFullYear()*100+lastDay.getMonth()+1;
}
// 日付選択 → 変更モードなら時間へ直行、通常はメニュー選択カードを表示
function cSelectDate(ds,cell){
  cState.selDate=ds; cState.selTime=null;
  document.querySelectorAll('#cGrid .cell').forEach(c=>c.classList.remove('selected')); cell.classList.add('selected');
  if(cState.rescheduleId){ cRenderSlots(); return; }
  cState.selMenu=null;
  document.getElementById('cTimeCard').classList.add('hidden');
  document.getElementById('cMenuDayLabel').textContent=fmtDateJ(ds)+' のメニュー';
  const wrap=document.getElementById('cMenuList'); wrap.innerHTML='';
  menus.forEach(mn=>{
    const free=daySlots(ds, mn.minutes, mn.buffer||0, false).length>0;
    const row=document.createElement('div'); row.className='listrow'; row.style.opacity=free?'1':'.5';
    row.innerHTML='<div class="meta"><div class="t1">'+escapeHtml(mn.name)+'</div>'+
      '<div class="t2">'+formatLabel(mn.mode)+' ／ '+mn.minutes+'分 ／ '+PAYTYPES[mn.payType].short+
      (mn.desc?'<br>'+escapeHtml(mn.desc):'')+(free?'':'<br><span style="color:var(--muted);">この日は空きなし</span>')+'</div></div>'+
      '<div style="font-size:15px;font-weight:600;color:'+(mn.payType==='free'?'var(--ok)':'var(--ink)')+'">'+priceLabel(mn)+'</div>';
    if(free) row.addEventListener('click',()=>cPickMenu(mn));
    wrap.appendChild(row);
  });
  document.getElementById('cMenuCard').classList.remove('hidden');
  document.getElementById('cMenuCard').scrollIntoView({behavior:'smooth',block:'start'});
}
// メニュー選択 → 時間枠を表示
function cPickMenu(mn){
  cState.selMenu=mn; cState.selTime=null;
  document.querySelectorAll('#cMenuList .listrow').forEach(r=>r.style.background='');
  cRenderSlots();
}
function cRenderSlots(){
  const ds=cState.selDate, menu=cState.selMenu;
  document.getElementById('cMenuBanner').innerHTML='メニュー： <b>'+escapeHtml(menu.name)+'（'+menu.minutes+'分・'+priceLabel(menu)+'）</b>';
  document.getElementById('cDayLabel').textContent=fmtDateJ(ds)+'の空き時間';
  const wrap=document.getElementById('cSlots'); wrap.innerHTML='';
  const slots=daySlots(ds, menu.minutes, menu.buffer||0, true);
  if(slots.filter(s=>!s.booked).length===0) wrap.innerHTML='<div class="none">この日・このメニューの空きはありません。</div>';
  slots.forEach(s=>{
    const el=document.createElement('div'); el.className='slot'+(s.booked?' booked':''); el.textContent=s.time;
    if(!s.booked) el.addEventListener('click',()=>{
      document.querySelectorAll('#cSlots .slot').forEach(x=>x.classList.remove('selected')); el.classList.add('selected');
      cState.selTime=s.time;
      const bar=document.getElementById('cSelbar'); bar.classList.remove('hidden');
      bar.innerHTML='選択中： <b>'+fmtDateJ(ds)+' '+s.time+'〜'+m2l(t2m(s.time)+menu.minutes)+'</b>';
      const tf=document.getElementById('cToForm');
      tf.textContent = cState.rescheduleId ? 'この日時に変更する' : 'この時間で予約する';
      tf.classList.remove('hidden');
    });
    wrap.appendChild(el);
  });
  document.getElementById('cSelbar').classList.add('hidden');
  document.getElementById('cToForm').classList.add('hidden');
  document.getElementById('cTimeCard').classList.remove('hidden');
  document.getElementById('cTimeCard').scrollIntoView({behavior:'smooth',block:'start'});
}
function cGotoForm(){
  if(cState.rescheduleId){ applyReschedule(); return; } // 変更モードはフォーム・決済を挟まず日時のみ更新
  document.getElementById('cFormWhen').innerHTML='<b>'+fmtDateJ(cState.selDate)+' '+cState.selTime+'</b><br>'+escapeHtml(cState.selMenu.name)+'（'+cState.selMenu.minutes+'分・'+priceLabel(cState.selMenu)+'）';
  cShow('form');
}
// 予約日時の変更（決済・料金はそのまま維持）
function startReschedule(){
  const bk=bookings.find(b=>b.id===cState.lastBookingId); if(!bk) return;
  cState.rescheduleId=bk.id; cState.selMenu=menuById(bk.menuId)||{name:bk.menuName,minutes:bk.minutes,buffer:bk.buffer||0,mode:bk.mode,payType:bk.payType,price:bk.price}; cState.selDate=null; cState.selTime=null;
  document.getElementById('cLead').textContent='予約日時の変更：'+escapeHtml(bk.menuName)+'（'+bk.minutes+'分）の新しい日時をお選びください';
  document.getElementById('cMenuCard').classList.add('hidden');
  document.getElementById('cTimeCard').classList.add('hidden');
  cRenderCal(); cShow('cal');
}
function applyReschedule(){
  const bk=bookings.find(b=>b.id===cState.rescheduleId); if(!bk){ cState.rescheduleId=null; cRestart(); return; }
  if(!slotFree(cState.selDate,cState.selTime,bk.minutes,bk.buffer||0,bk.id)){ alert('その枠は予約できません。別の日時をお選びください。'); return; }
  bk.date=cState.selDate; bk.time=cState.selTime;
  // 変更をメール通知＋リマインドを新しい日時で再スケジュール（会議リンクは維持）
  try{ sendBookingEmails(bk,'changed'); }catch(err){ console.log('メール送信呼び出しエラー', err); }
  cState.rescheduleId=null; cState.lastBookingId=bk.id;
  renderDone(bk, '予約を変更しました');
  cShow('done');
}
function cCancelBooking(){
  const bk=bookings.find(b=>b.id===cState.lastBookingId); if(!bk) return;
  askConfirm(fmtDateJ(bk.date)+' '+bk.time+' の予約をキャンセルしますか？', ()=>{
    try{ sendBookingEmails(bk,'cancelled'); }catch(err){ console.log('メール送信呼び出しエラー', err); } // キャンセル通知（削除前に送る）
    bookings=bookings.filter(b=>b.id!==bk.id); // 枠が再び予約可能に
    document.getElementById('cDoneMark').textContent='－';
    document.getElementById('cDoneTitle').textContent='予約をキャンセルしました';
    document.getElementById('cDoneLead').textContent='またのご利用をお待ちしております。';
    document.getElementById('cDoneBody').innerHTML='<div class="selbar" style="margin-top:0;">'+escapeHtml(bk.menuName)+'<br>'+fmtDateJ(bk.date)+' '+bk.time+'</div>';
    document.getElementById('cDoneActions').classList.add('hidden');
  });
}
function cGotoConfirm(){
  const name=v('cName'),email=v('cEmail'),tel=v('cTel'),msg=v('cMsg'), err=document.getElementById('cErr');
  if(!name)return e(err,'お名前を入力してください。');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return e(err,'メールアドレスを正しく入力してください。');
  if(!tel)return e(err,'電話番号を入力してください。');
  err.style.display='none'; cState.data={name,email,tel,msg};
  const menu=cState.selMenu, endT=m2l(t2m(cState.selTime)+menu.minutes);
  const rows=[sumRow('メニュー',menu.name,true),sumRow('形式',formatLabel(menu.mode)),sumRow('日時',fmtDateJ(cState.selDate)+' '+cState.selTime+'〜'+endT,true),sumRow('お名前',name),sumRow('メール',email),sumRow('電話',tel)];
  if(menu.mode==='inperson') rows.push(sumRow('場所',settings.location));
  if(msg)rows.push(sumRow('メッセージ',msg));
  rows.push(sumRow('料金',priceLabel(menu),true));
  if(menu.payType!=='free') rows.push(sumRow('お支払い方法',payTypeLabel(menu.payType)));
  document.getElementById('cSum').innerHTML=rows.join('');
  // 前払い(カード)は「お支払いへ進む」、それ以外はその場で確定
  document.getElementById('cConfirmBtn').textContent =
    menu.payType==='prepaid' ? 'お支払いへ進む' :
    menu.payType==='transfer' ? '予約を確定する（振込先を表示）' : '予約を確定する';
  cShow('confirm');
}
// 確認画面のボタン：お支払い方法に応じて分岐
function cConfirmProceed(){
  const menu=cState.selMenu;
  if(menu.payType==='prepaid'){ cGotoPayment(); return; }
  // 振込・当日払い・無料 → カード決済を挟まず、枠を確保して確定
  if(!slotFree(cState.selDate,cState.selTime,menu.minutes,menu.buffer||0)){ alert('申し訳ありません、その枠は先に予約が入りました。'); cRestart(); return; }
  finalizeWithCheck();
}
function cGotoPayment(){
  const menu=cState.selMenu;
  if(!slotFree(cState.selDate,cState.selTime,menu.minutes,menu.buffer||0)){ alert('申し訳ありません、その枠は先に予約が入りました。別の枠をお選びください。'); cRestart(); return; }
  placeHold(cState.selDate,cState.selTime,menu.minutes,menu.buffer||0);
  document.getElementById('cPayAmount').innerHTML='お支払い金額： <b>'+yen(menu.price)+'</b>';
  document.getElementById('cPayBtn').textContent=Number(menu.price).toLocaleString('ja-JP')+'円を支払う';
  document.getElementById('cPayErr').style.display='none';
  cShow('payment');
}
function processPayment(){
  const err=document.getElementById('cPayErr');
  if(document.getElementById('pcFail').checked){ releaseHold(); e(err,'決済に失敗しました。予約は確定していません。カード情報をご確認のうえ、再度お試しください。'); return; }
  finalizeWithCheck();
}
// オンライン会議リンクを用意する（設定の onlineUrlMode に従う）
//   fixed=固定URL / auto=自動発行（デモ） / none=URLなし（後日案内）
function makeOnlineLink(){
  const method = settings.onlineMethod || 'Zoom';
  if(settings.onlineUrlMode==='fixed'){
    return {method:method, url:(settings.onlineFixedUrl||'').trim()};   // 毎回同じ固定URL
  }
  if(settings.onlineUrlMode==='none'){
    return {method:method, url:''};                                     // URLは入れない（後日メール案内）
  }
  // auto：予約ごとに自動発行（本番はZoom/Google APIで発行。プロトタイプはダミー）
  if(method==='Zoom'){
    const id=Math.floor(1000000000+Math.random()*8999999999);
    const pwd=Math.random().toString(36).slice(2,8);
    return {method:'Zoom', url:'https://zoom.us/j/'+id+'?pwd='+pwd};
  }
  return {method:'Google Meet', url:'https://meet.google.com/'+Math.random().toString(36).slice(2,6)+'-'+Math.random().toString(36).slice(2,6)+'-'+Math.random().toString(36).slice(2,5)};
}
function finalizeBooking(){
  const menu=cState.selMenu, now=new Date();
  const paidAt=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate())+' '+pad(now.getHours())+':'+pad(now.getMinutes());
  const online = isOnlineMode(menu);
  const link = online ? makeOnlineLink() : {method:'',url:''}; // ★オンラインのみ会議リンクを自動発行
  const paymentStatus = menu.payType==='prepaid' ? 'paid'
                      : menu.payType==='transfer' ? 'awaiting_transfer'
                      : menu.payType==='onsite' ? 'onsite' : 'none';
  const bk={id:uid('bk'),date:cState.selDate,time:cState.selTime,name:cState.data.name,email:cState.data.email,tel:cState.data.tel,msg:cState.data.msg,
    menuId:menu.id, menuName:menu.name, minutes:menu.minutes, buffer:menu.buffer||0, price:menu.price, payType:menu.payType, mode:menu.mode,
    paymentStatus:paymentStatus, paymentAt: menu.payType==='prepaid' ? paidAt : '',
    onlineMethod:link.method, onlineUrl:link.url, location: online ? '' : settings.location, status:'confirmed'};
  bookings.push(bk); releaseHold();
  cState.lastBookingId=bk.id;
  try{ sendBookingEmails(bk,'confirmed'); }catch(err){ console.log('メール送信呼び出しエラー', err); } // ★予約確定時にメール送信
  renderDone(bk, '予約が完了しました');
  cShow('done');
}
/* ============================================================
   ★二重予約の防止：サーバー（GAS＝予約台帳）と連携
   ・syncBookingsFromServer … 起動時などにサーバーの確定予約を読み込み、
     枠管理用の bookings を最新状態に置き換える（＝埋まった枠が反映される）。
   ・finalizeWithCheck … 予約を確定する直前に、サーバーへ最終確認してから確定。
   MAIL_ENDPOINT が未設定（プロトタイプ）のときは、従来どおりメモリ上だけで動く。
   ============================================================ */
let serverSynced=false;
function syncBookingsFromServer(cb){
  if(!MAIL_ENDPOINT){ if(cb)cb(); return; }
  fetch(MAIL_ENDPOINT+'?action=list',{method:'GET'})
    .then(r=>r.json())
    .then(list=>{
      if(Array.isArray(list)){
        // サーバーの確定予約で置き換える（画面に開いていない間に入った予約も反映）
        bookings = list.map(b=>({
          id:b.id, date:b.date, time:b.time, minutes:b.minutes||60, buffer:b.buffer||0,
          name:b.name||'', email:b.email||'', tel:b.tel||'', msg:b.msg||'',
          menuId:b.menuId||'', menuName:b.menuName||'予約済み', price:b.price,
          payType:b.payType||'', paymentStatus:b.paymentStatus||'', paymentAt:'',
          mode:b.mode||'online', onlineMethod:b.onlineMethod||'', onlineUrl:b.onlineUrl||'',
          location:b.location||'', status:'confirmed'
        }));
        serverSynced=true;
      }
      if(cb)cb();
    })
    .catch(err=>{ console.log('予約の読み込みに失敗（オフライン等）', err); if(cb)cb(); });
}
// サーバーへ「この枠は空いているか」を確認（GET）。読めない環境では空き扱いにして先へ進む。
function serverSlotCheck(date,time,minutes,buffer,excludeId,cb){
  if(!MAIL_ENDPOINT){ cb(true); return; }
  const q='?action=check&date='+encodeURIComponent(date)+'&time='+encodeURIComponent(time)+
          '&minutes='+(minutes||60)+'&buffer='+(buffer||0)+(excludeId?'&excludeId='+encodeURIComponent(excludeId):'');
  fetch(MAIL_ENDPOINT+q,{method:'GET'})
    .then(r=>r.json()).then(res=>cb(!(res&&res.free===false)))
    .catch(err=>{ console.log('空き確認に失敗（オフライン等）', err); cb(true); });
}
// 予約確定の直前に、サーバーへ最終確認 → 空いていれば確定、埋まっていれば中止して再同期
function finalizeWithCheck(){
  const menu=cState.selMenu;
  if(!MAIL_ENDPOINT){ finalizeBooking(); return; }
  serverSlotCheck(cState.selDate,cState.selTime,menu.minutes,menu.buffer||0,null,function(free){
    if(!free){
      releaseHold();
      alert('申し訳ありません、ほぼ同時に別のご予約が入り、この枠は満席になりました。\n別の日時をお選びください。');
      syncBookingsFromServer(()=>cRestart());
      return;
    }
    finalizeBooking();
  });
}
// お客様＋オーナーへメール送信（送信はGASバックエンドで実行）。
//   type: 'confirmed'=予約確定 / 'changed'=日時変更 / 'cancelled'=キャンセル
function sendBookingEmails(bk, type){
  const payload={
    type: type||'confirmed',
    bookingId:bk.id,
    customerName:bk.name, customerEmail:bk.email, customerTel:bk.tel||'', message:bk.msg||'',
    menuName:bk.menuName, minutes:bk.minutes, buffer:bk.buffer||0,
    price:bk.price, payType:bk.payType, payTypeLabel:payTypeLabel(bk.payType), payStatus:payStatusLabel(bk),
    mode:bk.mode, formatLabel:formatLabel(bk.mode),
    onlineMethod:bk.onlineMethod||'', onlineUrl:bk.onlineUrl||'', location:bk.location||'',
    bankInfo: bk.payType==='transfer' ? settings.bankInfo : '',
    date:bk.date, dateLabel:fmtDateJ(bk.date), time:bk.time, endTime:m2l(t2m(bk.time)+(bk.minutes||60)),
    therapistName:owner.name, ownerEmail:owner.email
  };
  if(!MAIL_ENDPOINT){
    console.log('%c[メール送信プレビュー] ('+payload.type+') MAIL_ENDPOINT未設定のため実際には送信されません。','color:#a9757a');
    console.log('お客様宛('+payload.customerEmail+') / オーナー宛('+payload.ownerEmail+')に送る内容:', payload);
    return;
  }
  // 公開後のサイトからも動く。GASはCORS応答を返さないため no-cors の fire-and-forget で送信を起動。
  fetch(MAIL_ENDPOINT,{ method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(payload) })
    .catch(err=>console.log('メール送信エラー', err));
}
// 完了/変更画面の描画（予約内容・支払い方法・会議リンク・リマインド予定）
function renderDone(bk, title){
  const rem=reminderSchedule(bk);
  // お支払い方法ごとの案内
  let payBlock='';
  if(bk.payType==='free')          payBlock=sumRow('料金','無料');
  else if(bk.payType==='prepaid')  payBlock=sumRow('お支払い','決済完了（'+yen(bk.price)+'）');
  else if(bk.payType==='onsite')   payBlock=sumRow('お支払い','当日お支払い（'+yen(bk.price)+'）');
  else if(bk.payType==='transfer') payBlock=sumRow('お支払い','事前振込（'+yen(bk.price)+'）');
  let note='';
  if(bk.payType==='transfer') note='<p style="margin:10px 0 0;font-size:13.5px;color:var(--ink);background:var(--accent-soft);border:1px solid var(--accent-line);border-radius:10px;padding:10px 12px;">お振込先：'+escapeHtml(settings.bankInfo)+'<br>ご入金の確認後に予約が確定します。</p>';
  else if(bk.payType==='onsite')  note='<p style="margin:10px 0 0;font-size:13.5px;color:var(--accent-deep);">当日、セッション後にお支払いください。</p>';
  // 形式（オンライン／対面）で案内を切り替え
  const online = isOnlineMode(bk);
  const hasUrl = online && bk.onlineUrl;
  const accessRow = online
    ? sumRow(bk.onlineMethod+'リンク', bk.onlineUrl || '後日メールでご案内します')
    : sumRow('場所', bk.location||'（別途ご案内）');
  const accessNote = online
    ? (hasUrl ? '📩 '+bk.onlineMethod+'リンクをメールでお送りしました。'
              : '📩 '+bk.onlineMethod+'の参加リンクは、後日メールで別途ご案内します。')
    : '📍 対面のセッションです。当日は上記の場所へお越しください（詳細はメールでご案内します）。';
  document.getElementById('cDoneMark').textContent='✓';
  document.getElementById('cDoneTitle').textContent=title;
  document.getElementById('cDoneLead').textContent='当日どうぞよろしくお願いいたします。';
  document.getElementById('cDoneActions').classList.remove('hidden');
  document.getElementById('cDoneBody').innerHTML=
    '<div class="selbar" style="margin-top:0;"><b>'+escapeHtml(bk.menuName)+'（'+formatLabel(bk.mode)+'）<br>'+fmtDateJ(bk.date)+' '+bk.time+'</b></div>'+
    '<div class="sum" style="margin-top:12px;text-align:left;">'+payBlock+accessRow+'</div>'+
    note+
    '<p style="margin:12px 0 0;font-size:14px;color:var(--accent-deep);">'+accessNote+'</p>'+
    '<p style="margin:6px 0 0;font-size:14px;color:var(--accent-deep);">🔔 前日（'+rem.prev+'頃）と当日（'+rem.day+'頃）にリマインドを自動送信します。</p>'+
    '<p style="margin:10px 0 0;font-size:15px;">'+escapeHtml(bk.name)+' 様</p>';
}
function cRestart(){
  releaseHold();
  cState.selMenu=null;cState.selDate=null;cState.selTime=null;cState.data={};cState.rescheduleId=null;
  ['cName','cEmail','cTel','cMsg'].forEach(id=>document.getElementById(id).value='');
  const pf=document.getElementById('pcFail'); if(pf)pf.checked=false;
  document.getElementById('cMenuCard').classList.add('hidden');
  document.getElementById('cTimeCard').classList.add('hidden');
  cRenderCal(); cShow('cal');
  // サーバーから最新の予約状況を取り込み、埋まった枠を反映（未設定時は何もしない）
  syncBookingsFromServer(()=>{ if(!document.getElementById('c-cal').classList.contains('hidden')) cRenderCal(); });
}
document.getElementById('cPrev').addEventListener('click',()=>{cState.view=new Date(cState.view.getFullYear(),cState.view.getMonth()-1,1);cRenderCal();});
document.getElementById('cNext').addEventListener('click',()=>{cState.view=new Date(cState.view.getFullYear(),cState.view.getMonth()+1,1);cRenderCal();});
document.getElementById('cToForm').addEventListener('click',cGotoForm);
document.getElementById('cBackCal').addEventListener('click',()=>cShow('cal'));
document.getElementById('cToConfirm').addEventListener('click',cGotoConfirm);
document.getElementById('cBackForm').addEventListener('click',()=>cShow('form'));
document.getElementById('cEditBtn').addEventListener('click',()=>cShow('form'));
document.getElementById('cConfirmBtn').addEventListener('click',cConfirmProceed);
document.getElementById('cBackConfirm').addEventListener('click',()=>{releaseHold();cShow('confirm');});
document.getElementById('cPayBtn').addEventListener('click',processPayment);
document.getElementById('cChange').addEventListener('click',startReschedule);
document.getElementById('cCancel').addEventListener('click',cCancelBooking);
document.getElementById('cRestart').addEventListener('click',cRestart);

// ---- お客様：あとから予約を確認・変更・キャンセル ----
document.getElementById('cGoLookup').addEventListener('click',()=>{ document.getElementById('luList').innerHTML=''; document.getElementById('luErr').style.display='none'; cShow('lookup'); });
document.getElementById('cLookupBack').addEventListener('click',()=>cRestart());
document.getElementById('luFind').addEventListener('click',()=>{
  const email=v('luEmail'), err=document.getElementById('luErr');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return e(err,'メールアドレスを正しく入力してください。');
  err.style.display='none'; cState.lookupEmail=email; luRender();
});
function luRender(){
  const email=cState.lookupEmail;
  const wrap=document.getElementById('luList'); wrap.innerHTML='';
  const list=bookings.filter(b=>b.email===email&&b.status==='confirmed').sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  if(list.length===0){ wrap.innerHTML='<div class="none" style="margin-top:12px;">このメールアドレスのご予約は見つかりませんでした。</div>'; return; }
  list.forEach(bk=>{
    const div=document.createElement('div'); div.className='blockrow'; div.style.marginTop='12px';
    const access = isOnlineMode(bk) ? (bk.onlineMethod+'：'+(bk.onlineUrl||'-')) : ('場所：'+(bk.location||settings.location));
    div.innerHTML='<div class="bd">'+fmtDateJ(bk.date)+' '+bk.time+'〜'+m2l(t2m(bk.time)+(bk.minutes||60))+'</div>'+
      '<div class="bt">'+escapeHtml(bk.menuName||'')+'（'+formatLabel(bk.mode)+'・'+priceLabel(bk)+'）</div>'+
      '<div class="t2" style="color:var(--muted);margin-top:4px;word-break:break-all;">'+escapeHtml(access)+'</div>'+
      '<div class="rowbtns" style="margin-top:10px;"><button class="btn sm" data-act="change">日時を変更</button> <button class="btn sm danger" data-act="cancel">キャンセル</button></div>';
    div.querySelector('[data-act="change"]').addEventListener('click',()=>{ cState.lastBookingId=bk.id; startReschedule(); });
    div.querySelector('[data-act="cancel"]').addEventListener('click',()=>{ askConfirm(fmtDateJ(bk.date)+' '+bk.time+' の予約をキャンセルしますか？', ()=>{ try{ sendBookingEmails(bk,'cancelled'); }catch(err){ console.log('メール送信呼び出しエラー', err); } bookings=bookings.filter(x=>x.id!==bk.id); luRender(); }); });
    wrap.appendChild(div);
  });
}

/* ============================================================
   オーナー側（ログイン → 対応可能日時 / 予約一覧 / 料金設定）
   ============================================================ */
let ownerSession=false;
function renderOwnerTab(){
  document.getElementById('o-login').classList.toggle('hidden', ownerSession);
  document.getElementById('o-main').classList.toggle('hidden', !ownerSession);
  if(ownerSession){ document.getElementById('oName').textContent=owner.name+' さんのページ'; oRenderBlocks(); oRenderNg();
    syncBookingsFromServer(()=>{ if(ownerSession){ oRenderBlocks(); if(!document.getElementById('o-bookings').classList.contains('hidden')) oRenderBookings(); } });
  }
}
document.getElementById('olBtn').addEventListener('click',()=>{
  const email=v('olEmail'), pass=document.getElementById('olPass').value, err=document.getElementById('olErr');
  if(email!==owner.email || pass!==owner.password) return e(err,'メールアドレスまたはパスワードが違います');
  ownerSession=true; document.getElementById('olPass').value=''; err.style.display='none'; renderOwnerTab();
});
document.getElementById('oLogout').addEventListener('click',()=>{ ownerSession=false; renderOwnerTab(); });

document.querySelectorAll('#role-owner .rolebar > button[data-otab]').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('#role-owner .rolebar > button[data-otab]').forEach(x=>x.classList.remove('on')); b.classList.add('on');
    ['avail','bookings','settings'].forEach(s=>document.getElementById('o-'+s).classList.toggle('hidden', s!==b.dataset.otab));
    if(b.dataset.otab==='bookings'){ oRenderBookings(); syncBookingsFromServer(()=>{ if(!document.getElementById('o-bookings').classList.contains('hidden')) oRenderBookings(); }); }
    if(b.dataset.otab==='settings') oRenderMenus();
    if(b.dataset.otab==='avail'){ oRenderBlocks(); oRenderNg(); syncBookingsFromServer(()=>{ if(!document.getElementById('o-avail').classList.contains('hidden')) oRenderBlocks(); }); }
  });
});

function guardOwner(){ if(!ownerSession) throw new Error('ログインが必要です'); }
function oRenderBlocks(){
  guardOwner();
  const wrap=document.getElementById('oBlocks'); wrap.innerHTML='';
  const blocks=owner.availability.map((b,i)=>({b,i})).sort((x,y)=>(x.b.date+x.b.start).localeCompare(y.b.date+y.b.start));
  if(blocks.length===0){wrap.innerHTML='<div class="none">まだ登録がありません。「＋追加」から登録してください。</div>';return;}
  blocks.forEach(({b,i})=>{
    const div=document.createElement('div'); div.className='blockrow';
    const dayBk=bookings.filter(x=>x.date===b.date&&x.status==='confirmed'&&t2m(x.time)>=t2m(b.start)&&t2m(x.time)<t2m(b.end)).sort((x,y)=>t2m(x.time)-t2m(y.time));
    div.innerHTML='<div class="bh"><div><div class="bd">'+fmtDateJ(b.date)+'</div><div class="bt">'+b.start+'〜'+b.end+'</div></div>'+
      '<div class="rowbtns"><button class="linkbtn edit">編集</button><button class="linkbtn del">削除</button></div></div>'+
      (dayBk.length?'<div class="miniSlots">'+dayBk.map(x=>'<span class="miniSlot booked">'+x.time+' 予約済（'+escapeHtml(x.menuName||'')+'）</span>').join('')+'</div>':'');
    div.querySelector('.edit').addEventListener('click',()=>openBlockForm(i));
    div.querySelector('.del').addEventListener('click',()=>{ askConfirm(fmtDateJ(b.date)+' の対応可能枠を削除しますか？', ()=>{ owner.availability.splice(i,1); oRenderBlocks(); }); });
    wrap.appendChild(div);
  });
}
document.getElementById('oAdd').addEventListener('click',()=>openBlockForm());

// 手動ブロック（予約を受けない時間）の一覧・追加・削除
function oRenderNg(){
  guardOwner();
  const wrap=document.getElementById('oNgList'); wrap.innerHTML='';
  const list=(owner.blocks||[]).map((b,i)=>({b,i})).sort((x,y)=>(x.b.date+x.b.start).localeCompare(y.b.date+y.b.start));
  if(list.length===0){wrap.innerHTML='<div class="none">ブロックはありません。</div>';return;}
  list.forEach(({b,i})=>{
    const div=document.createElement('div'); div.className='blockrow';
    div.innerHTML='<div class="bh"><div><div class="bd">'+fmtDateJ(b.date)+'</div><div class="bt" style="color:var(--err);">'+b.start+'〜'+b.end+' 予約不可</div></div>'+
      '<div class="rowbtns"><button class="linkbtn del">削除</button></div></div>';
    div.querySelector('.del').addEventListener('click',()=>{ askConfirm(fmtDateJ(b.date)+' '+b.start+'〜'+b.end+' のブロックを解除しますか？', ()=>{ owner.blocks.splice(i,1); oRenderNg(); }); });
    wrap.appendChild(div);
  });
}
document.getElementById('oAddNg').addEventListener('click',()=>openNgForm());
function openNgForm(){
  guardOwner();
  if(!owner.blocks) owner.blocks=[];
  const root=document.getElementById('modalRoot');
  root.innerHTML='<div class="overlay"><div class="sheet"><button class="close">×</button><h2>予約を受けない時間を追加</h2>'+
    '<label class="f">日付</label><input type="date" id="ngDate" value="2026-08-25">'+
    '<div class="grid2"><div><label class="f">開始</label><input type="time" id="ngStart" value="12:00" step="900"></div>'+
    '<div><label class="f">終了</label><input type="time" id="ngEnd" value="13:00" step="900"></div></div>'+
    '<div class="err" id="ngErr"></div><button class="btn" id="ngSave">保存する</button>'+
    '<p class="hint" style="text-align:left;">この時間はお客様が予約できなくなります（自動計算より優先）。</p></div></div>';
  const close=()=>root.innerHTML='';
  root.querySelector('.close').addEventListener('click',close);
  root.querySelector('.overlay').addEventListener('click',ev=>{if(ev.target.classList.contains('overlay'))close();});
  root.querySelector('#ngSave').addEventListener('click',()=>{
    const date=root.querySelector('#ngDate').value,start=root.querySelector('#ngStart').value,end=root.querySelector('#ngEnd').value,err=root.querySelector('#ngErr');
    if(!date||!start||!end)return e(err,'日付・時間を入力してください。');
    if(t2m(end)<=t2m(start))return e(err,'終了は開始より後にしてください。');
    owner.blocks.push({date,start,end}); close(); oRenderNg();
  });
}
function openBlockForm(idx){
  guardOwner();
  const editing=idx!=null;
  const b=editing?owner.availability[idx]:{date:'2026-08-25',start:'10:00',end:'15:00'};
  const root=document.getElementById('modalRoot');
  root.innerHTML='<div class="overlay"><div class="sheet"><button class="close">×</button><h2>'+(editing?'対応可能日時を編集':'対応可能日時を追加')+'</h2>'+
    '<label class="f">日付</label><input type="date" id="bfDate" value="'+b.date+'">'+
    '<div class="grid2"><div><label class="f">開始時間</label><input type="time" id="bfStart" value="'+b.start+'" step="1800"></div>'+
    '<div><label class="f">終了時間</label><input type="time" id="bfEnd" value="'+b.end+'" step="1800"></div></div>'+
    '<p class="hint" style="text-align:left;">この時間帯の中で、お客様が選んだメニューの長さごとに予約枠が作られます。</p>'+
    '<div class="err" id="bfErr"></div><button class="btn" id="bfSave">保存する</button></div></div>';
  const close=()=>root.innerHTML='';
  root.querySelector('.close').addEventListener('click',close);
  root.querySelector('.overlay').addEventListener('click',ev=>{if(ev.target.classList.contains('overlay'))close();});
  root.querySelector('#bfSave').addEventListener('click',()=>{
    const date=root.querySelector('#bfDate').value,start=root.querySelector('#bfStart').value,end=root.querySelector('#bfEnd').value,err=root.querySelector('#bfErr');
    if(!date||!start||!end)return e(err,'日付・時間を入力してください。');
    if(t2m(end)<=t2m(start))return e(err,'終了時間は開始時間より後にしてください。');
    const nb={date,start,end};
    if(editing) owner.availability[idx]=nb; else owner.availability.push(nb);
    close(); oRenderBlocks();
  });
}

function oRenderBookings(){
  guardOwner();
  const wrap=document.getElementById('oBookingList'); wrap.innerHTML='';
  const list=bookings.slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  if(list.length===0){wrap.innerHTML='<div class="none">予約はまだありません。</div>';return;}
  list.forEach(bk=>{
    const div=document.createElement('div'); div.className='blockrow';
    const ptxt = bk.payType==='free' ? '無料' : (bk.price!=null?Number(bk.price).toLocaleString('ja-JP')+'円':'');
    const needAction = bk.payType==='transfer' && bk.paymentStatus!=='paid';
    div.innerHTML='<div class="bh"><div><div class="bd">'+fmtDateJ(bk.date)+' '+bk.time+'〜'+m2l(t2m(bk.time)+(bk.minutes||60))+'</div>'+
      '<div class="bt" style="color:var(--muted);">'+escapeHtml(bk.name)+' 様'+(bk.menuName?' ／ '+escapeHtml(bk.menuName):'')+(ptxt?' ／ '+ptxt:'')+'</div></div>'+
      '<span class="badge '+(needAction?'':'on')+'" style="'+(needAction?'background:#fbe4d8;color:#b06a2c;':'')+'">'+payStatusLabel(bk)+'</span></div>'+
      '<div class="rowbtns" style="margin-top:10px;"><button class="btn sm" data-a="detail">詳細</button> <button class="btn sm" data-a="change">日時変更</button> <button class="btn sm danger" data-a="cancel">キャンセル</button></div>';
    div.querySelector('[data-a="detail"]').addEventListener('click',()=>openBookingDetail(bk.id));
    div.querySelector('[data-a="change"]').addEventListener('click',()=>ownerReschedule(bk.id));
    div.querySelector('[data-a="cancel"]').addEventListener('click',()=>{ askConfirm(fmtDateJ(bk.date)+' '+bk.time+' '+bk.name+'様 の予約をキャンセルしますか？（枠は再び予約可能になります）', ()=>{ try{ sendBookingEmails(bk,'cancelled'); }catch(err){ console.log('メール送信呼び出しエラー', err); } bookings=bookings.filter(x=>x.id!==bk.id); oRenderBookings(); }); });
    wrap.appendChild(div);
  });
}
function openBookingDetail(id){
  const bk=bookings.find(b=>b.id===id);
  const root=document.getElementById('modalRoot');
  const priceTxt = bk.payType==='free' ? '無料' : (bk.price!=null?yen(bk.price):'-');
  const rem=reminderSchedule(bk);
  const online=isOnlineMode(bk);
  const accessRows = online ? [['オンライン方法',bk.onlineMethod||'-'],['参加URL',bk.onlineUrl||'-']] : [['場所',bk.location||settings.location]];
  const occEnd=m2l(t2m(bk.time)+(bk.minutes||60)+(bk.buffer||0));
  const rows=[['予約ID',bk.id],['メニュー',bk.menuName||'-'],['形式',formatLabel(bk.mode)],
    ['日時',fmtDateJ(bk.date)+' '+bk.time+'〜'+m2l(t2m(bk.time)+(bk.minutes||60))],
    ['所要時間',(bk.minutes||60)+'分'+((bk.buffer||0)>0?'（＋バッファ'+bk.buffer+'分／次の予約は '+occEnd+' 以降）':'')],
    ['お名前',bk.name+' 様'],['メール',bk.email],['電話',bk.tel||'-'],
    ['料金',priceTxt],['お支払い方法',payTypeLabel(bk.payType)],['支払い状況',payStatusLabel(bk)],['決済日時',bk.paymentAt||'-']]
    .concat(accessRows).concat([
    ['リマインド',rem.prev+' ／ '+rem.day+'（自動送信）'],
    ['メッセージ',bk.msg||'（なし）'],['予約状態',bk.status==='confirmed'?'確定':bk.status]]);
  const needConfirm = bk.payType==='transfer' && bk.paymentStatus!=='paid';
  root.innerHTML='<div class="overlay"><div class="sheet"><button class="close">×</button><h2>予約の詳細</h2>'+
    '<div class="sum">'+rows.map(r=>sumRow(r[0],r[1])).join('')+'</div>'+
    (needConfirm?'<button class="btn" id="bkPaid">入金を確認済みにする</button>':'')+
    '<button class="btn ghost" id="bkResched">日時を変更</button>'+
    '<button class="btn danger" id="bkCancel">この予約をキャンセル</button></div></div>';
  const close=()=>root.innerHTML='';
  root.querySelector('.close').addEventListener('click',close);
  root.querySelector('.overlay').addEventListener('click',ev=>{if(ev.target.classList.contains('overlay'))close();});
  if(needConfirm) root.querySelector('#bkPaid').addEventListener('click',()=>{ bk.paymentStatus='paid'; bk.paymentAt=(()=>{const n=new Date();return n.getFullYear()+'-'+pad(n.getMonth()+1)+'-'+pad(n.getDate())+' '+pad(n.getHours())+':'+pad(n.getMinutes());})(); close(); oRenderBookings(); });
  root.querySelector('#bkResched').addEventListener('click',()=>ownerReschedule(id));
  root.querySelector('#bkCancel').addEventListener('click',()=>{ askConfirm('この予約をキャンセルしますか？（枠は再び予約可能になります）', ()=>{ try{ sendBookingEmails(bk,'cancelled'); }catch(err){ console.log('メール送信呼び出しエラー', err); } bookings=bookings.filter(b=>b.id!==id); close(); oRenderBookings(); }); });
}
// 日時変更：メインと同じ月カレンダーで日付→空き時間を選ぶ
function ownerReschedule(id){
  guardOwner();
  const bk=bookings.find(b=>b.id===id);
  cState.rescheduleId=bk.id; // daySlotsで自分の枠を除外（現在の枠も選べる）
  const st={ view:new Date(today.getFullYear(),today.getMonth(),1), date:null, time:null };
  const root=document.getElementById('modalRoot');
  root.innerHTML='<div class="overlay"><div class="sheet"><button class="close">×</button><h2>日時を変更</h2>'+
    '<div class="selbar" style="margin-top:0;">'+escapeHtml(bk.name)+' 様 ／ '+escapeHtml(bk.menuName||'')+'（'+bk.minutes+'分）</div>'+
    '<div class="cal-head" style="margin-top:14px;"><button class="nav" id="orPrev">‹</button><div class="cal-title" id="orTitle"></div><button class="nav" id="orNext">›</button></div>'+
    '<div class="dow"><div class="sun">日</div><div>月</div><div>火</div><div>水</div><div>木</div><div>金</div><div class="sat">土</div></div>'+
    '<div class="grid" id="orGrid"></div>'+
    '<div class="legend"><span><i class="sw-open"></i>予約できる</span><span><i class="sw-full"></i>満員</span><span><i class="sw-closed"></i>受付なし</span></div>'+
    '<div id="orSlotsBox" class="hidden" style="margin-top:14px;"><div class="day-label" id="orDayLabel"></div><div class="slots" id="orSlots"></div></div>'+
    '<div class="selbar hidden" id="orSel" style="margin-top:12px;"></div>'+
    '<button class="btn" id="orSave" disabled style="margin-top:14px;">この日時に変更する</button>'+
    '<button class="btn ghost" id="orCancel">やめる</button>'+
    '</div></div>';
  const close=()=>{ cState.rescheduleId=null; root.innerHTML=''; };
  root.querySelector('.close').addEventListener('click',close);
  root.querySelector('#orCancel').addEventListener('click',close);
  root.querySelector('.overlay').addEventListener('click',ev=>{if(ev.target.classList.contains('overlay'))close();});
  root.querySelector('#orPrev').addEventListener('click',()=>{st.view=new Date(st.view.getFullYear(),st.view.getMonth()-1,1);renderCal();});
  root.querySelector('#orNext').addEventListener('click',()=>{st.view=new Date(st.view.getFullYear(),st.view.getMonth()+1,1);renderCal();});
  root.querySelector('#orSave').addEventListener('click',()=>{
    if(!st.date||!st.time) return;
    if(!slotFree(st.date,st.time,bk.minutes,bk.buffer||0,bk.id)) return;
    bk.date=st.date; bk.time=st.time; // 変更通知＋リマインド再スケジュール
    try{ sendBookingEmails(bk,'changed'); }catch(err){ console.log('メール送信呼び出しエラー', err); }
    cState.rescheduleId=null; root.innerHTML=''; oRenderBookings();
  });
  function renderCal(){
    const y=st.view.getFullYear(), mo=st.view.getMonth();
    root.querySelector('#orTitle').textContent=y+'年'+(mo+1)+'月';
    const grid=root.querySelector('#orGrid'); grid.innerHTML='';
    const startDow=new Date(y,mo,1).getDay(), days=new Date(y,mo+1,0).getDate();
    for(let i=0;i<startDow;i++){const b=document.createElement('div');b.className='cell';grid.appendChild(b);}
    for(let d=1;d<=days;d++){
      const ds=y+'-'+pad(mo+1)+'-'+pad(d), status=dayStatus(ds,bk.minutes,bk.buffer||0);
      const cell=document.createElement('div'); cell.className='cell '+status;
      const num=document.createElement('div'); num.textContent=d; cell.appendChild(num);
      if(status==='open'){const dot=document.createElement('div');dot.className='dot';cell.appendChild(dot);cell.addEventListener('click',()=>selDate(ds,cell));}
      else if(status==='full'){const tg=document.createElement('div');tg.className='tag';tg.textContent='満';cell.appendChild(tg);}
      if(st.date===ds&&status==='open')cell.classList.add('selected');
      grid.appendChild(cell);
    }
    root.querySelector('#orPrev').disabled=(y*100+mo+1)<=today.getFullYear()*100+today.getMonth()+1;
    root.querySelector('#orNext').disabled=(y*100+mo+1)>=lastDay.getFullYear()*100+lastDay.getMonth()+1;
  }
  function selDate(ds,cell){
    st.date=ds; st.time=null;
    root.querySelectorAll('#orGrid .cell').forEach(c=>c.classList.remove('selected')); cell.classList.add('selected');
    root.querySelector('#orDayLabel').textContent=fmtDateJ(ds)+'の空き時間';
    const wrap=root.querySelector('#orSlots'); wrap.innerHTML='';
    const slots=daySlots(ds,bk.minutes,bk.buffer||0,true);
    if(slots.filter(s=>!s.booked).length===0) wrap.innerHTML='<div class="none">この日は空きがありません。</div>';
    slots.forEach(s=>{
      const el=document.createElement('div'); el.className='slot'+(s.booked?' booked':''); el.textContent=s.time;
      if(!s.booked) el.addEventListener('click',()=>{
        root.querySelectorAll('#orSlots .slot').forEach(x=>x.classList.remove('selected')); el.classList.add('selected');
        st.time=s.time;
        const sel=root.querySelector('#orSel'); sel.classList.remove('hidden');
        sel.innerHTML='変更後： <b>'+fmtDateJ(ds)+' '+s.time+'〜'+m2l(t2m(s.time)+bk.minutes)+'</b>';
        root.querySelector('#orSave').disabled=false;
      });
      wrap.appendChild(el);
    });
    root.querySelector('#orSel').classList.add('hidden');
    root.querySelector('#orSave').disabled=true;
    root.querySelector('#orSlotsBox').classList.remove('hidden');
  }
  renderCal();
}

function oRenderMenus(){
  guardOwner();
  document.getElementById('oOnlineView').textContent='現在：'+settings.onlineMethod+'／'+
    (settings.onlineUrlMode==='fixed'?'固定URL'+(settings.onlineFixedUrl?'（設定済み）':'（未入力）'):
     settings.onlineUrlMode==='none'?'URLなし（後日案内）':'自動発行');
  document.getElementById('oLocView').textContent=settings.location;
  document.getElementById('oStepView').textContent='現在：'+(settings.slotStep||30)+'分刻み';
  const wrap=document.getElementById('oMenuList'); wrap.innerHTML='';
  menus.forEach((m,i)=>{
    const row=document.createElement('div'); row.className='listrow';
    row.innerHTML='<div class="meta"><div class="t1">'+escapeHtml(m.name)+' <span class="badge" style="background:#eef1ee;color:var(--ok);">'+formatLabel(m.mode)+'</span> <span class="badge" style="background:#f2ece9;color:var(--accent-deep);">'+PAYTYPES[m.payType].short+'</span></div>'+
      '<div class="t2">'+m.minutes+'分'+((m.buffer||0)>0?'＋余白'+m.buffer+'分':'')+' ／ '+priceLabel(m)+(m.desc?'<br>'+escapeHtml(m.desc):'')+'</div></div>'+
      '<button class="linkbtn edit">編集</button>';
    row.querySelector('.edit').addEventListener('click',ev=>{ev.stopPropagation();openMenuForm(i);});
    row.addEventListener('click',()=>openMenuForm(i));
    wrap.appendChild(row);
  });
}
document.getElementById('oChangeOnline').addEventListener('click',()=>{
  guardOwner();
  const root=document.getElementById('modalRoot');
  root.innerHTML='<div class="overlay"><div class="sheet"><button class="close">×</button><h2>オンライン会議の設定</h2>'+
    '<label class="f">会議の種類</label>'+
    '<select id="onMethod"><option value="Zoom">Zoom</option><option value="Google Meet">Google Meet</option></select>'+
    '<label class="f">参加URLの決め方</label>'+
    '<select id="onMode">'+
      '<option value="fixed">毎回同じ固定URL（あなたの定期ミーティングルーム）</option>'+
      '<option value="auto">予約ごとに自動発行（プロトタイプはダミー）</option>'+
      '<option value="none">URLを入れない（後日メールで別途ご案内）</option>'+
    '</select>'+
    '<div id="onUrlWrap"><label class="f">固定の参加URL</label>'+
      '<input id="onUrl" type="url" placeholder="例）https://zoom.us/j/1234567890?pwd=xxxx">'+
      '<p class="hint" style="text-align:left;">ZoomやGoogle Meetで発行した「毎回同じ会議リンク」を貼り付けます。オンラインのご予約すべてに、このURLをご案内します。</p></div>'+
    '<div class="err" id="onErr"></div>'+
    '<button class="btn" id="onSave">保存する</button>'+
    '<p class="hint" style="text-align:left;">「固定URL」は個人ミーティングルーム等をそのまま案内、「自動発行」は本番でZoom/Google APIから毎回発行（プロトタイプはダミー）、「なし」は後日メールでご案内します。</p></div></div>';
  root.querySelector('#onMethod').value=settings.onlineMethod;
  root.querySelector('#onMode').value=settings.onlineUrlMode||'auto';
  root.querySelector('#onUrl').value=settings.onlineFixedUrl||'';
  const syncMode=()=>{ root.querySelector('#onUrlWrap').style.display = root.querySelector('#onMode').value==='fixed' ? 'block' : 'none'; };
  syncMode();
  root.querySelector('#onMode').addEventListener('change',syncMode);
  const close=()=>root.innerHTML='';
  root.querySelector('.close').addEventListener('click',close);
  root.querySelector('.overlay').addEventListener('click',ev=>{if(ev.target.classList.contains('overlay'))close();});
  root.querySelector('#onSave').addEventListener('click',()=>{
    const mode=root.querySelector('#onMode').value, url=root.querySelector('#onUrl').value.trim(), err=root.querySelector('#onErr');
    if(mode==='fixed' && !/^https?:\/\/.+/.test(url)) return e(err,'固定URLを正しく入力してください（https:// で始まるURL）。');
    settings.onlineMethod=root.querySelector('#onMethod').value;
    settings.onlineUrlMode=mode;
    settings.onlineFixedUrl=url;
    close(); oRenderMenus();
  });
});
document.getElementById('oChangeStep').addEventListener('click',()=>{
  guardOwner();
  const root=document.getElementById('modalRoot');
  root.innerHTML='<div class="overlay"><div class="sheet"><button class="close">×</button><h2>予約の刻み幅</h2>'+
    '<label class="f">予約開始時刻の間隔</label><select id="stepSel"><option value="15">15分刻み</option><option value="30">30分刻み</option><option value="60">60分刻み</option></select>'+
    '<button class="btn" id="stepSave">保存する</button>'+
    '<p class="hint" style="text-align:left;">例：60分メニュー・15分刻み → 10:00, 10:15, 10:30… から開始できます。</p></div></div>';
  root.querySelector('#stepSel').value=String(settings.slotStep||30);
  const close=()=>root.innerHTML='';
  root.querySelector('.close').addEventListener('click',close);
  root.querySelector('.overlay').addEventListener('click',ev=>{if(ev.target.classList.contains('overlay'))close();});
  root.querySelector('#stepSave').addEventListener('click',()=>{ settings.slotStep=Number(root.querySelector('#stepSel').value); close(); oRenderMenus(); });
});
document.getElementById('oChangeLoc').addEventListener('click',()=>{
  guardOwner();
  const root=document.getElementById('modalRoot');
  root.innerHTML='<div class="overlay"><div class="sheet"><button class="close">×</button><h2>対面の場所</h2>'+
    '<label class="f">お客様に案内する場所</label><textarea id="locText">'+escapeHtml(settings.location)+'</textarea>'+
    '<button class="btn" id="locSave">保存する</button>'+
    '<p class="hint" style="text-align:left;">「対面（リアル）」形式のメニューの予約時に、この場所を表示・案内します。</p></div></div>';
  const close=()=>root.innerHTML='';
  root.querySelector('.close').addEventListener('click',close);
  root.querySelector('.overlay').addEventListener('click',ev=>{if(ev.target.classList.contains('overlay'))close();});
  root.querySelector('#locSave').addEventListener('click',()=>{ settings.location=root.querySelector('#locText').value.trim(); close(); oRenderMenus(); });
});
document.getElementById('oAddMenu').addEventListener('click',()=>openMenuForm());
function openMenuForm(idx){
  guardOwner();
  const editing=idx!=null;
  const m=editing?menus[idx]:{name:'',minutes:60,price:11000,payType:'prepaid',mode:'online'};
  const root=document.getElementById('modalRoot');
  root.innerHTML='<div class="overlay"><div class="sheet"><button class="close">×</button><h2>'+(editing?'メニューを編集':'メニューを追加')+'</h2>'+
    '<label class="f">メニュー名</label><input id="mfName" value="'+escapeHtml(m.name)+'" placeholder="例）オンラインセッション／リアルセッション">'+
    '<label class="f">説明<span class="opt2">任意</span></label><textarea id="mfDesc" placeholder="お客様に表示される説明文">'+escapeHtml(m.desc||'')+'</textarea>'+
    '<label class="f">形式</label><select id="mfMode"><option value="online">オンライン（Zoom等・リンク自動発行）</option><option value="inperson">対面（リアル・場所を案内）</option></select>'+
    '<label class="f">所要時間</label><select id="mfDur"><option value="30">30分</option><option value="60">60分</option><option value="90">90分</option><option value="120">120分</option></select>'+
    '<label class="f">バッファ（次の予約までの余白・分）<span class="opt2">0でもOK</span></label><input id="mfBuf" type="number" min="0" step="5" value="'+(m.buffer||0)+'">'+
    '<label class="f">お支払い方法</label><select id="mfPay">'+
      '<option value="prepaid">予約時にカード決済（前払い）</option>'+
      '<option value="transfer">事前に銀行振込</option>'+
      '<option value="onsite">当日お支払い（施術後など）</option>'+
      '<option value="free">無料</option></select>'+
    '<div id="mfPriceWrap"><label class="f">料金（税込・円）</label><input id="mfPrice" type="number" inputmode="numeric" value="'+m.price+'"></div>'+
    '<div class="err" id="mfErr"></div>'+
    '<button class="btn" id="mfSave">保存する</button>'+
    (editing&&menus.length>1?'<button class="btn danger" id="mfDel">このメニューを削除</button>':'')+
    '<p class="hint" style="text-align:left;">「無料」を選ぶと料金なしになります。振込を選ぶと、お客様に振込先を表示します。</p></div></div>';
  root.querySelector('#mfDur').value=String(m.minutes);
  root.querySelector('#mfMode').value=m.mode||'online';
  root.querySelector('#mfPay').value=m.payType;
  const priceWrap=root.querySelector('#mfPriceWrap');
  const syncPay=()=>{ priceWrap.style.display = root.querySelector('#mfPay').value==='free' ? 'none' : 'block'; };
  syncPay();
  root.querySelector('#mfPay').addEventListener('change',syncPay);
  const close=()=>root.innerHTML='';
  root.querySelector('.close').addEventListener('click',close);
  root.querySelector('.overlay').addEventListener('click',ev=>{if(ev.target.classList.contains('overlay'))close();});
  root.querySelector('#mfSave').addEventListener('click',()=>{
    const name=root.querySelector('#mfName').value.trim(), err=root.querySelector('#mfErr');
    if(!name)return e(err,'メニュー名を入力してください。');
    const payType=root.querySelector('#mfPay').value;
    const price = payType==='free' ? 0 : Math.round(Number(root.querySelector('#mfPrice').value));
    if(payType!=='free' && !(price>0)) return e(err,'料金を正しく入力してください。');
    const data={name,desc:root.querySelector('#mfDesc').value.trim(),minutes:Number(root.querySelector('#mfDur').value),buffer:Math.max(0,Math.round(Number(root.querySelector('#mfBuf').value)||0)),price,payType,mode:root.querySelector('#mfMode').value};
    if(editing) Object.assign(menus[idx],data); else menus.push(Object.assign({id:uid('m')},data));
    close(); oRenderMenus();
  });
  if(editing&&menus.length>1) root.querySelector('#mfDel').addEventListener('click',()=>{ askConfirm('「'+m.name+'」を削除しますか？', ()=>{ menus.splice(idx,1); oRenderMenus(); }); });
}

/* 初期表示 */
applyMode();
