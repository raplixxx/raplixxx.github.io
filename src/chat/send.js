let activeChatId=null, activeChatPartner=null, activeChatType='private', replyTarget=null;
let mediaRecorder=null, audioChunks=[], isRecording=false, recStart=0, messagesUnsubscribe=null;

document.getElementById('sendBtn').onclick = sendMessage;
document.getElementById('messageInput').onkeypress = function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}};
document.getElementById('voiceNoteBtn').onclick = toggleRecording;
document.getElementById('emojiBtn').onclick = ()=>{const p=document.getElementById('emojiPicker');p.style.display=p.style.display==='none'?'block':'none';};
document.getElementById('attachBtn').onclick = ()=>{const i=document.createElement('input');i.type='file';i.accept='image/*';i.onchange=e=>{if(e.target.files[0])sendImage(e.target.files[0]);};i.click();};
document.getElementById('closeChatBtn').onclick = ()=>{if(messagesUnsubscribe){messagesUnsubscribe();messagesUnsubscribe=null;}document.getElementById('activeChat').style.display='none';document.getElementById('blankChat').style.display='flex';activeChatId=null;activeChatPartner=null;cancelReply();};
document.getElementById('messageInput').oninput = function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px';};

const emojis=['😀','😂','🤣','😊','😍','🤗','😎','🤩','👍','❤️','🔥','💯','🎉','😢','😡','👏','🙏','💪','🤝','✨','🌟','💕','🍕','☕'];
document.querySelector('.emoji-grid').innerHTML = emojis.map(e=>`<button class="emoji-item" onclick="insertEmoji('${e}')">${e}</button>`).join('');

function insertEmoji(emoji){const i=document.getElementById('messageInput');const s=i.selectionStart,e=i.selectionEnd;i.value=i.value.substring(0,s)+emoji+i.value.substring(e);i.selectionStart=i.selectionEnd=s+emoji.length;i.focus();}

async function sendMessage(){
    const input=document.getElementById('messageInput'); const text=input.value.trim();
    if(!text||!currentUser||!activeChatId) return;
    if(isAICommand(text)){await handleAICommand(text);input.value='';input.style.height='auto';return;}
    const msg={text,senderUID:currentUser.uid,senderName:userData?.username||currentUser.displayName||'User',senderPhoto:userData?.photoURL||currentUser?.photoURL||'',timestamp:firebase.firestore.FieldValue.serverTimestamp(),type:'text',edited:false};
    if(replyTarget){msg.replyTo={messageId:replyTarget.id,senderName:replyTarget.senderName,text:replyTarget.text};cancelReply();}
    try{
        const ref=activeChatType==='group'?db.collection('groups').doc(activeChatId).collection('messages'):db.collection('chats').doc(activeChatId).collection('messages');
        if(activeChatType==='private') await db.collection('chats').doc(activeChatId).set({participants:[currentUser.uid,activeChatPartner.uid],lastMessage:text.substring(0,100),lastMessageAt:firebase.firestore.FieldValue.serverTimestamp(),lastSenderUID:currentUser.uid,lastSenderName:userData?.username||currentUser.displayName,[`unread_${activeChatPartner.uid}`]:firebase.firestore.FieldValue.increment(1),[`participantData.${currentUser.uid}`]:{username:userData?.username,photoURL:userData?.photoURL||''},[`participantData.${activeChatPartner.uid}`]:{username:activeChatPartner?.username,photoURL:activeChatPartner?.photoURL||''}},{merge:true});
        await ref.add(msg); input.value='';input.style.height='auto';
    }catch(e){console.error(e);showNotif('Gagal kirim','error');}
}

