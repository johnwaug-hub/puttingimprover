/**
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL - Unauthorized copying, modification,
 * distribution, or use is strictly prohibited. Protected under DMCA.
 * Contact: lockjawdiscgolf@gmail.com
 */
/**
 * Phase 2 Utilities Module
 * Loading spinners, confirmation modals, and empty states
 */

// ==========================================
// LOADING SPINNERS
// ==========================================

/**
 * Show overlay loading spinner
 * @param {string} message - Loading message to display
 * @returns {HTMLElement} Spinner element (for removal)
 */
export function showSpinner(message = 'Loading...') {
    // Remove existing spinner if present
    removeSpinner();

    const spinner = document.createElement('div');
    spinner.className = 'spinner-overlay';
    spinner.id = 'global-spinner';
    spinner.innerHTML = `
        <div class="spinner-container">
            <div class="spinner"></div>
            <div class="spinner-text">${message}</div>
        </div>
    `;

    document.body.appendChild(spinner);
    return spinner;
}

/**
 * Remove overlay loading spinner
 */
export function removeSpinner() {
    const spinner = document.getElementById('global-spinner');
    if (spinner) {
        spinner.remove();
    }
}

/**
 * Add loading state to a button
 * @param {HTMLElement} button - Button element
 */
export function setButtonLoading(button) {
    if (!button) return;
    button.classList.add('loading');
    button.disabled = true;
}

/**
 * Remove loading state from a button
 * @param {HTMLElement} button - Button element
 */
export function removeButtonLoading(button) {
    if (!button) return;
    button.classList.remove('loading');
    button.disabled = false;
}

// ==========================================
// CONFIRMATION MODALS
// ==========================================

/**
 * Show confirmation modal
 * @param {Object} options - Modal options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Modal message
 * @param {string} options.type - Modal type: 'warning', 'danger', 'info', 'success'
 * @param {string} options.confirmText - Confirm button text
 * @param {string} options.cancelText - Cancel button text
 * @param {Function} options.onConfirm - Callback when confirmed
 * @param {Function} options.onCancel - Callback when cancelled
 * @returns {Promise<boolean>} True if confirmed, false if cancelled
 */
