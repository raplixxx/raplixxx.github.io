document.getElementById('headerAvatar').onclick = openProfileSettings;
document.querySelector('.user-profile-mini').onclick = openProfileSettings;

function openProfileSettings(){
    if(!currentUser||!userData) return;
    const modal=document.createElement('div'); modal.className='modal-overlay';
    modal.innerHTML=`<div class="modal" style="max-width:500px;"><div class="modal-header"><h3>👤 Profil</h3><button class="icon-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button></div><div class="modal-body"><div class="profile-avatar-upload" onclick="document.getElementById('profilePhotoInput').click()"><img src="${userData?.photoURL||currentUser?.photoURL||''}" id="profileAvatarPreview"><div class="profile-avatar-overlay"><i class="fas fa-camera"></i></div><input type="file" id="profilePhotoInput" accept="image/*" style="display:none;" onchange="updateProfilePhoto(event)"></div><div class="form-group"><label class="form-label">Username</label><input type="text" id="editUsername" class="form-input" value="${userData?.username||''}"><p id="editUsernameHint" class="form-hint"></p></div><div class="form-group"><label class="form-label">Nama</label><input type="text" id="editDisplayName" class="form-input" value="${userData?.displayName||''}"></div><div class="form-group"><label class="form-label">Bio</label><textarea id="editBio" class="form-textarea" rows="3">${userData?.bio||''}</textarea></div><button id="saveProfileBtn" class="btn btn-primary btn-block btn-lg"><i class="fas fa-save"></i> Simpan</button></div></div>`;
    document.body.appendChild(modal); modal.onclick=e=>{if(e.target===modal)modal.remove();};
    document.getElementById('editUsername').oninput=async function(){const v=this.value.trim();const h=document.getElementById('editUsernameHint');if(!v||v===userData?.username){h.textContent='';return;}if(!/^[a-zA-Z0-9_]+$/.test(v)){h.textContent='❌ Hanya huruf, angka, underscore';h.style.color='#ef5350';return;}const ok=await isUsernameAvailable(v);h.textContent=ok?'✅ Tersedia':'❌ Sudah dipakai';h.style.color=ok?'#4caf50':'#ef5350';};
    document.getElementById('saveProfileBtn').onclick=async function(){
        const nu=document.getElementById('editUsername').value.trim();
        const nd=document.getElementById('editDisplayName').value.trim();
        const nb=document.getElementById('editBio').value.trim();
        if(!nu){showNotif('Username wajib','error');return;}
        this.disabled=true; this.innerHTML='<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        try{
            const u={displayName:nd,bio:nb};
            if(nu!==userData?.username){
                if(!await isUsernameAvailable(nu)) throw new Error('Username sudah dipakai');
                if(userData?.usernameLower) await db.collection('usernames').doc(userData.usernameLower).delete();
                await db.collection('usernames').doc(nu.toLowerCase()).set({uid:currentUser.uid,username:nu,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
                u.username=nu; u.usernameLower=nu.toLowerCase();
            }
            await db.collection('users').doc(currentUser.uid).update(u);
            userData=(await db.collection('users').doc(currentUser.uid).get()).data();
            updateHeaderUI(); showNotif('✅ Profil disimpan!','success'); modal.remove();
        }catch(e){showNotif(e.message,'error');}
        this.disabled=false; this.innerHTML='<i class="fas fa-save"></i> Simpan';
    };
}

async function updateProfilePhoto(e){
    const f=e.target.files[0]; if(!f||!currentUser) return;
    if(f.size>2*1024*1024){showNotif('Maks 2MB','error');return;}
    const b64=await blobToBase64(f);
    document.getElementById('profileAvatarPreview').src=b64;
    await db.collection('users').doc(currentUser.uid).update({photoURL:b64});
    document.getElementById('headerAvatar').src=b64; userData.photoURL=b64;
    showNotif('✅ Foto diupdate','success');
      }
