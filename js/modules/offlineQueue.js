/**
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL - Unauthorized copying, modification,
 * distribution, or use is strictly prohibited. Protected under DMCA.
 * Contact: lockjawdiscgolf@gmail.com
 */
/**
 * Offline Queue Manager
 * Handles saving data when offline and syncing when back online
 */

class OfflineQueueManager {
    constructor() {
        this.queueKey = 'offline_queue';
        this.isOnline = navigator.onLine;
        this.setupListeners();
    }

    /**
     * Setup online/offline listeners
     */
    setupListeners() {
        window.addEventListener('online', () => {
            console.log('📶 Back online - processing queue');
            this.isOnline = true;
            this.processQueue();
        });

        window.addEventListener('offline', () => {
            console.log('📵 Offline mode');
            this.isOnline = false;
        });
    }

    /**
     * Get queued items from localStorage
     */
    getQueue() {
        try {
            const queue = localStorage.getItem(this.queueKey);
            return queue ? JSON.parse(queue) : [];
        } catch (error) {
            console.error('Error reading offline queue:', error);
            return [];
        }
    }

    /**
     * Save queue to localStorage
     */
    saveQueue(queue) {
        try {
            localStorage.setItem(this.queueKey, JSON.stringify(queue));
        } catch (error) {
            console.error('Error saving offline queue:', error);
        }
    }

    /**
     * Add item to offline queue
     */
    addToQueue(type, data) {
        const queue = this.getQueue();
        const item = {
            id: Date.now() + Math.random(),
            type,
            data,
            timestamp: new Date().toISOString()
        };
        queue.push(item);
        this.saveQueue(queue);
        console.log(`📥 Added ${type} to offline queue`);
        return item;
    }

    /**
     * Process queued items when online
     */
    async processQueue() {
        if (!this.isOnline) return;

        const queue = this.getQueue();
        if (queue.length === 0) return;

        console.log(`🔄 Processing ${queue.length} queued items`);
        return { count: queue.length, queue };
    }

    /**
     * Remove item from queue
     */
    removeFromQueue(itemId) {
        const queue = this.getQueue();
        const filtered = queue.filter(item => item.id !== itemId);
        this.saveQueue(filtered);
    }

    /**
     * Clear the queue
     */
    clearQueue() {
        localStorage.removeItem(this.queueKey);
    }

    /**
     * Get queue count
     */
    getQueueCount() {
        return this.getQueue().length;
    }

    /**
     * Check if online
     */
    checkOnline() {
        return this.isOnline;
    }
}

// Export singleton
export const offlineQueueManager = new OfflineQueueManager();
