/**
 * Game Score Logging UI Components
 * Renders forms and modals for logging game scores
 */

import { PUTTING_GAMES } from '../config/constants.js';
import { gameTracker } from '../modules/gameTracker.js';

/**
 * Render game score logging modal
 * @param {string} gameId - Game ID
 * @returns {string} HTML for modal
 */
export function renderGameScoreModal(gameId) {
    const game = PUTTING_GAMES.find(g => g.id === gameId);
    if (!game) return '';

    const scoringForms = {
        time: renderTimeScoreForm(game),
        strokes: renderStrokesScoreForm(game),
        points: renderPointsScoreForm(game),
        distance: renderDistanceScoreForm(game),
        streak: renderStreakScoreForm(game),
        elimination: renderEliminationScoreForm(game),
        rotations: renderRotationsScoreForm(game)
    };

    return `
        <div class="modal-overlay" id="gameScoreModal">
            <div class="modal game-score-modal">
                <div class="modal-header">
                    <h3>📊 Log Score: ${game.name}</h3>
                    <button class="close-modal-btn" id="closeGameScoreModal">✕</button>
                </div>
                <div class="modal-body">
                    ${scoringForms[game.scoring.type] || '<p>Score logging not available for this game type.</p>'}
                </div>
            </div>
        </div>
    `;
}

function renderTimeScoreForm(game) {
    return `
        <form id="gameScoreForm" class="game-score-form">
            <div class="form-group">
                <label for="gameTime">Completion Time (minutes)</label>
                <input type="number" id="gameTime" min="1" max="120" step="0.5" required>
                <p class="form-hint">Goal: ${game.scoring.goal}</p>
            </div>
            
            <div class="form-group">
                <label for="gameNotes">Notes (optional)</label>
                <textarea id="gameNotes" rows="3" placeholder="How did it go? Any observations?"></textarea>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Save Score</button>
                <button type="button" class="btn btn-secondary" id="cancelGameScore">Cancel</button>
            </div>
        </form>
    `;
}

function renderStrokesScoreForm(game) {
    return `
        <form id="gameScoreForm" class="game-score-form">
            <div class="form-group">
                <label for="gameStrokes">Total Strokes</label>
                <input type="number" id="gameStrokes" min="1" max="100" required>
                <p class="form-hint">Goal: ${game.scoring.goal}</p>
            </div>
            
            <div class="form-group">
                <label for="gameNotes">Notes (optional)</label>
                <textarea id="gameNotes" rows="3" placeholder="Which holes were tough? What went well?"></textarea>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Save Score</button>
                <button type="button" class="btn btn-secondary" id="cancelGameScore">Cancel</button>
            </div>
        </form>
    `;
}

function renderPointsScoreForm(game) {
    return `
        <form id="gameScoreForm" class="game-score-form">
            <div class="form-group">
                <label for="gamePoints">Points Scored</label>
                <input type="number" id="gamePoints" min="0" max="500" required>
                <p class="form-hint">Goal: ${game.scoring.goal}</p>
            </div>
            
            <div class="form-group">
                <label for="totalPutts">Total Putts Attempted</label>
                <input type="number" id="totalPutts" min="1" max="200">
            </div>
            
            <div class="form-group">
                <label for="gameNotes">Notes (optional)</label>
                <textarea id="gameNotes" rows="3" placeholder="Best streak? Favorite distances?"></textarea>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Save Score</button>
                <button type="button" class="btn btn-secondary" id="cancelGameScore">Cancel</button>
            </div>
        </form>
    `;
}

function renderDistanceScoreForm(game) {
    return `
        <form id="gameScoreForm" class="game-score-form">
            <div class="form-group">
                <label for="maxDistance">Maximum Distance Reached (feet)</label>
                <input type="number" id="maxDistance" min="10" max="100" step="5" required>
                <p class="form-hint">Goal: ${game.scoring.goal}</p>
            </div>
            
            <div class="form-group">
                <label for="totalRounds">Total Rounds Attempted</label>
                <input type="number" id="totalRounds" min="1" max="20">
            </div>
            
            <div class="form-group">
                <label for="gameNotes">Notes (optional)</label>
                <textarea id="gameNotes" rows="3" placeholder="Where did you struggle? What felt good?"></textarea>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Save Score</button>
                <button type="button" class="btn btn-secondary" id="cancelGameScore">Cancel</button>
            </div>
        </form>
    `;
}

function renderStreakScoreForm(game) {
    return `
        <form id="gameScoreForm" class="game-score-form">
            <div class="form-group">
                <label for="bestStreak">Best Streak Achieved</label>
                <input type="number" id="bestStreak" min="0" max="50" required>
                <p class="form-hint">Goal: ${game.scoring.goal}</p>
            </div>
            
            <div class="form-group">
                <label for="totalAttempts">Total Attempts to Achieve</label>
                <input type="number" id="totalAttempts" min="10" max="200">
            </div>
            
            <div class="form-group">
                <label for="gameNotes">Notes (optional)</label>
                <textarea id="gameNotes" rows="3" placeholder="What broke your streak? Observations?"></textarea>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Save Score</button>
                <button type="button" class="btn btn-secondary" id="cancelGameScore">Cancel</button>
            </div>
        </form>
    `;
}

function renderEliminationScoreForm(game) {
    return `
        <form id="gameScoreForm" class="game-score-form">
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
            
            <div class="form-group">
                <label for="gameNotes">Notes (optional)</label>
                <textarea id="gameNotes" rows="3" placeholder="Best shots? Close calls?"></textarea>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Save Result</button>
                <button type="button" class="btn btn-secondary" id="cancelGameScore">Cancel</button>
            </div>
        </form>
    `;
}

function renderRotationsScoreForm(game) {
    return `
        <form id="gameScoreForm" class="game-score-form">
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
            
            <div class="form-group">
                <label for="gameNotes">Notes (optional)</label>
                <textarea id="gameNotes" rows="3" placeholder="Which turns went well? Any observations?"></textarea>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Save Score</button>
                <button type="button" class="btn btn-secondary" id="cancelGameScore">Cancel</button>
            </div>
        </form>
    `;
}

/**
 * Render game history/stats
 * @param {string} gameId - Game ID
 * @param {Object} stats - Game statistics
 * @returns {string} HTML for stats display
 */
export function renderGameStats(gameId, stats) {
    if (!stats || stats.timesPlayed === 0) {
        return '<p class="empty-state">No games played yet. Play this game and log your score!</p>';
    }

    return `
        <div class="game-stats-display">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.timesPlayed}</div>
                    <div class="stat-label">Times Played</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.successRate}%</div>
                    <div class="stat-label">Success Rate</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.bestScore || 'N/A'}</div>
                    <div class="stat-label">Best Score</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.goalsAchieved}</div>
                    <div class="stat-label">Goals Achieved</div>
                </div>
            </div>
        </div>
    `;
}
