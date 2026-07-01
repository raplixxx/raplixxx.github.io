/*
 * ============================================
 *   RAFLYCHAT ULTIMATE PREMIUM
 *   WhatsApp Clone Design System
 *   Version: 4.0 Ultimate
 *   Lines: 1800+
 *   Author: RaflyChat Team
 * ============================================
 */

/* ==========================================
   CSS VARIABLES - COMPLETE DESIGN TOKENS
   ========================================== */
:root {
    /* ===== PRIMARY BRAND COLORS ===== */
    --primary-50: #e8f5e9;
    --primary-100: #c8e6c9;
    --primary-200: #a5d6a7;
    --primary-300: #81c784;
    --primary-400: #66bb6a;
    --primary-500: #00a884;
    --primary-600: #008f72;
    --primary-700: #00765e;
    --primary-800: #005c4a;
    --primary-900: #004236;
    --primary: var(--primary-500);
    --primary-dark: var(--primary-600);
    --primary-darker: var(--primary-700);
    --primary-light: #25d366;
    --primary-lighter: #70e8a0;
    --primary-bg: rgba(0, 168, 132, 0.08);
    --primary-bg-hover: rgba(0, 168, 132, 0.15);
    --primary-bg-active: rgba(0, 168, 132, 0.2);
    --primary-gradient: linear-gradient(135deg, #00a884 0%, #25d366 100%);
    --primary-gradient-reverse: linear-gradient(135deg, #25d366 0%, #00a884 100%);

    /* ===== SECONDARY COLORS ===== */
    --blue-50: #e3f2fd;
    --blue-100: #bbdefb;
    --blue-200: #90caf9;
    --blue-300: #64b5f6;
    --blue-400: #42a5f5;
    --blue-500: #2196f3;
    --blue-600: #1e88e5;
    --blue-700: #1976d2;
    --blue: var(--blue-500);
    --blue-dark: var(--blue-700);
    --blue-light: var(--blue-300);
    --blue-bg: rgba(33, 150, 243, 0.08);

    --purple-50: #f3e5f5;
    --purple-100: #e1bee7;
    --purple-200: #ce93d8;
    --purple-300: #ba68c8;
    --purple-400: #ab47bc;
    --purple-500: #9c27b0;
    --purple-600: #8e24aa;
    --purple-700: #7b1fa2;
    --purple: #764ba2;
    --purple-dark: #5c3d7e;
    --purple-light: var(--purple-300);
    --purple-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --purple-gradient-reverse: linear-gradient(135deg, #764ba2 0%, #667eea 100%);

    --red-50: #ffebee;
    --red-100: #ffcdd2;
    --red-200: #ef9a9a;
    --red-300: #e57373;
    --red-400: #ef5350;
    --red-500: #f44336;
    --red-600: #e53935;
    --red-700: #d32f2f;
    --red: var(--red-400);
    --red-dark: var(--red-700);
    --red-light: var(--red-100);

    --orange-50: #fff3e0;
    --orange-100: #ffe0b2;
    --orange-200: #ffcc80;
    --orange-300: #ffb74d;
    --orange-400: #ffa726;
    --orange-500: #ff9800;
    --orange: var(--orange-500);
    --orange-light: var(--orange-50);

    --green-50: #e8f5e9;
    --green-100: #c8e6c9;
    --green-200: #a5d6a7;
    --green-300: #81c784;
    --green-400: #66bb6a;
    --green-500: #4caf50;
    --green: var(--green-500);
    --green-dark: #388e3c;
    --green-light: var(--green-100);

    --yellow-50: #fffde7;
    --yellow-100: #fff9c4;
    --yellow-200: #fff59d;
    --yellow-300: #fff176;
    --yellow-400: #ffee58;
    --yellow-500: #ffeb3b;
    --yellow: var(--yellow-500);
    --yellow-light: var(--yellow-100);

    /* ===== NEUTRAL COLORS ===== */
    --gray-50: #fafafa;
    --gray-100: #f5f5f5;
    --gray-200: #eeeeee;
    --gray-300: #e0e0e0;
    --gray-400: #bdbdbd;
    --gray-500: #9e9e9e;
    --gray-600: #757575;
    --gray-700: #616161;
    --gray-800: #424242;
    --gray-900: #212121;

    /* ===== LIGHT THEME SURFACES ===== */
    --bg-main: #efeae2;
    --bg-main-alt: #e8e3db;
    --bg-surface: #ffffff;
    --bg-surface-alt: #f8f9fa;
    --bg-surface-hover: #f0f1f2;
    --bg-sidebar: #ffffff;
    --bg-sidebar-alt: #fafafa;
    --bg-chat: #e5ddd5;
    --bg-chat-alt: #ebe5de;
    --bg-chat-pattern: #dcd5cd;
    --bg-input: #f0f2f5;
    --bg-input-focus: #ffffff;
    --bg-input-disabled: #e8eaed;
    --bg-hover: #f5f6f6;
    --bg-hover-alt: #e8eaed;
    --bg-hover-dark: #dcdfe2;
    --bg-active: #e8f5e9;
    --bg-active-alt: #dcedc8;
    --bg-selected: #e3f2fd;
    --bg-selected-alt: #bbdefb;
    --bg-message-sent: #d9fdd3;
    --bg-message-sent-hover: #c8f0c0;
    --bg-message-sent-active: #b8e8ae;
    --bg-message-received: #ffffff;
    --bg-message-received-hover: #f5f5f5;
    --bg-message-received-active: #ebebeb;
    --bg-card: #ffffff;
    --bg-card-hover: #fafafa;
    --bg-card-active: #f5f5f5;
    --bg-modal: #ffffff;
    --bg-modal-header: #f8f9fa;
    --bg-overlay: rgba(0, 0, 0, 0.4);
    --bg-overlay-light: rgba(0, 0, 0, 0.2);
    --bg-overlay-dark: rgba(0, 0, 0, 0.7);
    --bg-overlay-darker: rgba(0, 0, 0, 0.9);
    --bg-tooltip: #333333;
    --bg-tooltip-light: #555555;
    --bg-skeleton: #e0e0e0;
    --bg-skeleton-shine: #f5f5f5;
    --bg-scrollbar: #d0d0d0;
    --bg-scrollbar-hover: #b0b0b0;

    /* ===== TEXT COLORS ===== */
    --text-primary: #111b21;
    --text-primary-alt: #1a1a1a;
    --text-secondary: #667781;
    --text-secondary-alt: #54636b;
    --text-tertiary: #8696a0;
    --text-tertiary-alt: #75848c;
    --text-quaternary: #a0aab4;
    --text-quinary: #bcc4ca;
    --text-on-primary: #ffffff;
    --text-on-primary-alt: #f0faf7;
    --text-on-dark: #ffffff;
    --text-on-dark-alt: #e0e0e0;
    --text-link: #027eb5;
    --text-link-hover: #015c84;
    --text-link-active: #014a6e;
    --text-danger: #ef5350;
    --text-danger-hover: #d32f2f;
    --text-success: #4caf50;
    --text-success-hover: #388e3c;
    --text-warning: #ff9800;
    --text-warning-hover: #f57c00;
    --text-info: #2196f3;
    --text-info-hover: #1976d2;
    --text-code: #e91e63;
    --text-code-bg: #fce4ec;
    --text-highlight: #ffeb3b;
    --text-highlight-bg: #fff9c4;

    /* ===== BORDER COLORS ===== */
    --border: #e9edef;
    --border-alt: #e0e4e6;
    --border-light: #f0f2f5;
    --border-lighter: #f5f6f7;
    --border-lightest: #fafbfb;
    --border-input: #e0e0e0;
    --border-input-focus: #00a884;
    --border-input-error: #ef5350;
    --border-input-success: #4caf50;
    --border-card: #e8e8e8;
    --border-card-hover: #d8d8d8;
    --border-divider: #e0e0e0;
    --border-divider-light: #eeeeee;
    --border-avatar: #e0e0e0;
    --border-avatar-active: #00a884;

    /* ===== SHADOWS - ELEVATION SYSTEM ===== */
    --shadow-none: 0 0 0 0 transparent;
    --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
    --shadow-sm-hover: 0 2px 6px rgba(0, 0, 0, 0.12);
    --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.12);
    --shadow-md-hover: 0 4px 12px rgba(0, 0, 0, 0.16);
    --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.16);
    --shadow-lg-hover: 0 12px 40px rgba(0, 0, 0, 0.2);
    --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.2);
    --shadow-xl-hover: 0 20px 56px rgba(0, 0, 0, 0.24);
    --shadow-2xl: 0 24px 64px rgba(0, 0, 0, 0.25);
    --shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.06);
    --shadow-inner-lg: inset 0 4px 8px rgba(0, 0, 0, 0.1);
    --shadow-outline: 0 0 0 3px rgba(0, 168, 132, 0.3);
    --shadow-outline-sm: 0 0 0 2px rgba(0, 168, 132, 0.25);
    --shadow-primary: 0 4px 12px rgba(0, 168, 132, 0.3);
    --shadow-primary-lg: 0 8px 24px rgba(0, 168, 132, 0.4);
    --shadow-danger: 0 4px 12px rgba(239, 83, 80, 0.3);
    --shadow-success: 0 4px 12px rgba(76, 175, 80, 0.3);
    --shadow-info: 0 4px 12px rgba(33, 150, 243, 0.3);
    --shadow-purple: 0 4px 12px rgba(118, 75, 162, 0.3);
    --shadow-float: 0 10px 40px rgba(0, 0, 0, 0.15);

    /* ===== BORDER RADIUS ===== */
    --radius-none: 0;
    --radius-2xs: 2px;
    --radius-xs: 4px;
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-2xl: 20px;
    --radius-3xl: 24px;
    --radius-4xl: 32px;
    --radius-full: 50%;
    --radius-pill: 9999px;

    /* ===== TRANSITIONS ===== */
    --transition-instant: 0.05s ease;
    --transition-fast: 0.12s ease;
    --transition-normal: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-slow: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-very-slow: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-bounce: 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    --transition-spring: 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    --transition-smooth: 0.35s cubic-bezier(0.25, 0.1, 0.25, 1);

    /* ===== TYPOGRAPHY ===== */
    --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    --font-family-display: 'Inter', sans-serif;
    --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;
    --font-size-3xs: 8px;
    --font-size-2xs: 10px;
    --font-size-xs: 11px;
    --font-size-sm: 12px;
    --font-size-md: 14px;
    --font-size-lg: 16px;
    --font-size-xl: 18px;
    --font-size-2xl: 20px;
    --font-size-3xl: 24px;
    --font-size-4xl: 28px;
    --font-size-5xl: 32px;
    --font-size-6xl: 36px;
    --font-size-7xl: 48px;
    --font-size-8xl: 64px;
    --font-weight-thin: 100;
    --font-weight-extralight: 200;
    --font-weight-light: 300;
    --font-weight-regular: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
    --font-weight-extrabold: 800;
    --font-weight-black: 900;
    --line-height-none: 1;
    --line-height-tight: 1.25;
    --line-height-snug: 1.375;
    --line-height-normal: 1.5;
    --line-height-relaxed: 1.625;
    --line-height-loose: 1.75;
    --letter-spacing-tighter: -0.05em;
    --letter-spacing-tight: -0.025em;
    --letter-spacing-normal: 0;
    --letter-spacing-wide: 0.025em;
    --letter-spacing-wider: 0.05em;
    --letter-spacing-widest: 0.1em;

    /* ===== SPACING SYSTEM ===== */
    --space-0: 0;
    --space-px: 1px;
    --space-0-5: 2px;
    --space-1: 4px;
    --space-1-5: 6px;
    --space-2: 8px;
    --space-2-5: 10px;
    --space-3: 12px;
    --space-3-5: 14px;
    --space-4: 16px;
    --space-5: 20px;
    --space-6: 24px;
    --space-7: 28px;
    --space-8: 32px;
    --space-9: 36px;
    --space-10: 40px;
    --space-11: 44px;
    --space-12: 48px;
    --space-14: 56px;
    --space-16: 64px;
    --space-20: 80px;
    --space-24: 96px;
    --space-28: 112px;
    --space-32: 128px;

    /* ===== LAYOUT ===== */
    --sidebar-width: 400px;
    --sidebar-width-lg: 420px;
    --sidebar-width-tablet: 340px;
    --sidebar-width-mobile: 100%;
    --header-height: 60px;
    --header-height-mobile: 56px;
    --input-height: 62px;
    --input-height-mobile: 56px;
    --max-width-container: 1440px;
    --max-width-content: 1200px;
    --max-width-modal: 500px;
    --max-width-modal-sm: 400px;
    --max-width-modal-lg: 600px;
    --max-width-login: 440px;
    --max-width-chat-bubble: 65%;
    --max-width-chat-bubble-mobile: 85%;

    /* ===== Z-INDEX SCALE ===== */
    --z-1: 1;
    --z-2: 2;
    --z-3: 3;
    --z-dropdown: 10;
    --z-sticky: 20;
    --z-sidebar: 30;
    --z-header: 40;
    --z-overlay: 50;
    --z-modal-backdrop: 90;
    --z-modal: 100;
    --z-popover: 200;
    --z-tooltip: 300;
    --z-toast: 500;
    --z-notification: 1000;
    --z-spinner: 2000;
    --z-call: 3000;
    --z-max: 9999;

    /* ===== AVATAR SIZES ===== */
    --avatar-xs: 24px;
    --avatar-sm: 32px;
    --avatar-md: 40px;
    --avatar-lg: 48px;
    --avatar-xl: 56px;
    --avatar-2xl: 64px;
    --avatar-3xl: 80px;
    --avatar-4xl: 120px;

    /* ===== ICON SIZES ===== */
    --icon-xs: 12px;
    --icon-sm: 14px;
    --icon-md: 18px;
    --icon-lg: 20px;
    --icon-xl: 24px;
    --icon-2xl: 28px;
    --icon-3xl: 32px;

    /* ===== MISC ===== */
    --opacity-disabled: 0.5;
    --opacity-hover: 0.8;
    --opacity-active: 0.6;
    --backdrop-blur: blur(4px);
    --backdrop-blur-lg: blur(8px);
    --backdrop-blur-xl: blur(12px);
}