export function showConfirmModal(options) {
    return new Promise((resolve) => {
        const {
            title = 'Confirm Action',
            message = 'Are you sure you want to proceed?',
            type = 'warning',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            onConfirm = null,
            onCancel = null
        } = options;

        // Icon based on type
        const icons = {
            warning: '⚠️',
            danger: '🗑️',
            success: '✅',
            info: 'ℹ️'
        };
        const icon = icons[type] || icons.warning;

        // Button styles based on type
        const confirmClass = type === 'danger' ? 'btn-danger' : 'btn-primary';

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'confirmation-modal';
        modal.innerHTML = `
            <div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div class="pi-confirm-icon-wrap ${type}">
                    <span>${icon}</span>
                </div>
                <div class="pi-confirm-body">
                    <h2 class="pi-confirm-title" id="modal-title">${title}</h2>
                    <p class="pi-confirm-message">${message}</p>
                </div>
                <div class="pi-confirm-footer">
                    <button class="btn btn-secondary" id="modal-cancel">${cancelText}</button>
                    <button class="btn ${confirmClass}" id="modal-confirm">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Focus on modal
        const container = modal.querySelector('.modal-container');
        container.focus();

        // Handle confirm
        const confirmBtn = modal.querySelector('#modal-confirm');
        const handleConfirm = () => {
            modal.remove();
            if (onConfirm) onConfirm();
            resolve(true);
        };
        confirmBtn.addEventListener('click', handleConfirm);

        // Handle cancel
        const cancelBtn = modal.querySelector('#modal-cancel');
        const handleCancel = () => {
            modal.remove();
            if (onCancel) onCancel();
            resolve(false);
        };
        cancelBtn.addEventListener('click', handleCancel);

        // Handle overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                handleCancel();
            }
        });

        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

/**
 * Show delete confirmation (pre-configured danger modal)
 * @param {string} itemName - Name of item being deleted
 * @param {Function} onConfirm - Callback when confirmed
 * @returns {Promise<boolean>}
 */
export function confirmDelete(itemName, onConfirm) {
    return showConfirmModal({
        title: 'Delete Item',
        message: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
        type: 'danger',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm
    });
}

/**
 * Show reject confirmation (pre-configured warning modal)
 * @param {string} itemName - Name of item being rejected
 * @param {Function} onConfirm - Callback when confirmed
 * @returns {Promise<boolean>}
 */
export function confirmReject(itemName, onConfirm) {
    return showConfirmModal({
        title: 'Reject Item',
        message: `Are you sure you want to reject ${itemName}? It will be permanently deleted.`,
        type: 'warning',
        confirmText: 'Reject',
        cancelText: 'Cancel',
        onConfirm
    });
}

// ==========================================
// EMPTY STATES
// ==========================================

/**
 * Render empty state HTML
 * @param {Object} options - Empty state options
 * @param {string} options.icon - Emoji icon
 * @param {string} options.title - Title text
 * @param {string} options.message - Message text
 * @param {Array} options.actions - Array of action objects {text, onClick, primary}
 * @param {boolean} options.compact - Use compact variant
 * @returns {string} HTML string
 */
export function renderEmptyState(options) {
    const {
        icon = '📭',
        title = 'No Items',
        message = 'There are no items to display.',
        actions = [],
        compact = false
    } = options;

    const actionsHTML = actions.length > 0 ? `
        <div class="empty-state-actions">
            ${actions.map(action => `
                <button class="btn ${action.primary ? 'btn-primary' : 'btn-secondary'}"
                        data-action="${action.id || ''}">
                    ${action.text}
                </button>
            `).join('')}
        </div>
    ` : '';

    return `
        <div class="empty-state ${compact ? 'compact' : ''}">
            <div class="empty-state-icon">${icon}</div>
            <h3 class="empty-state-title">${title}</h3>
            <p class="empty-state-message">${message}</p>
            ${actionsHTML}
        </div>
    `;
}

/**
 * Pre-configured empty states for common scenarios
 */
export const emptyStates = {
    noSessions: () => renderEmptyState({
        icon: '🥏',
        title: 'No Practice Sessions',
        message: 'Start tracking your putting practice! Log your makes and attempts from any distance to see your accuracy improve over time.',
        actions: [
            { text: 'Add Session', primary: true, id: 'add-session' }
        ]
    }),

    noRoutines: () => renderEmptyState({
        icon: '📋',
        title: 'No Routines Completed',
        message: 'Practice routines help you stay consistent! Try a drill like "Circle 1" or "Around the World" to level up your putting game.',
        actions: [
            { text: 'Browse Routines', primary: true, id: 'browse-routines' }
        ]
    }),

    noGames: () => renderEmptyState({
        icon: '🎮',
        title: 'No Games Played',
        message: 'Make practice fun with games! Try HORSE, Around the World, or Perfect 10 to challenge yourself and earn points.',
        actions: [
            { text: 'Play a Game', primary: true, id: 'play-game' }
        ]
    }),

    noPending: () => renderEmptyState({
        icon: '✅',
        title: 'All Caught Up!',
        message: 'No pending activities. Your friends can log practice sessions for you when you play together!',
        compact: true
    }),

    noFriends: () => renderEmptyState({
        icon: '👥',
        title: 'No Friends Added',
        message: 'Add friends to log activities for each other and compete on the leaderboard! Search by name or email above.',
        compact: true
    }),

    noAchievements: () => renderEmptyState({
        icon: '🏆',
        title: 'No Achievements Yet',
        message: 'Keep practicing to unlock your first achievement!',
        compact: true
    }),

    noResults: (searchTerm) => renderEmptyState({
        icon: '🔍',
        title: 'No Results Found',
        message: `No items match "${searchTerm}". Try a different search term.`,
        compact: true
    })
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Wrap async function with loading spinner
 * @param {Function} asyncFn - Async function to wrap
 * @param {string} message - Loading message
 * @returns {Function} Wrapped function
 */
export function withSpinner(asyncFn, message = 'Loading...') {
    return async function(...args) {
        showSpinner(message);
        try {
            const result = await asyncFn.apply(this, args);
            return result;
        } finally {
            removeSpinner();
        }
    };
}

/**
 * Wrap async function with button loading state
 * @param {Function} asyncFn - Async function to wrap
 * @param {HTMLElement} button - Button element
 * @returns {Function} Wrapped function
 */
export function withButtonLoading(asyncFn, button) {
    return async function(...args) {
        setButtonLoading(button);
        try {
            const result = await asyncFn.apply(this, args);
            return result;
        } finally {
            removeButtonLoading(button);
        }
    };
}

/**
 * Debounce function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay = 300) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Throttle function
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(fn, limit = 300) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
