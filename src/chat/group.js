// src/chat/group.js
// Group Management Module - Create Groups, Invite Links, Member Validation

import {
    db,
    collection,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    getDocs,
    query,
    where,
    arrayUnion,
    arrayRemove,
    increment,
    serverTimestamp,
    Timestamp
} from '../database/firebase-config.js';

import { showNotification } from '../utils/notification.js';
import authManager from '../auth/login.js';

class GroupManager {
    constructor() {
        this.currentGroupId = null;
        this.groupListeners = new Map();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Create group button
        document.getElementById('createGroupBtn')?.addEventListener('click', () => {
            this.showCreateGroupModal();
        });

        // Submit group creation
        document.getElementById('submitGroupBtn')?.addEventListener('click', () => {
            this.createGroup();
        });

        // Close modal buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // Group info button
        document.getElementById('groupInfoBtn')?.addEventListener('click', () => {
            if (this.currentGroupId) {
                this.showGroupInfo(this.currentGroupId);
            }
        });

        // Handle enter key in group name input
        document.getElementById('groupName')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.createGroup();
            }
        });
    }

    /**
     * Show create group modal
     */
    showCreateGroupModal() {
        const modal = document.getElementById('createGroupModal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('groupName').value = '';
            document.getElementById('groupDescription').value = '';
            document.getElementById('groupError').style.display = 'none';
            
            // Focus on input
            setTimeout(() => {
                document.getElementById('groupName').focus();
            }, 100);
        }
    }

    /**
     * Create new group
     */
    async createGroup() {
        const groupName = document.getElementById('groupName')?.value.trim();
        const groupDescription = document.getElementById('groupDescription')?.value.trim();
        const errorDiv = document.getElementById('groupError');
        const submitBtn = document.getElementById('submitGroupBtn');

        // Validate input
        if (!groupName) {
            errorDiv.textContent = 'Nama grup tidak boleh kosong';
            errorDiv.style.display = 'block';
            return;
        }

        if (groupName.length < 3) {
            errorDiv.textContent = 'Nama grup minimal 3 karakter';
            errorDiv.style.display = 'block';
            return;
        }

        if (groupName.length > 100) {
            errorDiv.textContent = 'Nama grup maksimal 100 karakter';
            errorDiv.style.display = 'block';
            return;
        }

        try {
            // Disable button
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Membuat Grup...';

            const user = authManager.getCurrentUser();
            if (!user) {
                throw new Error('Anda harus login terlebih dahulu');
            }

            // Generate unique invite link
            const inviteLink = this.generateGroupInviteLink();

            // Create group document
            const groupData = {
                name: groupName,
                description: groupDescription || '',
                createdBy: user.uid,
                createdByEmail: user.email,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                inviteLink: inviteLink,
                members: [user.uid],
                memberCount: 1,
                admins: [user.uid],
                maxMembers: 1000,
                isActive: true
            };

            const docRef = await addDoc(collection(db, 'groups'), groupData);

            // Add group to user's groups
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                groups: arrayUnion(docRef.id)
            });

            // Close modal
            document.getElementById('createGroupModal').style.display = 'none';
            
            showNotification('Grup berhasil dibuat! 🎉', 'success');
            
            // Refresh group list
            this.loadGroupList();
            
            // Show the new group
            setTimeout(() => {
                this.openGroup(docRef.id, groupData);
            }, 500);

        } catch (error) {
            console.error('Error creating group:', error);
            errorDiv.textContent = 'Gagal membuat grup. Silakan coba lagi.';
            errorDiv.style.display = 'block';
            showNotification('Gagal membuat grup', 'error');
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Buat Grup';
        }
    }

    /**
     * Generate unique invite link for group
     */
    generateGroupInviteLink() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 20; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Join group via invite link
     */
    async joinGroupViaLink(inviteLink) {
        try {
            const user = authManager.getCurrentUser();
            if (!user) {
                throw new Error('Anda harus login terlebih dahulu');
            }

            // Find group by invite link
            const groupsRef = collection(db, 'groups');
            const q = query(groupsRef, where('inviteLink', '==', inviteLink));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error('Link undangan tidak valid');
            }

            const groupDoc = querySnapshot.docs[0];
            const groupData = groupDoc.data();

            // Validate member limit
            if (groupData.memberCount >= groupData.maxMembers) {
                throw new Error('Grup sudah mencapai batas maksimal 1.000 anggota');
            }

            // Check if already member
            if (groupData.members.includes(user.uid)) {
                throw new Error('Anda sudah menjadi anggota grup ini');
            }

            // Add user to group
            await updateDoc(doc(db, 'groups', groupDoc.id), {
                members: arrayUnion(user.uid),
                memberCount: increment(1),
                updatedAt: serverTimestamp()
            });

            // Add group to user's groups
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                groups: arrayUnion(groupDoc.id)
            });

            showNotification(`Berhasil bergabung ke grup "${groupData.name}"! 🎉`, 'success');
            
            // Refresh group list
            this.loadGroupList();
            
            // Open the group
            this.openGroup(groupDoc.id, groupData);

        } catch (error) {
            console.error('Error joining group:', error);
            showNotification(error.message || 'Gagal bergabung ke grup', 'error');
            throw error;
        }
    }

    /**
     * Leave group
     */
    async leaveGroup(groupId) {
        try {
            const user = authManager.getCurrentUser();
            if (!user) throw new Error('Anda harus login');

            const groupRef = doc(db, 'groups', groupId);
            const groupDoc = await getDoc(groupRef);

            if (!groupDoc.exists()) {
                throw new Error('Grup tidak ditemukan');
            }

            const groupData = groupDoc.data();

            // Check if user is admin
            if (groupData.admins.includes(user.uid) && groupData.admins.length === 1) {
                // Transfer admin to another member if exists
                const otherMembers = groupData.members.filter(m => m !== user.uid);
                if (otherMembers.length > 0) {
                    await updateDoc(groupRef, {
                        admins: [otherMembers[0]],
                        members: arrayRemove(user.uid),
                        memberCount: increment(-1),
                        updatedAt: serverTimestamp()
                    });
                } else {
                    // Delete group if no members left
                    await updateDoc(groupRef, {
                        isActive: false,
                        updatedAt: serverTimestamp()
                    });
                }
            } else {
                await updateDoc(groupRef, {
                    members: arrayRemove(user.uid),
                    admins: arrayRemove(user.uid),
                    memberCount: increment(-1),
                    updatedAt: serverTimestamp()
                });
            }

            // Remove from user's groups
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                groups: arrayRemove(groupId)
            });

            showNotification('Berhasil keluar dari grup', 'success');
            this.loadGroupList();

        } catch (error) {
            console.error('Error leaving group:', error);
            showNotification('Gagal keluar dari grup', 'error');
        }
    }

    /**
     * Show group info modal
     */
    async showGroupInfo(groupId) {
        try {
            const groupDoc = await getDoc(doc(db, 'groups', groupId));
            if (!groupDoc.exists()) {
                throw new Error('Grup tidak ditemukan');
            }

            const groupData = groupDoc.data();
            const modal = document.getElementById('groupInfoModal');
            const content = document.getElementById('groupInfoContent');

            // Get member details
            const memberPromises = groupData.members.map(async (memberId) => {
                const userDoc = await getDoc(doc(db, 'users', memberId));
                return userDoc.exists() ? userDoc.data() : null;
            });

            const members = (await Promise.all(memberPromises)).filter(m => m !== null);

            content.innerHTML = `
                <div class="group-info-section">
                    <div class="group-info-label">Nama Grup</div>
                    <h3 style="margin-bottom: 8px;">${this.escapeHtml(groupData.name)}</h3>
                    ${groupData.description ? `<p style="color: var(--text-secondary);">${this.escapeHtml(groupData.description)}</p>` : ''}
                </div>

                <div class="group-info-section">
                    <div class="group-info-label">Link Undangan</div>
                    <div class="group-invite-link">
                        <code>${groupData.inviteLink}</code>
                        <button class="copy-link-btn" onclick="navigator.clipboard.writeText('${groupData.inviteLink}').then(() => alert('Link disalin!'))">
                            <i class="fas fa-copy"></i> Salin
                        </button>
                    </div>
                </div>

                <div class="group-info-section">
                    <div class="group-info-label">Anggota (${groupData.memberCount}/${groupData.maxMembers})</div>
                    <div class="member-list">
                        ${members.map(member => `
                            <div class="member-item">
                                <img src="${member.photoURL || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2236%22 height=%2236%22%3E%3Crect width=%2236%22 height=%2236%22 fill=%22%23667eea%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2214%22%3E${(member.displayName || 'U').charAt(0)}%3C/text%3E%3C/svg%3E'}" 
                                     alt="${member.displayName}" 
                                     class="member-avatar">
                                <div class="member-info">
                                    <div class="member-name">${this.escapeHtml(member.displayName)}</div>
                                    <div class="member-role">${groupData.admins.includes(member.uid) ? '👑 Admin' : 'Anggota'}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <button class="primary-btn full-width" style="background: var(--danger-color); margin-top: 20px;" 
                        onclick="window.groupManager.leaveGroup('${groupId}')">
                    <i class="fas fa-sign-out-alt"></i> Keluar dari Grup
                </button>
            `;

            modal.style.display = 'flex';

        } catch (error) {
            console.error('Error showing group info:', error);
            showNotification('Gagal memuat info grup', 'error');
        }
    }

    /**
     * Load group list for sidebar
     */
    async loadGroupList() {
        try {
            const user = authManager.getCurrentUser();
            if (!user) return;

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) return;

            const userGroups = userDoc.data().groups || [];
            const groupList = document.getElementById('groupList');
            
            if (!groupList) return;

            if (userGroups.length === 0) {
                groupList.innerHTML = `
                    <div style="padding: 40px 20px; text-align: center;">
                        <i class="fas fa-users" style="font-size: 48px; color: var(--text-secondary); margin-bottom: 16px;"></i>
                        <p style="color: var(--text-secondary);">Belum ada grup</p>
                        <p style="color: var(--text-secondary); font-size: 12px; margin-top: 8px;">Buat grup baru untuk mulai</p>
                    </div>
                `;
                return;
            }

            // Fetch group details
            const groupPromises = userGroups.map(async (groupId) => {
                const groupDoc = await getDoc(doc(db, 'groups', groupId));
                return groupDoc.exists() ? { id: groupId, ...groupDoc.data() } : null;
            });

            const groups = (await Promise.all(groupPromises)).filter(g => g !== null && g.isActive);

            groupList.innerHTML = groups.map(group => `
                <div class="chat-item" onclick="window.groupManager.openGroup('${group.id}')" data-group-id="${group.id}">
                    <div class="chat-item-avatar" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                         display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 20px;">
                        ${group.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="chat-item-info">
                        <div class="chat-item-header">
                            <span class="chat-item-name">${this.escapeHtml(group.name)}</span>
                            <span class="chat-item-time">${group.memberCount} anggota</span>
                        </div>
                        <div class="chat-item-preview">${this.escapeHtml(group.description || 'Tidak ada deskripsi')}</div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading groups:', error);
        }
    }

    /**
     * Open a group chat
     */
    openGroup(groupId, groupData = null) {
        this.currentGroupId = groupId;
        
        // Update UI
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('chatArea').style.display = 'flex';
        document.getElementById('groupInfoBtn').style.display = 'block';

        if (groupData) {
            document.getElementById('chatName').textContent = groupData.name;
            document.getElementById('chatStatus').textContent = `${groupData.memberCount} anggota`;
            
            // Set group avatar
            const avatar = document.getElementById('chatAvatar');
            avatar.src = `data:image/svg+xml,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                    <rect width="32" height="32" fill="#667eea"/>
                    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="16" font-weight="bold">
                        ${groupData.name.charAt(0)}
                    </text>
                </svg>
            `)}`;
        }

        // Load messages
        if (window.chatRenderer) {
            window.chatRenderer.loadMessages(groupId);
        }

        // On mobile, hide sidebar
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.add('hidden');
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
}

// Create singleton instance
const groupManager = new GroupManager();
window.groupManager = groupManager;

export default groupManager;
