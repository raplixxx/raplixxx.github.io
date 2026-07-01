// src/utils/user-link.js
// FITUR LINK ACAK PER PENGGUNA

function generateUserLink(uid) {
    const baseUrl = window.location.origin + window.location.pathname;
    return baseUrl + '?user=' + uid;
}

function copyUserLink(uid) {
    const link = generateUserLink(uid);
    navigator.clipboard.writeText(link).then(() => {
        showNotif('✅ Link chat kamu berhasil disalin!', 'success');
    }).catch(() => {
        // Fallback untuk browser lama
        const input = document.createElement('input');
        input.value = link;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showNotif('✅ Link chat kamu berhasil disalin!', 'success');
    });
}

function getTargetUIDFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('user');
      }