async function openPrivateChat(username){
    if(!currentUser) return;
    const u=await findUserByUsername(username);
    if(!u){showNotif('User tidak ditemukan','error');return;}
    if(u.uid===currentUser.uid){showNotif('Ini kamu sendiri!','info');return;}
    activeChatPartner=u; activeChatType='private';
    const uids=[currentUser.uid,u.uid].sort(); activeChatId='private_'+uids[0]+'_'+uids[1];
    const cr=db.collection('chats').doc(activeChatId); const cd=await cr.get();
    if(!cd.exists) await cr.set({participants:[currentUser.uid,u.uid],participantData:{[currentUser.uid]:{username:userData?.username,photoURL:userData?.photoURL||''},[u.uid]:{username:u.username,photoURL:u.photoURL||''}},createdAt:firebase.firestore.FieldValue.serverTimestamp(),lastMessage:'',lastMessageAt:firebase.firestore.FieldValue.serverTimestamp(),[`unread_${currentUser.uid}`]:0,[`unread_${u.uid}`]:0});
    document.getElementById('blankChat').style.display='none'; document.getElementById('activeChat').style.display='flex';
    document.getElementById('groupInfoBtn').style.display='none'; document.getElementById('chatPartnerName').textContent=u.username||u.displayName;
    document.getElementById('chatPartnerAvatar').src=u.photoURL||'';
    const pd=await db.collection('users').doc(u.uid).get();
    if(pd.exists){document.getElementById('chatPartnerStatus').textContent=pd.data().status==='online'?'Online':'Offline';document.getElementById('chatPartnerStatus').style.color=pd.data().status==='online'?'#4caf50':'var(--text-secondary)';}
    await cr.update({[`unread_${currentUser.uid}`]:0}); listenMessages(activeChatId,'private'); loadPrivateChatList();
    setTimeout(()=>document.getElementById('messageInput')?.focus(),300);
}

function loadPrivateChatList(){
    if(!currentUser) return;
    db.collection('chats').where('participants','array-contains',currentUser.uid).orderBy('lastMessageAt','desc').onSnapshot(snap=>{
        let h='';
        if(snap.empty) h=`<div style="padding:40px;text-align:center;color:var(--text-secondary);"><i class="fas fa-inbox" style="font-size:48px;opacity:0.5;"></i><p>Belum ada chat</p><p style="font-size:12px;margin-top:16px;">Link chat kamu:</p><code style="background:var(--bg-input);padding:8px 12px;border-radius:8px;font-size:11px;">${userData?.username?generateUserLink(userData.username):'-'}</code></div>`;
        else snap.forEach(d=>{const c=d.data();const pid=c.participants.find(p=>p!==currentUser.uid);const pd=c.participantData?.[pid]||{};const unread=c[`unread_${currentUser.uid}`]||0;const time=c.lastMessageAt?.toDate?.()?.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})||'';h+=`<div class="chat-item ${unread>0?'unread':''}" onclick="openPrivateChatById('${pid}')" style="${unread>0?'background:var(--primary-bg);':''}"><div class="chat-avatar-placeholder">${(pd.username||'?')[0].toUpperCase()}</div><div class="chat-content"><div class="chat-header-row"><span class="chat-name" style="${unread>0?'font-weight:700;':''}">${pd.username||'Unknown'}</span><span class="chat-time">${time}</span></div><div class="chat-preview">${c.lastSenderUID===currentUser.uid?'<span style="color:var(--text-tertiary);">Anda: </span>':''}${(c.lastMessage||'').substring(0,40)}${unread>0?`<span class="chat-badge">${unread}</span>`:''}</div></div></div>`;});
        document.getElementById('chatList').innerHTML=h;
    });
}

async function openPrivateChatById(pid){if(!pid||pid===currentUser?.uid) return;const d=await db.collection('users').doc(pid).get();if(d.exists) openPrivateChat(d.data().username||d.data().displayName);}

function listenMessages(chatId,type){
    if(messagesUnsubscribe){messagesUnsubscribe();messagesUnsubscribe=null;}
    const ref=type==='group'?db.collection('groups').doc(chatId).collection('messages'):db.collection('chats').doc(chatId).collection('messages');
    messagesUnsubscribe=ref.orderBy('timestamp','asc').onSnapshot(snap=>{
        const list=document.getElementById('messagesList'); if(!list) return; list.innerHTML='';
        if(snap.empty){list.innerHTML=`<div style="text-align:center;padding:40px;color:var(--text-secondary);"><i class="fas fa-comments" style="font-size:48px;opacity:0.3;"></i><p>Belum ada pesan. Kirim pesan pertama! 👋</p></div>`;return;}
        snap.forEach(d=>{const m=d.data();m.id=d.id;list.innerHTML+=renderMessage(m);});
        scrollToBottom();
        const last=snap.docs[snap.docs.length-1]?.data();
        if(last&&last.senderUID!==currentUser?.uid&&last.senderUID!=='ai') notifyNewMessage(last.senderName||'User',last.text||'[Voice Note]');
    });
}

