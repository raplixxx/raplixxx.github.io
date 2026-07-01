const AIC={url:'https://ai.sumopod.com/v1/chat/completions',key:'sk-f-cGux8U_fsibMTbLa1utw',model:'gpt-4o-mini'};
function isAICommand(t){return t.trim().toLowerCase().startsWith('@bot');}
function extractQuestion(t){return t.replace(/^@bot\s*/i,'').trim();}
async function getAIResponse(q){
    if(!q) return 'Halo! Ada yang bisa saya bantu? 😊';
    try{
        const r=await fetch(AIC.url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+AIC.key},body:JSON.stringify({model:AIC.model,messages:[{role:'system',content:'Kamu Aetheris AI, asisten di RaflyChat. Jawab singkat, ramah, bahasa Indonesia. Maks 3 kalimat.'},{role:'user',content:q}],max_tokens:200,temperature:0.7})});
        const d=await r.json(); return d.choices?.[0]?.message?.content?.trim()||fallback(q);
    }catch{return fallback(q);}
}
function fallback(q){
    q=q.toLowerCase();
    if(q.includes('halo')) return 'Halo! 👋';
    if(q.includes('kabar')) return 'Baik! 😊';
    if(q.includes('waktu')) return 'Jam '+new Date().toLocaleTimeString('id-ID')+' ⏰';
    return 'Maaf, AI sedang istirahat. Coba lagi nanti! 🙏';
}
function sanitizeAI(t){return t.replace(/<[^>]*>/g,'').substring(0,500);}
