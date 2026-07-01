if('Notification' in window && Notification.permission==='default') Notification.requestPermission();
function showNotif(msg, type='info', dur=4000) {
    const c = document.getElementById('notifications');
    if(!c) return;
    const icons = {success:'✅', error:'❌', warning:'⚠️', info:'ℹ️'};
    const el = document.createElement('div');
    el.className = 'notification '+type;
    el.innerHTML = (icons[type]||'')+' '+msg;
    el.onclick = ()=>{el.classList.add('fade-out');setTimeout(()=>el.remove(),300);};
    c.appendChild(el);
    setTimeout(()=>{if(el.parentNode){el.classList.add('fade-out');setTimeout(()=>el.remove(),300);}},dur);
}
function showBrowserNotification(title, body) {
    if(!('Notification' in window)||Notification.permission!=='granted') return;
    playNotifSound();
    try{const n=new Notification(title,{body,icon:'/favicon.ico',tag:'rc-msg'});n.onclick=()=>{window.focus();n.close();};setTimeout(()=>n.close(),5000);}catch(e){}
}
function notifyNewMessage(sender, preview) {
    showNotif('💬 '+sender+': '+preview.substring(0,50),'info',3000);
    showBrowserNotification(sender, preview.substring(0,100));
}
function playNotifSound() {
    try{
        const ctx=new(window.AudioContext||window.webkitAudioContext)();
        [880,1100].forEach((f,i)=>{
            setTimeout(()=>{
                const o=ctx.createOscillator(),g=ctx.createGain();
                o.connect(g);g.connect(ctx.destination);
                o.frequency.value=f;o.type='sine';
                g.gain.setValueAtTime(0.3,ctx.currentTime);
                g.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.15);
                o.start(ctx.currentTime);o.stop(ctx.currentTime+0.15);
                setTimeout(()=>{o.disconnect();g.disconnect();if(i===1)ctx.close();},200);
            },i*150);
        });
    }catch(e){}
}