/* ==========================================
   DARK THEME - COMPLETE OVERRIDES
   ========================================== */
[data-theme="dark"] {
    --bg-main: #0b141a;
    --bg-main-alt: #0d1820;
    --bg-surface: #1f2c33;
    --bg-surface-alt: #1a252d;
    --bg-surface-hover: #253138;
    --bg-sidebar: #111b21;
    --bg-sidebar-alt: #151e25;
    --bg-chat: #0b141a;
    --bg-chat-alt: #0d1820;
    --bg-chat-pattern: #0f1a22;
    --bg-input: #2a3942;
    --bg-input-focus: #2d3d46;
    --bg-input-disabled: #1f2c33;
    --bg-hover: #202c33;
    --bg-hover-alt: #253138;
    --bg-hover-dark: #2a373f;
    --bg-active: #182229;
    --bg-active-alt: #1d2931;
    --bg-selected: #1a2a35;
    --bg-selected-alt: #1f303c;
    --bg-message-sent: #005c4b;
    --bg-message-sent-hover: #004d3e;
    --bg-message-sent-active: #003e32;
    --bg-message-received: #202c33;
    --bg-message-received-hover: #253138;
    --bg-message-received-active: #2a373f;
    --bg-card: #1f2c33;
    --bg-card-hover: #253138;
    --bg-card-active: #2a373f;
    --bg-modal: #1f2c33;
    --bg-modal-header: #1a252d;
    --bg-overlay: rgba(0, 0, 0, 0.7);
    --bg-overlay-light: rgba(0, 0, 0, 0.4);
    --bg-overlay-dark: rgba(0, 0, 0, 0.85);
    --bg-overlay-darker: rgba(0, 0, 0, 0.95);
    --bg-tooltip: #424242;
    --bg-tooltip-light: #555555;
    --bg-skeleton: #2a3942;
    --bg-skeleton-shine: #313d45;
    --bg-scrollbar: #3b4a54;
    --bg-scrollbar-hover: #4a5a64;

    --text-primary: #e9edef;
    --text-primary-alt: #d9dfe3;
    --text-secondary: #8696a0;
    --text-secondary-alt: #7a8a94;
    --text-tertiary: #667781;
    --text-tertiary-alt: #5a6b75;
    --text-quaternary: #54636b;
    --text-quinary: #4a5860;
    --text-on-primary: #ffffff;
    --text-on-primary-alt: #e0f0eb;
    --text-on-dark: #ffffff;
    --text-on-dark-alt: #d0d0d0;
    --text-link: #64b5f6;
    --text-link-hover: #90caf9;
    --text-link-active: #42a5f5;
    --text-code: #ff80ab;
    --text-code-bg: #311b1b;
    --text-highlight: #ffd54f;
    --text-highlight-bg: #3e3520;

    --border: #313d45;
    --border-alt: #3b4a54;
    --border-light: #2a373f;
    --border-lighter: #253138;
    --border-lightest: #1f2c33;
    --border-input: #3b4a54;
    --border-input-focus: #00a884;
    --border-input-error: #ef5350;
    --border-input-success: #4caf50;
    --border-card: #2a373f;
    --border-card-hover: #3b4a54;
    --border-divider: #313d45;
    --border-divider-light: #2a373f;
    --border-avatar: #3b4a54;
    --border-avatar-active: #00a884;

    --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
    --shadow-sm-hover: 0 2px 6px rgba(0, 0, 0, 0.5);
    --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.5);
    --shadow-md-hover: 0 4px 12px rgba(0, 0, 0, 0.6);
    --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.6);
    --shadow-lg-hover: 0 12px 40px rgba(0, 0, 0, 0.7);
    --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.7);
    --shadow-xl-hover: 0 20px 56px rgba(0, 0, 0, 0.8);
    --shadow-2xl: 0 24px 64px rgba(0, 0, 0, 0.8);
    --shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.3);
    --shadow-inner-lg: inset 0 4px 8px rgba(0, 0, 0, 0.4);
    --shadow-outline: 0 0 0 3px rgba(0, 168, 132, 0.4);
    --shadow-outline-sm: 0 0 0 2px rgba(0, 168, 132, 0.35);
    --shadow-primary: 0 4px 12px rgba(0, 168, 132, 0.5);
    --shadow-primary-lg: 0 8px 24px rgba(0, 168, 132, 0.6);
    --shadow-danger: 0 4px 12px rgba(239, 83, 80, 0.5);
    --shadow-success: 0 4px 12px rgba(76, 175, 80, 0.5);
    --shadow-info: 0 4px 12px rgba(33, 150, 243, 0.5);
    --shadow-purple: 0 4px 12px rgba(118, 75, 162, 0.5);
    --shadow-float: 0 10px 40px rgba(0, 0, 0, 0.5);
}

