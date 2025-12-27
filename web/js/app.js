/**
 * Main Application Controller
 * Coordinates all modules and manages application state
 */

import { initializeFirebase } from './config/firebase.js';
import { authManager } from './modules/auth.js';
import { userManager } from './modules/user.js';
import { storageManager } from './modules/storage.js';
import { achievementManager } from './modules/achievements.js';
import { challengeManager } from './modules/challenges.js';
import { MOTIVATIONAL_QUOTES, SUGGESTED_ROUTINES, PUTTING_GAMES } from './config/constants.js';

class App {
    constructor() {
        this.state = {
            loading: true,
            error: null,
            currentView: 'practice', // practice, leaderboard, friends, achievements, games
            showAddSession: false,
            showRoutines: false,
            currentQuote: this.getRandomQuote(),
            leaderboard: [],
            friends: [],
            activeRoutine: null,
            routineProgress: [],
            currentDrill: 0,
            selectedGame: null
        };

        this.newSession = {
            date: new Date().toISOString().split('T')[0],
            distance: '10',
            makes: '',
            attempts: '',
            routineName: null
        };
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Initializing Putting Improver...');

            // Initialize Firebase (waits for SDK to load)
            await initializeFirebase();

            // Initialize auth manager with callback
            authManager.init(this.onAuthStateChange.bind(this));

            // Initial render
            this.render();

        } catch (error) {
            console.error('❌ Initialization error:', error);
            this.state.error = error.message;
            this.state.loading = false;
            this.render();
        }
    }

    /**
     * Handle authentication state changes
     * @param {Object} firebaseUser - Firebase user object
     */
    async onAuthStateChange(firebaseUser) {
        try {
            this.state.loading = true;
            this.render();

            if (firebaseUser) {
                // User is signed in
                await userManager.initializeUser(firebaseUser);
                await challengeManager.loadWeeklyChallenge();
                await this.loadLeaderboard();
                await achievementManager.checkAchievements();

                this.state.error = null;
                console.log('✅ User authenticated and data loaded');
            } else {
                // User is signed out
                userManager.clearUser();
                this.state.leaderboard = [];
                this.state.friends = [];
            }

            this.state.loading = false;
            this.render();

        } catch (error) {
            console.error('❌ Auth state change error:', error);
            this.state.error = error.message;
            this.state.loading = false;
            this.render();
        }
    }

    /**
     * Load leaderboard data
     */
    async loadLeaderboard() {
        try {
            this.state.leaderboard = await storageManager.getLeaderboard();
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    }

    /**
     * Handle user login
     */
    async handleLogin() {
        try {
            await authManager.signInWithGoogle();
            // onAuthStateChange will handle the rest
        } catch (error) {
            console.error('Login error:', error);
            alert(error.message);
        }
    }

    /**
     * Handle user logout
     */
    async handleLogout() {
        try {
            await authManager.signOut();
            // onAuthStateChange will handle cleanup
        } catch (error) {
            console.error('Logout error:', error);
            alert(error.message);
        }
    }

    /**
     * Add a new practice session
     */
    async addSession() {
        try {
            await userManager.addSession(this.newSession);

            // Check for challenge completion
            const latestSession = userManager.sessions[0];
            await challengeManager.checkChallengeCompletion(latestSession);

            // Check for new achievements
            await achievementManager.checkAchievements();

            // Reload leaderboard
            await this.loadLeaderboard();

            // Reset form and close modal
            this.state.showAddSession = false;
            this.newSession = {
                date: new Date().toISOString().split('T')[0],
                distance: '10',
                makes: '',
                attempts: '',
                routineName: null
            };

            this.render();

        } catch (error) {
            console.error('Error adding session:', error);
            alert(error.message);
        }
    }

    /**
     * Change current view
     * @param {string} view - View name
     */
    changeView(view) {
        this.state.currentView = view;
        this.render();
    }

    /**
     * Toggle add session modal
     */
    toggleAddSession() {
        this.state.showAddSession = !this.state.showAddSession;
        this.render();
    }

    /**
     * Toggle routines panel
     */
    toggleRoutines() {
        this.state.showRoutines = !this.state.showRoutines;
        this.render();
    }

    /**
     * Get random motivational quote
     * @returns {string} Random quote
     */
    getRandomQuote() {
        return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    }

    /**
     * Rotate to new quote
     */
    rotateQuote() {
        this.state.currentQuote = this.getRandomQuote();
        this.render();
    }

    /**
     * Main render function
     * Updates the entire UI based on current state
     */
    render() {
        const appContainer = document.getElementById('app');
        if (!appContainer) {
            console.error('App container not found');
            return;
        }

        // Show loading state
        if (this.state.loading) {
            appContainer.innerHTML = this.renderLoading();
            return;
        }

        // Show error state
        if (this.state.error) {
            appContainer.innerHTML = this.renderError();
            return;
        }

        // Show login if not authenticated
        if (!authManager.isAuthenticated()) {
            appContainer.innerHTML = this.renderLogin();
            this.attachLoginListeners();
            return;
        }

        // Show main app
        appContainer.innerHTML = this.renderApp();
        this.attachEventListeners();
    }

    /**
     * Render loading state
     * @returns {string} HTML string
     */
    renderLoading() {
        return `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh;">
                <div style="text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🥏</div>
                    <div style="font-size: 1.5rem; color: #4b5563;">Loading Putting Improver...</div>
                </div>
            </div>
        `;
    }

    /**
     * Render error state
     * @returns {string} HTML string
     */
    renderError() {
        return `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 2rem;">
                <div class="card" style="max-width: 500px; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                    <h2 style="margin-bottom: 1rem; color: #dc2626;">Error</h2>
                    <p style="color: #6b7280; margin-bottom: 1.5rem;">${this.state.error}</p>
                    <button class="btn btn-primary" onclick="location.reload()">Reload Page</button>
                </div>
            </div>
        `;
    }

    /**
     * Render login screen
     * @returns {string} HTML string
     */
    renderLogin() {
        return `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 2rem;">
                <div class="card" style="max-width: 500px; text-align: center;">
                    <div class="logo-container">
                        <img src="logo.jpg" alt="Lock Jaw Disc Golf">
                    </div>
                    <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem; background: linear-gradient(135deg, #FF6B35 0%, #D9534F 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                        Putting Improver
                    </h1>
                    <p style="color: #6b7280; margin-bottom: 2rem; font-size: 1.1rem;">
                        Track your disc golf putting practice and compete with friends
                    </p>
                    <button id="googleSignInBtn" class="btn btn-primary" style="width: 100%; padding: 1rem; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Sign in with Google
                    </button>
                    <p style="margin-top: 1.5rem; color: #9ca3af; font-size: 0.875rem;">
                        By signing in, you agree to our terms of service
                    </p>
                </div>
            </div>
        `;
    }

    /**
     * Render main application
     * @returns {string} HTML string
     */
    renderApp() {
        const user = userManager.getCurrentUser();
        const stats = userManager.getStats();
        const sessions = storageManager.getSessions();
        
        return `
            <!-- Header -->
            <header class="app-header">
                <div class="container">
                    <div class="header-content">
                        <div class="logo-section">
                            <img src="logo.jpg" alt="Lock Jaw Disc Golf" class="header-logo">
                            <h1 class="app-title">Putting Improver</h1>
                        </div>
                        <div class="user-section">
                            <span class="user-name">${user.displayName}</span>
                            <button id="logoutBtn" class="btn btn-secondary">Logout</button>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Main Content -->
            <main class="container main-content">
                <!-- Navigation Tabs -->
                <div class="tabs">
                    <button class="tab ${this.state.currentView === 'practice' ? 'active' : ''}" data-view="practice">
                        📊 Practice
                    </button>
                    <button class="tab ${this.state.currentView === 'leaderboard' ? 'active' : ''}" data-view="leaderboard">
                        🏆 Leaderboard
                    </button>
                    <button class="tab ${this.state.currentView === 'games' ? 'active' : ''}" data-view="games">
                        🎮 Games
                    </button>
                    <button class="tab ${this.state.currentView === 'achievements' ? 'active' : ''}" data-view="achievements">
                        🏅 Achievements
                    </button>
                </div>

                <!-- Practice View -->
                <div class="view ${this.state.currentView === 'practice' ? 'active' : ''}" id="practice-view">
                    <!-- Statistics Cards -->
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${stats.totalPoints || 0}</div>
                            <div class="stat-label">Total Points</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.totalSessions || 0}</div>
                            <div class="stat-label">Sessions</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.totalMakes || 0}</div>
                            <div class="stat-label">Total Makes</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.accuracy ? stats.accuracy.toFixed(1) : 0}%</div>
                            <div class="stat-label">Accuracy</div>
                        </div>
                    </div>

                    <!-- Add Session Button -->
                    <div class="action-section">
                        <button id="addSessionBtn" class="btn btn-primary btn-large">
                            ➕ Add Practice Session
                        </button>
                        <button id="viewRoutinesBtn" class="btn btn-secondary btn-large">
                            📋 View Routines
                        </button>
                    </div>

                    <!-- Add Session Form (Hidden by default) -->
                    ${this.state.showAddSession ? this.renderAddSessionForm() : ''}
                    
                    <!-- Routines Panel (Hidden by default) -->
                    ${this.state.showRoutines ? this.renderRoutines() : ''}

                    <!-- Recent Sessions -->
                    <div class="card">
                        <h2>Recent Sessions</h2>
                        <div class="sessions-list">
                            ${sessions.length > 0 ? sessions.map(s => this.renderSessionItem(s)).join('') : '<p class="empty-state">No sessions yet. Add your first practice session!</p>'}
                        </div>
                    </div>
                </div>

                <!-- Leaderboard View -->
                <div class="view ${this.state.currentView === 'leaderboard' ? 'active' : ''}" id="leaderboard-view">
                    <div class="card">
                        <h2>🏆 Leaderboard</h2>
                        <div class="leaderboard-list">
                            ${this.state.leaderboard.length > 0 ? this.state.leaderboard.map((player, index) => this.renderLeaderboardItem(player, index + 1)).join('') : '<p class="empty-state">No players yet</p>'}
                        </div>
                    </div>
                </div>

                <!-- Achievements View -->
                <div class="view ${this.state.currentView === 'achievements' ? 'active' : ''}" id="achievements-view">
                    <div class="card">
                        <h2>🏅 Your Achievements</h2>
                        <div class="achievements-grid">
                            ${this.renderAchievements()}
                        </div>
                    </div>
                </div>

                <!-- Games View -->
                <div class="view ${this.state.currentView === 'games' ? 'active' : ''}" id="games-view">
                    <div class="card">
                        <h2>🎮 Putting Games</h2>
                        <p style="margin-bottom: 1.5rem; color: #6b7280;">Make practice fun with these competitive putting games!</p>
                        <div class="games-grid">
                            ${this.renderGames()}
                        </div>
                    </div>
                </div>
            </main>

            <!-- Footer -->
            <footer class="app-footer">
                <div class="container">
                    <p>&copy; 2024 Lock Jaw Disc Golf - Tucson, AZ</p>
                    <p>Made with 🥏 for disc golf enthusiasts</p>
                </div>
            </footer>
        `;
    }
    
    renderAddSessionForm() {
        return `
            <div class="card add-session-form">
                <h3>Add Practice Session</h3>
                <form id="sessionForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="distance">Distance (feet)</label>
                            <input type="number" id="distance" min="5" max="100" value="${this.newSession.distance}" required>
                        </div>
                        <div class="form-group">
                            <label for="makes">Makes</label>
                            <input type="number" id="makes" min="0" max="100" value="${this.newSession.makes}" required>
                        </div>
                        <div class="form-group">
                            <label for="attempts">Attempts</label>
                            <input type="number" id="attempts" min="1" max="100" value="${this.newSession.attempts}" required>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save Session</button>
                        <button type="button" id="cancelSessionBtn" class="btn btn-secondary">Cancel</button>
                    </div>
                </form>
            </div>
        `;
    }
    
    renderSessionItem(session) {
        const dateObj = new Date(session.timestamp || session.date);
        const date = dateObj.toLocaleDateString();
        const time = session.timestamp ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        const routineTag = session.routineName ? `<span class="routine-tag">📋 ${session.routineName}</span>` : '';
        
        return `
            <div class="session-item">
                <div class="session-header">
                    <div>
                        <span class="session-date">${date}</span>
                        ${time ? `<span class="session-time">${time}</span>` : ''}
                        ${routineTag}
                    </div>
                    <span class="session-points">${session.points} pts</span>
                </div>
                <div class="session-stats">
                    <span>${session.distance}ft</span>
                    <span>${session.makes}/${session.attempts}</span>
                    <span>${session.percentage.toFixed(1)}%</span>
                </div>
            </div>
        `;
    }
    
    renderLeaderboardItem(player, rank) {
        const isCurrentUser = player.userId === userManager.getCurrentUser().userId;
        const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
        
        return `
            <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
                <div class="rank ${rankClass}">#${rank}</div>
                <div class="player-info">
                    <div class="player-name">${player.displayName}${isCurrentUser ? ' (You)' : ''}</div>
                </div>
                <div class="player-stats">
                    <div class="stat-item">
                        <div class="stat-value">${player.totalPoints}</div>
                        <div class="stat-label">Points</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${player.totalSessions}</div>
                        <div class="stat-label">Sessions</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderAchievements() {
        const achievements = achievementManager.getAchievements();
        if (!achievements || achievements.length === 0) {
            return '<p class="empty-state">No achievements yet. Keep practicing!</p>';
        }
        
        return achievements.map(achievement => `
            <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
                ${achievement.unlocked ? '<div class="achievement-badge">✓ Unlocked</div>' : ''}
            </div>
        `).join('');
    }

    /**
     * Render routines panel
     */
    renderRoutines() {
        return `
            <div class="card routines-panel">
                <div class="header-flex">
                    <h3>📋 Suggested Putting Routines</h3>
                    <button id="closeRoutinesBtn" class="btn btn-secondary">Close</button>
                </div>
                <p style="margin-bottom: 1.5rem; color: #6b7280;">Choose a routine to structure your practice session</p>
                <div class="routines-grid">
                    ${SUGGESTED_ROUTINES.map(routine => `
                        <div class="routine-card">
                            <div class="routine-header">
                                <h4>${routine.name}</h4>
                                <span class="routine-badge">${routine.level}</span>
                            </div>
                            <p class="routine-description">${routine.description}</p>
                            <div class="routine-meta">
                                <span>⏱️ ${routine.duration}</span>
                                <span>📍 ${routine.drills.length} drills</span>
                            </div>
                            <div class="routine-drills">
                                ${routine.drills.map((drill, idx) => `
                                    <div class="drill-item">
                                        <strong>${idx + 1}. ${drill.distance}ft - ${drill.attempts} attempts</strong>
                                        <p>${drill.description}</p>
                                    </div>
                                `).join('')}
                            </div>
                            <button class="btn btn-primary btn-small start-routine-btn" data-routine="${routine.id}">
                                Start Routine
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render games grid
     */
    renderGames() {
        return PUTTING_GAMES.map(game => `
            <div class="game-card">
                <div class="game-header">
                    <h3>${game.name}</h3>
                    <span class="game-badge ${game.difficulty.toLowerCase()}">${game.difficulty}</span>
                </div>
                <p class="game-description">${game.description}</p>
                <div class="game-meta">
                    <span>⏱️ ${game.duration}</span>
                </div>
                
                <div class="game-details ${this.state.selectedGame === game.id ? 'expanded' : ''}">
                    <h4>📋 Instructions:</h4>
                    <ol class="game-instructions">
                        ${game.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                    </ol>
                    
                    <h4>🎯 Scoring:</h4>
                    <div class="game-scoring">
                        <p><strong>Type:</strong> ${game.scoring.type}</p>
                        <p><strong>Goal:</strong> ${game.scoring.goal}</p>
                        <p><strong>Points:</strong> ${game.scoring.points}</p>
                    </div>
                </div>
                
                <button class="btn btn-primary btn-small toggle-game-btn" data-game="${game.id}">
                    ${this.state.selectedGame === game.id ? 'Hide Details' : 'View Details'}
                </button>
            </div>
        `).join('');
    }

    /**
     * Attach event listeners for login screen
     */
    attachLoginListeners() {
        const loginBtn = document.getElementById('googleSignInBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleLogin());
        }
    }

    /**
     * Attach event listeners for main app
     */
    attachEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        // Tab navigation
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.state.currentView = e.target.dataset.view;
                this.render();
            });
        });
        
        // Add session button
        const addSessionBtn = document.getElementById('addSessionBtn');
        if (addSessionBtn) {
            addSessionBtn.addEventListener('click', () => {
                this.state.showAddSession = true;
                this.render();
            });
        }
        
        // View routines button
        const viewRoutinesBtn = document.getElementById('viewRoutinesBtn');
        if (viewRoutinesBtn) {
            viewRoutinesBtn.addEventListener('click', () => {
                this.state.showRoutines = true;
                this.render();
            });
        }
        
        // Close routines button
        const closeRoutinesBtn = document.getElementById('closeRoutinesBtn');
        if (closeRoutinesBtn) {
            closeRoutinesBtn.addEventListener('click', () => {
                this.state.showRoutines = false;
                this.render();
            });
        }
        
        // Start routine buttons
        const startRoutineBtns = document.querySelectorAll('.start-routine-btn');
        startRoutineBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const routineId = e.target.dataset.routine;
                this.startRoutine(routineId);
            });
        });
        
        // Toggle game details buttons
        const toggleGameBtns = document.querySelectorAll('.toggle-game-btn');
        toggleGameBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gameId = e.target.dataset.game;
                this.state.selectedGame = this.state.selectedGame === gameId ? null : gameId;
                this.render();
            });
        });
        
        // Cancel session button
        const cancelSessionBtn = document.getElementById('cancelSessionBtn');
        if (cancelSessionBtn) {
            cancelSessionBtn.addEventListener('click', () => {
                this.state.showAddSession = false;
                this.newSession = {
                    date: new Date().toISOString().split('T')[0],
                    distance: '10',
                    makes: '',
                    attempts: '',
                    routineName: null
                };
                this.render();
            });
        }
        
        // Session form submit
        const sessionForm = document.getElementById('sessionForm');
        if (sessionForm) {
            sessionForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleAddSession(e);
            });
        }
    }
    
    /**
     * Start a routine
     */
    startRoutine(routineId) {
        const routine = SUGGESTED_ROUTINES.find(r => r.id === routineId);
        if (routine) {
            this.state.activeRoutine = routine;
            this.state.currentDrill = 0;
            this.state.routineProgress = [];
            this.state.showRoutines = false;
            this.state.showAddSession = true;
            
            // Pre-fill the form with first drill
            const firstDrill = routine.drills[0];
            this.newSession.distance = firstDrill.distance.toString();
            this.newSession.attempts = firstDrill.attempts.toString();
            this.newSession.routineName = routine.name;
            
            this.render();
            alert(`Starting ${routine.name}!\n\nDrill 1: ${firstDrill.description}\nDistance: ${firstDrill.distance}ft\nAttempts: ${firstDrill.attempts}`);
        }
    }
    
    /**
     * Handle adding a new session
     */
    async handleAddSession(e) {
        const distance = parseInt(document.getElementById('distance').value);
        const makes = parseInt(document.getElementById('makes').value);
        const attempts = parseInt(document.getElementById('attempts').value);
        
        if (makes > attempts) {
            alert('Makes cannot be greater than attempts!');
            return;
        }
        
        try {
            await userManager.addSession({
                distance,
                makes,
                attempts
            });
            
            // Reset form and hide
            this.state.showAddSession = false;
            this.newSession = {
                date: new Date().toISOString().split('T')[0],
                distance: '10',
                makes: '',
                attempts: '',
                routineName: null
            };
            
            // Reload data
            await this.loadLeaderboard();
            await achievementManager.checkAchievements();
            
            // Re-render
            this.render();
            
            // Show success message
            alert('Session added successfully!');
            
        } catch (error) {
            console.error('Error adding session:', error);
            alert('Failed to add session: ' + error.message);
        }
    }
}

// Create and export app instance
export const app = new App();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}
