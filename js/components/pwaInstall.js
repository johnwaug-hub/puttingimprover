/**
 * PWA Install Prompt Component
 * Add this to your app to show an install button when the app can be installed
 * Supports both Android (beforeinstallprompt) and iOS (manual instructions)
 */

// Detect iOS Safari
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}

export function createInstallPrompt() {
  // Don't show in native Capacitor app
  if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
    console.log('Running in Capacitor native - skipping PWA install prompt');
    return null;
  }

  // Only show if not already installed
  if (isInStandaloneMode()) {
    console.log('App is already installed');
    return null;
  }

  // Check if dismissed recently
  const dismissed = localStorage.getItem('pwa-prompt-dismissed');
  if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
    return null;
  }

  const isIOSDevice = isIOS();

  const installContainer = document.createElement('div');
  installContainer.id = 'pwa-install-prompt';
  installContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
    display: ${isIOSDevice ? 'flex' : 'none'};
    align-items: center;
    gap: 16px;
    z-index: 10000;
    max-width: 90%;
    animation: slideUp 0.3s ease-out;
  `;

  installContainer.innerHTML = `
    <style>
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }

      #pwa-install-prompt button {
        background: white;
        color: #2563eb;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
      }

      #pwa-install-prompt button:hover {
        background: #f3f4f6;
        transform: scale(1.05);
      }

      #pwa-install-prompt .close-btn {
        background: transparent;
        color: white;
        padding: 4px 8px;
        font-size: 20px;
        opacity: 0.8;
      }

      #pwa-install-prompt .close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        opacity: 1;
      }

      #pwa-install-prompt .message {
        flex: 1;
        font-size: 14px;
      }

      @media (max-width: 640px) {
        #pwa-install-prompt {
          flex-direction: column;
          text-align: center;
        }

        #pwa-install-prompt .message {
          font-size: 13px;
        }
      }

      /* iOS Instructions Modal */
      .ios-install-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        padding: 20px;
        animation: fadeIn 0.2s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .ios-install-content {
        background: white;
        border-radius: 16px;
        padding: 24px;
        max-width: 320px;
        width: 100%;
        text-align: center;
        color: #1f2937;
        animation: scaleIn 0.2s ease-out;
      }

      @keyframes scaleIn {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }

      .ios-install-content h3 {
        margin: 0 0 16px 0;
        font-size: 18px;
        color: #111827;
      }

      .ios-install-steps {
        text-align: left;
        margin: 16px 0;
      }

      .ios-install-step {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 16px;
        font-size: 14px;
        line-height: 1.4;
      }

      .ios-install-step .step-icon {
        font-size: 24px;
        flex-shrink: 0;
      }

      .ios-install-step .step-text {
        padding-top: 2px;
      }

      .share-icon-svg {
        width: 24px;
        height: 24px;
        vertical-align: middle;
      }

      .ios-install-close {
        background: #2563eb;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
        font-size: 16px;
      }

      .ios-install-close:hover {
        background: #1d4ed8;
      }
    </style>
    <div class="message">
      📱 Install Putting Improver for quick access and offline use!
    </div>
    <button id="pwa-install-btn">Install</button>
    <button class="close-btn" id="pwa-close-btn">×</button>
  `;

  // Create iOS instructions modal
  function showIOSInstructions() {
    const modal = document.createElement('div');
    modal.className = 'ios-install-modal';
    modal.innerHTML = `
      <div class="ios-install-content">
        <h3>📱 Install Putting Improver</h3>
        <div class="ios-install-steps">
          <div class="ios-install-step">
            <span class="step-icon">
              <svg class="share-icon-svg" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
            </span>
            <span class="step-text">Tap the <strong>Share</strong> button at the bottom of Safari</span>
          </div>
          <div class="ios-install-step">
            <span class="step-icon">⬇️</span>
            <span class="step-text">Scroll down and tap <strong>"Add to Home Screen"</strong></span>
          </div>
          <div class="ios-install-step">
            <span class="step-icon">✅</span>
            <span class="step-text">Tap <strong>"Add"</strong> in the top right corner</span>
          </div>
        </div>
        <button class="ios-install-close">Got it!</button>
      </div>
    `;

    // Close on button click
    modal.querySelector('.ios-install-close').addEventListener('click', () => {
      modal.remove();
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    document.body.appendChild(modal);
  }

  // Show the prompt when available (Android/Chrome)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    installContainer.style.display = 'flex';
  });

  // Handle install button click
  const installBtn = installContainer.querySelector('#pwa-install-btn');
  installBtn.addEventListener('click', async () => {
    // For iOS, show instructions modal
    if (isIOSDevice) {
      showIOSInstructions();
      return;
    }

    // For Android/Chrome, use the native prompt
    if (!window.deferredPrompt) return;

    window.deferredPrompt.prompt();
    const { outcome } = await window.deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    window.deferredPrompt = null;
    installContainer.style.display = 'none';
  });

  // Handle close button
  const closeBtn = installContainer.querySelector('#pwa-close-btn');
  closeBtn.addEventListener('click', () => {
    installContainer.style.display = 'none';
    // Store in localStorage to not show again for 7 days
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  });

  return installContainer;
}

// Auto-initialize when DOM is ready
function initInstallPrompt() {
  const prompt = createInstallPrompt();
  if (prompt) document.body.appendChild(prompt);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInstallPrompt);
} else {
  initInstallPrompt();
}
