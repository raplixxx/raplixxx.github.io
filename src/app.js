// src/app.js - SIMPLE NO LOADING

import authManager from './auth/login.js';
import groupManager from './chat/group.js';
import sendMessage from './chat/send.js';
import chatRenderer from './chat/render.js';
import chatActions from './chat/action.js';
import statusUpload from './status/status-upload.js';
import statusView from './status/status-view.js';

class App {
    constructor() {
        this.init();
    }

    init() {
        console.log('🚀 RaflyChat starting...');
        
        // Dark mode auto
        const hour = new Date().getHours();
        if (hour >= 18 || hour < 6) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        
        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('rc_theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('rc_theme', 'dark');
            }
            // Update icon
            const icon = document.querySelector('#themeToggle i');
            if (icon) icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
        });

        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab + 'Tab')?.classList.add('active');
                
                // Load data
                if (btn.dataset.tab === 'groups') groupManager.loadGroupList();
                if (btn.dataset.tab === 'status') statusUpload.loadStatuses();
            });
        });

        // Mobile back button
        document.getElementById('backToSidebar')?.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.remove('hidden');
        });

        // Close modals on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(m => {
                    if (m.id !== 'loginModal') m.style.display = 'none';
                });
            }
        });

        // Close modals on background click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') && e.target.id !== 'loginModal') {
                e.target.style.display = 'none';
            }
        });

        console.log('✅ RaflyChat ready!');
    }
}

// Start app
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
