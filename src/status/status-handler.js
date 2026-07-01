function showStatusUploadModal(){
    if(!currentUser){showNotif('Login dulu','warning');return;}
    const modal=document.createElement('div'); modal.className='modal-overlay';
    modal.innerHTML=`<div class="modal"><div class="modal-header"><h3>📸 Status Baru</h3><button class="icon-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button></div><div class="modal-body"><div id="statusUploadArea" style="border:2px dashed var(--border);border-radius:12px;padding:40px;text-align:center;cursor:pointer;"><i class="fas fa-cloud-upload-alt" style="font-size:48px;color:var(--primary);"></i><p>Klik pilih foto</p><input type="file" id="statusPhotoInput" accept="image/*" style="display:none;"></div><div id="statusPreview" style="display:none;"><img id="statusPreviewImg" style="width:100%;max-height:300px;object-fit:cover;border-radius:8px;"><textarea id="statusCaption" class="form-textarea" rows="2" placeholder="Caption..." maxlength="200" style="margin-top:16px;"></textarea><button id="submitStatusBtn" class="btn btn-primary btn-block mt-4">📤 Bagikan</button></div><p id="statusError" class="form-error"></p></div></div>`;
    document.body.appendChild(modal); modal.onclick=e=>{if(e.target===modal)modal.remove();};
    const ua=modal.querySelector('#statusUploadArea'); const fi=modal.querySelector('#statusPhotoInput');
    ua.onclick=()=>fi.click();
    ua.ondragover=e=>{e.preventDefault();ua.style.borderColor='var(--primary)';};
    ua.ondragleave=()=>ua.style.borderColor='var(--border)';
    ua.ondrop=e=>{e.preventDefault();ua.style.borderColor='var(--border)';if(e.dataTransfer.files[0])preview(e.dataTransfer.files[0],modal);};
    fi.onchange=e=>{if(e.target.files[0])preview(e.target.files[0],modal);};
    modal.querySelector('#submitStatusBtn').onclick=()=>uploadStatus(modal);
    function preview(file,modal){
        if(!file.type.startsWith('image/')){modal.querySelector('#statusError').textContent='Pilih gambar';modal.querySelector('#statusError').style.display='block';return;}
        if(file.size>5*1024*1024){modal.querySelector('#statusError').textContent='Maks 5MB';modal.querySelector('#statusError').style.display='block';return;}
        modal.statusFile=file; const r=new FileReader();
        r.onload=e=>{modal.querySelector('#statusPreviewImg').src=e.target.result;modal.querySelector('#statusUploadArea').style.display='none';modal.querySelector('#statusPreview').style.display='block';};
        r.readAsDataURL(file);
    }
}

async function uploadStatus(modal){
    const f=modal.statusFile; const cap=modal.querySelector('#statusCaption')?.value.trim()||'';
    if(!f||!currentUser) return;
    const btn=modal.querySelector('#submitStatusBtn'); btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i>...';
    try{
        const b64=await compressImage(f,800,0.6); const id='st_'+Date.now();
        const statuses=getActiveStatuses(); statuses.push({id,data:b64,caption:cap,userId:currentUser.uid,userName:userData?.username||currentUser.displayName,timestamp:Date.now(),expiresAt:Date.now()+86400000});
        saveToLocal('STATUS',statuses);
        await db.collection('statuses').add({userId:currentUser.uid,userName:userData?.username||currentUser.displayName,caption:cap,createdAt:firebase.firestore.FieldValue.serverTimestamp(),expiresAt:new Date(Date.now()+86400000)});
        modal.remove(); showNotif('✅ Status dibagikan!','success'); loadStatusList();
    }catch(e){modal.querySelector('#statusError').textContent='Gagal';modal.querySelector('#statusError').style.display='block';}
    btn.disabled=false; btn.innerHTML='📤 Bagikan';
}

function loadStatusList(){
    const c=document.getElementById('statusListContainer'); if(!c) return;
    db.collection('statuses').where('expiresAt','>',new Date()).orderBy('createdAt','desc').limit(30).onSnapshot(snap=>{
        if(snap.empty){c.innerHTML=`<div style="padding:40px;text-align:center;color:var(--text-secondary);"><i class="fas fa-circle" style="font-size:48px;opacity:0.5;"></i><p>Belum ada status</p></div>`;return;}
        c.innerHTML=snap.docs.map(d=>{const s=d.data();return`<div class="chat-item" onclick="viewStatus('${s.userId}')"><div class="chat-avatar-placeholder" style="border:3px solid var(--primary);">${(s.userName||'?')[0]}</div><div class="chat-content"><div class="chat-name">${s.userName||'Unknown'}</div><div class="chat-preview">${s.caption||'Tanpa caption'}</div></div></div>`;}).join('');
    });
}

function viewStatus(uid){
    const statuses=getActiveStatuses().filter(s=>s.userId===uid);
    if(!statuses.length){showNotif('Status expired','warning');return;}
    const s=statuses[statuses.length-1];
    const v=document.createElement('div'); v.className='image-viewer';
    v.innerHTML=`<img src="${s.data}">${s.caption?`<div style="position:absolute;bottom:40px;left:50%;transform:translateX(-50%);color:white;background:rgba(0,0,0,0.5);padding:8px 16px;border-radius:8px;">${s.caption}</div>`:''}<div class="image-viewer-actions"><button class="image-viewer-btn" onclick="saveImage('${s.data}')"><i class="fas fa-download"></i></button><button class="image-viewer-btn" onclick="this.closest('.image-viewer').remove()"><i class="fas fa-times"></i></button></div>`;
    document.body.appendChild(v); v.onclick=e=>{if(e.target===v)v.remove();};
    setTimeout(()=>{if(v.parentNode)v.remove();},10000);
      }
