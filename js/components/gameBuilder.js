/**
 * Game Builder UI Component
 * Allows users to create and edit custom putting games
 */

import { storageManager } from '../modules/storage.js';
import { userManager } from '../modules/user.js';

export class GameBuilder {
    constructor() {
        this.currentGame = null;
        this.editMode = false;
    }

    render() {
        const title = this.editMode ? 'Edit Game' : 'Create Game';
        const submitText = this.editMode ? 'Update Game' : 'Save Game';
        const submitIcon = this.editMode ? '✏️' : '🎮';

        const g = this.currentGame;
        const scoringTypes = [
            { value: 'points',      label: '🏆 Points',      sub: 'Highest score wins' },
            { value: 'strokes',     label: '⛳ Strokes',     sub: 'Lowest score wins' },
            { value: 'time',        label: '⏱️ Time',        sub: 'Fastest completion wins' },
            { value: 'percentage',  label: '📊 Percentage',  sub: 'Highest % wins' },
            { value: 'distance',    label: '📏 Distance',    sub: 'Longest putt wins' },
            { value: 'streak',      label: '🔥 Streak',      sub: 'Longest consecutive makes' },
            { value: 'elimination', label: '❌ Elimination', sub: 'Last player standing' },
        ];

        return `
            <div class="rb-overlay" id="gameBuilderModal">
                <div class="rb-panel">
                    <div class="rb-header">
                        <div class="rb-header-left">
                            <span class="rb-header-icon">🎮</span>
                            <div>
                                <div class="rb-header-title">${title}</div>
                                <div class="rb-header-sub">Custom Game</div>
                            </div>
                        </div>
                        <button class="rb-close-btn" id="closeGameBuilder" type="button">✕</button>
                    </div>
                    <div class="rb-body">
                        <form id="gameBuilderForm">

                            <div class="rb-field-group">
                                <label class="rb-label">Game Name <span class="rb-required">*</span></label>
                                <input class="rb-input" type="text" id="gameName" required
                                       placeholder="My Custom Game" maxlength="50"
                                       value="${g?.name || ''}">
                            </div>

                            <div class="rb-field-group">
                                <label class="rb-label">Description <span class="rb-required">*</span></label>
                                <textarea class="rb-input rb-textarea" id="gameDescription" rows="2" required
                                          placeholder="How is this game played?" maxlength="200">${g?.description || ''}</textarea>
                            </div>

                            <div class="rb-two-col">
                                <div class="rb-field-group">
                                    <label class="rb-label">Difficulty <span class="rb-required">*</span></label>
                                    <div class="rb-diff-grid">
                                        ${['Easy','Medium','Hard'].map(d => `
                                            <label class="rb-level-chip ${(g?.difficulty || 'Easy') === d ? 'selected' : ''}">
                                                <input type="radio" name="gameLevel" value="${d}"
                                                       ${(g?.difficulty || 'Easy') === d ? 'checked' : ''}>
                                                ${d}
                                            </label>
                                        `).join('')}
                                    </div>
                                </div>
                                <div class="rb-field-group">
                                    <label class="rb-label">Duration <span class="rb-required">*</span></label>
                                    <select class="rb-input" id="gameDuration" required>
                                        ${['5-10 mins','10-15 mins','15-20 mins','20-30 mins','30+ mins'].map(d => `
                                            <option value="${d}" ${g?.duration === d ? 'selected' : ''}>${d}</option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>

                            <div class="rb-field-group">
                                <label class="rb-label">Scoring Type <span class="rb-required">*</span></label>
                                <div class="rb-scoring-grid">
                                    ${scoringTypes.map(st => `
                                        <label class="rb-scoring-chip ${(g?.scoring?.type || 'points') === st.value ? 'selected' : ''}">
                                            <input type="radio" name="scoringType" value="${st.value}"
                                                   ${(g?.scoring?.type || 'points') === st.value ? 'checked' : ''}>
                                            <span class="rb-scoring-label">${st.label}</span>
                                            <span class="rb-scoring-sub">${st.sub}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>

                            <div class="rb-field-group">
                                <label class="rb-label">Goal Description <span class="rb-required">*</span></label>
                                <input class="rb-input" type="text" id="gameGoal" required
                                       placeholder="e.g., Score 100 points in 15 minutes" maxlength="100"
                                       value="${g?.scoring?.goal || ''}">
                            </div>

                            <div class="rb-field-group">
                                <label class="rb-label">Instructions <span class="rb-required">*</span>
                                    <span class="rb-hint-inline">— one per line</span>
                                </label>
                                <textarea class="rb-input rb-textarea rb-instructions" id="gameInstructions" rows="5" required
                                          placeholder="1. Set up at 20 feet&#10;2. Each make = 10 points&#10;3. Play for 15 minutes&#10;4. Record your highest score"
                                          maxlength="500">${g?.instructions?.join('\n') || ''}</textarea>
                            </div>

                            <div class="rb-two-col">
                                <div class="rb-field-group">
                                    <label class="rb-label">Min Players <span class="rb-required">*</span></label>
                                    <input class="rb-input" type="number" id="minPlayers" min="1" max="8" required
                                           value="${g?.minPlayers || 1}">
                                </div>
                                <div class="rb-field-group">
                                    <label class="rb-label">Max Players <span class="rb-required">*</span></label>
                                    <input class="rb-input" type="number" id="maxPlayers" min="1" max="8" required
                                           value="${g?.maxPlayers || 4}">
                                </div>
                            </div>

                            <div class="rb-field-group">
                                <label class="rb-toggle-row">
                                    <div class="rb-toggle-text">
                                        <span class="rb-toggle-title">🌎 Share Publicly</span>
                                        <span class="rb-toggle-sub">Other players can discover and play your game</span>
                                    </div>
                                    <div class="rb-toggle-wrap">
                                        <input type="checkbox" id="gameIsPublic" class="rb-toggle-input"
                                               ${g?.isPublic ? 'checked' : ''}>
                                        <span class="rb-toggle-thumb"></span>
                                    </div>
                                </label>
                            </div>

                            <div class="rb-actions">
                                <button type="button" class="rb-btn-cancel" id="cancelGameBuilder">Cancel</button>
                                <button type="submit" class="rb-btn-save">${submitIcon} ${submitText}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    openCreate() {
        this.editMode = false;
        this.currentGame = null;
    }

    async openEdit(gameId) {
        this.editMode = true;
        const user = userManager.getCurrentUser();
        this.currentGame = await storageManager.getCustomGame(user.id, gameId);
    }

    async handleSubmit(formData) {
        try {
            const user = userManager.getCurrentUser();
            if (!user) throw new Error('Must be logged in');

            const instructions = formData.instructions
                .split('\n').map(l => l.trim()).filter(l => l.length > 0);

            const gameData = {
                name: formData.name,
                description: formData.description,
                difficulty: formData.difficulty,
                duration: formData.duration,
                minPlayers: parseInt(formData.minPlayers),
                maxPlayers: parseInt(formData.maxPlayers),
                instructions,
                scoring: { type: formData.scoringType, goal: formData.goal },
                isPublic: formData.isPublic || false,
                createdBy: user.id,
                createdByName: user.displayName,
                createdAt: new Date().toISOString(),
                timesPlayed: this.currentGame?.timesPlayed || 0,
                averageRating: this.currentGame?.averageRating || 0,
                favorites: this.currentGame?.favorites || 0
            };

            if (this.editMode && this.currentGame) {
                await storageManager.updateCustomGame(user.id, this.currentGame.id, gameData);
                return { success: true, message: 'Game updated successfully!' };
            } else {
                await storageManager.saveCustomGame(user.id, gameData);
                return { success: true, message: 'Game created successfully!' };
            }
        } catch (error) {
            console.error('Error saving custom game:', error);
            return { success: false, message: error.message };
        }
    }

    validate(formData) {
        const errors = [];
        if (!formData.name || formData.name.trim().length < 3)
            errors.push('Game name must be at least 3 characters');
        if (!formData.description || formData.description.trim().length < 10)
            errors.push('Description must be at least 10 characters');
        if (!formData.instructions || formData.instructions.trim().length < 20)
            errors.push('Instructions must be at least 20 characters');
        const min = parseInt(formData.minPlayers);
        const max = parseInt(formData.maxPlayers);
        if (min < 1 || min > 8) errors.push('Min players must be between 1 and 8');
        if (max < 1 || max > 8) errors.push('Max players must be between 1 and 8');
        if (min > max) errors.push('Min players cannot be greater than max players');
        return errors;
    }
}

export const gameBuilder = new GameBuilder();
