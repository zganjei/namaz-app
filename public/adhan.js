(() => {
  'use strict';
  const ZONE = 'Europe/Stockholm';
  const SETTINGS = 'qaza-adhan-enabled-v1';
  const FIRED = 'qaza-adhan-fired-v1';
  const sources = [
    'https://namnak.com/wp-content/uploads/2025/10/1623739897_D1kA7.mp3',
    'https://dl.namaz.ir/s/c/other/azan/rahim_moazenzadeh.mp3'
  ];
  const audio = document.getElementById('adhan-audio');
  const enable = document.getElementById('adhan-enable');
  const disable = document.getElementById('adhan-disable');
  const status = document.getElementById('adhan-status');
  const next = document.getElementById('adhan-next');
  const banner = document.getElementById('adhan-playing');
  const bannerLabel = document.getElementById('adhan-playing-label');
  const read = (key, fallback) => {try{return JSON.parse(localStorage.getItem(key)) ?? fallback;}catch{return fallback;}};
  const write = (key, value) => {try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
  const clock = now => {
    const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(x=>[x.type,x.value]));
    return {day:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`};
  };
  let enabled = read(SETTINGS,false) === true;
  let timetable, timer, previewTimer, inFlight=false, sourceIndex=0, pendingPrayer=null;
  const attempted=new Set();
  audio.src=sources[0];
  function controls(){disable.hidden=!enabled;enable.textContent=enabled?'آماده‌سازی مجدد و تست ۵ ثانیه‌ای':'فعال‌سازی و تست ۵ ثانیه‌ای';}
  function stop(){clearTimeout(previewTimer);audio.pause();audio.currentTime=0;banner.hidden=true;pendingPrayer=null;}
  function summary(){
    if(!timetable){next.textContent='زمان‌بندی در انتظار دریافت جدول است.';return;}
    const c=clock(new Date());
    if(!timetable[c.day]){next.textContent='جدول اوقات شرعی امروز موجود نیست؛ اذان خودکار پخش نمی‌شود.';return;}
    const upcoming=Object.keys(timetable).sort().flatMap(day=>['dhuhr','maghrib'].map(prayer=>({day,prayer,time:timetable[day][prayer]}))).find(x=>x.day>c.day||(x.day===c.day&&x.time>c.time));
    next.textContent=upcoming ? `${enabled?'اذان بعدی':'زمان بعدی'}: ${upcoming.prayer==='dhuhr'?'ظهر':'مغرب'}، ${upcoming.day===c.day?'امروز':upcoming.day} ساعت ${upcoming.time} به وقت استکهلم` : 'آخرین نوبت جدول امروز است؛ برای ماه بعد جدول جدید لازم است.';
  }
  function messageError(){status.textContent='پخش صدا انجام نشد؛ اتصال اینترنت و صدای گوشی را بررسی کنید و دکمه فعال‌سازی یا پخش را بزنید.';}
  async function playPrayer(prayer){
    clearTimeout(previewTimer);
    // Stop the Dua Ahd player if it is playing in another tab.
    document.querySelectorAll('audio').forEach(other=>{if(other!==audio)other.pause();});
    audio.currentTime=0;
    pendingPrayer=prayer;
    bannerLabel.textContent=`اذان ${prayer==='dhuhr'?'ظهر':'مغرب'} در حال پخش است`;
    try{await audio.play();status.textContent=`اذان ${prayer==='dhuhr'?'ظهر':'مغرب'} به وقت استکهلم در حال پخش است.`;}
    catch{messageError();}
  }
  async function tick(){
    summary();
    if(!enabled||!timetable||inFlight)return;
    const c=clock(new Date()),row=timetable[c.day];if(!row)return;
    const prayer=['dhuhr','maghrib'].find(p=>row[p]===c.time);if(!prayer)return;
    const event=`${c.day}:${prayer}`;if(attempted.has(event))return;
    inFlight=true;
    const claim=async()=>{
      const fired=read(FIRED,{});
      if(fired && typeof fired==='object' && fired[event]){attempted.add(event);return;}
      // Claim before playback to prevent repeated audio after reload or in another tab.
      const fresh=Object.fromEntries(Object.entries(fired&&typeof fired==='object'?fired:{}).filter(([key])=>key.startsWith(c.day)));
      fresh[event]=true;write(FIRED,fresh);attempted.add(event);
      if(enabled && clock(new Date()).day===c.day && clock(new Date()).time===c.time)await playPrayer(prayer);
    };
    try{
      if(navigator.locks?.request)await navigator.locks.request('qaza-adhan-playback',claim);
      else await claim();
    }catch{messageError();}
    finally{inFlight=false;}
  }
  enable.addEventListener('click',async()=>{
    enable.disabled=true;stop();audio.load();
    status.textContent='در حال تست صدا…';bannerLabel.textContent='تست ۵ ثانیه‌ای اذان';
    try{
      await audio.play();
      enabled=true;write(SETTINGS,true);controls();
      status.textContent='اذان ظهر و مغرب فعال شد؛ اپ را باز نگه دارید. در حال پخش نمونه ۵ ثانیه‌ای…';
      previewTimer=setTimeout(()=>{stop();status.textContent='اذان ظهر و مغرب فعال است؛ اپ را باز نگه دارید.';tick();},5000);
    }catch{messageError();}
    finally{enable.disabled=false;summary();}
  });
  disable.addEventListener('click',()=>{enabled=false;write(SETTINGS,false);stop();controls();status.textContent='پخش خودکار اذان خاموش است.';summary();});
  document.getElementById('adhan-stop').addEventListener('click',()=>{stop();status.textContent=enabled?'صدا متوقف شد؛ پخش خودکار نوبت بعد فعال است.':'صدا متوقف شد.';});
  audio.addEventListener('play',()=>{banner.hidden=false;});
  audio.addEventListener('pause',()=>{banner.hidden=true;});
  audio.addEventListener('ended',()=>{banner.hidden=true;pendingPrayer=null;});
  audio.addEventListener('error',()=>{
    if(sourceIndex<sources.length-1){
      sourceIndex++;audio.src=sources[sourceIndex];audio.load();
      status.textContent='منبع دوم صوت آماده است؛ برای پخش، دکمه پخش را بزنید.';
      if(pendingPrayer)audio.play().catch(messageError);
    }else messageError();
  });
  window.addEventListener('storage',event=>{if(event.key===SETTINGS){enabled=read(SETTINGS,false)===true;if(!enabled)stop();controls();summary();}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
  window.initAdhan = rows => {timetable=rows;clearInterval(timer);timer=setInterval(tick,1000);tick();};
  controls();summary();
  if(enabled)status.textContent='اذان ظهر و مغرب روشن است؛ برای آماده‌سازی صدا در این صفحه، دکمه تست را بزنید.';
})();
