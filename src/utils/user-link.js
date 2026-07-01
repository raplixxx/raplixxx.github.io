function generateUserLink(username) {
    return window.location.origin + window.location.pathname + '?u=' + encodeURIComponent(username);
}
function copyUserLink(username) {
    const link = generateUserLink(username);
    navigator.clipboard.writeText(link).then(()=>showNotif('✅ Link disalin!','success')).catch(()=>{
        const inp=document.createElement('input'); inp.value=link; document.body.appendChild(inp);
        inp.select(); document.execCommand('copy'); document.body.removeChild(inp);
        showNotif('✅ Link disalin!','success');
    });
}
function getTargetUsernameFromURL() {
    return new URLSearchParams(window.location.search).get('u');
}
async function isUsernameAvailable(username) {
    if(!username||username.length<3||!/^[a-zA-Z0-9_]+$/.test(username)) return false;
    const snap = await db.collection('usernames').doc(username.toLowerCase()).get();
    return !snap.exists;
}
async function registerUsername(uid, username) {
    const lower = username.toLowerCase();
    if(!await isUsernameAvailable(lower)) throw new Error('Username sudah dipakai');
    const batch = db.batch();
    batch.set(db.collection('usernames').doc(lower), {uid, username, createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    batch.update(db.collection('users').doc(uid), {username, usernameLower:lower});
    await batch.commit();
}
async function findUserByUsername(username) {
    const snap = await db.collection('usernames').doc(username.toLowerCase()).get();
    return snap.exists ? snap.data() : null;
}
