/**
 * ============================================================================
 * PUTTING IMPROVER — Code Protection Layer
 * ============================================================================
 * 
 * © 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * 
 * This source code is the exclusive property of Lock Jaw Disc Golf.
 * Unauthorized copying, modification, distribution, or use of this code,
 * in whole or in part, via any medium, is strictly prohibited without
 * express written permission from the copyright holder.
 * 
 * Protected under US Copyright Law (17 U.S.C. §§ 101-810),
 * the Digital Millennium Copyright Act (DMCA), and applicable
 * international intellectual property treaties.
 * 
 * Violators will be prosecuted to the fullest extent of the law.
 * 
 * Patent Pending — Application-specific methods and systems.
 * 
 * Contact: lockjawdiscgolf@gmail.com
 * ============================================================================
 */

(function() {
    'use strict';

    try { // Master try-catch — protection must NEVER block app loading

    const _PI = 'PuttingImprover';
    const _WARN = '⚠️ This application is proprietary software of Lock Jaw Disc Golf.';

    // ======================
    // 1. CONSOLE WARNINGS
    // ======================
    const warnStyle = 'color:#ef4444;font-size:20px;font-weight:bold;';
    const infoStyle = 'color:#f97316;font-size:14px;';
    const smallStyle = 'color:#94a3b8;font-size:12px;';

    try {
        console.log(
            '%c🔒 STOP!',
            'color:#ef4444;font-size:48px;font-weight:900;text-shadow:2px 2px 0 #000;'
        );
        console.log(
            '%cThis is a protected application owned by Lock Jaw Disc Golf.',
            warnStyle
        );
        console.log(
            '%cIf someone told you to paste something here, it is likely a scam.\nUnauthorized access, copying, or reverse-engineering of this software\nis a violation of federal law (DMCA / 17 U.S.C. § 1201).',
            infoStyle
        );
        console.log(
            '%c© 2024-2026 Lock Jaw Disc Golf. All rights reserved.\nContact: lockjawdiscgolf@gmail.com\nPatent Pending.',
            smallStyle
        );
    } catch(e) {}

    // ======================
    // 2. DISABLE RIGHT-CLICK CONTEXT MENU
    // ======================
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    }, true);

    // ======================
    // 3. DISABLE KEYBOARD SHORTCUTS FOR DEV TOOLS / VIEW SOURCE
    // ======================
    document.addEventListener('keydown', function(e) {
        // F12 - Dev Tools
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl+Shift+I - Dev Tools
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl+Shift+J - Console
        if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl+Shift+C - Element picker
        if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl+U - View Source
        if (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl+S - Save Page
        if (e.ctrlKey && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl+Shift+U - View Source (some browsers)
        if (e.ctrlKey && e.shiftKey && (e.key === 'U' || e.key === 'u')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Cmd equivalents for Mac
        if (e.metaKey) {
            // Cmd+Option+I
            if (e.altKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // Cmd+Option+J
            if (e.altKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // Cmd+Option+U
            if (e.altKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // Cmd+S
            if (e.key === 'S' || e.key === 's' || e.keyCode === 83) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }
    }, true);

    // ======================
    // 4. DEVTOOLS DETECTION
    // ======================
    let _devtoolsOpen = false;

    // Method 1: Size-based detection
    function checkDevToolsBySize() {
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;
        if (widthThreshold || heightThreshold) {
            if (!_devtoolsOpen) {
                _devtoolsOpen = true;
                onDevToolsOpen();
            }
        } else {
            _devtoolsOpen = false;
        }
    }

    // Method 2: Console.log timing detection
    function checkDevToolsByTiming() {
        const el = new Image();
        let opened = false;
        Object.defineProperty(el, 'id', {
            get: function() {
                opened = true;
            }
        });
        console.debug(el);
        if (opened && !_devtoolsOpen) {
            _devtoolsOpen = true;
            onDevToolsOpen();
        }
    }

    function onDevToolsOpen() {
        try {
            console.clear();
            console.log(
                '%c🔒 Developer Tools Detected',
                'color:#ef4444;font-size:24px;font-weight:900;'
            );
            console.log(
                '%cThis application is protected by copyright law.\nUnauthorized inspection, copying, or modification is prohibited.\n\n© Lock Jaw Disc Golf — All rights reserved.',
                'color:#f97316;font-size:14px;'
            );
        } catch(e) {}
    }

    // Run size check periodically
    setInterval(checkDevToolsBySize, 2000);

    // ======================
    // 5. DISABLE TEXT SELECTION ON APP ELEMENTS
    // ======================
    const protectionStyles = document.createElement('style');
    protectionStyles.textContent = `
        /* Disable text selection on app UI elements */
        .app-container, .card, .btn, .nav-btn, .header-flex,
        .stat-card, .session-card, .achievement-card, .modal-header,
        .simple-scorer-overlay, .ss-make-btn, .ss-miss-btn,
        .leaderboard-table, .tab-content, .bottom-nav,
        [class*="btn"], [class*="header"], [class*="nav"] {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
        }
        /* Allow selection in input fields, textareas, and content areas */
        input, textarea, select, [contenteditable="true"],
        .session-notes, .feedback-textarea, pre, code {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
        }
    `;
    document.head.appendChild(protectionStyles);

    // ======================
    // 6. DISABLE DRAG
    // ======================
    document.addEventListener('dragstart', function(e) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            return false;
        }
    }, true);

    // ======================
    // 7. DISABLE COPY ON NON-INPUT ELEMENTS
    // ======================
    document.addEventListener('copy', function(e) {
        const activeEl = document.activeElement;
        const sel = window.getSelection();
        // Allow copy from inputs, textareas, and elements with explicit allow
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || 
            activeEl.contentEditable === 'true' || activeEl.closest('.allow-copy'))) {
            return; // Allow
        }
        // Allow if selecting text in a code block or content area
        if (sel && sel.anchorNode) {
            const parent = sel.anchorNode.parentElement;
            if (parent && (parent.closest('pre') || parent.closest('code') || parent.closest('.allow-copy'))) {
                return; // Allow
            }
        }
        e.preventDefault();
    }, true);

    // ======================
    // 8. PERIODIC INTEGRITY CHECK
    // ======================
    function integrityCheck() {
        // Verify we're running on the correct domain
        const allowedHosts = [
            'puttingimprover.com',
            'www.puttingimprover.com',
            'putting-improver-waugs.web.app',
            'putting-improver-waugs.firebaseapp.com',
            'localhost',
            '127.0.0.1'
        ];

        const currentHost = window.location.hostname;
        const isAllowed = allowedHosts.some(h => currentHost === h || currentHost.endsWith('.' + h));

        if (!isAllowed && currentHost !== '' && currentHost !== 'localhost') {
            // Running on unauthorized domain
            console.error('🚫 Unauthorized domain detected:', currentHost);
            document.body.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#0f172a;color:white;font-family:system-ui;text-align:center;padding:2rem;">
                    <div style="font-size:4rem;margin-bottom:1rem;">🔒</div>
                    <h1 style="font-size:1.5rem;margin:0 0 1rem;">Unauthorized Use Detected</h1>
                    <p style="color:#94a3b8;max-width:400px;line-height:1.6;">
                        This application is the proprietary software of Lock Jaw Disc Golf
                        and is not authorized to run on this domain.
                    </p>
                    <p style="color:#ef4444;margin-top:1rem;font-weight:700;">
                        This incident has been logged.
                    </p>
                    <a href="https://puttingimprover.com" 
                       style="margin-top:2rem;background:#f97316;color:white;padding:0.75rem 2rem;border-radius:12px;text-decoration:none;font-weight:700;">
                        Go to Putting Improver
                    </a>
                </div>
            `;
            // Prevent further script execution
            throw new Error('Unauthorized domain');
        }
    }

    // Run on load
    try { integrityCheck(); } catch(e) {}

    // ======================
    // 9. DISABLE PRINT (prevents Print to PDF code extraction)
    // ======================
    window.addEventListener('beforeprint', function() {
        document.body.style.visibility = 'hidden';
    });
    window.addEventListener('afterprint', function() {
        document.body.style.visibility = 'visible';
    });

    // Also override Ctrl+P
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.keyCode === 80)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);

    // ======================
    // 10. ANTI-AUTOMATION / HEADLESS DETECTION
    // ======================
    function detectHeadless() {
        const isHeadless = (
            navigator.webdriver === true ||
            /HeadlessChrome/.test(navigator.userAgent) ||
            /PhantomJS/.test(navigator.userAgent) ||
            !window.chrome && /Chrome/.test(navigator.userAgent)
        );

        if (isHeadless) {
            console.warn('🤖 Automated browser detected');
        }
    }

    try { detectHeadless(); } catch(e) {}

    // ======================
    // 11. FREEZE PROTECTION OBJECT
    // ======================
    window.__PI_PROTECTED__ = Object.freeze({
        name: 'Putting Improver',
        owner: 'Lock Jaw Disc Golf',
        copyright: '© 2024-2026 All Rights Reserved',
        contact: 'lockjawdiscgolf@gmail.com',
        dmca: true
    });

    // Prevent overwriting the protection flag
    Object.defineProperty(window, '__PI_PROTECTED__', {
        configurable: false,
        writable: false
    });

    } catch(masterErr) {
        // Protection layer failed — app must still load
        console.warn('Protection layer error (non-blocking):', masterErr);
    }

})();