/* ==========================================
   CSS RESET & BASE STYLES
   ========================================== */
*,
*::before,
*::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    height: 100%;
    -webkit-text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    scroll-behavior: smooth;
    text-size-adjust: 100%;
}

body {
    font-family: var(--font-family);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-regular);
    line-height: var(--line-height-normal);
    color: var(--text-primary);
    background: var(--bg-main);
    overflow: hidden;
    height: 100vh;
    height: 100dvh;
    width: 100vw;
    width: 100dvw;
    transition: background var(--transition-slow), color var(--transition-slow);
    position: relative;
    letter-spacing: var(--letter-spacing-normal);
}

img,
svg,
video,
canvas {
    display: block;
    max-width: 100%;
    height: auto;
}

a {
    color: var(--text-link);
    text-decoration: none;
    transition: color var(--transition-fast);
    cursor: pointer;
}

a:hover {
    color: var(--text-link-hover);
    text-decoration: underline;
    text-underline-offset: 2px;
}

a:active {
    color: var(--text-link-active);
}

button,
input,
textarea,
select {
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    line-height: inherit;
}

button {
    cursor: pointer;
    border: none;
    background: none;
}

button:disabled {
    cursor: not-allowed;
    opacity: var(--opacity-disabled);
}

input:disabled,
textarea:disabled,
select:disabled {
    opacity: var(--opacity-disabled);
    cursor: not-allowed;
    background: var(--bg-input-disabled);
}

