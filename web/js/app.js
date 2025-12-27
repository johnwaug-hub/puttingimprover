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
import { routineTracker } from './modules/routineTracker.js';
import { gameTracker } from './modules/gameTracker.js';
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
            selectedGame: null,
            showGameScoreModal: false,
            selectedGameForScore: null,
            showRoutineCompletionModal: false,
            selectedRoutineForCompletion: null
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
    async changeView(view) {
        this.state.currentView = view;
        
        // Unlock "Game On" achievement when viewing Games tab for first time
        if (view === 'games') {
            const user = userManager.getCurrentUser();
            if (user && !user.achievements.includes('game_on')) {
                await userManager.addAchievement('game_on');
                console.log('🎮 Game On achievement unlocked!');
            }
        }
        
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
        const stats = userManager.getStatistics();
        const sessions = userManager.sessions;
        
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
            
            <!-- Game Score Modal -->
            ${this.state.showGameScoreModal ? this.renderGameScoreModal() : ''}
            
            <!-- Routine Completion Modal -->
            ${this.state.showRoutineCompletionModal ? this.renderRoutineCompletionModal() : ''}
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
        const currentUser = userManager.getCurrentUser();
        const isCurrentUser = currentUser && (player.id === currentUser.id || player.userId === currentUser.userId);
        const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
        
        return `
            <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
                <div class="rank ${rankClass}">#${rank}</div>
                <div class="player-info">
                    <div class="player-name">${player.displayName || 'Unknown Player'}${isCurrentUser ? ' (You)' : ''}</div>
                </div>
                <div class="player-stats">
                    <div class="stat-item">
                        <div class="stat-value">${player.totalPoints || 0}</div>
                        <div class="stat-label">Points</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${player.totalSessions || 0}</div>
                        <div class="stat-label">Sessions</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderAchievements() {
        const achievements = achievementManager.getAchievementsWithStatus();
        if (!achievements || achievements.length === 0) {
            return '<p class="empty-state">No achievements yet. Keep practicing!</p>';
        }
        
        return achievements.map(achievement => `
            <div class="achievement-card ${achievement.isUnlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.desc}</div>
                ${achievement.isUnlocked ? '<div class="achievement-badge">✓ Unlocked</div>' : ''}
            </div>
        `).join('');
    }
    
    /**
     * Render game score modal
     */
    renderGameScoreModal() {
        const game = PUTTING_GAMES.find(g => g.id === this.state.selectedGameForScore);
        if (!game) return '';
        
        let formHTML = '';
        
        // Create form based on game type
        switch (game.scoring.type) {
            case 'time':
                formHTML = `
                    <div class="form-group">
                        <label for="gameTime">Completion Time (minutes)</label>
                        <input type="number" id="gameTime" min="1" max="120" step="0.5" required>
                        <p class="form-hint">Goal: ${game.scoring.goal}</p>
                    </div>
                `;
                break;
            case 'strokes':
                formHTML = `
                    <div class="form-group">
                        <label for="gameStrokes">Total Strokes</label>
                        <input type="number" id="gameStrokes" min="1" max="100" required>
                        <p class="form-hint">Goal: ${game.scoring.goal}</p>
                    </div>
                `;
                break;
            case 'points':
                formHTML = `
                    <div class="form-group">
                        <label for="gamePoints">Points Scored</label>
                        <input type="number" id="gamePoints" min="0" max="500" required>
                        <p class="form-hint">Goal: ${game.scoring.goal}</p>
                    </div>
                    <div class="form-group">
                        <label for="totalPutts">Total Putts Attempted</label>
                        <input type="number" id="totalPutts" min="1" max="200">
                    </div>
                `;
                break;
            case 'distance':
                formHTML = `
                    <div class="form-group">
                        <label for="maxDistance">Maximum Distance Reached (feet)</label>
                        <input type="number" id="maxDistance" min="10" max="100" step="5" required>
                        <p class="form-hint">Goal: ${game.scoring.goal}</p>
                    </div>
                    <div class="form-group">
                        <label for="totalRounds">Total Rounds Attempted</label>
                        <input type="number" id="totalRounds" min="1" max="20">
                    </div>
                `;
                break;
            case 'streak':
                formHTML = `
                    <div class="form-group">
                        <label for="bestStreak">Best Streak Achieved</label>
                        <input type="number" id="bestStreak" min="0" max="50" required>
                        <p class="form-hint">Goal: ${game.scoring.goal}</p>
                    </div>
                    <div class="form-group">
                        <label for="totalAttempts">Total Attempts</label>
                        <input type="number" id="totalAttempts" min="10" max="200">
                    </div>
                `;
                break;
            case 'elimination':
                formHTML = `
                    <div class="form-group">
                        <label>Did you win?</label>
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" name="won" value="true" required> Yes, I won! 🎉
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="won" value="false" required> No, I lost 😔
                            </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="opponentName">Opponent Name (optional)</label>
                        <input type="text" id="opponentName" placeholder="Who did you play against?">
                    </div>
                `;
                break;
        }
        
        return `
            <div class="modal-overlay" id="gameScoreModal">
                <div class="modal game-score-modal">
                    <div class="modal-header">
                        <h3>📊 Log Score: ${game.name}</h3>
                        <button type="button" class="close-modal-btn" id="closeGameScoreModal">✕</button>
                    </div>
                    <div class="modal-body">
                        <form id="gameScoreForm" class="game-score-form">
                            ${formHTML}
                            
                            <div class="form-group">
                                <label for="gameNotes">Notes (optional)</label>
                                <textarea id="gameNotes" rows="3" placeholder="How did it go?"></textarea>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Save Score</button>
                                <button type="button" class="btn btn-secondary" id="cancelGameScore">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
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
                            <div class="routine-actions">
                                <button class="btn btn-primary btn-small start-routine-btn" data-routine="${routine.id}">
                                    Start Routine
                                </button>
                                <button class="btn btn-secondary btn-small log-routine-btn" data-routine="${routine.id}">
                                    📊 Log Completion
                                </button>
                            </div>
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
                
                <div class="game-actions">
                    <button class="btn btn-primary btn-small toggle-game-btn" data-game="${game.id}">
                        ${this.state.selectedGame === game.id ? 'Hide Details' : 'View Details'}
                    </button>
                    <button class="btn btn-secondary btn-small log-score-btn" data-game="${game.id}">
                        📊 Log Score
                    </button>
                </div>
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
            tab.addEventListener('click', async (e) => {
                await this.changeView(e.target.dataset.view);
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
        
        // Log routine completion buttons
        const logRoutineBtns = document.querySelectorAll('.log-routine-btn');
        logRoutineBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const routineId = e.target.dataset.routine;
                this.openRoutineCompletionModal(routineId);
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
        
        // Log score buttons
        const logScoreBtns = document.querySelectorAll('.log-score-btn');
        logScoreBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const gameId = e.target.dataset.game;
                this.openGameScoreModal(gameId);
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
    
    /**
     * Open game score modal
     */
    openGameScoreModal(gameId) {
        this.state.showGameScoreModal = true;
        this.state.selectedGameForScore = gameId;
        this.render();
        
        // Attach modal event listeners after render
        setTimeout(() => {
            const closeBtn = document.getElementById('closeGameScoreModal');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeGameScoreModal());
            }
            
            const cancelBtn = document.getElementById('cancelGameScore');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.closeGameScoreModal());
            }
            
            const form = document.getElementById('gameScoreForm');
            if (form) {
                form.addEventListener('submit', (e) => this.handleGameScoreSubmit(e));
            }
            
            // Close on overlay click
            const overlay = document.getElementById('gameScoreModal');
            if (overlay) {
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        this.closeGameScoreModal();
                    }
                });
            }
        }, 100);
    }
    
    /**
     * Close game score modal
     */
    closeGameScoreModal() {
        this.state.showGameScoreModal = false;
        this.state.selectedGameForScore = null;
        this.render();
    }
    
    /**
     * Handle game score submission
     */
    async handleGameScoreSubmit(e) {
        e.preventDefault();
        
        const game = PUTTING_GAMES.find(g => g.id === this.state.selectedGameForScore);
        if (!game) return;
        
        try {
            let scoreData = {};
            
            // Collect score data based on game type
            switch (game.scoring.type) {
                case 'time':
                    scoreData = {
                        score: parseFloat(document.getElementById('gameTime').value),
                        timeInMinutes: parseFloat(document.getElementById('gameTime').value),
                        targetTime: 15 // Could be dynamic based on game
                    };
                    break;
                    
                case 'strokes':
                    scoreData = {
                        score: parseInt(document.getElementById('gameStrokes').value),
                        par: 18 // Could be dynamic
                    };
                    break;
                    
                case 'points':
                    scoreData = {
                        score: parseInt(document.getElementById('gamePoints').value),
                        targetScore: 100,
                        totalPutts: parseInt(document.getElementById('totalPutts')?.value || 0)
                    };
                    break;
                    
                case 'distance':
                    scoreData = {
                        score: parseInt(document.getElementById('maxDistance').value),
                        maxDistance: parseInt(document.getElementById('maxDistance').value),
                        targetDistance: 40,
                        totalRounds: parseInt(document.getElementById('totalRounds')?.value || 0)
                    };
                    break;
                    
                case 'streak':
                    scoreData = {
                        score: parseInt(document.getElementById('bestStreak').value),
                        streak: parseInt(document.getElementById('bestStreak').value),
                        targetStreak: 10,
                        totalAttempts: parseInt(document.getElementById('totalAttempts')?.value || 0)
                    };
                    break;
                    
                case 'elimination':
                    const won = document.querySelector('input[name="won"]:checked')?.value === 'true';
                    scoreData = {
                        score: won ? 1 : 0,
                        won: won,
                        opponent: document.getElementById('opponentName')?.value || 'Unknown'
                    };
                    break;
            }
            
            // Add notes if provided
            const notes = document.getElementById('gameNotes')?.value;
            if (notes) {
                scoreData.notes = notes;
            }
            
            // Start and complete game in one go
            gameTracker.startGame(game);
            await gameTracker.completeGame(scoreData);
            
            // Check achievements
            await achievementManager.checkAchievements();
            
            // Close modal
            this.closeGameScoreModal();
            
            // Show success
            alert(`✅ Score logged for ${game.name}!${scoreData.won !== undefined ? (scoreData.won ? ' You won! 🎉' : ' Better luck next time!') : ''}`);
            
        } catch (error) {
            console.error('Error logging game score:', error);
            alert('Failed to log score: ' + error.message);
        }
    }
    
    /**
     * Render routine completion modal
     */
    renderRoutineCompletionModal() {
        const routine = SUGGESTED_ROUTINES.find(r => r.id === this.state.selectedRoutineForCompletion);
        if (!routine) return '';
        
        return `
            <div class="modal-overlay" id="routineCompletionModal">
                <div class="modal routine-completion-modal">
                    <div class="modal-header">
                        <h3>✅ Log Routine Completion: ${routine.name}</h3>
                        <button type="button" class="close-modal-btn" id="closeRoutineCompletionModal">✕</button>
                    </div>
                    <div class="modal-body">
                        <p class="modal-description">Log your performance for each drill in this routine:</p>
                        <form id="routineCompletionForm" class="routine-completion-form">
                            ${routine.drills.map((drill, idx) => `
                                <div class="drill-completion-group">
                                    <h4>Drill ${idx + 1}: ${drill.distance}ft - ${drill.attempts} attempts</h4>
                                    <p class="drill-desc">${drill.description}</p>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="drill${idx}Makes">Makes</label>
                                            <input type="number" id="drill${idx}Makes" min="0" max="${drill.attempts}" required>
                                        </div>
                                        <div class="form-group">
                                            <label for="drill${idx}Attempts">Attempts</label>
                                            <input type="number" id="drill${idx}Attempts" value="${drill.attempts}" min="1" max="100" required>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                            
                            <div class="form-group">
                                <label for="routineDuration">Total Duration (minutes)</label>
                                <input type="number" id="routineDuration" min="1" max="120" placeholder="How long did it take?">
                            </div>
                            
                            <div class="form-group">
                                <label for="routineNotes">Notes (optional)</label>
                                <textarea id="routineNotes" rows="3" placeholder="How did it go? Which drills were challenging?"></textarea>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Save Completion</button>
                                <button type="button" class="btn btn-secondary" id="cancelRoutineCompletion">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Open routine completion modal
     */
    openRoutineCompletionModal(routineId) {
        this.state.showRoutineCompletionModal = true;
        this.state.selectedRoutineForCompletion = routineId;
        this.render();
        
        // Attach modal event listeners after render
        setTimeout(() => {
            const closeBtn = document.getElementById('closeRoutineCompletionModal');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeRoutineCompletionModal());
            }
            
            const cancelBtn = document.getElementById('cancelRoutineCompletion');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.closeRoutineCompletionModal());
            }
            
            const form = document.getElementById('routineCompletionForm');
            if (form) {
                form.addEventListener('submit', (e) => this.handleRoutineCompletionSubmit(e));
            }
            
            // Close on overlay click
            const overlay = document.getElementById('routineCompletionModal');
            if (overlay) {
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        this.closeRoutineCompletionModal();
                    }
                });
            }
        }, 100);
    }
    
    /**
     * Close routine completion modal
     */
    closeRoutineCompletionModal() {
        this.state.showRoutineCompletionModal = false;
        this.state.selectedRoutineForCompletion = null;
        this.render();
    }
    
    /**
     * Handle routine completion submission
     */
    async handleRoutineCompletionSubmit(e) {
        e.preventDefault();
        
        const routine = SUGGESTED_ROUTINES.find(r => r.id === this.state.selectedRoutineForCompletion);
        if (!routine) return;
        
        try {
            // Collect drill data
            const drills = routine.drills.map((drill, idx) => {
                const makes = parseInt(document.getElementById(`drill${idx}Makes`).value);
                const attempts = parseInt(document.getElementById(`drill${idx}Attempts`).value);
                
                return {
                    drillNumber: idx + 1,
                    distance: drill.distance,
                    targetAttempts: drill.attempts,
                    description: drill.description,
                    makes,
                    attempts,
                    percentage: (makes / attempts) * 100,
                    completed: true
                };
            });
            
            // Calculate overall stats
            const totalMakes = drills.reduce((sum, d) => sum + d.makes, 0);
            const totalAttempts = drills.reduce((sum, d) => sum + d.attempts, 0);
            const overallPercentage = (totalMakes / totalAttempts) * 100;
            
            const duration = parseInt(document.getElementById('routineDuration')?.value || 0);
            const notes = document.getElementById('routineNotes')?.value;
            
            // Create completion record
            const completion = {
                routineId: routine.id,
                routineName: routine.name,
                startTime: new Date(Date.now() - duration * 60000).toISOString(), // Estimate start time
                endTime: new Date().toISOString(),
                duration,
                drills,
                totalStats: {
                    totalDrills: drills.length,
                    completedDrills: drills.length,
                    totalMakes,
                    totalAttempts,
                    overallPercentage: Math.round(overallPercentage * 10) / 10
                },
                notes: notes || null,
                completed: true
            };
            
            // Save to Firestore
            const user = userManager.getCurrentUser();
            if (user) {
                await storageManager.saveRoutineCompletion(user.id, completion);
            }
            
            // Check achievements
            await achievementManager.checkAchievements();
            
            // Close modal
            this.closeRoutineCompletionModal();
            
            // Show success
            alert(`✅ Routine completion logged!\n\n${routine.name}\nOverall: ${totalMakes}/${totalAttempts} (${Math.round(overallPercentage)}%)\nDuration: ${duration} minutes`);
            
        } catch (error) {
            console.error('Error logging routine completion:', error);
            alert('Failed to log routine completion: ' + error.message);
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
