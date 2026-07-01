let currentUser = null;
let userData = null;

document.getElementById('googleLoginBtn').onclick = () => loginWithProvider(googleProvider, 'Google');
document.getElementById('microsoftLoginBtn').onclick = () => loginWithProvider(microsoftProvider, 'Microsoft');

async function loginWithProvider(provider, name) {
    const btn = name === 'Google' ? document.getElementById('googleLoginBtn') : document.getElementById('microsoftLoginBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghubungkan...';
    document.getElementById('loginError').style.display = 'none';
    try {
        await auth.signInWithPopup(provider);
    } catch(e) {
        let msg = 'Gagal login. ';
        if(e.code==='auth/popup-closed-by-user') msg='Login dibatalkan.';
        else if(e.code==='auth/popup-blocked') msg='Popup diblokir browser.';
        else msg += e.message;
        document.getElementById('loginError').textContent = msg;
        document.getElementById('loginError').style.display = 'block';
    }
    btn.disabled = false;
    btn.innerHTML = name === 'Google' ? '<img src="https://www.google.com/favicon.ico" alt="G"> Masuk dengan Google' : '<i class="fab fa-microsoft"></i> Masuk dengan Microsoft';
}

auth.onAuthStateChanged(async user => {
    if(user) {
        currentUser = user;
        const doc = await db.collection('users').doc(user.uid).get();
        if(!doc.exists) {
            await db.collection('users').doc(user.uid).set({
                uid:user.uid, email:user.email, displayName:user.displayName||'',
                photoURL:user.photoURL||'', createdAt:firebase.firestore.FieldValue.serverTimestamp(),
                lastSeen:firebase.firestore.FieldValue.serverTimestamp(), status:'online'
            },{merge:true});
            showUsernameSetup();
        } else {
            userData = doc.data();
            if(!userData.username) { showUsernameSetup(); }
            else {
                document.getElementById('loginScreen').style.display='none';
                document.getElementById('mainApp').style.display='flex';
                updateHeaderUI();
                loadPrivateChatList();
                loadGroupList();
            }
        }
    } else {
        currentUser=null; userData=null;
        document.getElementById('loginScreen').style.display='flex';
        document.getElementById('mainApp').style.display='none';
    }
});

function showUsernameSetup() {
    document.getElementById('loginScreen').style.display='none';
    document.getElementById('mainApp').style.display='none';
    document.getElementById('usernameSetup').style.display='flex';
    document.getElementById('usernameInput').focus();
}

document.getElementById('usernameInput').oninput = async function() {
    const v = this.value.trim().toLowerCase();
    const avail = document.getElementById('usernameAvailability');
    const err = document.getElementById('usernameError');
    const btn = document.getElementById('saveUsernameBtn');
    err.style.display='none'; avail.style.display='none';
    if(v.length<3){ btn.disabled=true; return; }
    if(!/^[a-zA-Z0-9_]+$/.test(v)){ err.textContent='Hanya huruf, angka, underscore'; err.style.display='block'; btn.disabled=true; return; }
    const ok = await isUsernameAvailable(v);
    avail.style.display='block';
    avail.className = 'username-availability '+(ok?'available':'unavailable');
    avail.textContent = ok?'✅ Tersedia':'❌ Sudah dipakai';
    btn.disabled = !ok;
};

document.getElementById('saveUsernameBtn').onclick = async function() {
    const username = document.getElementById('usernameInput').value.trim();
    if(!username||!currentUser) return;
    this.disabled=true; this.innerHTML='<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    try {
        await registerUsername(currentUser.uid, username);
        await db.collection('users').doc(currentUser.uid).update({username, usernameLower:username.toLowerCase()});
        userData = (await db.collection('users').doc(currentUser.uid).get()).data();
        document.getElementById('usernameSetup').style.display='none';
        document.getElementById('mainApp').style.display='flex';
        updateHeaderUI();
        loadPrivateChatList();
        loadGroupList();
        showNotif('✅ Username @'+username+' berhasil dibuat!','success');
    } catch(e) {
        document.getElementById('usernameError').textContent=e.message;
        document.getElementById('usernameError').style.display='block';
    }
    this.disabled=false; this.innerHTML='<i class="fas fa-check"></i> Simpan Username';
};

function updateHeaderUI() {
    document.getElementById('headerName').textContent = userData?.username || userData?.displayName || 'User';
    document.getElementById('headerAvatar').src = userData?.photoURL || currentUser?.photoURL || '';
    document.getElementById('headerStatus').textContent = 'Online';
    document.getElementById('headerStatus').style.color = '#4caf50';
}

document.getElementById('logoutBtnMain').onclick = async () => {
    if(currentUser) await db.collection('users').doc(currentUser.uid).update({status:'offline',lastSeen:firebase.firestore.FieldValue.serverTimestamp()}).catch(()=>{});
    await auth.signOut();
};

document.getElementById('copyLinkBtn').onclick = () => {
    if(userData?.username) copyUserLink(userData.username);
    else showNotif('Buat username dulu','warning');
};

window.addEventListener('online', ()=>{
    if(currentUser) db.collection('users').doc(currentUser.uid).update({status:'online'}).catch(()=>{});
    document.getElementById('headerStatus').textContent='Online';
    document.getElementById('headerStatus').style.color='#4caf50';
});
window.addEventListener('offline', ()=>{
    document.getElementById('headerStatus').textContent='Offline';
    document.getElementById('headerStatus').style.color='#ef5350';
});
window.addEventListener('beforeunload', ()=>{
    if(currentUser) db.collection('users').doc(currentUser.uid).update({status:'offline',lastSeen:firebase.firestore.FieldValue.serverTimestamp()}).catch(()=>{});
});