ul,
ol {
    list-style: none;
}

h1,
h2,
h3,
h4,
h5,
h6 {
    font-weight: var(--font-weight-semibold);
    line-height: var(--line-height-tight);
}

p {
    margin-bottom: var(--space-2);
}

code,
pre {
    font-family: var(--font-family-mono);
    font-size: 0.9em;
}

::selection {
    background: var(--primary);
    color: var(--text-on-primary);
}

::-moz-selection {
    background: var(--primary);
    color: var(--text-on-primary);
}

/* ==========================================
   FOCUS VISIBLE - ACCESSIBILITY
   ========================================== */
:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
    border-radius: var(--radius-xs);
}

:focus:not(:focus-visible) {
    outline: none;
}

/* ==========================================
   CUSTOM SCROLLBAR - PREMIUM STYLE
   ========================================== */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

::-webkit-scrollbar-track {
    background: transparent;
    border-radius: var(--radius-full);
    margin: 4px 0;
}

::-webkit-scrollbar-thumb {
    background: var(--bg-scrollbar);
    border-radius: var(--radius-full);
    border: 2px solid transparent;
    background-clip: padding-box;
    transition: background var(--transition-fast);
    min-height: 40px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--bg-scrollbar-hover);
    border: 2px solid transparent;
    background-clip: padding-box;
}

::-webkit-scrollbar-thumb:active {
    background: var(--text-tertiary);
}

::-webkit-scrollbar-corner {
    background: transparent;
}

/* Firefox Scrollbar */
* {
    scrollbar-width: thin;
    scrollbar-color: var(--bg-scrollbar) transparent;
}

/* ==========================================
   ANIMATIONS - COMPLETE KEYFRAMES LIBRARY
   ========================================== */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}

@keyframes slideInUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInDown {
    from { opacity: 0; transform: translateY(-24px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInLeft {
    from { opacity: 0; transform: translateX(24px); }
    to { opacity: 1; transform: translateX(0); }
}

@keyframes slideInRight {
    from { opacity: 0; transform: translateX(-24px); }
    to { opacity: 1; transform: translateX(0); }
}

@keyframes slideOutRight {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(100%); }
}

@keyframes slideOutLeft {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(-100%); }
}

@keyframes slideOutUp {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-24px); }
}

@keyframes slideOutDown {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(24px); }
}

@keyframes scaleIn {
    from { opacity: 0; transform: scale(0.85); }
    to { opacity: 1; transform: scale(1); }
}

@keyframes scaleOut {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.85); }
}

@keyframes scaleInBounce {
    0% { opacity: 0; transform: scale(0.3); }
    50% { opacity: 1; transform: scale(1.08); }
    70% { transform: scale(0.95); }
    100% { transform: scale(1); }
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

@keyframes pulseSubtle {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
}

@keyframes pulseRing {
    0% { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(2.4); opacity: 0; }
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

@keyframes spinReverse {
    from { transform: rotate(360deg); }
    to { transform: rotate(0deg); }
}

@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}

@keyframes skeleton {
    0% { background-position: -200px 0; }
    100% { background-position: calc(200px + 100%) 0; }
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-12px); }
}

@keyframes bounceIn {
    0% { opacity: 0; transform: scale(0.3); }
    50% { opacity: 1; transform: scale(1.05); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); }
}

@keyframes ripple {
    to { transform: scale(4); opacity: 0; }
}

@keyframes typing {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
}

@keyframes typingDot1 {
    0%, 20% { opacity: 0.3; }
    40%, 100% { opacity: 1; }
}

@keyframes typingDot2 {
    0%, 40% { opacity: 0.3; }
    60%, 100% { opacity: 1; }
}

@keyframes typingDot3 {
    0%, 60% { opacity: 0.3; }
    80%, 100% { opacity: 1; }
}

@keyframes messageIn {
    from { opacity: 0; transform: translateY(8px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes messageInSent {
    from { opacity: 0; transform: translateX(16px) scale(0.97); }
    to { opacity: 1; transform: translateX(0) scale(1); }
}

@keyframes messageInReceived {
    from { opacity: 0; transform: translateX(-16px) scale(0.97); }
    to { opacity: 1; transform: translateX(0) scale(1); }
}

@keyframes notificationIn {
    from { opacity: 0; transform: translateX(120%) scale(0.9); }
    to { opacity: 1; transform: translateX(0) scale(1); }
}

@keyframes notificationOut {
    from { opacity: 1; transform: translateX(0) scale(1); }
    to { opacity: 0; transform: translateX(120%) scale(0.9); }
}

@keyframes modalBackdropIn {
    from { opacity: 0; backdrop-filter: blur(0px); }
    to { opacity: 1; backdrop-filter: blur(4px); }
}

@keyframes modalBackdropOut {
    from { opacity: 1; backdrop-filter: blur(4px); }
    to { opacity: 0; backdrop-filter: blur(0px); }
}

@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
}

@keyframes floatSlow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
}

@keyframes glow {
    0%, 100% { box-shadow: 0 0 5px rgba(0, 168, 132, 0.3); }
    50% { box-shadow: 0 0 25px rgba(0, 168, 132, 0.7); }
}

@keyframes glowPulse {
    0%, 100% { box-shadow: 0 0 5px rgba(0, 168, 132, 0.2), 0 0 10px rgba(0, 168, 132, 0.1); }
    50% { box-shadow: 0 0 15px rgba(0, 168, 132, 0.4), 0 0 30px rgba(0, 168, 132, 0.2); }
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
    20%, 40%, 60%, 80% { transform: translateX(4px); }
}

@keyframes shakeHard {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
    20%, 40%, 60%, 80% { transform: translateX(6px); }
}

@keyframes heartbeat {
    0% { transform: scale(1); }
    14% { transform: scale(1.3); }
    28% { transform: scale(1); }
    42% { transform: scale(1.3); }
    70% { transform: scale(1); }
}

@keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

@keyframes gradientShiftSlow {
    0% { background-position: 0% 50%; }
    25% { background-position: 50% 100%; }
    50% { background-position: 100% 50%; }
    75% { background-position: 50% 0%; }
    100% { background-position: 0% 50%; }
}

@keyframes rotate3d {
    0% { transform: perspective(800px) rotateY(0deg); }
    100% { transform: perspective(800px) rotateY(360deg); }
}

@keyframes swingIn {
    0% { opacity: 0; transform: perspective(800px) rotateY(-90deg); }
    100% { opacity: 1; transform: perspective(800px) rotateY(0deg); }
}

@keyframes countIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes badgePop {
    0% { transform: scale(0); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
}

@keyframes stripeMove {
    0% { background-position: 0 0; }
    100% { background-position: 40px 0; }
}

/* ==========================================
   SELECTION STYLING
   ========================================== */
::selection {
    background: var(--primary-400);
    color: var(--text-on-primary);
}

::-moz-selection {
    background: var(--primary-400);
    color: var(--text-on-primary);
}

/* ==========================================
   LOGIN SCREEN - PREMIUM DESIGN
   ========================================== */
.login-screen {
    display: flex;
    position: fixed;
    inset: 0;
    z-index: var(--z-max);
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0f0c29 0%, #302b63 25%, #24243e 50%, #1a1a2e 75%, #0f0c29 100%);
    background-size: 300% 300%;
    animation: gradientShift 20s ease infinite;
}

.login-screen::before {
    content: '';
    position: absolute;
    inset: 0;
    background: 
        radial-gradient(ellipse at 20% 50%, rgba(102, 126, 234, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(118, 75, 162, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 80%, rgba(0, 168, 132, 0.1) 0%, transparent 50%);
    animation: pulseSubtle 6s ease-in-out infinite;
}

.login-screen::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: 
        radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.1) 0%, transparent 100%),
        radial-gradient(1px 1px at 30% 60%, rgba(255,255,255,0.08) 0%, transparent 100%),
        radial-gradient(1px 1px at 50% 10%, rgba(255,255,255,0.12) 0%, transparent 100%),
        radial-gradient(1px 1px at 70% 40%, rgba(255,255,255,0.06) 0%, transparent 100%),
        radial-gradient(1px 1px at 90% 80%, rgba(255,255,255,0.1) 0%, transparent 100%),
        radial-gradient(2px 2px at 15% 70%, rgba(255,255,255,0.15) 0%, transparent 100%),
        radial-gradient(2px 2px at 65% 30%, rgba(255,255,255,0.1) 0%, transparent 100%),
        radial-gradient(2px 2px at 85% 55%, rgba(255,255,255,0.12) 0%, transparent 100%);
}

.login-card {
    background: var(--bg-surface);
    border-radius: var(--radius-3xl);
    padding: 48px 40px;
    text-align: center;
    max-width: var(--max-width-login);
    width: 90%;
    box-shadow: var(--shadow-2xl), 0 0 0 1px rgba(255,255,255,0.05) inset;
    animation: slideInUp 0.6s ease, fadeIn 0.6s ease;
    position: relative;
    overflow: hidden;
    z-index: 1;
}

.login-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--primary), var(--purple), var(--blue), var(--primary));
    background-size: 300% 100%;
    animation: gradientShift 3s ease infinite;
}

