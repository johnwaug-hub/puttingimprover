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
import { calculateRoutinePoints } from './utils/calculations.js';

class App {
    constructor() {
        this.state = {
            loading: true,
            error: null,
            currentView: 'practice', // practice, leaderboard, friends, achievements, games
            leaderboardCategory: 'points', // points, sessions, routines, games
            leaderboardGenderFilter: 'both', // male, female, both
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
            selectedRoutineForCompletion: null,
            showProfileModal: false,
            selectedUserProfile: null,
            recentRoutines: [],
            recentGames: [],
            searchedPlayer: null,
            customAlert: null,
            editingSession: null,
            editingRoutine: null,
            editingGame: null,
            showEditRoutineModal: false,
            showEditGameModal: false,
            achievementSplash: null, // { id, name, icon, desc, points }
            collapsedCategories: {
                // Achievement categories - all collapsed by default
                'Getting Started': true,
                'Accuracy': true,
                'Points & Sessions': true,
                'Streaks': true,
                'Distance': true,
                'Volume': true,
                'Routines': true,
                'Games': true,
                'Social & Competition': true,
                'Variety': true,
                'Dedication': true,
                'Special': true,
                // Routine difficulty sections - all collapsed by default
                'routine-Beginner': true,
                'routine-Intermediate': true,
                'routine-Advanced': true,
                'routine-Expert': true
            },
            otherPlayerStats: null, // Cache for other player's calculated stats
            showBulkLogModal: false,
            showPermissionsModal: false,
            bulkLogPlayers: [], // Players selected for bulk logging
            permissionRequests: [] // Pending permission requests
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
                await this.loadRecentPractice();
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
     * Load recent practice activities (routines and games)
     */
    async loadRecentPractice() {
        try {
            const user = userManager.getCurrentUser();
            if (!user) return;
            
            // Load routines
            const routines = await storageManager.getRoutineCompletions(user.id);
            this.state.recentRoutines = routines || [];
            
            // Load games
            const games = await storageManager.getGameCompletions(user.id);
            this.state.recentGames = games || [];
            
        } catch (error) {
            console.error('Error loading recent practice:', error);
            this.state.recentRoutines = [];
            this.state.recentGames = [];
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
     * Delete a practice session
     * @param {string} sessionId - ID of session to delete
     */
    async deleteSession(sessionId) {
        try {
            // Confirm deletion
            const session = userManager.sessions.find(s => s.id === sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            const confirmed = confirm(
                `Are you sure you want to delete this session?\n\n` +
                `Date: ${new Date(session.date).toLocaleDateString()}\n` +
                `Distance: ${session.distance}ft\n` +
                `Score: ${session.makes}/${session.attempts} (${session.percentage.toFixed(1)}%)\n` +
                `Points: ${session.points}`
            );

            if (!confirmed) {
                return;
            }

            // Delete the session
            await userManager.deleteSession(sessionId);

            // Reload leaderboard
            await this.loadLeaderboard();

            // Re-render
            this.render();

            console.log('✅ Session deleted successfully');

        } catch (error) {
            console.error('Error deleting session:', error);
            alert('Failed to delete session: ' + error.message);
        }
    }
    
    /**
     * Edit a session
     * @param {string} sessionId - ID of session to edit
     */
    editSession(sessionId) {
        const session = userManager.sessions.find(s => s.id === sessionId);
        if (!session) {
            this.showCustomAlert('Session not found', 'error');
            return;
        }
        
        // Set editing mode
        this.state.editingSession = sessionId;
        this.state.showAddSession = true;
        
        // Pre-fill form with session data
        this.newSession = {
            date: session.date,
            distance: session.distance.toString(),
            makes: session.makes.toString(),
            attempts: session.attempts.toString(),
            routineName: session.routineName
        };
        
        this.render();
    }
    
    /**
     * Delete a routine
     * @param {string} routineId - ID of routine to delete
     */
    async deleteRoutine(routineId) {
        try {
            const routine = this.state.recentRoutines.find(r => r.id === routineId);
            if (!routine) {
                throw new Error('Routine not found');
            }

            const confirmed = confirm(
                `Are you sure you want to delete this routine?\n\n` +
                `Routine: ${routine.routineName}\n` +
                `Duration: ${routine.duration} minutes\n` +
                `Score: ${routine.totalStats.totalMakes}/${routine.totalStats.totalAttempts} (${routine.totalStats.overallPercentage.toFixed(1)}%)\n` +
                `Points: ${routine.points || 0}`
            );

            if (!confirmed) {
                return;
            }

            const user = userManager.getCurrentUser();
            
            // Remove points from user
            user.totalPoints = Math.max(0, user.totalPoints - (routine.points || 0));
            user.totalRoutines = Math.max(0, (user.totalRoutines || 0) - 1);
            await storageManager.saveUser(user);
            
            // Delete routine
            await storageManager.deleteRoutineCompletion(user.id, routineId);

            // Reload data
            await this.loadRecentPractice();
            await this.loadLeaderboard();

            this.render();
            this.showCustomAlert('Routine deleted successfully', 'success');

        } catch (error) {
            console.error('Error deleting routine:', error);
            this.showCustomAlert('Failed to delete routine: ' + error.message, 'error');
        }
    }
    
    /**
     * Edit a routine
     * @param {string} routineId - ID of routine to edit
     */
    editRoutine(routineId) {
        const routine = this.state.recentRoutines.find(r => r.id === routineId);
        if (!routine) {
            this.showCustomAlert('Routine not found', 'error');
            return;
        }
        
        this.state.editingRoutine = routineId;
        this.state.showEditRoutineModal = true;
        this.render();
    }
    
    /**
     * Delete a game
     * @param {string} gameId - ID of game to delete
     */
    async deleteGame(gameId) {
        try {
            const game = this.state.recentGames.find(g => g.id === gameId);
            if (!game) {
                throw new Error('Game not found');
            }

            const confirmed = confirm(
                `Are you sure you want to delete this game?\n\n` +
                `Game: ${game.gameName}\n` +
                `Score: ${game.score}\n` +
                `Points: ${game.points || 0}`
            );

            if (!confirmed) {
                return;
            }

            const user = userManager.getCurrentUser();
            
            // Remove points from user
            user.totalPoints = Math.max(0, user.totalPoints - (game.points || 0));
            user.totalGames = Math.max(0, (user.totalGames || 0) - 1);
            await storageManager.saveUser(user);
            
            // Delete game
            await storageManager.deleteGameCompletion(user.id, gameId);

            // Reload data
            await this.loadRecentPractice();
            await this.loadLeaderboard();

            this.render();
            this.showCustomAlert('Game deleted successfully', 'success');

        } catch (error) {
            console.error('Error deleting game:', error);
            this.showCustomAlert('Failed to delete game: ' + error.message, 'error');
        }
    }
    
    /**
     * Edit a game
     * @param {string} gameId - ID of game to edit
     */
    editGame(gameId) {
        const game = this.state.recentGames.find(g => g.id === gameId);
        if (!game) {
            this.showCustomAlert('Game not found', 'error');
            return;
        }
        
        this.state.editingGame = gameId;
        this.state.showEditGameModal = true;
        this.render();
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
                        <div class="header-left">
                            <img src="logo.jpg" alt="Lock Jaw Disc Golf" class="header-logo">
                        </div>
                        <div class="header-center">
                            <h1 class="app-title">Putting Improver</h1>
                        </div>
                        <div class="header-right">
                            <div class="header-user-profile">
                                <div class="header-profile-pic">
                                    ${user.profilePictureURL 
                                        ? `<img src="${user.profilePictureURL}" alt="${user.displayName}">` 
                                        : `<div class="header-profile-placeholder">${(user.displayName || 'U')[0].toUpperCase()}</div>`
                                    }
                                </div>
                                <span class="user-name clickable" id="headerUsername">${user.displayName}</span>
                            </div>
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
                    <button class="tab ${this.state.currentView === 'routines' ? 'active' : ''}" data-view="routines">
                        📋 Routines
                    </button>
                    <button class="tab ${this.state.currentView === 'games' ? 'active' : ''}" data-view="games">
                        🎮 Games
                    </button>
                    <button class="tab ${this.state.currentView === 'achievements' ? 'active' : ''}" data-view="achievements">
                        🏅 Achievements
                    </button>
                    <button class="tab ${this.state.currentView === 'leaderboard' ? 'active' : ''}" data-view="leaderboard">
                        🏆 Leaderboard
                    </button>
                    <button class="tab ${this.state.currentView === 'stats' ? 'active' : ''}" data-view="stats">
                        📈 Stats
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

                    <!-- Add Session Form (Hidden by default) -->
                    ${this.state.showAddSession ? this.renderAddSessionForm() : ''}

                    <!-- Recent Sessions -->
                    <div class="card">
                        <div class="header-flex">
                            <h2>Recent Practice</h2>
                            <div class="header-actions">
                                <button id="bulkLogBtn" class="btn btn-secondary btn-small">
                                    📋 Bulk Log
                                </button>
                                <button id="addSessionBtn" class="btn btn-primary">
                                    ➕ Add Practice Session
                                </button>
                            </div>
                        </div>
                        <div class="sessions-list">
                            ${this.renderRecentPractice()}
                        </div>
                    </div>
                </div>

                <!-- Routines View -->
                <div class="view ${this.state.currentView === 'routines' ? 'active' : ''}" id="routines-view">
                    ${this.renderRoutines()}
                </div>

                <!-- Stats View -->
                <div class="view ${this.state.currentView === 'stats' ? 'active' : ''}" id="stats-view">
                    ${this.renderStatsView()}
                </div>

                <!-- Leaderboard View -->
                <div class="view ${this.state.currentView === 'leaderboard' ? 'active' : ''}" id="leaderboard-view">
                    <div class="card">
                        <h2>🏆 Leaderboard</h2>
                        
                        <!-- Leaderboard Category Tabs -->
                        <div class="leaderboard-tabs">
                            <button class="leaderboard-tab ${!this.state.leaderboardCategory || this.state.leaderboardCategory === 'points' ? 'active' : ''}" 
                                    data-category="points">
                                💰 Points Leader
                            </button>
                            <button class="leaderboard-tab ${this.state.leaderboardCategory === 'sessions' ? 'active' : ''}" 
                                    data-category="sessions">
                                🎯 Sessions Leader
                            </button>
                            <button class="leaderboard-tab ${this.state.leaderboardCategory === 'routines' ? 'active' : ''}" 
                                    data-category="routines">
                                📋 Routines Leader
                            </button>
                            <button class="leaderboard-tab ${this.state.leaderboardCategory === 'games' ? 'active' : ''}" 
                                    data-category="games">
                                🎮 Games Leader
                            </button>
                        </div>
                        
                        <!-- Gender Filter Toggles -->
                        <div class="gender-filter-container">
                            <span class="filter-label">Filter by gender:</span>
                            <div class="gender-toggles">
                                <button class="gender-toggle ${this.state.leaderboardGenderFilter === 'male' ? 'active' : ''}" 
                                        data-gender="male">
                                    ♂️ Male
                                </button>
                                <button class="gender-toggle ${this.state.leaderboardGenderFilter === 'female' ? 'active' : ''}" 
                                        data-gender="female">
                                    ♀️ Female
                                </button>
                                <button class="gender-toggle ${this.state.leaderboardGenderFilter === 'both' ? 'active' : ''}" 
                                        data-gender="both">
                                    👥 Both
                                </button>
                            </div>
                        </div>
                        
                        <div class="leaderboard-list">
                            ${this.renderLeaderboardList()}
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
            
            <!-- Bulk Logging Modal -->
            ${this.state.showBulkLogModal ? this.renderBulkLogModal() : ''}
            
            <!-- Permissions Modal -->
            ${this.state.showPermissionsModal ? this.renderPermissionsModal() : ''}
            
            <!-- Profile Modal -->
            ${this.state.showProfileModal ? this.renderProfileModal() : ''}
            
            <!-- Edit Routine Modal -->
            ${this.state.showEditRoutineModal ? this.renderEditRoutineModal() : ''}
            
            <!-- Edit Game Modal -->
            ${this.state.showEditGameModal ? this.renderEditGameModal() : ''}
            
            <!-- Achievement Splash -->
            ${this.state.achievementSplash ? this.renderAchievementSplash() : ''}
            
            <!-- Custom Alert -->
            ${this.state.customAlert ? this.renderCustomAlert() : ''}
        `;
    }
    
    /**
     * Render achievement splash screen
     */
    renderAchievementSplash() {
        const { icon, name, desc, points } = this.state.achievementSplash;
        
        return `
            <div class="achievement-splash-overlay">
                <div class="achievement-splash">
                    <div class="achievement-splash-glow"></div>
                    <div class="achievement-splash-content">
                        <div class="achievement-splash-header">
                            <div class="achievement-splash-badge">🏆</div>
                            <h2 class="achievement-splash-title">Achievement Unlocked!</h2>
                        </div>
                        <div class="achievement-splash-icon">${icon}</div>
                        <h3 class="achievement-splash-name">${name}</h3>
                        <p class="achievement-splash-desc">${desc}</p>
                        <div class="achievement-splash-points">+${points} points</div>
                    </div>
                    <div class="achievement-splash-sparkles">
                        <span class="sparkle">✨</span>
                        <span class="sparkle">✨</span>
                        <span class="sparkle">✨</span>
                        <span class="sparkle">✨</span>
                        <span class="sparkle">✨</span>
                        <span class="sparkle">✨</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render custom alert
     */
    renderCustomAlert() {
        const { message, type } = this.state.customAlert;
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        return `
            <div class="custom-alert ${type}">
                <span class="alert-icon">${icons[type] || icons.info}</span>
                <span class="alert-message">${message}</span>
            </div>
        `;
    }
    
    renderAddSessionForm() {
        const isEditing = this.state.editingSession !== null;
        return `
            <div class="card add-session-form">
                <h3>${isEditing ? '✏️ Edit Practice Session' : 'Add Practice Session'}</h3>
                <form id="sessionForm">
                    ${!isEditing ? `
                    <div class="form-group">
                        <label for="logForUser">Log Session For</label>
                        <select id="logForUser" class="form-input">
                            <option value="${this.state.user?.id || ''}">Myself</option>
                            ${this.state.leaderboard
                                .filter(p => p.id !== (this.state.user?.id || ''))
                                .map(p => `<option value="${p.id}">${p.displayName}</option>`)
                                .join('')}
                        </select>
                        <p class="form-hint">Choose who this session is for</p>
                    </div>
                    ` : ''}
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
                        <button type="submit" class="btn btn-primary">${isEditing ? 'Update Session' : 'Save Session'}</button>
                        <button type="button" id="cancelSessionBtn" class="btn btn-secondary">Cancel</button>
                    </div>
                </form>
            </div>
        `;
    }
    
    /**
     * Render combined recent practice (sessions, routines, and games)
     */
    renderRecentPractice() {
        const sessions = userManager.sessions || [];
        const routines = this.state.recentRoutines || [];
        const games = this.state.recentGames || [];
        
        // Get all practice activities
        const allActivities = [];
        
        // Add sessions
        sessions.forEach(session => {
            // Use timestamp if available, otherwise use date
            const dateToUse = session.timestamp ? new Date(session.timestamp) : new Date(session.date);
            allActivities.push({
                type: 'session',
                data: session,
                date: dateToUse,
                id: session.id
            });
        });
        
        // Add routines
        routines.forEach(routine => {
            allActivities.push({
                type: 'routine',
                data: routine,
                date: new Date(routine.endTime),
                id: routine.id
            });
        });
        
        // Add games
        games.forEach(game => {
            allActivities.push({
                type: 'game',
                data: game,
                date: new Date(game.endTime),
                id: game.id
            });
        });
        
        // Sort by date (newest first)
        allActivities.sort((a, b) => b.date - a.date);
        
        // Take most recent 20
        const recent = allActivities.slice(0, 20);
        
        if (recent.length === 0) {
            return '<p class="empty-state">No practice activities yet. Start practicing!</p>';
        }
        
        return recent.map(activity => {
            switch (activity.type) {
                case 'session':
                    return this.renderSessionItem(activity.data);
                case 'routine':
                    return this.renderRoutineItem(activity.data);
                case 'game':
                    return this.renderGameItem(activity.data);
                default:
                    return '';
            }
        }).join('');
    }
    
    /**
     * Render routine item for recent practice list
     */
    renderRoutineItem(routine) {
        const dateObj = new Date(routine.endTime);
        const date = dateObj.toLocaleDateString();
        const time = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        const currentUserId = userManager.getCurrentUser()?.id;
        const loggedByOther = routine.loggedBy && routine.loggedBy !== currentUserId;
        const needsAccept = routine.pending && loggedByOther;
        
        return `
            <div class="session-item routine-item ${needsAccept ? 'pending-session' : ''}">
                <div class="session-header">
                    <div>
                        <span class="session-date">${date}</span>
                        <span class="session-time">${time}</span>
                        <span class="routine-tag">📋 ${routine.routineName}</span>
                        ${loggedByOther ? `<span class="logged-by-badge">📝 Logged by ${routine.loggedByName || 'Another user'}</span>` : ''}
                        ${needsAccept ? `<span class="pending-badge">⏳ Pending</span>` : ''}
                    </div>
                    <div class="session-actions">
                        ${needsAccept ? `
                            <button class="btn btn-success btn-small accept-routine-btn" data-routine-id="${routine.id}">
                                ✓ Accept
                            </button>
                            <button class="btn btn-danger btn-small reject-routine-btn" data-routine-id="${routine.id}">
                                ✕ Reject
                            </button>
                        ` : `
                            <span class="session-points">${routine.points || 0} pts</span>
                            <button class="btn-edit-routine" data-routine-id="${routine.id}" title="Edit routine">
                                ✏️
                            </button>
                            <button class="btn-delete-routine" data-routine-id="${routine.id}" title="Delete routine">
                                🗑️
                            </button>
                        `}
                    </div>
                </div>
                <div class="session-stats">
                    <span>${routine.duration} min</span>
                    <span>${routine.totalStats.totalMakes}/${routine.totalStats.totalAttempts}</span>
                    <span>${routine.totalStats.overallPercentage.toFixed(1)}%</span>
                </div>
            </div>
        `;
    }
    
    /**
     * Render game item for recent practice list
     */
    renderGameItem(game) {
        const dateObj = new Date(game.endTime);
        const date = dateObj.toLocaleDateString();
        const time = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        
        const currentUserId = userManager.getCurrentUser()?.id;
        const loggedByOther = game.loggedBy && game.loggedBy !== currentUserId;
        const needsAccept = game.pending && loggedByOther;
        
        return `
            <div class="session-item game-item ${needsAccept ? 'pending-session' : ''}">
                <div class="session-header">
                    <div>
                        <span class="session-date">${date}</span>
                        <span class="session-time">${time}</span>
                        <span class="game-tag">🎮 ${game.gameName}</span>
                        ${loggedByOther ? `<span class="logged-by-badge">📝 Logged by ${game.loggedByName || 'Another user'}</span>` : ''}
                        ${needsAccept ? `<span class="pending-badge">⏳ Pending</span>` : ''}
                    </div>
                    <div class="session-actions">
                        ${needsAccept ? `
                            <button class="btn btn-success btn-small accept-game-btn" data-game-id="${game.id}">
                                ✓ Accept
                            </button>
                            <button class="btn btn-danger btn-small reject-game-btn" data-game-id="${game.id}">
                                ✕ Reject
                            </button>
                        ` : `
                            <span class="session-points">${game.points || 0} pts</span>
                            <button class="btn-edit-game" data-game-id="${game.id}" title="Edit game">
                                ✏️
                            </button>
                            <button class="btn-delete-game" data-game-id="${game.id}" title="Delete game">
                                🗑️
                            </button>
                        `}
                    </div>
                </div>
                <div class="session-stats">
                    <span>Score: ${game.score}</span>
                    ${game.goalAchieved ? '<span class="goal-badge">🎯 Goal!</span>' : ''}
                </div>
            </div>
        `;
    }
    
    renderSessionItem(session) {
        const dateObj = new Date(session.timestamp || session.date);
        const date = dateObj.toLocaleDateString();
        const time = session.timestamp ? dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
        const routineTag = session.routineName ? `<span class="routine-tag">📋 ${session.routineName}</span>` : '';
        
        // Check if logged by someone else
        const currentUserId = userManager.getCurrentUser()?.id;
        const loggedByOther = session.loggedBy && session.loggedBy !== currentUserId;
        const needsAccept = session.pending && loggedByOther;
        
        return `
            <div class="session-item ${needsAccept ? 'pending-session' : ''}" data-session-id="${session.id}">
                <div class="session-header">
                    <div>
                        <span class="session-date">${date}</span>
                        ${time ? `<span class="session-time">${time}</span>` : ''}
                        ${routineTag}
                        ${loggedByOther ? `<span class="logged-by-badge">📝 Logged by ${session.loggedByName || 'Another user'}</span>` : ''}
                        ${needsAccept ? `<span class="pending-badge">⏳ Pending</span>` : ''}
                    </div>
                    <div class="session-actions">
                        ${needsAccept ? `
                            <button class="btn btn-success btn-small accept-session-btn" data-session-id="${session.id}">
                                ✓ Accept
                            </button>
                            <button class="btn btn-danger btn-small reject-session-btn" data-session-id="${session.id}">
                                ✕ Reject
                            </button>
                        ` : `
                            <span class="session-points">${session.points} pts</span>
                            <button class="btn-edit-session" data-session-id="${session.id}" title="Edit session">
                                ✏️
                            </button>
                            <button class="btn-delete-session" data-session-id="${session.id}" title="Delete session">
                                🗑️
                            </button>
                        `}
                    </div>
                </div>
                <div class="session-stats">
                    <span>${session.distance}ft</span>
                    <span>${session.makes}/${session.attempts}</span>
                    <span>${session.percentage.toFixed(1)}%</span>
                </div>
            </div>
        `;
    }
    
    renderLeaderboardList() {
        if (this.state.leaderboard.length === 0) {
            return '<p class="empty-state">No players yet</p>';
        }
        
        const category = this.state.leaderboardCategory || 'points';
        const genderFilter = this.state.leaderboardGenderFilter || 'both';
        
        // Filter out users who opted out of leaderboard
        let filteredPlayers = this.state.leaderboard.filter(player => !player.hideFromLeaderboard);
        
        // Filter by gender
        if (genderFilter !== 'both') {
            filteredPlayers = filteredPlayers.filter(player => player.gender === genderFilter);
        }
        
        // Check if any players after filtering
        if (filteredPlayers.length === 0) {
            return `<p class="empty-state">No ${genderFilter === 'male' ? 'male' : genderFilter === 'female' ? 'female' : ''} players yet</p>`;
        }
        
        // Sort based on category
        let sortedPlayers = [...filteredPlayers];
        switch(category) {
            case 'sessions':
                sortedPlayers.sort((a, b) => (b.totalSessions || 0) - (a.totalSessions || 0));
                break;
            case 'routines':
                sortedPlayers.sort((a, b) => (b.totalRoutines || 0) - (a.totalRoutines || 0));
                break;
            case 'games':
                sortedPlayers.sort((a, b) => (b.totalGames || 0) - (a.totalGames || 0));
                break;
            case 'points':
            default:
                sortedPlayers.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
                break;
        }
        
        return sortedPlayers.map((player, index) => 
            this.renderLeaderboardItem(player, index + 1, category)
        ).join('');
    }
    
    renderLeaderboardItem(player, rank, category = 'points') {
        const currentUser = userManager.getCurrentUser();
        const isCurrentUser = currentUser && (player.id === currentUser.id || player.userId === currentUser.userId);
        const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
        
        // Determine which stats to show based on category
        let stat1Value, stat1Label, stat2Value, stat2Label;
        
        switch(category) {
            case 'sessions':
                stat1Value = player.totalSessions || 0;
                stat1Label = 'Sessions';
                stat2Value = player.totalPoints || 0;
                stat2Label = 'Points';
                break;
            case 'routines':
                stat1Value = player.totalRoutines || 0;
                stat1Label = 'Routines';
                stat2Value = player.totalSessions || 0;
                stat2Label = 'Sessions';
                break;
            case 'games':
                stat1Value = player.totalGames || 0;
                stat1Label = 'Games';
                stat2Value = player.totalPoints || 0;
                stat2Label = 'Points';
                break;
            case 'points':
            default:
                stat1Value = player.totalPoints || 0;
                stat1Label = 'Points';
                stat2Value = player.totalSessions || 0;
                stat2Label = 'Sessions';
                break;
        }
        
        // Count achievements
        const achievementsCount = player.achievements ? player.achievements.length : 0;
        
        return `
            <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
                <div class="rank ${rankClass}">#${rank}</div>
                <div class="leaderboard-profile-pic">
                    ${player.profilePictureURL 
                        ? `<img src="${player.profilePictureURL}" alt="${player.displayName}">` 
                        : `<div class="leaderboard-profile-placeholder">${(player.displayName || 'U')[0].toUpperCase()}</div>`
                    }
                </div>
                <div class="player-info">
                    <div class="player-name-wrapper">
                        <span class="player-name">
                            ${player.displayName || 'Unknown Player'}
                        </span>
                    </div>
                    ${achievementsCount > 0 ? `
                        <div class="player-achievements">
                            🏅 ${achievementsCount} achievement${achievementsCount !== 1 ? 's' : ''}
                        </div>
                    ` : ''}
                </div>
                <div class="player-stats">
                    <div class="stat-item">
                        <div class="stat-value">${stat1Value}</div>
                        <div class="stat-label">${stat1Label}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stat2Value}</div>
                        <div class="stat-label">${stat2Label}</div>
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
        
        // Group achievements by category
        const categories = {
            'Getting Started': ['first_steps', 'early_bird', 'night_owl'],
            'Accuracy': ['perfect_10', 'ninety_percent_club', 'flawless', 'sharpshooter'],
            'Points & Sessions': ['century_club', 'half_century', 'centurion', 'point_king', 'point_legend'],
            'Streaks': ['week_warrior', 'two_week_streak', 'month_master', 'iron_will', 'unstoppable'],
            'Distance': ['long_ranger', 'distance_demon', 'downtown_driver', 'extreme_range'],
            'Volume': ['hundred_club', 'two_hundred_club', 'marathon_putter', 'iron_man'],
            'Routines': ['routine_rookie', 'routine_regular', 'routine_master', 'ladder_climber', 'consistency_king', 'routine_addict'],
            'Games': ['game_on', 'first_game', 'game_enthusiast', 'game_master', 'around_the_world_champ', 'horse_master', 'perfect_streak', 'distance_champion', 'par_shooter', 'poker_pro', 'putt_100_master'],
            'Social & Competition': ['social_butterfly', 'friend_magnet', 'podium_finish', 'top_ten', 'number_one', 'challenge_accepted'],
            'Variety': ['distance_explorer', 'all_ranges', 'versatile_putter'],
            'Dedication': ['weekend_warrior', 'daily_grinder', 'committed', 'veteran', 'legend', 'early_adopter'],
            'Special': ['comeback_kid', 'profile_complete', 'disc_collector']
        };
        
        let html = '';
        
        // Render each category
        for (const [categoryName, achievementIds] of Object.entries(categories)) {
            const categoryAchievements = achievements.filter(a => achievementIds.includes(a.id));
            
            if (categoryAchievements.length === 0) continue;
            
            const unlockedCount = categoryAchievements.filter(a => a.isUnlocked).length;
            const isCollapsed = this.state.collapsedCategories[categoryName];
            
            html += `
                <div class="achievement-category ${isCollapsed ? 'collapsed' : ''}">
                    <h3 class="category-title clickable" data-category="${categoryName}">
                        <span class="category-toggle">${isCollapsed ? '▶' : '▼'}</span>
                        ${categoryName}
                        <span class="category-progress">${unlockedCount}/${categoryAchievements.length}</span>
                    </h3>
                    <div class="achievements-grid" style="display: ${isCollapsed ? 'none' : 'grid'}">
                        ${categoryAchievements.map(achievement => `
                            <div class="achievement-card ${achievement.isUnlocked ? 'unlocked' : 'locked'}">
                                <div class="achievement-icon">${achievement.icon}</div>
                                <div class="achievement-name">${achievement.name}</div>
                                <div class="achievement-description">${achievement.desc}</div>
                                <div class="achievement-points">${achievement.points} pts</div>
                                ${achievement.isUnlocked ? '<div class="achievement-badge">✓ Unlocked</div>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        return html;
    }
    
    /**
     * Render Stats View with player search and filters
     */
    renderStatsView() {
        const user = userManager.getCurrentUser();
        let displayPlayer = user;
        let displaySessions = userManager.sessions || [];
        let displayStats = userManager.getStatistics();
        
        // If searching for another player
        if (this.state.searchedPlayer && this.state.searchedPlayer !== user.id) {
            displayPlayer = this.state.leaderboard.find(p => p.id === this.state.searchedPlayer);
            if (displayPlayer) {
                // Load their sessions to calculate stats
                this.loadOtherPlayerStats(displayPlayer.id);
                
                // Use cached data if available
                if (this.state.otherPlayerStats && this.state.otherPlayerStats.playerId === displayPlayer.id) {
                    displaySessions = [];
                    displayStats = this.state.otherPlayerStats.stats;
                } else {
                    // Show loading state or stored aggregate stats
                    displaySessions = [];
                    displayStats = {
                        totalSessions: displayPlayer.totalSessions || 0,
                        totalPutts: displayPlayer.totalPutts || 0,
                        totalMakes: displayPlayer.totalMakes || 0,
                        accuracy: displayPlayer.totalPutts > 0 ? ((displayPlayer.totalMakes / displayPlayer.totalPutts) * 100).toFixed(1) : 0,
                        bestSession: displayPlayer.bestSession || null,
                        currentStreak: displayPlayer.currentStreak || 0,
                        longestStreak: displayPlayer.longestStreak || 0,
                        avgDistance: displayPlayer.avgDistance || 0,
                        bestAccuracy: displayPlayer.bestAccuracy || 0
                    };
                }
            }
        }
        
        return `
            <div class="card">
                <h2>📈 Player Statistics</h2>
                
                <!-- Search Bar -->
                <div class="stats-search-container">
                    <input type="text" 
                           id="playerSearch" 
                           class="stats-search-input" 
                           placeholder="Search player by name..."
                           value="">
                    <button class="btn btn-primary" id="searchPlayerBtn">Search</button>
                    <button class="btn btn-secondary" id="viewMyStatsBtn">My Stats</button>
                </div>
                
                <!-- Stats Display -->
                <div id="statsDisplay">
                    ${this.renderPlayerStats(displayPlayer, displaySessions, displayStats)}
                </div>
            </div>
        `;
    }
    
    /**
     * Render player stats details
     */
    renderPlayerStats(player, sessions, stats) {
        if (!player) {
            return '<p class="empty-state">No player selected</p>';
        }
        
        // Calculate additional stats (use stored stats if sessions aren't available)
        let avgDistance, bestAccuracy;
        
        if (sessions.length > 0) {
            const totalDistance = sessions.reduce((sum, s) => sum + (s.distance * s.attempts), 0);
            avgDistance = (totalDistance / sessions.reduce((sum, s) => sum + s.attempts, 0)).toFixed(1);
            bestAccuracy = Math.max(...sessions.map(s => s.percentage)).toFixed(1);
        } else {
            // Use stored aggregate stats for other players
            avgDistance = stats.avgDistance || player.avgDistance || 0;
            bestAccuracy = stats.bestAccuracy || player.bestAccuracy || 0;
        }
        
        const avgAccuracy = stats.totalPutts > 0 
            ? ((stats.totalMakes / stats.totalPutts) * 100).toFixed(1)
            : (stats.accuracy || 0);
        
        // Distance breakdown with accuracy (only for own stats with sessions)
        const distanceRanges = sessions.length > 0 ? {
            '0-5ft': {
                sessions: sessions.filter(s => s.distance >= 0 && s.distance < 5),
                get makes() { return this.sessions.reduce((sum, s) => sum + s.makes, 0); },
                get attempts() { return this.sessions.reduce((sum, s) => sum + s.attempts, 0); },
                get percentage() { return this.attempts > 0 ? (this.makes / this.attempts * 100).toFixed(1) : 0; }
            },
            '5-10ft': {
                sessions: sessions.filter(s => s.distance >= 5 && s.distance < 10),
                get makes() { return this.sessions.reduce((sum, s) => sum + s.makes, 0); },
                get attempts() { return this.sessions.reduce((sum, s) => sum + s.attempts, 0); },
                get percentage() { return this.attempts > 0 ? (this.makes / this.attempts * 100).toFixed(1) : 0; }
            },
            '10-15ft': {
                sessions: sessions.filter(s => s.distance >= 10 && s.distance < 15),
                get makes() { return this.sessions.reduce((sum, s) => sum + s.makes, 0); },
                get attempts() { return this.sessions.reduce((sum, s) => sum + s.attempts, 0); },
                get percentage() { return this.attempts > 0 ? (this.makes / this.attempts * 100).toFixed(1) : 0; }
            },
            '15-20ft': {
                sessions: sessions.filter(s => s.distance >= 15 && s.distance < 20),
                get makes() { return this.sessions.reduce((sum, s) => sum + s.makes, 0); },
                get attempts() { return this.sessions.reduce((sum, s) => sum + s.attempts, 0); },
                get percentage() { return this.attempts > 0 ? (this.makes / this.attempts * 100).toFixed(1) : 0; }
            },
            '20-25ft': {
                sessions: sessions.filter(s => s.distance >= 20 && s.distance < 25),
                get makes() { return this.sessions.reduce((sum, s) => sum + s.makes, 0); },
                get attempts() { return this.sessions.reduce((sum, s) => sum + s.attempts, 0); },
                get percentage() { return this.attempts > 0 ? (this.makes / this.attempts * 100).toFixed(1) : 0; }
            },
            '25-30ft': {
                sessions: sessions.filter(s => s.distance >= 25 && s.distance < 30),
                get makes() { return this.sessions.reduce((sum, s) => sum + s.makes, 0); },
                get attempts() { return this.sessions.reduce((sum, s) => sum + s.attempts, 0); },
                get percentage() { return this.attempts > 0 ? (this.makes / this.attempts * 100).toFixed(1) : 0; }
            },
            '30-35ft': {
                sessions: sessions.filter(s => s.distance >= 30 && s.distance < 35),
                get makes() { return this.sessions.reduce((sum, s) => sum + s.makes, 0); },
                get attempts() { return this.sessions.reduce((sum, s) => sum + s.attempts, 0); },
                get percentage() { return this.attempts > 0 ? (this.makes / this.attempts * 100).toFixed(1) : 0; }
            },
            '35-40ft': {
                sessions: sessions.filter(s => s.distance >= 35 && s.distance < 40),
                get makes() { return this.sessions.reduce((sum, s) => sum + s.makes, 0); },
                get attempts() { return this.sessions.reduce((sum, s) => sum + s.attempts, 0); },
                get percentage() { return this.attempts > 0 ? (this.makes / this.attempts * 100).toFixed(1) : 0; }
            },
            '40-45ft': {
                sessions: sessions.filter(s => s.distance >= 40 && s.distance < 45),
                get makes() { return this.sessions.reduce((sum, s) => sum + s.makes, 0); },
                get attempts() { return this.sessions.reduce((sum, s) => sum + s.attempts, 0); },
                get percentage() { return this.attempts > 0 ? (this.makes / this.attempts * 100).toFixed(1) : 0; }
            },
            '45-50ft': {
                sessions: sessions.filter(s => s.distance >= 45 && s.distance < 50),
                get makes() { return this.sessions.reduce((sum, s) => sum + s.makes, 0); },
                get attempts() { return this.sessions.reduce((sum, s) => sum + s.attempts, 0); },
                get percentage() { return this.attempts > 0 ? (this.makes / this.attempts * 100).toFixed(1) : 0; }
            },
            '50-55ft': {
                sessions: sessions.filter(s => s.distance >= 50 && s.distance < 55),
                get makes() { return this.sessions.reduce((sum, s) => sum + s.makes, 0); },
                get attempts() { return this.sessions.reduce((sum, s) => sum + s.attempts, 0); },
                get percentage() { return this.attempts > 0 ? (this.makes / this.attempts * 100).toFixed(1) : 0; }
            },
            '55-60ft': {
                sessions: sessions.filter(s => s.distance >= 55 && s.distance < 60),
                get makes() { return this.sessions.reduce((sum, s) => sum + s.makes, 0); },
                get attempts() { return this.sessions.reduce((sum, s) => sum + s.attempts, 0); },
                get percentage() { return this.attempts > 0 ? (this.makes / this.attempts * 100).toFixed(1) : 0; }
            },
            '60ft+': {
                sessions: sessions.filter(s => s.distance >= 60),
                get makes() { return this.sessions.reduce((sum, s) => sum + s.makes, 0); },
                get attempts() { return this.sessions.reduce((sum, s) => sum + s.attempts, 0); },
                get percentage() { return this.attempts > 0 ? (this.makes / this.attempts * 100).toFixed(1) : 0; }
            }
        } : {}; // Empty object when no sessions
        
        return `
            <!-- Player Header -->
            <div class="stats-player-header">
                <div class="stats-player-pic">
                    ${player.profilePictureURL 
                        ? `<img src="${player.profilePictureURL}" alt="${player.displayName}">` 
                        : `<div class="stats-profile-placeholder">${(player.displayName || 'U')[0].toUpperCase()}</div>`
                    }
                </div>
                <div class="stats-player-info">
                    <h3>${player.displayName}</h3>
                    <p class="stats-player-meta">
                        ${player.gender ? `${player.gender === 'male' ? '♂️' : '♀️'} ` : ''}
                        Member since ${new Date(player.createdAt).toLocaleDateString()}
                    </p>
                </div>
            </div>
            
            <!-- Overall Stats Grid -->
            <div class="stats-grid-detailed">
                <div class="stat-card-detailed">
                    <div class="stat-icon">🎯</div>
                    <div class="stat-value">${player.totalPoints || 0}</div>
                    <div class="stat-label">Total Points</div>
                </div>
                <div class="stat-card-detailed">
                    <div class="stat-icon">📊</div>
                    <div class="stat-value">${player.totalSessions || 0}</div>
                    <div class="stat-label">Total Sessions</div>
                </div>
                <div class="stat-card-detailed">
                    <div class="stat-icon">📋</div>
                    <div class="stat-value">${player.totalRoutines || 0}</div>
                    <div class="stat-label">Total Routines</div>
                </div>
                <div class="stat-card-detailed">
                    <div class="stat-icon">🎮</div>
                    <div class="stat-value">${player.totalGames || 0}</div>
                    <div class="stat-label">Total Games</div>
                </div>
                <div class="stat-card-detailed">
                    <div class="stat-icon">🏅</div>
                    <div class="stat-value">${player.achievements ? player.achievements.length : 0}</div>
                    <div class="stat-label">Achievements</div>
                </div>
                <div class="stat-card-detailed">
                    <div class="stat-icon">🔥</div>
                    <div class="stat-value">${stats.currentStreak || 0}</div>
                    <div class="stat-label">Current Streak</div>
                </div>
            </div>
            
            <!-- Best Session (Moved to Top) -->
            ${stats.bestSession ? `
                <div class="stats-section">
                    <h3 class="stats-section-title">🌟 Best Session</h3>
                    <div class="best-session-card">
                        <div class="best-session-stats">
                            <span>${stats.bestSession.distance}ft</span>
                            <span>${stats.bestSession.makes}/${stats.bestSession.attempts}</span>
                            <span>${stats.bestSession.percentage.toFixed(1)}%</span>
                        </div>
                        <div class="best-session-points">${stats.bestSession.points} points</div>
                        <div class="best-session-date">${new Date(stats.bestSession.date).toLocaleDateString()}</div>
                    </div>
                </div>
            ` : ''}
            
            <!-- Performance Stats -->
            <div class="stats-section">
                <div class="section-header-with-action">
                    <h3 class="stats-section-title">📈 Performance</h3>
                    <button class="btn btn-secondary btn-small" id="sharePerformanceBtn">
                        📤 Share
                    </button>
                </div>
                <div class="stats-grid-detailed">
                    <div class="stat-card-detailed">
                        <div class="stat-icon">💯</div>
                        <div class="stat-value">${avgAccuracy}%</div>
                        <div class="stat-label">Avg Accuracy</div>
                    </div>
                    <div class="stat-card-detailed">
                        <div class="stat-icon">⭐</div>
                        <div class="stat-value">${bestAccuracy}%</div>
                        <div class="stat-label">Best Accuracy</div>
                    </div>
                    <div class="stat-card-detailed">
                        <div class="stat-icon">📏</div>
                        <div class="stat-value">${avgDistance}ft</div>
                        <div class="stat-label">Avg Distance</div>
                    </div>
                    <div class="stat-card-detailed">
                        <div class="stat-icon">🎪</div>
                        <div class="stat-value">${stats.totalMakes || 0}</div>
                        <div class="stat-label">Total Makes</div>
                    </div>
                    <div class="stat-card-detailed">
                        <div class="stat-icon">🎲</div>
                        <div class="stat-value">${stats.totalPutts || 0}</div>
                        <div class="stat-label">Total Attempts</div>
                    </div>
                    <div class="stat-card-detailed">
                        <div class="stat-icon">🏆</div>
                        <div class="stat-value">${stats.longestStreak || 0}</div>
                        <div class="stat-label">Longest Streak</div>
                    </div>
                </div>
            </div>
            
            <!-- Distance Breakdown (only show for own stats) -->
            ${sessions.length > 0 ? `
            <div class="stats-section">
                <h3 class="stats-section-title">📍 Distance Breakdown</h3>
                <div class="distance-breakdown">
                    ${Object.entries(distanceRanges).map(([range, data]) => {
                        const percentage = parseFloat(data.percentage);
                        return `
                        <div class="distance-bar-container">
                            <div class="distance-label">${range}</div>
                            <div class="distance-bar-bg">
                                <div class="distance-bar" style="width: ${percentage}%"></div>
                            </div>
                            <div class="distance-stats">
                                <span class="distance-percentage">${data.percentage}%</span>
                                <span class="distance-makes">${data.makes}/${data.attempts}</span>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            </div>
            ` : ''}
        `;
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
            case 'rotations':
                formHTML = `
                    <p class="form-description">Log each turn's results - enter makes out of attempts for each of the 10 turns</p>
                    
                    <div class="rotations-grid-detailed">
                        ${Array.from({ length: 10 }, (_, i) => `
                            <div class="turn-input-group">
                                <label class="turn-label">Turn ${i + 1}</label>
                                <div class="turn-inputs">
                                    <div class="turn-field">
                                        <label for="turn${i + 1}Makes">Makes</label>
                                        <input type="number" 
                                               id="turn${i + 1}Makes" 
                                               class="turn-makes-input"
                                               min="0" 
                                               max="100" 
                                               required 
                                               placeholder="0">
                                    </div>
                                    <span class="turn-separator">/</span>
                                    <div class="turn-field">
                                        <label for="turn${i + 1}Attempts">Attempts</label>
                                        <input type="number" 
                                               id="turn${i + 1}Attempts" 
                                               class="turn-attempts-input"
                                               min="1" 
                                               max="100" 
                                               value="10"
                                               required 
                                               placeholder="10">
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="form-group">
                        <label for="puttingDistance">Putting Distance (feet)</label>
                        <input type="number" id="puttingDistance" min="10" max="50" value="20" required>
                        <p class="form-hint">Goal: ${game.scoring.goal}</p>
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
                            <div class="form-group">
                                <label for="logGameForUser">Log Game For</label>
                                <select id="logGameForUser" class="form-input">
                                    <option value="${this.state.user?.id || ''}">Myself</option>
                                    ${this.state.leaderboard
                                        .filter(p => p.id !== (this.state.user?.id || ''))
                                        .map(p => `<option value="${p.id}">${p.displayName}</option>`)
                                        .join('')}
                                </select>
                            </div>
                            
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
        // Group routines by difficulty level
        const difficultyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
        
        let html = `
            <div class="card routines-panel">
                <h3>📋 Suggested Putting Routines</h3>
                <p style="margin-bottom: 1.5rem; color: #6b7280;">Choose a routine to structure your practice session</p>
        `;
        
        // Render each difficulty level
        difficultyLevels.forEach(level => {
            const routinesInLevel = SUGGESTED_ROUTINES.filter(r => r.level === level);
            
            if (routinesInLevel.length === 0) return;
            
            const isCollapsed = this.state.collapsedCategories[`routine-${level}`];
            
            html += `
                <div class="routine-difficulty-section ${isCollapsed ? 'collapsed' : ''}">
                    <h4 class="difficulty-title clickable" data-category="routine-${level}">
                        <span class="category-toggle">${isCollapsed ? '▶' : '▼'}</span>
                        ${level}
                        <span class="difficulty-count">${routinesInLevel.length} routine${routinesInLevel.length > 1 ? 's' : ''}</span>
                    </h4>
                    <div class="routines-grid" style="display: ${isCollapsed ? 'none' : 'grid'}">
                        ${routinesInLevel.map(routine => `
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
                                    <button class="btn btn-primary log-routine-btn" data-routine="${routine.id}">
                                        📊 Log Completion
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        html += `
            </div>
        `;
        
        return html;
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
                    <button class="btn btn-primary btn-small log-score-btn" data-game="${game.id}">
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
        
        // Leaderboard category tabs
        const leaderboardTabs = document.querySelectorAll('.leaderboard-tab');
        leaderboardTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.state.leaderboardCategory = e.target.dataset.category;
                this.render();
            });
        });
        
        // Gender filter toggles
        const genderToggles = document.querySelectorAll('.gender-toggle');
        genderToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                this.state.leaderboardGenderFilter = e.target.dataset.gender;
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
        
        // Bulk log button
        const bulkLogBtn = document.getElementById('bulkLogBtn');
        if (bulkLogBtn) {
            bulkLogBtn.addEventListener('click', () => {
                this.state.showBulkLogModal = true;
                this.render();
                
                // Attach modal event listeners after render
                setTimeout(() => {
                    this.attachBulkLogModalListeners();
                }, 100);
            });
        }
        
        // Delete session buttons
        const deleteSessionBtns = document.querySelectorAll('.btn-delete-session');
        deleteSessionBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const sessionId = e.target.dataset.sessionId;
                if (sessionId) {
                    await this.deleteSession(sessionId);
                }
            });
        });
        
        // Edit session buttons
        const editSessionBtns = document.querySelectorAll('.btn-edit-session');
        editSessionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const sessionId = e.target.dataset.sessionId;
                if (sessionId) {
                    this.editSession(sessionId);
                }
            });
        });
        
