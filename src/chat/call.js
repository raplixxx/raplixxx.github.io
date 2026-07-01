let localStream=null, peerConnection=null, callInProgress=false, callType='voice';
document.getElementById('voiceCallBtn').onclick=()=>startCall('voice');
document.getElementById('videoCallBtn').onclick=()=>startCall('video');

async function startCall(type='voice'){
    if(!activeChatPartner||!currentUser||callInProgress) return;
    callType=type;
    try{
        const constraints=type==='video'?{audio:true,video:{width:{ideal:640},height:{ideal:480}}}:{audio:true,video:false};
        localStream=await navigator.mediaDevices.getUserMedia(constraints);
        callInProgress=true;
        const screen=document.createElement('div'); screen.id='callScreen'; screen.className='call-screen';
        screen.innerHTML=`<div class="call-avatar">${(activeChatPartner?.username||'?')[0].toUpperCase()}</div><div class="call-name">${activeChatPartner?.username||'Unknown'}</div><div class="call-status" id="callStatus">Memanggil...</div><div class="call-duration" id="callDuration" style="display:none;">00:00</div>${type==='video'?'<video id="localVideo" autoplay muted style="position:absolute;top:20px;right:20px;width:120px;height:160px;border-radius:8px;object-fit:cover;border:2px solid white;"></video><video id="remoteVideo" autoplay style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"></video>':''}<div class="call-controls" style="position:absolute;bottom:40px;"><button class="call-btn mute" onclick="toggleMute()"><i class="fas fa-microphone"></i></button><button class="call-btn end" onclick="endCall()"><i class="fas fa-phone-slash"></i></button></div>`;
        document.body.appendChild(screen);
        if(type==='video'&&localStream) document.getElementById('localVideo').srcObject=localStream;
        setTimeout(()=>{if(callInProgress)endCall('Tidak dijawab');},60000);
    }catch(e){showNotif('Gagal akses kamera/mikrofon','error');}
}

function toggleMute(){if(localStream){const t=localStream.getAudioTracks()[0];if(t){t.enabled=!t.enabled;document.querySelector('#callScreen .mute').style.background=t.enabled?'rgba(255,255,255,0.2)':'#ef5350';}}}
function endCall(reason='Berakhir'){callInProgress=false;if(localStream){localStream.getTracks().forEach(t=>t.stop());localStream=null;}if(peerConnection){peerConnection.close();peerConnection=null;}const s=document.getElementById('callScreen');if(s){s.querySelector('.call-status').textContent=reason;setTimeout(()=>s.remove(),1500);}showNotif('📞 '+reason,'info');}