.login-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 0%, rgba(0,168,132,0.05) 0%, transparent 70%);
    pointer-events: none;
}

.login-logo {
    width: 88px;
    height: 88px;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
    border-radius: var(--radius-2xl);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 28px;
    font-size: 44px;
    color: white;
    box-shadow: 0 12px 32px rgba(0, 168, 132, 0.35);
    animation: float 4s ease-in-out infinite, glowPulse 3s ease-in-out infinite;
    position: relative;
}

.login-logo::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: var(--radius-2xl);
    border: 2px solid rgba(255,255,255,0.3);
    animation: pulse 2s ease-in-out infinite;
}

.login-title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-extrabold);
    color: var(--text-primary);
    margin-bottom: 8px;
    letter-spacing: var(--letter-spacing-tight);
    background: linear-gradient(135deg, var(--text-primary), var(--primary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.login-subtitle {
    color: var(--text-secondary);
    font-size: var(--font-size-md);
    margin-bottom: 36px;
    line-height: var(--line-height-relaxed);
}

.login-btn {
    width: 100%;
    padding: 15px 24px;
    border: 2px solid var(--border);
    background: var(--bg-surface);
    color: var(--text-primary);
    border-radius: var(--radius-lg);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-family: inherit;
    transition: all var(--transition-normal);
    margin-bottom: 14px;
    position: relative;
    overflow: hidden;
    letter-spacing: var(--letter-spacing-wide);
}

.login-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--primary);
    opacity: 0;
    transition: opacity var(--transition-fast);
    z-index: -1;
}

.login-btn:hover {
    background: var(--bg-hover);
    border-color: var(--primary);
    transform: translateY(-3px);
    box-shadow: var(--shadow-md), 0 6px 20px rgba(0,0,0,0.1);
}

.login-btn:hover::after {
    opacity: 0.03;
}

.login-btn:active {
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-instant);
}

.login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
}

.login-btn.google {
    border-color: #4285f4;
}

.login-btn.google:hover {
    background: #f0f6ff;
    border-color: #3367d6;
    box-shadow: 0 6px 20px rgba(66,133,244,0.2);
}

.login-btn.microsoft {
    border-color: #00a4ef;
}

.login-btn.microsoft:hover {
    background: #f0f9ff;
    border-color: #0078d4;
    box-shadow: 0 6px 20px rgba(0,164,239,0.2);
}

.login-btn img,
.login-btn svg {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
}

.login-error {
    color: var(--text-danger);
    margin-top: 16px;
    font-size: var(--font-size-sm);
    display: none;
    padding: 12px 16px;
    background: var(--red-50);
    border-radius: var(--radius-md);
    animation: shake 0.5s ease;
    border-left: 3px solid var(--red);
    text-align: left;
}

.login-footer {
    margin-top: 28px;
    padding-top: 24px;
    border-top: 1px solid var(--border-light);
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.login-footer i {
    color: var(--green);
}

/* ==========================================
   USERNAME SETUP SCREEN
   ========================================== */
.username-setup {
    display: none;
    position: fixed;
    inset: 0;
    z-index: calc(var(--z-max) + 1);
    align-items: center;
    justify-content: center;
    background: var(--bg-overlay);
    backdrop-filter: var(--backdrop-blur-lg);
    animation: modalBackdropIn 0.3s ease;
}

.username-setup-card {
    background: var(--bg-surface);
    border-radius: var(--radius-3xl);
    padding: 44px 40px;
    max-width: 460px;
    width: 90%;
    box-shadow: var(--shadow-2xl);
    animation: scaleInBounce 0.5s ease;
    border: 1px solid var(--border-light);
}

.username-setup-icon {
    width: 72px;
    height: 72px;
    background: var(--purple-gradient);
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    font-size: 32px;
    color: white;
    animation: bounce 1s ease;
    box-shadow: var(--shadow-purple);
}

.username-setup-title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    text-align: center;
    margin-bottom: 8px;
}

.username-setup-subtitle {
    text-align: center;
    color: var(--text-secondary);
    margin-bottom: 28px;
    font-size: var(--font-size-md);
}

.username-input-group {
    position: relative;
    margin-bottom: 20px;
}

.username-input-group::before {
    content: '@';
    position: absolute;
    left: 18px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-tertiary);
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    z-index: 2;
    pointer-events: none;
}

.username-input {
    width: 100%;
    padding: 16px 20px 16px 42px;
    border: 2px solid var(--border-input);
    border-radius: var(--radius-lg);
    font-size: var(--font-size-lg);
    background: var(--bg-input);
    color: var(--text-primary);
    font-family: inherit;
    transition: all var(--transition-normal);
    letter-spacing: var(--letter-spacing-wide);
}

