/**
 * Routine Builder UI Component
 * Allows users to create, edit, and share custom putting routines
 */

import { storageManager } from '../modules/storage.js';
import { userManager } from '../modules/user.js';

export class RoutineBuilder {
    constructor() {
        this.drills = [];
        this.currentRoutine = null;
        this.editMode = false;
    }

    render() {
        const title = this.editMode ? 'Edit Routine' : 'Create Routine';
        const submitText = this.editMode ? 'Update Routine' : 'Save Routine';
        const submitIcon = this.editMode ? '✏️' : '✅';

        return `
            <div class="rb-overlay" id="routineBuilderModal">
                <div class="rb-panel">
                    <div class="rb-header">
                        <div class="rb-header-left">
                            <span class="rb-header-icon">📋</span>
                            <div>
                                <div class="rb-header-title">${title}</div>
                                <div class="rb-header-sub">Custom Routine</div>
                            </div>
                        </div>
                        <button class="rb-close-btn" id="closeRoutineBuilder" type="button">✕</button>
                    </div>
                    <div class="rb-body">
                        <form id="routineBuilderForm">
                            <div class="rb-field-group">
                                <label class="rb-label">Routine Name <span class="rb-required">*</span></label>
                                <input class="rb-input" type="text" id="routineName" required
                                       placeholder="My Custom Routine" maxlength="50"
                                       value="${this.currentRoutine?.name || ''}">
                            </div>
                            <div class="rb-field-group">
                                <label class="rb-label">Description <span class="rb-required">*</span></label>
                                <textarea class="rb-input rb-textarea" id="routineDescription" rows="2" required
                                          placeholder="What's this routine for?" maxlength="200">${this.currentRoutine?.description || ''}</textarea>
                            </div>
                            <div class="rb-field-group">
                                <label class="rb-label">Difficulty Level <span class="rb-required">*</span></label>
                                <div class="rb-level-grid">
                                    ${['Beginner','Intermediate','Advanced','Expert'].map(lvl => `
                                        <label class="rb-level-chip ${(this.currentRoutine?.level || 'Beginner') === lvl ? 'selected' : ''}">
                                            <input type="radio" name="routineLevel" value="${lvl}"
                                                   ${(this.currentRoutine?.level || 'Beginner') === lvl ? 'checked' : ''}>
                                            ${lvl}
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="rb-drills-section">
                                <div class="rb-drills-header">
                                    <div>
                                        <div class="rb-drills-title">Drills</div>
                                        <div class="rb-drills-hint">Add at least 2 drills</div>
                                    </div>
                                    <div class="rb-summary-pills">
                                        <span class="rb-summary-pill">⏱️ <span id="estimatedDuration">0</span> mins</span>
                                        <span class="rb-summary-pill">🎯 <span id="totalPutts">0</span> putts</span>
                                    </div>
                                </div>
                                <div id="drillsList" class="rb-drills-list"></div>
                                <button type="button" class="rb-add-drill-btn" id="addDrillBtn">+ Add Drill</button>
                            </div>
                            <div class="rb-field-group">
                                <label class="rb-toggle-row">
                                    <div class="rb-toggle-text">
                                        <span class="rb-toggle-title">🌎 Share with Community</span>
                                        <span class="rb-toggle-sub">Others can find and use your routine</span>
                                    </div>
                                    <div class="rb-toggle-wrap">
                                        <input type="checkbox" id="sharePublic" class="rb-toggle-input"
                                               ${this.currentRoutine?.isPublic ? 'checked' : ''}>
                                        <span class="rb-toggle-thumb"></span>
                                    </div>
                                </label>
                            </div>
                            <div id="tagsSection" class="rb-field-group"
                                 style="display: ${this.currentRoutine?.isPublic ? 'block' : 'none'};">
                                <label class="rb-label">Tags <span class="rb-hint-inline">(comma-separated)</span></label>
                                <input class="rb-input" type="text" id="routineTags"
                                       placeholder="consistency, 20ft, warm-up"
                                       value="${this.currentRoutine?.tags?.join(', ') || ''}">
                            </div>
                            <div class="rb-actions">
                                <button type="button" class="rb-btn-cancel" id="cancelRoutineBuilder">Cancel</button>
                                <button type="submit" class="rb-btn-save">${submitIcon} ${submitText}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    renderDrill(index, drill = null) {
        const distance = drill?.distance || 20;
        const attempts = drill?.attempts || 20;
        const description = drill?.description || '';
        const zone = distance <= 33 ? { label: 'C1', color: '#10b981' } : { label: 'C2', color: '#f59e0b' };
        return `
            <div class="rb-drill-card" data-drill-index="${index}">
                <div class="rb-drill-top">
                    <span class="rb-drill-num">${index + 1}</span>
                    <span class="rb-drill-zone" style="background:${zone.color}22;color:${zone.color};border:1px solid ${zone.color}44">${zone.label}</span>
                    <button type="button" class="rb-drill-delete delete-drill-btn" data-index="${index}" title="Remove drill">✕</button>
                </div>
                <div class="rb-drill-fields">
                    <div class="rb-drill-field">
                        <label class="rb-drill-label">Distance (ft)</label>
                        <input type="number" class="rb-input rb-drill-distance" min="5" max="100" value="${distance}" required>
                    </div>
                    <div class="rb-drill-field">
                        <label class="rb-drill-label">Attempts</label>
                        <input type="number" class="rb-input rb-drill-attempts" min="1" max="200" value="${attempts}" required>
                    </div>
                    <div class="rb-drill-field rb-drill-notes">
                        <label class="rb-drill-label">Notes</label>
                        <input type="text" class="rb-input rb-drill-description" value="${description}"
                               placeholder="Warm up, focus on form…" maxlength="100">
                    </div>
                </div>
            </div>
        `;
    }

    initEventListeners() {
        document.getElementById('addDrillBtn')?.addEventListener('click', () => this.addDrill());
        document.getElementById('sharePublic')?.addEventListener('change', (e) => {
            const tagsSection = document.getElementById('tagsSection');
            if (tagsSection) tagsSection.style.display = e.target.checked ? 'block' : 'none';
        });
        document.getElementById('routineBuilderForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveRoutine();
        });
        document.getElementById('drillsList')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.delete-drill-btn');
            if (btn) this.deleteDrill(parseInt(btn.dataset.index));
        });
        document.getElementById('drillsList')?.addEventListener('input', () => { this.updateSummary(); this.updateZones(); });
        document.getElementById('closeRoutineBuilder')?.addEventListener('click', () => this.close());
        document.getElementById('cancelRoutineBuilder')?.addEventListener('click', () => this.close());
        document.getElementById('routineBuilderModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'routineBuilderModal') this.close();
        });
        document.querySelectorAll('.rb-level-chip input').forEach(radio => {
            radio.addEventListener('change', () => {
                document.querySelectorAll('.rb-level-chip').forEach(c => c.classList.remove('selected'));
                radio.closest('.rb-level-chip').classList.add('selected');
            });
        });
    }

    updateZones() {
        document.querySelectorAll('.rb-drill-card').forEach(card => {
            const dist = parseInt(card.querySelector('.rb-drill-distance')?.value || 20);
            const zone = dist <= 33 ? { label: 'C1', color: '#10b981' } : { label: 'C2', color: '#f59e0b' };
            const chip = card.querySelector('.rb-drill-zone');
            if (chip) {
                chip.textContent = zone.label;
                chip.style.background = `${zone.color}22`;
                chip.style.color = zone.color;
                chip.style.borderColor = `${zone.color}44`;
            }
        });
    }

    addDrill(drill = null) {
        const drillsList = document.getElementById('drillsList');
        if (!drillsList) return;
        const index = this.drills.length;
        this.drills.push(drill || { distance: 20, attempts: 20, description: '' });
        drillsList.insertAdjacentHTML('beforeend', this.renderDrill(index, drill));
        this.updateSummary();
    }

    deleteDrill(index) {
        if (this.drills.length <= 1) { alert('You must have at least 1 drill in your routine'); return; }
        this.drills.splice(index, 1);
        this.renderDrillsList();
        this.updateSummary();
    }

    renderDrillsList() {
        const drillsList = document.getElementById('drillsList');
        if (!drillsList) return;
        drillsList.innerHTML = this.drills.map((drill, index) => this.renderDrill(index, drill)).join('');
    }

    updateSummary() {
        let totalPutts = 0, estimatedMinutes = 0;
        document.querySelectorAll('.rb-drill-card').forEach(el => {
            const attempts = parseInt(el.querySelector('.rb-drill-attempts')?.value || 0);
            totalPutts += attempts;
            estimatedMinutes += (attempts * 15) / 60 + 0.5;
        });
        const durationEl = document.getElementById('estimatedDuration');
        const puttsEl = document.getElementById('totalPutts');
        if (durationEl) durationEl.textContent = Math.round(estimatedMinutes);
        if (puttsEl) puttsEl.textContent = totalPutts;
    }

    validateRoutine(drills, routineData) {
        if (!routineData.name?.trim()) throw new Error('Please enter a routine name');
        if (!routineData.description?.trim()) throw new Error('Please enter a description');
        if (drills.length < 1) throw new Error('Please add at least 1 drill');
        drills.forEach((drill, i) => {
            if (!drill.distance || drill.distance < 5 || drill.distance > 100)
                throw new Error(`Drill ${i + 1}: Distance must be between 5 and 100 feet`);
            if (!drill.attempts || drill.attempts < 1 || drill.attempts > 200)
                throw new Error(`Drill ${i + 1}: Attempts must be between 1 and 200`);
        });
        return true;
    }

    async saveRoutine() {
        try {
            const drills = [];
            document.querySelectorAll('.rb-drill-card').forEach(el => {
                drills.push({
                    distance: parseInt(el.querySelector('.rb-drill-distance').value),
                    attempts: parseInt(el.querySelector('.rb-drill-attempts').value),
                    description: el.querySelector('.rb-drill-description').value.trim()
                });
            });
            const selectedLevel = document.querySelector('input[name="routineLevel"]:checked')?.value || 'Beginner';
            const routineData = {
                name: document.getElementById('routineName').value.trim(),
                description: document.getElementById('routineDescription').value.trim(),
                level: selectedLevel,
                drills,
                isPublic: document.getElementById('sharePublic').checked,
                tags: [],
                estimatedDuration: document.getElementById('estimatedDuration').textContent + ' mins'
            };
            if (this.editMode && this.currentRoutine?.id) routineData.id = this.currentRoutine.id;
            this.validateRoutine(drills, routineData);
            if (routineData.isPublic) {
                const tagsInput = document.getElementById('routineTags').value;
                routineData.tags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
            }
            const user = userManager.getCurrentUser();
            if (!user) throw new Error('You must be logged in to save routines');
            const saved = await storageManager.saveCustomRoutine(user.id, routineData);
            this.close();
            alert(`Routine "${saved.name}" ${this.editMode ? 'updated' : 'created'} successfully!`);
            window.dispatchEvent(new CustomEvent('routinesSaved'));
        } catch (error) {
            console.error('Error saving routine:', error);
            alert(error.message || 'Failed to save routine. Please try again.');
        }
    }

    open() {
        this.editMode = false; this.currentRoutine = null; this.drills = [];
        document.body.insertAdjacentHTML('beforeend', this.render());
        this.addDrill(); this.addDrill();
        this.initEventListeners();
    }

    openEdit(routine) {
        this.editMode = true; this.currentRoutine = routine; this.drills = [];
        document.body.insertAdjacentHTML('beforeend', this.render());
        this.drills = [];
        routine.drills.forEach(drill => this.addDrill(drill));
        this.initEventListeners();
        this.updateSummary();
    }

    close() {
        document.getElementById('routineBuilderModal')?.remove();
        this.drills = []; this.currentRoutine = null; this.editMode = false;
    }
}

export const routineBuilder = new RoutineBuilder();
