console.log('🚀 RaflyChat vFINAL starting...');

// Dark Mode
function applyTheme(){const h=new Date().getHours();const s=localStorage.getItem('rc_theme');if(s==='dark'||(!s&&(h>=18||h<6))){document.documentElement.setAttribute('data-theme','dark');document.querySelector('#themeToggle i').className='fas fa-sun';}else{document.documentElement.removeAttribute('data-theme');document.querySelector('#themeToggle i').className='fas fa-moon';}}
applyTheme(); setInterval(applyTheme,60000);
document.getElementById('themeToggle').onclick=function(){const d=document.documentElement.getAttribute('data-theme')==='dark';if(d){document.documentElement.removeAttribute('data-theme');localStorage.setItem('rc_theme','light');this.querySelector('i').className='fas fa-moon';}else{document.documentElement.setAttribute('data-theme','dark');localStorage.setItem('rc_theme','dark');this.querySelector('i').className='fas fa-sun';}};

// Tabs
document.querySelectorAll('.tab-btn').forEach(b=>{b.onclick=function(){document.querySelectorAll('.tab-btn').forEach(x=>{x.style.color='var(--text-secondary)';x.style.borderBottomColor='transparent';});this.style.color='var(--primary)';this.style.borderBottomColor='var(--primary)';const t=this.dataset.tab;document.getElementById('chatList').style.display=t==='chats'?'block':'none';document.getElementById('groupList').style.display=t==='groups'?'block':'none';document.getElementById('statusTabContent').style.display=t==='status'?'flex':'none';if(t==='groups')loadGroupList();if(t==='status')loadStatusList();};});

// Search user
document.getElementById('searchInput').onkeypress=async function(e){if(e.key==='Enter'){const q=this.value.trim();if(!q)return;const u=await findUserByUsername(q);if(u&&u.uid!==currentUser?.uid){openPrivateChat(u.username);}else if(u&&u.uid===currentUser?.uid){showNotif('Itu kamu sendiri!','info');}else{showNotif('User tidak ditemukan','warning');}}};

// URL parameter
const targetUser=getTargetUsernameFromURL();
if(targetUser){const check=setInterval(()=>{if(currentUser&&userData?.username){clearInterval(check);if(targetUser.toLowerCase()!==userData.username.toLowerCase()){setTimeout(()=>openPrivateChat(targetUser),1500);}}},500);setTimeout(()=>clearInterval(check),30000);}

// AI Panel
document.getElementById('aiPanelBtn').onclick=function(){
    const ex=document.getElementById('aiChatPanel'); if(ex){ex.remove();return;}
    const p=document.createElement('div'); p.id='aiChatPanel'; p.className='ai-chat-panel';
    p.innerHTML=`<div class="ai-chat-panel-header"><h3><img src="src/logoai.jpg" style="width:28px;height:28px;border-radius:50%;" onerror="this.style.display='none';"> Aetheris AI</h3><button class="icon-btn" style="color:white;" onclick="document.getElementById('aiChatPanel').remove()"><i class="fas fa-times"></i></button></div><div class="ai-chat-panel-messages" id="aiMessages"><div class="ai-message"><img src="src/logoai.jpg" class="ai-message-avatar" onerror="this.style.display='none';"><div class="ai-message-bubble">Halo! Aku Aetheris AI. Tanya apa saja! 😊</div></div></div><div class="ai-chat-panel-input"><input type="text" id="aiInput" placeholder="Tanya AI..." style="flex:1;padding:10px 14px;border:2px solid var(--border);border-radius:24px;font-size:14px;background:var(--bg-input);color:var(--text-primary);font-family:inherit;"><button onclick="sendAIMessage()" style="width:44px;height:44px;border:none;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border-radius:50%;cursor:pointer;font-size:16px;"><i class="fas fa-paper-plane"></i></button></div>`;
    document.body.appendChild(p); document.getElementById('aiInput').focus();
    document.getElementById('aiInput').onkeypress=e=>{if(e.key==='Enter')sendAIMessage();};
};

async function sendAIMessage(){
    const i=document.getElementById('aiInput'); const t=i.value.trim(); if(!t) return;
    const c=document.getElementById('aiMessages');
    c.innerHTML+=`<div class="ai-message" style="justify-content:flex-end;"><div class="ai-message-bubble" style="background:var(--primary);color:white;">${t}</div></div>`;
    c.innerHTML+=`<div class="ai-message" id="aiTyping"><div class="ai-message-bubble"><i class="fas fa-spinner fa-spin"></i></div></div>`;
    c.scrollTop=c.scrollHeight; i.value='';
    const a=await getAIResponse(t); document.getElementById('aiTyping')?.remove();
    c.innerHTML+=`<div class="ai-message"><div class="ai-message-bubble">${sanitizeAI(a)}</div></div>`; c.scrollTop=c.scrollHeight;
}

// Escape close
document.onkeydown=e=>{if(e.key==='Escape'){document.querySelectorAll('.modal-overlay').forEach(m=>m.remove());document.getElementById('createGroupModal').style.display='none';}};

// Mobile back
document.getElementById('backToSidebarBtn').onclick=()=>document.getElementById('sidebar').classList.remove('hidden');

console.log('✅ RaflyChat FINAL ready!');