.username-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: var(--shadow-outline);
    background: var(--bg-input-focus);
}

.username-input::placeholder {
    color: var(--text-quaternary);
}

.username-input:focus::placeholder {
    opacity: 0.5;
}

.username-hint {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.username-error {
    color: var(--text-danger);
    font-size: var(--font-size-sm);
    margin-top: 8px;
    display: none;
    padding: 10px 14px;
    background: var(--red-50);
    border-radius: var(--radius-md);
    border-left: 3px solid var(--red);
}

.username-availability {
    font-size: var(--font-size-sm);
    margin-top: 10px;
    display: none;
    font-weight: var(--font-weight-medium);
    padding: 8px 14px;
    border-radius: var(--radius-md);
}

.username-availability.available {
    color: var(--text-success);
    background: var(--green-50);
    border: 1px solid var(--green-200);
}

.username-availability.unavailable {
    color: var(--text-danger);
    background: var(--red-50);
    border: 1px solid var(--red-200);
}

/* ==========================================
   APP CONTAINER
   ========================================== */
.app-container {
    display: flex;
    height: 100vh;
    height: 100dvh;
    width: 100vw;
    width: 100dvw;
    overflow: hidden;
    animation: fadeIn 0.4s ease;
}

/* ==========================================
   SIDEBAR - PREMIUM DESIGN
   ========================================== */
.sidebar {
    width: var(--sidebar-width);
    min-width: var(--sidebar-width);
    background: var(--bg-sidebar);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    height: 100vh;
    height: 100dvh;
    transition: transform var(--transition-smooth), width var(--transition-smooth);
    z-index: var(--z-sidebar);
    position: relative;
}

.sidebar::after {
    content: '';
    position: absolute;
    right: -1px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: linear-gradient(to bottom, transparent, var(--border), transparent);
}

/* Sidebar Header */
.sidebar-header {
    padding: 14px 18px;
    background: var(--bg-surface);
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: var(--header-height);
    border-bottom: 1px solid var(--border);
    position: relative;
}

.sidebar-header::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(to right, transparent, var(--border), transparent);
}

.user-profile-mini {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
    cursor: pointer;
    padding: 6px 8px;
    border-radius: var(--radius-lg);
    transition: all var(--transition-fast);
    margin: -6px -8px;
}

.user-profile-mini:hover {
    background: var(--bg-hover);
}

.user-profile-mini:active {
    background: var(--bg-hover-alt);
    transform: scale(0.98);
}

.avatar {
    width: var(--avatar-md);
    height: var(--avatar-md);
    border-radius: var(--radius-full);
    object-fit: cover;
    flex-shrink: 0;
    background: linear-gradient(135deg, var(--bg-input) 0%, var(--bg-hover) 100%);
    border: 2px solid var(--border-avatar);
    transition: all var(--transition-normal);
    box-shadow: var(--shadow-xs);
}

.avatar:hover {
    border-color: var(--primary);
    box-shadow: var(--shadow-sm);
}

.avatar-sm { width: var(--avatar-sm); height: var(--avatar-sm); }
.avatar-lg { width: var(--avatar-lg); height: var(--avatar-lg); }
.avatar-xl { width: var(--avatar-2xl); height: var(--avatar-2xl); }
.avatar-2xl { width: var(--avatar-4xl); height: var(--avatar-4xl); }

.user-info-mini {
    min-width: 0;
    flex: 1;
}

.user-info-mini h3 {
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.user-info-mini span {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    display: block;
    margin-top: 1px;
}

.header-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
}

/* Icon Button */
.icon-btn {
    width: 42px;
    height: 42px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    border-radius: var(--radius-full);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);
    font-size: var(--icon-md);
    position: relative;
    outline: none;
}

.icon-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
}

.icon-btn:active {
    transform: scale(0.9);
    transition: all var(--transition-instant);
}

.icon-btn.active {
    color: var(--primary);
    background: var(--primary-bg);
}

.icon-btn.small {
    width: 34px;
    height: 34px;
    font-size: var(--icon-sm);
}

.icon-btn .badge {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 20px;
    height: 20px;
    background: var(--primary);
    color: white;
    border-radius: var(--radius-full);
    font-size: 10px;
    font-weight: var(--font-weight-bold);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--bg-surface);
    animation: badgePop 0.3s ease;
}

/* Search */
.search-container {
    padding: 10px 14px;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border);
}

.search-box {
    background: var(--bg-input);
    border-radius: var(--radius-lg);
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all var(--transition-normal);
    border: 2px solid transparent;
}

.search-box:focus-within {
    background: var(--bg-input-focus);
    border-color: var(--primary);
    box-shadow: var(--shadow-outline-sm);
}

.search-box i {
    color: var(--text-tertiary);
    font-size: var(--icon-sm);
    flex-shrink: 0;
    transition: color var(--transition-fast);
}

.search-box:focus-within i {
    color: var(--primary);
}

.search-box input {
    border: none;
    background: transparent;
    outline: none;
    font-size: var(--font-size-md);
    color: var(--text-primary);
    width: 100%;
    font-family: inherit;
}

.search-box input::placeholder {
    color: var(--text-tertiary);
}

/* Tabs */
.sidebar-tabs {
    display: flex;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border);
}

.tab-btn {
    flex: 1;
    padding: 16px 12px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all var(--transition-normal);
    border-bottom: 3px solid transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: inherit;
    position: relative;
    letter-spacing: var(--letter-spacing-wide);
}

.tab-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
}

.tab-btn.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
    font-weight: var(--font-weight-semibold);
}

.tab-btn .tab-count {
    font-size: 11px;
    background: var(--primary);
    color: white;
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    min-width: 20px;
    text-align: center;
    font-weight: var(--font-weight-bold);
}

/* Sidebar Content */
.sidebar-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

/* Chat List */
.chat-list {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
}

.chat-item {
    padding: 14px 18px;
    display: flex;
    align-items: center;
    gap: 14px;
    cursor: pointer;
    transition: all var(--transition-fast);
    border-bottom: 1px solid var(--border-lightest);
    position: relative;
}

.chat-item:hover {
    background: var(--bg-hover);
}

.chat-item:active {
    background: var(--bg-hover-alt);
    transform: scale(0.995);
}

.chat-item.active {
    background: var(--bg-active);
    border-left: 4px solid var(--primary);
}

.chat-item.unread {
    background: var(--primary-bg);
}

.chat-avatar-placeholder {
    width: 52px;
    height: 52px;
    border-radius: var(--radius-full);
    background: var(--purple-gradient);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: var(--font-weight-bold);
    font-size: 20px;
    flex-shrink: 0;
    box-shadow: var(--shadow-sm);
    position: relative;
}