function renderMessage(msg){
    const isMe=msg.senderUID===currentUser?.uid, isAI=msg.senderUID==='ai';
    const time=msg.timestamp?.toDate?.()?.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})||'';
    if(msg.type==='image') return `<div class="message-wrapper ${isMe?'sent':'received'}"><div class="message-bubble" style="padding:4px;background:transparent;box-shadow:none;"><img src="${msg.imageData}" class="message-image" onclick="viewImage('${msg.imageData}')" style="max-width:250px;border-radius:8px;cursor:pointer;"><div class="message-meta"><span class="message-time">${time}</span></div></div></div>`;
    if(msg.type==='voice'){const m=Math.floor((msg.duration||0)/60),s=(msg.duration||0)%60;return `<div class="message-wrapper ${isMe?'sent':'received'}"><div class="message-bubble"><div style="display:flex;align-items:center;gap:10px;"><button class="voice-play-btn" onclick="playVN('${msg.voiceNoteId}',this)"><i class="fas fa-play"></i></button><div style="flex:1;height:24px;background:rgba(0,0,0,0.1);border-radius:4px;"><div class="voice-progress" style="width:0;height:100%;background:var(--primary);opacity:0.3;"></div></div><span style="font-size:12px;">${m}:${String(s).padStart(2,'0')}</span></div><div class="message-meta"><span class="message-time">${time}</span></div></div></div>`;}
    let r=''; if(msg.replyTo) r=`<div style="background:rgba(0,0,0,0.05);padding:6px 8px;border-radius:4px;margin-bottom:4px;border-left:3px solid var(--primary);font-size:12px;"><strong style="color:var(--primary);">↩ ${msg.replyTo.senderName||''}</strong><br><span style="color:var(--text-secondary);">${(msg.replyTo.text||'').substring(0,80)}</span></div>`;
    return `<div class="message-wrapper ${isMe?'sent':'received'} ${isAI?'ai-message':''}">${!isMe&&!isAI?`<div style="font-size:11px;color:var(--accent-color);margin-bottom:2px;padding-left:8px;">${msg.senderName||''}</div>`:''}<div class="message-bubble" style="position:relative;">${r}<div class="message-text">${(msg.text||'').replace(/(https?:\/\/[^\s]+)/g,'<a href="$1" target="_blank" style="color:#027eb5;">$1</a>').replace(/\n/g,'<br>')}</div><div class="message-meta"><span class="message-time">${time}</span>${msg.edited?'<span class="message-edited">(diedit)</span>':''}</div></div></div>`;
}

function scrollToBottom(){const c=document.getElementById('messagesContainer');if(c)setTimeout(()=>c.scrollTop=c.scrollHeight,100);}
function setReply(id,name,text){replyTarget={id,senderName:name,text};document.getElementById('replyPreview').style.display='flex';document.getElementById('replyText').textContent=text.substring(0,50);document.getElementById('messageInput')?.focus();}
function cancelReply(){replyTarget=null;document.getElementById('replyPreview').style.display='none';}

