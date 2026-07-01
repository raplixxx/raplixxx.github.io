const MAX_MEMBERS=1000; let currentGroupId=null;

document.getElementById('submitGroupBtn').onclick = createGroup;
document.getElementById('createGroupModal').onclick = function(e){if(e.target===this)this.style.display='none';};

async function createGroup(){
    const name=document.getElementById('groupNameInput').value.trim();
    const desc=document.getElementById('groupDescInput').value.trim();
    const err=document.getElementById('groupError');
    const btn=document.getElementById('submitGroupBtn');
    if(!name){err.textContent='Nama grup wajib diisi';err.style.display='block';return;}
    if(!currentUser){err.textContent='Login dulu';err.style.display='block';return;}
    btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Membuat...';
    try{
        const code=Array.from({length:20},()=>'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random()*62)]).join('');
        const ref=await db.collection('groups').add({name,description:desc,createdBy:currentUser.uid,creatorName:userData?.username||currentUser.displayName,createdAt:firebase.firestore.FieldValue.serverTimestamp(),inviteLink:code,members:[currentUser.uid],memberCount:1,admins:[currentUser.uid],maxMembers:MAX_MEMBERS,isActive:true});
        document.getElementById('createGroupModal').style.display='none';
        document.getElementById('groupNameInput').value=''; document.getElementById('groupDescInput').value=''; err.style.display='none';
        showNotif('✅ Grup dibuat!','success'); loadGroupList(); openGroupChat(ref.id);
    }catch(e){err.textContent='Gagal membuat grup';err.style.display='block';}
    btn.disabled=false; btn.innerHTML='<i class="fas fa-check"></i> Buat Grup';
}

function loadGroupList(){
    if(!currentUser) return;
    db.collection('groups').where('members','array-contains',currentUser.uid).where('isActive','==',true).orderBy('createdAt','desc').onSnapshot(snap=>{
        let h=`<div style="padding:12px 16px;"><button onclick="document.getElementById('createGroupModal').style.display='flex';document.getElementById('groupNameInput').focus();" style="width:100%;padding:12px;background:var(--primary);color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-family:inherit;"><i class="fas fa-plus"></i> Buat Grup Baru</button></div>`;
        if(snap.empty) h+=`<div style="padding:40px;text-align:center;color:var(--text-secondary);"><i class="fas fa-users" style="font-size:48px;opacity:0.5;"></i><p>Belum ada grup</p></div>`;
        else snap.forEach(d=>{const g=d.data();h+=`<div class="chat-item" onclick="openGroupChat('${d.id}')"><div class="chat-avatar-placeholder">${g.name[0].toUpperCase()}</div><div class="chat-content"><div class="chat-header-row"><span class="chat-name">${g.name}</span><span class="chat-time">${g.memberCount}/${g.maxMembers}</span></div><div class="chat-preview">🔗 ${g.inviteLink.substring(0,15)}...</div></div></div>`;});
        document.getElementById('groupList').innerHTML=h;
    });
}

function openGroupChat(gid){
    currentGroupId=gid; activeChatType='group'; activeChatId=gid; activeChatPartner=null;
    db.collection('groups').doc(gid).get().then(d=>{
        if(!d.exists) return; const g=d.data();
        document.getElementById('blankChat').style.display='none';
        document.getElementById('activeChat').style.display='flex';
        document.getElementById('groupInfoBtn').style.display='block';
        document.getElementById('chatPartnerName').textContent=g.name;
        document.getElementById('chatPartnerStatus').textContent=g.memberCount+' anggota';
        listenMessages(gid,'group');
    });
}

document.getElementById('groupInfoBtn').onclick = async function(){
    if(!currentGroupId) return;
    const d=await db.collection('groups').doc(currentGroupId).get();
    if(!d.exists) return; const g=d.data();
    const modal=document.createElement('div'); modal.className='modal-overlay';
    modal.innerHTML=`<div class="modal"><div class="modal-header"><h3>📁 ${g.name}</h3><button class="icon-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button></div><div class="modal-body"><p style="color:var(--text-secondary);">${g.description||'Tidak ada deskripsi'}</p><div class="form-group"><label class="form-label">Link Undangan</label><div style="display:flex;gap:8px;"><input value="${g.inviteLink}" readonly class="form-input" style="flex:1;"><button class="btn btn-primary btn-sm" onclick="navigator.clipboard.writeText('${g.inviteLink}');showNotif('✅ Disalin!','success')"><i class="fas fa-copy"></i></button></div></div><p style="font-size:12px;color:var(--text-secondary);">Anggota: ${g.memberCount}/${g.maxMembers}</p><button class="btn btn-danger btn-block mt-4" onclick="leaveGroup('${currentGroupId}');this.closest('.modal-overlay').remove();"><i class="fas fa-sign-out-alt"></i> Keluar Grup</button></div></div>`;
    document.body.appendChild(modal); modal.onclick=e=>{if(e.target===modal)modal.remove();};
};

async function leaveGroup(gid){
    if(!confirm('Yakin keluar?')) return;
    await db.collection('groups').doc(gid).update({members:firebase.firestore.FieldValue.arrayRemove(currentUser.uid),admins:firebase.firestore.FieldValue.arrayRemove(currentUser.uid),memberCount:firebase.firestore.FieldValue.increment(-1)});
    document.getElementById('activeChat').style.display='none'; document.getElementById('blankChat').style.display='flex'; currentGroupId=null;
    showNotif('Keluar dari grup','info'); loadGroupList();
}

document.getElementById('joinGroupBtn').onclick = async function(){
    const link=document.getElementById('inviteLinkInput').value.trim();
    if(!link){showNotif('Masukkan kode undangan','warning');return;}
    if(!currentUser){showNotif('Login dulu','warning');return;}
    const snap=await db.collection('groups').where('inviteLink','==',link).where('isActive','==',true).limit(1).get();
    if(snap.empty){showNotif('Kode tidak valid','error');return;}
    const d=snap.docs[0]; const g=d.data();
    if(g.members.includes(currentUser.uid)){showNotif('Kamu sudah anggota','info');openGroupChat(d.id);return;}
    if(g.memberCount>=g.maxMembers){showNotif('Grup penuh! (Maks 1000)','error');return;}
    await db.collection('groups').doc(d.id).update({members:firebase.firestore.FieldValue.arrayUnion(currentUser.uid),memberCount:firebase.firestore.FieldValue.increment(1)});
    showNotif('✅ Gabung ke '+g.name+'!','success'); document.getElementById('inviteLinkInput').value=''; openGroupChat(d.id);
};