.chat-avatar-placeholder::after {
    content: '';
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 14px;
    height: 14px;
    background: var(--green);
    border: 2px solid var(--bg-surface);
    border-radius: var(--radius-full);
    display: none;
}

.chat-item.online .chat-avatar-placeholder::after {
    display: block;
}

.chat-content {
    flex: 1;
    min-width: 0;
}

.chat-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.chat-name {
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.chat-time {
    font-size: var(--font-size-2xs);
    color: var(--text-tertiary);
    flex-shrink: 0;
    margin-left: 8px;
    font-weight: var(--font-weight-medium);
}

.chat-preview {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    gap: 6px;
}

.chat-badge {
    background: var(--primary);
    color: white;
    font-size: 11px;
    font-weight: var(--font-weight-bold);
    padding: 3px 9px;
    border-radius: var(--radius-pill);
    min-width: 22px;
    text-align: center;
    flex-shrink: 0;
    animation: badgePop 0.3s ease;
}

/* ==========================================
   MAIN CONTENT AREA
   ========================================== */
.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--bg-chat);
    position: relative;
    overflow: hidden;
    min-width: 0;
}

/* Welcome Screen */
.welcome-screen {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-surface);
    position: relative;
    overflow: hidden;
}

.welcome-screen::before {
    content: '';
    position: absolute;
    top: -30%;
    left: -30%;
    width: 160%;
    height: 160%;
    background: 
        radial-gradient(circle at 30% 50%, var(--primary-bg) 0%, transparent 50%),
        radial-gradient(circle at 70% 30%, rgba(118,75,162,0.06) 0%, transparent 50%),
        radial-gradient(circle at 50% 70%, rgba(33,150,243,0.04) 0%, transparent 50%);
    animation: pulseSubtle 8s ease-in-out infinite;
}

.welcome-content {
    text-align: center;
    max-width: 550px;
    padding: 48px;
    position: relative;
    z-index: 1;
}

.welcome-icon {
    font-size: 88px;
    color: var(--primary);
    margin-bottom: 24px;
    animation: float 3s ease-in-out infinite;
    filter: drop-shadow(0 8px 16px rgba(0,168,132,0.2));
}

.welcome-content h2 {
    font-size: var(--font-size-5xl);
    font-weight: var(--font-weight-extrabold);
    margin-bottom: 16px;
    color: var(--text-primary);
    letter-spacing: var(--letter-spacing-tight);
}

.welcome-content p {
    color: var(--text-secondary);
    font-size: var(--font-size-lg);
    line-height: var(--line-height-relaxed);
    margin-bottom: 8px;
}

/* ==========================================
   CHAT AREA - PREMIUM
   ========================================== */
.chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.chat-header {
    padding: 12px 18px;
    background: var(--bg-surface);
    display: flex;
    align-items: center;
    gap: 14px;
    border-bottom: 1px solid var(--border);
    min-height: var(--header-height);
    z-index: var(--z-header);
    box-shadow: var(--shadow-xs);
    position: relative;
}

.chat-header-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    cursor: pointer;
    padding: 4px;
    border-radius: var(--radius-md);
    transition: background var(--transition-fast);
}

.chat-header-info:hover {
    background: var(--bg-hover);
}

.chat-header-info h3 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: var(--letter-spacing-normal);
}

.chat-header-status {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    display: block;
    margin-top: 1px;
}

.chat-header-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
}

/* Messages Container */
.messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 24px 20px;
    background-color: var(--bg-chat);
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    scroll-behavior: smooth;
    position: relative;
}

.messages-list {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding-bottom: 20px;
}

/* Message Wrapper */
.message-wrapper {
    display: flex;
    flex-direction: column;
    max-width: var(--max-width-chat-bubble);
    position: relative;
    animation: messageIn 0.35s ease;
}

.message-wrapper.sent {
    align-self: flex-end;
    align-items: flex-end;
    animation-name: messageInSent;
}

.message-wrapper.received {
    align-self: flex-start;
    align-items: flex-start;
    animation-name: messageInReceived;
}

/* Message Bubble */
.message-bubble {
    padding: 10px 14px;
    border-radius: var(--radius-md);
    position: relative;
    word-wrap: break-word;
    white-space: pre-wrap;
    box-shadow: var(--shadow-xs);
    max-width: 100%;
    transition: all var(--transition-fast);
    line-height: var(--line-height-snug);
}

.message-wrapper.sent .message-bubble {
    background: var(--bg-message-sent);
    border-bottom-right-radius: var(--radius-xs);
}

.message-wrapper.received .message-bubble {
    background: var(--bg-message-received);
    border-bottom-left-radius: var(--radius-xs);
}

.message-text {
    font-size: var(--font-size-md);
    color: var(--text-primary);
    line-height: var(--line-height-relaxed);
    word-break: break-word;
}

.message-text a {
    color: var(--text-link);
    text-decoration: underline;
    text-underline-offset: 3px;
    font-weight: var(--font-weight-medium);
}

.message-image {
    max-width: 300px;
    max-height: 300px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    margin-bottom: 4px;
    transition: all var(--transition-fast);
    object-fit: cover;
}

.message-image:hover {
    opacity: 0.9;
    transform: scale(1.02);
    box-shadow: var(--shadow-md);
}

.message-meta {
    display: flex;
    align-items: center;
    gap: 4px;
    justify-content: flex-end;
    margin-top: 4px;
}

.message-time {
    font-size: var(--font-size-2xs);
    color: var(--text-tertiary);
    font-weight: var(--font-weight-medium);
}

.message-edited {
    font-size: 10px;
    color: var(--text-tertiary);
    font-style: italic;
}

/* Reply Preview Bar */
.reply-preview-bar {
    padding: 10px 18px;
    background: var(--bg-surface);
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    animation: slideInDown 0.25s ease;
    position: relative;
}

.reply-preview-bar::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--primary);
}

.reply-preview-content {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
}

.reply-preview-label {
    color: var(--primary);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-sm);
    flex-shrink: 0;
}

.reply-preview-text {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Message Input Area */
.message-input-area {
    padding: 12px 18px;
    background: var(--bg-surface);
    display: flex;
    align-items: flex-end;
    gap: 10px;
    border-top: 1px solid var(--border);
    min-height: var(--input-height);
    z-index: var(--z-sticky);
}

.input-wrapper {
    flex: 1;
    background: var(--bg-input);
    border-radius: var(--radius-pill);
    padding: 12px 18px;
    transition: all var(--transition-normal);
    border: 2px solid transparent;
}

.input-wrapper:focus-within {
    background: var(--bg-input-focus);
    border-color: var(--primary);
    box-shadow: var(--shadow-outline-sm);
}

.message-input {
    width: 100%;
    border: none;
    background: transparent;
    outline: none;
    resize: none;
    font-size: var(--font-size-md);
    color: var(--text-primary);
    font-family: inherit;
    max-height: 140px;
    line-height: var(--line-height-normal);
    display: block;
}

.message-input::placeholder {
    color: var(--text-tertiary);
}

.send-btn {
    width: 50px;
    height: 50px;
    border: none;
    background: var(--primary);
    color: white;
    border-radius: var(--radius-full);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-normal);
    font-size: 22px;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-primary);
}

