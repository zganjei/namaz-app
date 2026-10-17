(() => {
  'use strict';
  const ZONE = 'Europe/Stockholm';
  const labels = [['fajr','اذان صبح',true],['sunrise','طلوع آفتاب',false],['dhuhr','اذان ظهر',true],['sunset','غروب آفتاب',false],['maghrib','اذان مغرب',true]];
  const el = id => document.getElementById('times-' + id);
  const dateKey = now => {
    const parts = new Intl.DateTimeFormat('en-GB',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
    const p = Object.fromEntries(parts.map(x=>[x.type,x.value]));
    return `${p.year}-${p.month}-${p.day}`;
  };
  const pretty = key => new Intl.DateTimeFormat('fa-IR',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(key+'T12:00:00Z'));
  let rows, keys, selected, lastToday;
  function render() {
    const today = dateKey(new Date());
    const inRange = Boolean(rows[today]);
    el('status').textContent = inRange ? 'ساعت‌ها طبق جدول مرکز امام علی (ع)' : 'جدول این ماه موجود نیست؛ جدول اکتبر ۲۰۲۶ را مشاهده می‌کنید.';
    el('heading').textContent = pretty(selected) + (selected===today ? ' · امروز' : '');
    el('date').value=selected;
    el('prev').disabled=selected===keys[0];
    el('next').disabled=selected===keys[keys.length-1];
    el('today').disabled=!inRange;
    el('today').hidden=!inRange;
    el('grid').replaceChildren(...labels.map(([key,label,azan])=>{
      const card=document.createElement('article');card.className='time-item'+(azan?'':' solar');
      const title=document.createElement('span');title.textContent=label;
      const time=document.createElement('b');time.dir='ltr';time.textContent=rows[selected][key];
      const note=document.createElement('small');note.textContent=azan?'زمان اذان':'زمان خورشید';
      card.append(title,time,note);return card;
    }));
    el('month').replaceChildren(...keys.map(key=>{
      const tr=document.createElement('tr');if(key===today)tr.setAttribute('aria-current','date');
      const day=document.createElement('th');day.scope='row';day.textContent=new Intl.NumberFormat('fa-IR').format(Number(key.slice(-2)));tr.append(day);
      for(const [field] of labels){const td=document.createElement('td');td.dir='ltr';td.textContent=rows[key][field];tr.append(td);}return tr;
    }));
  }
  async function init() {
    try {
      const res=await fetch('/stockholm_prayer_times_oct_2026.json');if(!res.ok)throw Error('fetch');
      const data=await res.json();rows=data.times;keys=Object.keys(rows).sort();
      if(keys.length!==31 || !keys.every(k=>labels.every(([field])=>/^\d{2}:\d{2}$/.test(rows[k][field]))))throw Error('data');
      lastToday=dateKey(new Date());selected=rows[lastToday]?lastToday:keys[0];
      el('date').addEventListener('change',e=>{if(rows[e.target.value]){selected=e.target.value;render();}else el('date').value=selected;});
      const move=step=>{const next=keys[keys.indexOf(selected)+step];if(next){selected=next;render();}};
      el('prev').onclick=()=>move(-1);el('next').onclick=()=>move(1);
      el('today').onclick=()=>{const key=dateKey(new Date());if(rows[key]){selected=key;render();}};
      el('content').hidden=false;render();
      setInterval(()=>{const now=dateKey(new Date());if(now!==lastToday){if(selected===lastToday&&rows[now])selected=now;lastToday=now;render();}},30000);
    }catch(error){el('status').textContent='دریافت جدول انجام نشد؛ صفحه را دوباره باز کنید.';el('status').classList.add('times-error');}
  }
  init();
})();
