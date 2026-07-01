const SK = {VOICE:'rc_voice',STATUS:'rc_status'};
function saveToLocal(k,v){localStorage.setItem(SK[k]||k,JSON.stringify(v));}
function getFromLocal(k){try{return JSON.parse(localStorage.getItem(SK[k]||k)||'null');}catch{return null;}}
async function saveVoiceNote(blob,dur){
    const b64 = await new Promise((res,rej)=>{const r=new FileReader();r.onloadend=()=>res(r.result);r.onerror=rej;r.readAsDataURL(blob);});
    const notes=getFromLocal('VOICE')||[]; const id='vn_'+Date.now();
    notes.push({id,data:b64,duration:dur,timestamp:Date.now()}); saveToLocal('VOICE',notes); return id;
}
function getVoiceNote(id){return (getFromLocal('VOICE')||[]).find(n=>n.id===id)||null;}
function getActiveStatuses(){
    const all=getFromLocal('STATUS')||[]; const active=all.filter(s=>s.expiresAt>Date.now());
    if(active.length!==all.length) saveToLocal('STATUS',active);
    return active;
}
async function saveStatusPhoto(file,caption){
    const b64 = await compressImage(file,800,0.6);
    const statuses=getActiveStatuses(); const id='st_'+Date.now();
    statuses.push({id,data:b64,caption,timestamp:Date.now(),expiresAt:Date.now()+86400000,userId:currentUser?.uid});
    saveToLocal('STATUS',statuses); return id;
}
function compressImage(file,maxW=800,q=0.7){
    return new Promise((res,rej)=>{
        const r=new FileReader(); r.onload=e=>{
            const img=new Image(); img.onload=()=>{
                const c=document.createElement('canvas'); let w=img.width,h=img.height;
                if(w>maxW){h=(maxW/w)*h;w=maxW;} c.width=w;c.height=h;
                c.getContext('2d').drawImage(img,0,0,w,h); res(c.toDataURL('image/jpeg',q));
            }; img.onerror=rej; img.src=e.target.result;
        }; r.onerror=rej; r.readAsDataURL(file);
    });
}
function blobToBase64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onloadend=()=>res(r.result);r.onerror=rej;r.readAsDataURL(blob);});}