.send-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
    transform: scale(0);
    border-radius: var(--radius-full);
    transition: transform var(--transition-fast);
}

.send-btn:active::after {
    transform: scale(2);
}

.send-btn:hover {
    background: var(--primary-dark);
    transform: scale(1.08);
    box-shadow: var(--shadow-primary-lg);
}

.send-btn:active {
    transform: scale(0.92);
}

.send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
}

/* ==========================================
   EMOJI PICKER
   ========================================== */
.emoji-picker-container {
    background: var(--bg-surface);
    border-top: 1px solid var(--border);
    padding: 14px;
    max-height: 280px;
    overflow-y: auto;
    animation: slideInUp 0.25s ease;
}

.emoji-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
    gap: 4px;
}

.emoji-item {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
    border: none;
    background: transparent;
}

.emoji-item:hover {
    background: var(--bg-hover);
    transform: scale(1.25);
}

.emoji-item:active {
    transform: scale(0.9);
    background: var(--bg-active);
}

/* ==========================================
   VOICE NOTE PLAYER
   ========================================== */
.voice-note-player {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 220px;
}

.voice-play-btn {
    width: 38px;
    height: 38px;
    border: none;
    background: var(--primary);
    color: white;
    border-radius: var(--radius-full);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
    transition: all var(--transition-fast);
    box-shadow: var(--shadow-sm);
}

.voice-play-btn:hover {
    background: var(--primary-dark);
    transform: scale(1.1);
    box-shadow: var(--shadow-md);
}

.voice-waveform-container {
    flex: 1;
    height: 28px;
    background: rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-pill);
    overflow: hidden;
    position: relative;
}

.voice-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--primary), var(--primary-light));
    opacity: 0.4;
    border-radius: var(--radius-pill);
    transition: width 0.1s linear;
}

.voice-duration-text {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    flex-shrink: 0;
    font-weight: var(--font-weight-medium);
}

/* ==========================================
   AI CHAT PANEL
   ========================================== */
.ai-chat-panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 400px;
    height: 100vh;
    height: 100dvh;
    background: var(--bg-surface);
    box-shadow: var(--shadow-2xl);
    z-index: var(--z-modal);
    display: flex;
    flex-direction: column;
    animation: slideInLeft 0.35s ease;
    border-left: 1px solid var(--border);
}

.ai-chat-panel-header {
    padding: 18px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--purple-gradient);
    color: white;
    min-height: var(--header-height);
}

.ai-chat-panel-header h3 {
    font-size: var(--font-size-lg);
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: var(--font-weight-semibold);
}

.ai-chat-panel-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
}

.ai-message {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    animation: messageIn 0.3s ease;
}

.ai-message-avatar {
    width: 34px;
    height: 34px;
    border-radius: var(--radius-full);
    flex-shrink: 0;
    object-fit: cover;
    box-shadow: var(--shadow-sm);
}

.ai-message-bubble {
    background: var(--bg-input);
    padding: 12px 16px;
    border-radius: var(--radius-lg);
    font-size: var(--font-size-md);
    line-height: var(--line-height-relaxed);
    border-top-left-radius: var(--radius-xs);
    box-shadow: var(--shadow-xs);
}

.ai-chat-panel-input {
    padding: 14px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 10px;
    background: var(--bg-surface);
}

/* ==========================================
   MODALS - PREMIUM
   ========================================== */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: var(--bg-overlay);
    z-index: var(--z-modal-backdrop);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: modalBackdropIn 0.25s ease;
    backdrop-filter: var(--backdrop-blur);
}

.modal {
    background: var(--bg-modal);
    border-radius: var(--radius-2xl);
    width: 92%;
    max-width: var(--max-width-modal);
    max-height: 88vh;
    overflow-y: auto;
    box-shadow: var(--shadow-2xl);
    animation: scaleInBounce 0.4s ease;
    border: 1px solid var(--border-light);
}

.modal-header {
    padding: 22px 28px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    background: var(--bg-modal);
    z-index: 1;
    border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
    backdrop-filter: var(--backdrop-blur-lg);
}

.modal-header h3 {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--letter-spacing-normal);
}

.modal-body {
    padding: 28px;
}

.modal-footer {
    padding: 18px 28px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 14px;
    justify-content: flex-end;
    position: sticky;
    bottom: 0;
    background: var(--bg-modal);
    border-radius: 0 0 var(--radius-2xl) var(--radius-2xl);
}

/* ==========================================
   RESPONSIVE DESIGN
   ========================================== */
@media (max-width: 1200px) {
    :root { --sidebar-width: 380px; }
}

@media (max-width: 1024px) {
    :root { --sidebar-width: 340px; }
}

@media (max-width: 768px) {
    :root {
        --sidebar-width: 100%;
        --max-width-chat-bubble: 85%;
    }
    
    .sidebar {
        position: absolute;
        z-index: var(--z-sidebar);
    }
    
    .sidebar.hidden {
        transform: translateX(-100%);
    }
    
    .ai-chat-panel {
        width: 100%;
    }
    
    .modal {
        width: 96%;
        max-height: 92vh;
    }
}

@media (max-width: 480px) {
    :root {
        --max-width-chat-bubble: 92%;
    }
    
    .login-card {
        padding: 32px 24px;
    }
    
    .username-setup-card {
        padding: 28px 20px;
    }
    
    .modal {
        width: 100%;
        margin: 0;
        border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
        max-height: 94vh;
    }
}

/* ==========================================
   UTILITY CLASSES
   ========================================== */
.hidden { display: none !important; }
.block { display: block; }
.flex { display: flex; }
.grid { display: grid; }
.flex-1 { flex: 1; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.text-center { text-align: center; }
.text-sm { font-size: var(--font-size-sm); }
.text-md { font-size: var(--font-size-md); }
.font-bold { font-weight: var(--font-weight-bold); }
.mt-2 { margin-top: 8px; }
.mt-4 { margin-top: 16px; }
.mb-2 { margin-bottom: 8px; }
.mb-4 { margin-bottom: 16px; }
.w-full { width: 100%; }
.rounded-full { border-radius: var(--radius-full); }
.shadow-md { box-shadow: var(--shadow-md); }
.truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ==========================================
   ACCESSIBILITY
   ========================================== */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    white-space: nowrap;
    border-width: 0;
}

@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}

@media print {
    .sidebar, .message-input-area, .chat-header-actions,
    .header-actions, .search-container, .sidebar-tabs,
    #aiChatPanel, .notifications-container, .modal-overlay {
        display: none !important;
    }
    .main-content { width: 100%; overflow: visible; }
    .messages-container { overflow: visible; }
      }