        // Delete routine buttons
        const deleteRoutineBtns = document.querySelectorAll('.btn-delete-routine');
        deleteRoutineBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const routineId = e.target.dataset.routineId;
                if (routineId) {
                    await this.deleteRoutine(routineId);
                }
            });
        });
        
        // Edit routine buttons
        const editRoutineBtns = document.querySelectorAll('.btn-edit-routine');
        editRoutineBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const routineId = e.target.dataset.routineId;
                if (routineId) {
                    this.editRoutine(routineId);
                }
            });
        });
        
        // Delete game buttons
        const deleteGameBtns = document.querySelectorAll('.btn-delete-game');
        deleteGameBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const gameId = e.target.dataset.gameId;
                if (gameId) {
                    await this.deleteGame(gameId);
                }
            });
        });
        
        // Edit game buttons
        const editGameBtns = document.querySelectorAll('.btn-edit-game');
        editGameBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const gameId = e.target.dataset.gameId;
                if (gameId) {
                    this.editGame(gameId);
                }
            });
        });
        
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
        
        // Header username click (open own profile)
        const headerUsername = document.getElementById('headerUsername');
        const headerProfile = document.querySelector('.header-user-profile');
        
        const openOwnProfile = () => {
            const currentUser = userManager.getCurrentUser();
            if (currentUser) {
                this.openProfileModal(currentUser.id);
            }
        };
        
        if (headerUsername) {
            headerUsername.addEventListener('click', openOwnProfile);
        }
        
        if (headerProfile) {
            headerProfile.addEventListener('click', openOwnProfile);
        }
        
        // Cancel session button
        const cancelSessionBtn = document.getElementById('cancelSessionBtn');
        if (cancelSessionBtn) {
            cancelSessionBtn.addEventListener('click', () => {
                this.state.showAddSession = false;
                this.state.editingSession = null;
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
        
        // Stats page search
        const searchPlayerBtn = document.getElementById('searchPlayerBtn');
        if (searchPlayerBtn) {
            searchPlayerBtn.addEventListener('click', () => this.handlePlayerSearch());
        }
        
        const playerSearchInput = document.getElementById('playerSearch');
        if (playerSearchInput) {
            playerSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handlePlayerSearch();
                }
            });
        }
        
        const viewMyStatsBtn = document.getElementById('viewMyStatsBtn');
        if (viewMyStatsBtn) {
            viewMyStatsBtn.addEventListener('click', () => {
                this.state.searchedPlayer = null;
                this.render();
            });
        }
        
        // Share Performance button
        const sharePerformanceBtn = document.getElementById('sharePerformanceBtn');
        if (sharePerformanceBtn) {
            sharePerformanceBtn.addEventListener('click', () => this.handleSharePerformance());
        }
        
        // Achievement and routine category toggles
        const categoryTitles = document.querySelectorAll('.category-title.clickable, .difficulty-title.clickable');
        categoryTitles.forEach(title => {
            title.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.state.collapsedCategories[category] = !this.state.collapsedCategories[category];
                this.render();
            });
        });
        
        // Edit routine form
        const editRoutineForm = document.getElementById('editRoutineForm');
        if (editRoutineForm) {
            editRoutineForm.addEventListener('submit', (e) => this.handleRoutineUpdate(e));
        }
        
        // Edit game form
        const editGameForm = document.getElementById('editGameForm');
        if (editGameForm) {
            editGameForm.addEventListener('submit', (e) => this.handleGameUpdate(e));
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
            this.showCustomAlert('Makes cannot be greater than attempts!', 'warning');
            return;
        }
        
        try {
            const isEditing = this.state.editingSession !== null;
            
            if (isEditing) {
                // Update existing session (always for current user)
                await userManager.updateSession(this.state.editingSession, {
                    distance,
                    makes,
                    attempts
                });
                this.showCustomAlert('Session updated successfully!', 'success');
            } else {
                // Check if logging for another user
                const logForUserSelect = document.getElementById('logForUser');
                const targetUserId = logForUserSelect ? logForUserSelect.value : userManager.getCurrentUser().id;
                const currentUser = userManager.getCurrentUser();
                
                if (targetUserId !== currentUser.id) {
                    // Logging for another user
                    await this.addSessionForUser(targetUserId, { distance, makes, attempts });
                    const targetUser = this.state.leaderboard.find(p => p.id === targetUserId);
                    this.showCustomAlert(`Session added for ${targetUser?.displayName || 'user'}!`, 'success');
                } else {
                    // Logging for self
                    await userManager.addSession({
                        distance,
                        makes,
                        attempts
                    });
                    this.showCustomAlert('Session added successfully!', 'success');
                }
            }
            
            // Reset form and hide
            this.state.showAddSession = false;
            this.state.editingSession = null;
            this.newSession = {
                date: new Date().toISOString().split('T')[0],
                distance: '10',
                makes: '',
                attempts: '',
                routineName: null
            };
            
            // Reload data
            await this.loadLeaderboard();
            await this.loadRecentPractice();
            
            // Check achievements and show splash (only for current user's sessions)
            const newAchievements = await achievementManager.checkAchievements();
            if (newAchievements && newAchievements.length > 0) {
                this.showAchievementSplash(newAchievements[0]);
            }
            
            // Re-render
            this.render();
            
        } catch (error) {
            console.error('Error saving session:', error);
            this.showCustomAlert('Failed to save session: ' + error.message, 'error');
        }
    }
    
    /**
     * Add session for another user
     */
    async addSessionForUser(userId, sessionData, requireApproval = false) {
        const { makes, attempts, distance } = sessionData;
        
        // Calculate points and percentage
        const { calculateSessionPoints } = await import('./utils/calculations.js');
        const { points, percentage } = calculateSessionPoints(makes, attempts, distance);
        
        // Create session object
        const session = {
            id: `session_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            distance,
            makes,
            attempts,
            percentage,
            points,
            loggedBy: userManager.getCurrentUser().id,
            loggedByName: userManager.getCurrentUser().displayName,
            pending: requireApproval // If true, requires user acceptance
        };
        
        // Save session for target user
        await storageManager.saveSession(userId, session);
        
        // Only update stats if not requiring approval
        if (!requireApproval) {
            const targetUser = await storageManager.getUser(userId);
            if (targetUser) {
                targetUser.totalPoints = (targetUser.totalPoints || 0) + points;
                targetUser.totalSessions = (targetUser.totalSessions || 0) + 1;
                targetUser.totalPutts = (targetUser.totalPutts || 0) + attempts;
                targetUser.totalMakes = (targetUser.totalMakes || 0) + makes;
                
                // Update best session if needed
                if (!targetUser.bestSession || points > (targetUser.bestSession.points || 0)) {
                    targetUser.bestSession = {
                        distance,
                        makes,
                        attempts,
                        percentage,
                        points,
                        date: session.date
                    };
                }
                
                // Update best accuracy
                if (!targetUser.bestAccuracy || percentage > targetUser.bestAccuracy) {
                    targetUser.bestAccuracy = percentage;
                }
                
                await storageManager.saveUser(targetUser);
            }
        }
        
        return session;
    }
    
    /**
     * Attach bulk log modal event listeners
     */
    attachBulkLogModalListeners() {
        // Close button
        const closeBtn = document.getElementById('closeBulkLogModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.state.showBulkLogModal = false;
                this.render();
            });
        }
        
        // Cancel button
        const cancelBtn = document.getElementById('cancelBulkLog');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.state.showBulkLogModal = false;
                this.render();
            });
        }
        
        // Checkbox toggle for enabling/disabling inputs
        const checkboxes = document.querySelectorAll('.bulk-player-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const playerId = e.target.dataset.playerId;
                const inputs = document.querySelectorAll(`.bulk-input[data-player-id="${playerId}"]`);
                inputs.forEach(input => {
                    input.disabled = !e.target.checked;
                    if (e.target.checked && !input.value) {
                        // Set default values when enabled
                        if (input.dataset.field === 'distance') input.value = '20';
                        if (input.dataset.field === 'attempts') input.value = '20';
                    }
                });
            });
        });
        
        // Form submit
        const form = document.getElementById('bulkLogForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleBulkLog();
            });
        }
        
        // Close on overlay click
        const overlay = document.getElementById('bulkLogModal');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.state.showBulkLogModal = false;
                    this.render();
                }
            });
        }
    }
    
    /**
     * Handle bulk log submission
     */
    async handleBulkLog() {
        try {
            const checkedBoxes = document.querySelectorAll('.bulk-player-checkbox:checked');
            
            if (checkedBoxes.length === 0) {
                this.showCustomAlert('Please select at least one player', 'warning');
                return;
            }
            
            const requireApproval = document.getElementById('requireApproval')?.checked || false;
            let successCount = 0;
            
            for (const checkbox of checkedBoxes) {
                const playerId = checkbox.dataset.playerId;
                
                // Get individual stats for this player
                const distance = parseInt(document.querySelector(`.bulk-input[data-player-id="${playerId}"][data-field="distance"]`).value);
                const makes = parseInt(document.querySelector(`.bulk-input[data-player-id="${playerId}"][data-field="makes"]`).value);
                const attempts = parseInt(document.querySelector(`.bulk-input[data-player-id="${playerId}"][data-field="attempts"]`).value);
                
                if (makes > attempts) {
                    this.showCustomAlert(`Invalid stats for ${checkbox.parentElement.querySelector('strong').textContent}: Makes cannot exceed attempts`, 'error');
                    continue;
                }
                
                // Log session for this player
                await this.addSessionForUser(playerId, { distance, makes, attempts }, requireApproval);
                successCount++;
            }
            
            // Close modal
            this.state.showBulkLogModal = false;
            
            // Reload data
            await this.loadLeaderboard();
            await this.loadRecentPractice();
            
            // Show success message
            this.showCustomAlert(`Successfully logged sessions for ${successCount} player${successCount > 1 ? 's' : ''}!`, 'success');
            
        } catch (error) {
            console.error('Error bulk logging:', error);
            this.showCustomAlert('Failed to bulk log sessions: ' + error.message, 'error');
        }
    }
    
    /**
     * Handle sharing performance stats
     */
    async handleSharePerformance() {
        const user = userManager.getCurrentUser();
        const stats = userManager.getStatistics();
        
        const avgAccuracy = stats.totalPutts > 0 
            ? Math.round((stats.totalMakes / stats.totalPutts) * 100) 
            : 0;
        
        const shareText = `🎯 My Putting Stats - ${user.displayName}
        
📊 Performance:
• Avg Accuracy: ${avgAccuracy}%
• Total Makes: ${stats.totalMakes}
• Total Attempts: ${stats.totalPutts}
• Best Session: ${stats.bestSession ? `${stats.bestSession.percentage.toFixed(1)}% at ${stats.bestSession.distance}ft` : 'N/A'}
• Longest Streak: ${stats.longestStreak || 0} days

🎯 Total Sessions: ${user.totalSessions || 0}
📋 Total Routines: ${user.totalRoutines || 0}
🎮 Total Games: ${user.totalGames || 0}
⭐ Points: ${user.totalPoints || 0}

#DiscGolf #PuttingPractice`;

        // Try to use Web Share API if available
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My Putting Stats',
                    text: shareText
                });
                this.showCustomAlert('Stats shared successfully!', 'success');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    // Fall back to clipboard
                    this.copyToClipboard(shareText);
                }
            }
        } else {
            // Fall back to clipboard
            this.copyToClipboard(shareText);
        }
    }
    
    /**
     * Copy text to clipboard
     */
    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showCustomAlert('Stats copied to clipboard!', 'success');
            }).catch(() => {
                this.showCustomAlert('Could not copy stats', 'error');
            });
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                this.showCustomAlert('Stats copied to clipboard!', 'success');
            } catch (err) {
                this.showCustomAlert('Could not copy stats', 'error');
            }
            document.body.removeChild(textarea);
        }
    }
    
    /**
     * Show achievement unlock splash screen
     */
    showAchievementSplash(achievementId) {
        const achievement = ACHIEVEMENTS_CONFIG.find(a => a.id === achievementId);
        if (!achievement) return;
        
        this.state.achievementSplash = {
            id: achievement.id,
            name: achievement.name,
            icon: achievement.icon,
            desc: achievement.desc,
            points: achievement.points
        };
        
        this.render();
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            this.state.achievementSplash = null;
            this.render();
        }, 4000);
    }
    
    /**
     * Show custom styled alert
     */
    showCustomAlert(message, type = 'info') {
        this.state.customAlert = { message, type };
        this.render();
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.state.customAlert = null;
            this.render();
        }, 3000);
    }
    
    /**
     * Load and calculate stats for another player
     */
    async loadOtherPlayerStats(playerId) {
        try {
            // Check if already loaded for this player
            if (this.state.otherPlayerStats && this.state.otherPlayerStats.playerId === playerId) {
                return;
            }
            
            // Fetch their sessions
            const sessions = await storageManager.getSessions(playerId);
            
            // Calculate stats from sessions
            const totalPutts = sessions.reduce((sum, s) => sum + s.attempts, 0);
            const totalMakes = sessions.reduce((sum, s) => sum + s.makes, 0);
            const accuracy = totalPutts > 0 ? ((totalMakes / totalPutts) * 100).toFixed(1) : 0;
            
            // Find best session
            let bestSession = null;
            if (sessions.length > 0) {
                bestSession = sessions.reduce((best, s) => 
                    !best || s.points > best.points ? s : best
                , null);
            }
            
            // Find best accuracy
            const bestAccuracy = sessions.length > 0 
                ? Math.max(...sessions.map(s => s.percentage)).toFixed(1) 
                : 0;
            
            // Calculate average distance
            const totalDistance = sessions.reduce((sum, s) => sum + (s.distance * s.attempts), 0);
            const avgDistance = totalPutts > 0 ? (totalDistance / totalPutts).toFixed(1) : 0;
            
            // Cache the calculated stats
            this.state.otherPlayerStats = {
                playerId: playerId,
                stats: {
                    totalPutts,
                    totalMakes,
                    accuracy,
                    bestSession,
                    bestAccuracy,
                    avgDistance,
                    currentStreak: 0, // Would need date-based calculation
                    longestStreak: 0  // Would need date-based calculation
                }
            };
            
            // Re-render with the new stats
            this.render();
            
        } catch (error) {
            console.error('Error loading other player stats:', error);
        }
    }
    
    /**
     * Handle player search
     */
    async handlePlayerSearch() {
        const searchInput = document.getElementById('playerSearch');
        if (!searchInput) return;
        
        const searchQuery = searchInput.value.trim().toLowerCase();
        if (!searchQuery) {
            this.showCustomAlert('Please enter a player name', 'warning');
            return;
        }
        
        // Search in leaderboard
        const player = this.state.leaderboard.find(p => 
            p.displayName && p.displayName.toLowerCase().includes(searchQuery)
        );
        
        if (player) {
            // Clear cached stats when searching for a new player
            if (this.state.searchedPlayer !== player.id) {
                this.state.otherPlayerStats = null;
            }
            this.state.searchedPlayer = player.id;
            this.render();
        } else {
            this.showCustomAlert(`No player found matching "${searchQuery}"`, 'info');
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
                    
                case 'rotations':
                    // Collect all 10 turn scores (makes and attempts)
                    const turns = [];
                    let totalMakes = 0;
                    let totalAttempts = 0;
                    
                    for (let i = 1; i <= 10; i++) {
                        const makes = parseInt(document.getElementById(`turn${i}Makes`).value);
                        const attempts = parseInt(document.getElementById(`turn${i}Attempts`).value);
                        
                        // Validate makes <= attempts
                        if (makes > attempts) {
                            alert(`Turn ${i}: Makes (${makes}) cannot be greater than Attempts (${attempts})`);
                            return;
                        }
                        
                        turns.push({
                            turn: i,
                            makes: makes,
                            attempts: attempts,
                            percentage: attempts > 0 ? (makes / attempts * 100) : 0
                        });
                        
                        totalMakes += makes;
                        totalAttempts += attempts;
                    }
                    
                    const distance = parseInt(document.getElementById('puttingDistance').value);
                    const overallPercentage = totalAttempts > 0 ? (totalMakes / totalAttempts * 100) : 0;
                    
                    scoreData = {
                        score: totalMakes,
                        totalMakes: totalMakes,
                        totalAttempts: totalAttempts,
                        percentage: overallPercentage,
                        distance: distance,
                        turns: turns,
                        targetScore: 70
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
            const completedGame = await gameTracker.completeGame(scoreData);
            
            // Check achievements and show splash
            const newAchievements = await achievementManager.checkAchievements();
            
            // Reload leaderboard and recent practice
            await this.loadLeaderboard();
            await this.loadRecentPractice();
            
            // Close modal
            this.closeGameScoreModal();
            
            // Re-render to show new data
            this.render();
            
            // Show achievement splash if any
            if (newAchievements && newAchievements.length > 0) {
                this.showAchievementSplash(newAchievements[0]);
            }
            
            // Show success with points
            alert(`✅ Score logged for ${game.name}!\n\n🎯 Points Earned: ${completedGame.points}${scoreData.won !== undefined ? (scoreData.won ? '\n🎉 You won!' : '\n Better luck next time!') : ''}`);
            
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
                            <div class="form-group">
                                <label for="logRoutineForUser">Log Routine For</label>
                                <select id="logRoutineForUser" class="form-input">
                                    <option value="${this.state.user?.id || ''}">Myself</option>
                                    ${this.state.leaderboard
                                        .filter(p => p.id !== (this.state.user?.id || ''))
                                        .map(p => `<option value="${p.id}">${p.displayName}</option>`)
                                        .join('')}
                                </select>
                            </div>
                            
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
     * Render bulk logging modal
     */
    renderBulkLogModal() {
        const availablePlayers = this.state.leaderboard.filter(p => 
            p.id !== userManager.getCurrentUser()?.id && !p.optOutSharedLogging
        );
        
        return `
            <div class="modal-overlay" id="bulkLogModal">
                <div class="modal bulk-log-modal">
                    <div class="modal-header">
                        <h3>📋 Bulk Log Sessions</h3>
                        <button type="button" class="close-modal-btn" id="closeBulkLogModal">✕</button>
                    </div>
                    <div class="modal-body">
                        <p class="modal-description">Log practice sessions for multiple players with individual stats</p>
                        
                        <form id="bulkLogForm">
                            <!-- Player List with Individual Stats -->
                            <div class="bulk-players-list">
                                ${availablePlayers.length > 0 ? availablePlayers.map(player => `
                                    <div class="bulk-player-card">
                                        <div class="bulk-player-header">
                                            <label class="checkbox-label">
                                                <input type="checkbox" 
                                                       class="bulk-player-checkbox" 
                                                       data-player-id="${player.id}"
                                                       value="${player.id}">
                                                <strong>${player.displayName}</strong>
                                            </label>
                                        </div>
                                        <div class="bulk-player-stats">
                                            <div class="form-group-inline">
                                                <label>Distance (ft)</label>
                                                <input type="number" 
                                                       class="bulk-input" 
                                                       data-player-id="${player.id}"
                                                       data-field="distance"
                                                       min="5" 
                                                       max="100" 
                                                       value="20"
                                                       disabled>
                                            </div>
                                            <div class="form-group-inline">
                                                <label>Makes</label>
                                                <input type="number" 
                                                       class="bulk-input" 
                                                       data-player-id="${player.id}"
                                                       data-field="makes"
                                                       min="0" 
                                                       max="100"
                                                       disabled>
                                            </div>
                                            <div class="form-group-inline">
                                                <label>Attempts</label>
                                                <input type="number" 
                                                       class="bulk-input" 
                                                       data-player-id="${player.id}"
                                                       data-field="attempts"
                                                       min="1" 
                                                       max="100" 
                                                       value="20"
                                                       disabled>
                                            </div>
                                        </div>
                                    </div>
                                `).join('') : '<p class="empty-state">No players available for bulk logging. Players can opt out in their profile settings.</p>'}
                            </div>
                            
                            ${availablePlayers.length > 0 ? `
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="requireApproval" checked>
                                    Require player approval before adding to stats
                                </label>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Log for All Selected</button>
                                <button type="button" class="btn btn-secondary" id="cancelBulkLog">Cancel</button>
                            </div>
                            ` : `
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" id="cancelBulkLog">Close</button>
                            </div>
                            `}
                        </form>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render permissions modal
     */
    renderPermissionsModal() {
        const currentUser = userManager.getCurrentUser();
        
        return `
            <div class="modal-overlay" id="permissionsModal">
                <div class="modal permissions-modal">
                    <div class="modal-header">
                        <h3>🔐 Logging Permissions</h3>
                        <button type="button" class="close-modal-btn" id="closePermissionsModal">✕</button>
                    </div>
                    <div class="modal-body">
                        <p class="modal-description">Manage who can log practice sessions on your behalf</p>
                        
                        <!-- Pending Requests -->
                        <div class="permissions-section">
                            <h4>Pending Approvals</h4>
                            ${this.state.permissionRequests && this.state.permissionRequests.length > 0 ? `
                                <div class="permission-list">
                                    ${this.state.permissionRequests.map(req => `
                                        <div class="permission-item">
                                            <div class="permission-info">
                                                <span class="permission-name">${req.fromName}</span>
                                                <span class="permission-detail">${req.activityType} logged ${req.date}</span>
                                            </div>
                                            <div class="permission-actions">
                                                <button class="btn btn-success btn-small" data-request-id="${req.id}">
                                                    ✓ Approve
                                                </button>
                                                <button class="btn btn-danger btn-small" data-request-id="${req.id}">
                                                    ✕ Deny
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p class="empty-state">No pending approvals</p>'}
                        </div>
                        
                        <!-- Logging History -->
                        <div class="permissions-section">
                            <h4>Recent Logging Activity</h4>
                            <p class="section-hint">Sessions logged by others on your behalf</p>
                            <div class="logging-history">
                                <p class="empty-state">View this in Recent Practice section</p>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" id="closePermissions">Close</button>
                        </div>
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
            
            // Calculate points for routine
            const routinePoints = calculateRoutinePoints(drills);
            
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
                points: routinePoints,
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
                
                // Increment totalRoutines counter and add points
                user.totalRoutines = (user.totalRoutines || 0) + 1;
                user.totalPoints = (user.totalPoints || 0) + routinePoints;
                await storageManager.saveUser(user);
            }
            
            // Check achievements and show splash
            const newAchievements = await achievementManager.checkAchievements();
            
            // Reload leaderboard and recent practice
            await this.loadLeaderboard();
            await this.loadRecentPractice();
            
            // Close modal
            this.closeRoutineCompletionModal();
            
            // Re-render to show new data
            this.render();
            
            // Show achievement splash if any
            if (newAchievements && newAchievements.length > 0) {
                this.showAchievementSplash(newAchievements[0]);
            }
            
            // Show success with points
            alert(`✅ Routine completion logged!\n\n${routine.name}\nOverall: ${totalMakes}/${totalAttempts} (${Math.round(overallPercentage)}%)\nDuration: ${duration} minutes\n\n🎯 Points Earned: ${routinePoints}`);
            
        } catch (error) {
            console.error('Error logging routine completion:', error);
            alert('Failed to log routine completion: ' + error.message);
        }
    }
    
    /**
     * Render profile modal
     */
    renderProfileModal() {
        const user = this.state.selectedUserProfile;
        if (!user) return '';
        
        const currentUser = userManager.getCurrentUser();
        const isOwnProfile = currentUser && (user.id === currentUser.id);
        
        // Format birthday
        const birthday = user.birthday ? new Date(user.birthday).toLocaleDateString() : 'Not set';
        
        return `
            <div class="modal-overlay" id="profileModal">
                <div class="modal profile-modal">
                    <div class="modal-header">
                        <h3>👤 Player Profile</h3>
                        <button type="button" class="close-modal-btn" id="closeProfileModal">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="profile-content">
                            <!-- Profile Picture -->
                            <div class="profile-picture-section">
                                <div class="profile-picture">
                                    ${user.profilePictureURL 
                                        ? `<img src="${user.profilePictureURL}" alt="${user.displayName}">` 
                                        : `<div class="profile-placeholder">${(user.displayName || 'U')[0].toUpperCase()}</div>`
                                    }
                                </div>
                                ${isOwnProfile ? '<button class="btn btn-secondary btn-small" id="changeProfilePicBtn">Change Photo</button>' : ''}
                            </div>
                            
                            <!-- Profile Info -->
                            <div class="profile-info-section">
                                <div class="profile-field">
                                    <label>Display Name</label>
                                    ${isOwnProfile 
                                        ? `<input type="text" id="profileDisplayName" value="${user.displayName || ''}" class="profile-input">`
                                        : `<div class="profile-value">${user.displayName || 'Unknown'}</div>`
                                    }
                                </div>
                                
                                <div class="profile-field">
                                    <label>Gender</label>
                                    ${isOwnProfile 
                                        ? `<select id="profileGender" class="profile-input">
                                            <option value="male" ${user.gender === 'male' ? 'selected' : ''}>Male</option>
                                            <option value="female" ${user.gender === 'female' ? 'selected' : ''}>Female</option>
                                           </select>`
                                        : `<div class="profile-value">${user.gender === 'male' ? '♂️ Male' : '♀️ Female'}</div>`
                                    }
                                </div>
                                
                                <div class="profile-field">
                                    <label>Birthday</label>
                                    ${isOwnProfile 
                                        ? `<input type="date" id="profileBirthday" value="${user.birthday || ''}" class="profile-input">`
                                        : `<div class="profile-value">${birthday}</div>`
                                    }
                                </div>
                                
                                <div class="profile-field">
                                    <label>Favorite Putter</label>
                                    ${isOwnProfile 
                                        ? `<input type="text" id="profilePutter" value="${user.favoritePutter || ''}" placeholder="e.g., Aviar, Luna, Berg" class="profile-input">`
                                        : `<div class="profile-value">${user.favoritePutter || 'Not set'}</div>`
                                    }
                                </div>
                                
                                <div class="profile-field">
                                    <label>Favorite Midrange</label>
                                    ${isOwnProfile 
                                        ? `<input type="text" id="profileMidrange" value="${user.favoriteMidrange || ''}" placeholder="e.g., Buzzz, Roc, Mako3" class="profile-input">`
                                        : `<div class="profile-value">${user.favoriteMidrange || 'Not set'}</div>`
                                    }
                                </div>
                                
                                <div class="profile-field">
                                    <label>Favorite Driver</label>
                                    ${isOwnProfile 
                                        ? `<input type="text" id="profileDriver" value="${user.favoriteDriver || ''}" placeholder="e.g., Destroyer, Teebird, Wraith" class="profile-input">`
                                        : `<div class="profile-value">${user.favoriteDriver || 'Not set'}</div>`
                                    }
                                </div>
                                
                                ${isOwnProfile ? `
                                    <div class="profile-field">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="profileHideFromLeaderboard" ${user.hideFromLeaderboard ? 'checked' : ''} class="profile-checkbox">
                                            <span>Hide me from leaderboard</span>
                                        </label>
                                        <p class="profile-hint">When checked, you won't appear on the public leaderboard</p>
                                    </div>
                                    
                                    <div class="profile-field">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="profileOptOutSharedLogging" ${user.optOutSharedLogging ? 'checked' : ''} class="profile-checkbox">
                                            <span>Opt out of shared logging</span>
                                        </label>
                                        <p class="profile-hint">When checked, others cannot log sessions on your behalf</p>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <!-- Personal Goals Section -->
                            ${isOwnProfile ? `
                            <div class="profile-disc-section">
                                <h4>🎯 Personal Goals</h4>
                                <p class="profile-hint">Set your practice targets</p>
                                
                                <div class="goal-item">
                                    <label>Weekly Putts Goal</label>
                                    <input type="number" id="goalPutts" value="${user.goals?.putts || 0}" min="0" max="10000" class="profile-input">
                                    <div class="goal-progress-bar">
                                        <div class="goal-progress-fill" style="width: ${user.goals?.putts ? Math.min((user.weeklyPutts || 0) / user.goals.putts * 100, 100) : 0}%"></div>
                                    </div>
                                    <div class="goal-progress-text">${user.weeklyPutts || 0} / ${user.goals?.putts || 0}</div>
                                </div>
                                
                                <div class="goal-item">
                                    <label>Weekly Sessions Goal</label>
                                    <input type="number" id="goalSessions" value="${user.goals?.sessions || 0}" min="0" max="100" class="profile-input">
                                    <div class="goal-progress-bar">
                                        <div class="goal-progress-fill" style="width: ${user.goals?.sessions ? Math.min((user.weeklySessions || 0) / user.goals.sessions * 100, 100) : 0}%"></div>
                                    </div>
                                    <div class="goal-progress-text">${user.weeklySessions || 0} / ${user.goals?.sessions || 0}</div>
                                </div>
                                
                                <div class="goal-item">
                                    <label>Weekly Routines Goal</label>
                                    <input type="number" id="goalRoutines" value="${user.goals?.routines || 0}" min="0" max="50" class="profile-input">
                                    <div class="goal-progress-bar">
                                        <div class="goal-progress-fill" style="width: ${user.goals?.routines ? Math.min((user.weeklyRoutines || 0) / user.goals.routines * 100, 100) : 0}%"></div>
                                    </div>
                                    <div class="goal-progress-text">${user.weeklyRoutines || 0} / ${user.goals?.routines || 0}</div>
                                </div>
                                
                                <div class="goal-item">
                                    <label>Weekly Games Goal</label>
                                    <input type="number" id="goalGames" value="${user.goals?.games || 0}" min="0" max="50" class="profile-input">
                                    <div class="goal-progress-bar">
                                        <div class="goal-progress-fill" style="width: ${user.goals?.games ? Math.min((user.weeklyGames || 0) / user.goals.games * 100, 100) : 0}%"></div>
                                    </div>
                                    <div class="goal-progress-text">${user.weeklyGames || 0} / ${user.goals?.games || 0}</div>
                                </div>
                            </div>
                            ` : ''}
                            
                            <!-- Stats Section -->
                            <div class="profile-stats-section">
                                <h4>📊 Stats</h4>
                                <div class="profile-stats-grid">
                                    <div class="profile-stat">
                                        <div class="profile-stat-value">${user.totalPoints || 0}</div>
                                        <div class="profile-stat-label">Points</div>
                                    </div>
                                    <div class="profile-stat">
                                        <div class="profile-stat-value">${user.totalSessions || 0}</div>
                                        <div class="profile-stat-label">Sessions</div>
                                    </div>
                                    <div class="profile-stat">
                                        <div class="profile-stat-value">${user.totalRoutines || 0}</div>
                                        <div class="profile-stat-label">Routines</div>
                                    </div>
                                    <div class="profile-stat">
                                        <div class="profile-stat-value">${user.totalGames || 0}</div>
                                        <div class="profile-stat-label">Games</div>
                                    </div>
                                </div>
                                <div class="profile-member-since">
                                    Member since: ${new Date(user.createdAt || Date.now()).toLocaleDateString()}
                                </div>
                            </div>
                            
                            ${isOwnProfile ? `
                                <div class="profile-actions">
                                    <button type="button" class="btn btn-primary" id="saveProfileBtn">💾 Save Changes</button>
                                    <button type="button" class="btn btn-secondary" id="cancelProfileBtn">Cancel</button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render edit routine modal
     */
    renderEditRoutineModal() {
        const routine = this.state.recentRoutines.find(r => r.id === this.state.editingRoutine);
        if (!routine) return '';
        
        return `
            <div class="modal-overlay" id="editRoutineModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>✏️ Edit Routine: ${routine.routineName}</h3>
                        <button type="button" class="close-modal-btn" onclick="app.closeEditRoutineModal()">✕</button>
                    </div>
                    <div class="modal-body">
                        <form id="editRoutineForm">
                            <div class="form-group">
                                <label for="editRoutineDuration">Duration (minutes)</label>
                                <input type="number" id="editRoutineDuration" min="1" max="180" value="${routine.duration}" required>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Update Routine</button>
                                <button type="button" class="btn btn-secondary" onclick="app.closeEditRoutineModal()">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render edit game modal
     */
    renderEditGameModal() {
        const game = this.state.recentGames.find(g => g.id === this.state.editingGame);
        if (!game) return '';
        
        return `
            <div class="modal-overlay" id="editGameModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>✏️ Edit Game: ${game.gameName}</h3>
                        <button type="button" class="close-modal-btn" onclick="app.closeEditGameModal()">✕</button>
                    </div>
                    <div class="modal-body">
                        <form id="editGameForm">
                            <div class="form-group">
                                <label for="editGameScore">Score</label>
                                <input type="number" id="editGameScore" min="0" max="1000" value="${game.score}" required>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Update Game</button>
                                <button type="button" class="btn btn-secondary" onclick="app.closeEditGameModal()">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Close edit routine modal
     */
    closeEditRoutineModal() {
        this.state.showEditRoutineModal = false;
        this.state.editingRoutine = null;
        this.render();
    }
    
    /**
     * Close edit game modal
     */
    closeEditGameModal() {
        this.state.showEditGameModal = false;
        this.state.editingGame = null;
        this.render();
    }
    
    /**
     * Handle routine update
     */
    async handleRoutineUpdate(e) {
        e.preventDefault();
        
        try {
            const routine = this.state.recentRoutines.find(r => r.id === this.state.editingRoutine);
            if (!routine) return;
            
            const newDuration = parseInt(document.getElementById('editRoutineDuration').value);
            const oldPoints = routine.points || 0;
            
            // Update routine
            routine.duration = newDuration;
            
            const user = userManager.getCurrentUser();
            await storageManager.updateRoutineCompletion(user.id, this.state.editingRoutine, {
                duration: newDuration
            });
            
            // Reload data
            await this.loadRecentPractice();
            await this.loadLeaderboard();
            
            this.closeEditRoutineModal();
            this.showCustomAlert('Routine updated successfully!', 'success');
            
        } catch (error) {
            console.error('Error updating routine:', error);
            this.showCustomAlert('Failed to update routine: ' + error.message, 'error');
        }
    }
    
    /**
     * Handle game update
     */
    async handleGameUpdate(e) {
        e.preventDefault();
        
        try {
            const game = this.state.recentGames.find(g => g.id === this.state.editingGame);
            if (!game) return;
            
            const newScore = parseInt(document.getElementById('editGameScore').value);
            const oldPoints = game.points || 0;
            
            // Recalculate points with new score
            const { calculateGamePoints } = await import('./utils/calculations.js');
            const gameDefinition = PUTTING_GAMES.find(g => g.name === game.gameName);
            const newPoints = calculateGamePoints(gameDefinition, { score: newScore });
            
            const pointsDiff = newPoints - oldPoints;
            
            // Update game
            game.score = newScore;
            game.points = newPoints;
            
            const user = userManager.getCurrentUser();
            await storageManager.updateGameCompletion(user.id, this.state.editingGame, {
                score: newScore,
                points: newPoints
            });
            
            // Update user points
            user.totalPoints = (user.totalPoints || 0) + pointsDiff;
            await storageManager.saveUser(user);
            
            // Reload data
            await this.loadRecentPractice();
            await this.loadLeaderboard();
            
            this.closeEditGameModal();
            this.showCustomAlert('Game updated successfully!', 'success');
            
        } catch (error) {
            console.error('Error updating game:', error);
            this.showCustomAlert('Failed to update game: ' + error.message, 'error');
        }
    }
    
    /**
     * Open profile modal
     */
    async openProfileModal(userId) {
        try {
            // Fetch user data
            const user = await storageManager.getUser(userId);
            if (!user) {
                alert('User not found');
                return;
            }
            
            this.state.selectedUserProfile = user;
            this.state.showProfileModal = true;
            this.render();
            
            // Attach event listeners after render
            setTimeout(() => {
                const closeBtn = document.getElementById('closeProfileModal');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => this.closeProfileModal());
                }
                
                const cancelBtn = document.getElementById('cancelProfileBtn');
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => this.closeProfileModal());
                }
                
                const saveBtn = document.getElementById('saveProfileBtn');
                if (saveBtn) {
                    saveBtn.addEventListener('click', () => this.handleProfileSave());
                }
                
                const changePhotoBtn = document.getElementById('changeProfilePicBtn');
                if (changePhotoBtn) {
                    changePhotoBtn.addEventListener('click', () => this.handleProfilePictureChange());
                }
                
                // Close on overlay click
                const overlay = document.getElementById('profileModal');
                if (overlay) {
                    overlay.addEventListener('click', (e) => {
                        if (e.target === overlay) {
                            this.closeProfileModal();
                        }
                    });
                }
            }, 100);
        } catch (error) {
            console.error('Error opening profile:', error);
            alert('Failed to load profile');
        }
    }
    
    /**
     * Close profile modal
     */
    closeProfileModal() {
        this.state.showProfileModal = false;
        this.state.selectedUserProfile = null;
        this.render();
    }
    
    /**
     * Handle profile save
     */
    async handleProfileSave() {
        try {
            const user = this.state.selectedUserProfile;
            
            // Update user data
            user.displayName = document.getElementById('profileDisplayName').value;
            user.gender = document.getElementById('profileGender').value;
            user.birthday = document.getElementById('profileBirthday').value;
            user.favoritePutter = document.getElementById('profilePutter').value;
            user.favoriteMidrange = document.getElementById('profileMidrange').value;
            user.favoriteDriver = document.getElementById('profileDriver').value;
            user.hideFromLeaderboard = document.getElementById('profileHideFromLeaderboard').checked;
            user.optOutSharedLogging = document.getElementById('profileOptOutSharedLogging')?.checked || false;
            
            // Update goals
            user.goals = {
                putts: parseInt(document.getElementById('goalPutts')?.value || 0),
                sessions: parseInt(document.getElementById('goalSessions')?.value || 0),
                routines: parseInt(document.getElementById('goalRoutines')?.value || 0),
                games: parseInt(document.getElementById('goalGames')?.value || 0)
            };
            
            // Save to database
            await storageManager.saveUser(user);
            
            // Update current user if it's own profile
            const currentUser = userManager.getCurrentUser();
            if (currentUser && user.id === currentUser.id) {
                Object.assign(currentUser, user);
            }
            
            // Reload leaderboard to reflect changes
            await this.loadLeaderboard();
            
            this.showCustomAlert('Profile updated successfully!', 'success');
            this.closeProfileModal();
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showCustomAlert('Failed to save profile: ' + error.message, 'error');
        }
    }
    
    /**
     * Handle profile picture change
     */
    async handleProfilePictureChange() {
        const url = prompt('Enter image URL for your profile picture:');
        if (url) {
            this.state.selectedUserProfile.profilePictureURL = url;
            this.render();
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