async function toggleRecording(){
    if(isRecording){stopRecording();return;}
    try{const s=await navigator.mediaDevices.getUserMedia({audio:true});mediaRecorder=new MediaRecorder(s);audioChunks=[];mediaRecorder.ondataavailable=e=>{if(e.data.size>0)audioChunks.push(e.data);};mediaRecorder.onstop=async()=>{const b=new Blob(audioChunks,{type:'audio/webm'});const dur=Math.round((Date.now()-recStart)/1000);const id=await saveVoiceNote(b,dur);const ref=activeChatType==='group'?db.collection('groups').doc(activeChatId).collection('messages'):db.collection('chats').doc(activeChatId).collection('messages');await ref.add({text:'',senderUID:currentUser.uid,senderName:userData?.username||currentUser.displayName,timestamp:firebase.firestore.FieldValue.serverTimestamp(),type:'voice',voiceNoteId:id,duration:dur});s.getTracks().forEach(t=>t.stop());};mediaRecorder.start();isRecording=true;recStart=Date.now();document.getElementById('voiceNoteBtn').innerHTML='<i class="fas fa-stop" style="color:#ef5350;"></i>';showNotif('🎙️ Merekam...','info');setTimeout(()=>{if(isRecording)stopRecording();},300000);}catch(e){showNotif('Gagal akses mikrofon','error');}
}
function stopRecording(){if(mediaRecorder&&isRecording){mediaRecorder.stop();isRecording=false;}document.getElementById('voiceNoteBtn').innerHTML='<i class="fas fa-microphone"></i>';}
function playVN(id,btn){const vn=getVoiceNote(id);if(!vn){showNotif('VN tidak ditemukan','error');return;}const a=new Audio(vn.data);const i=btn.querySelector('i');a.onplay=()=>i.className='fas fa-pause';a.onpause=()=>i.className='fas fa-play';a.onended=()=>i.className='fas fa-play';a.play().catch(()=>showNotif('Gagal putar','error'));}
async function handleAICommand(text){const q=extractQuestion(text);const ref=activeChatType==='group'?db.collection('groups').doc(activeChatId).collection('messages'):db.collection('chats').doc(activeChatId).collection('messages');const p=await ref.add({text:'🤔 AI berpikir...',senderUID:'ai',senderName:'Aetheris AI',timestamp:firebase.firestore.FieldValue.serverTimestamp()});try{const a=await getAIResponse(q);await p.delete();await ref.add({text:sanitizeAI(a),senderUID:'ai',senderName:'🤖 Aetheris AI',timestamp:firebase.firestore.FieldValue.serverTimestamp()});}catch{await p.delete();await ref.add({text:'Maaf, AI sibuk 🙏',senderUID:'ai',senderName:'🤖 Aetheris AI',timestamp:firebase.firestore.FieldValue.serverTimestamp()});}}
async function sendImage(file){if(!file||!activeChatId)return;const b64=await blobToBase64(file);const ref=activeChatType==='group'?db.collection('groups').doc(activeChatId).collection('messages'):db.collection('chats').doc(activeChatId).collection('messages');await ref.add({text:'',senderUID:currentUser.uid,senderName:userData?.username||currentUser.displayName,timestamp:firebase.firestore.FieldValue.serverTimestamp(),type:'image',imageData:b64});showNotif('✅ Gambar terkirim','success');}
function viewImage(src){const v=document.createElement('div');v.className='image-viewer';v.innerHTML=`<img src="${src}"><div class="image-viewer-actions"><button class="image-viewer-btn" onclick="saveImage('${src}')"><i class="fas fa-download"></i></button><button class="image-viewer-btn" onclick="this.closest('.image-viewer').remove()"><i class="fas fa-times"></i></button></div>`;document.body.appendChild(v);v.onclick=e=>{if(e.target===v)v.remove();};}
function saveImage(src){const a=document.createElement('a');a.href=src;a.download='raflychat_'+Date.now()+'.jpg';document.body.appendChild(a);a.click();document.body.removeChild(a);showNotif('✅ Disimpan','success');}
async function editMsg(id,old){const n=prompt('Edit:',old);if(!n||!n.trim())return;const ref=activeChatType==='group'?db.collection('groups').doc(activeChatId).collection('messages').doc(id):db.collection('chats').doc(activeChatId).collection('messages').doc(id);await ref.update({text:n.trim(),edited:true,editedAt:firebase.firestore.FieldValue.serverTimestamp()});showNotif('✅ Diedit','success');}
async function showForwardModal(id){if(!currentUser)return;const s=await db.collection('groups').where('members','array-contains',currentUser.uid).limit(20).get();if(s.empty){showNotif('Tidak ada grup','warning');return;}const m=document.createElement('div');m.className='modal-overlay';m.innerHTML=`<div class="modal"><div class="modal-header"><h3>↗ Teruskan</h3><button class="icon-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button></div><div class="modal-body">${s.docs.map(d=>{const g=d.data();return`<div class="chat-item" onclick="forwardToGroup('${id}','${d.id}');this.closest('.modal-overlay').remove()"><div class="chat-avatar-placeholder">${g.name[0]}</div><div class="chat-content"><div class="chat-name">${g.name}</div></div></div>`;}).join('')}</div></div>`;document.body.appendChild(m);m.onclick=e=>{if(e.target===m)m.remove();};}
async function forwardToGroup(msgId,gid){const d=await(activeChatType==='group'?db.collection('groups').doc(activeChatId).collection('messages').doc(msgId):db.collection('chats').doc(activeChatId).collection('messages').doc(msgId)).get();if(!d.exists)return;const msg=d.data();await db.collection('groups').doc(gid).collection('messages').add({text:msg.text,senderUID:currentUser.uid,senderName:userData?.username||currentUser.displayName,timestamp:firebase.firestore.FieldValue.serverTimestamp(),forwarded:true,forwardedFrom:msg.senderName});showNotif('✅ Diteruskan','success');}
