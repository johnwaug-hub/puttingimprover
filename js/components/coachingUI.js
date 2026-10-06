/**
 * Coaching UI Component
 * Renders the enhanced Work On card and coaching dashboard modal
 */

import { coachingEngine, SKILL_BENCHMARKS, TIER_CONFIG, TRACKED_DISTANCES } from '../modules/coachingEngine.js';

class CoachingUI {
    constructor() {
        this.profile = null;
        this.activeTab = 'overview';
        this.loading = false;
    }

    /**
     * Initialize and load coaching data
     */
    async init() {
        this.loading = true;
        this.profile = await coachingEngine.generateCoachingProfile();
        this.loading = false;
        return this.profile;
    }

    /**
     * Refresh coaching data
     */
    async refresh() {
        coachingEngine.clearCache();
        return await this.init();
    }

    /**
     * Render the enhanced Work On card for the dashboard
     */
    renderWorkOnCard() {
        if (this.loading) {
            return `
                <div class="card work-on-card coaching-compact" id="workOnCard">
                    <span class="coaching-icon">🎯</span>
                    <span class="coaching-title">Coaching</span>
                    <span class="coaching-info">Analyzing...</span>
                </div>
            `;
        }

        if (!this.profile || !this.profile.hasEnoughData) {
            const needed = this.profile?.activitiesNeeded || 3;
            const logged = this.profile?.activitiesLogged || 0;

            return `
                <div class="card work-on-card coaching-compact" id="workOnCard">
                    <span class="coaching-icon">🎯</span>
                    <span class="coaching-title">Coaching</span>
                    <span class="coaching-info">Log ${needed - logged} more to unlock</span>
                    <span class="coaching-progress">${logged}/${needed}</span>
                </div>
            `;
        }

        const { focusAreas, overallTier, distanceProfile } = this.profile;
        const primaryFocus = focusAreas[0];
        
        // Get focus stats
        let focusInfo = '';
        if (primaryFocus && distanceProfile.byDistance[primaryFocus.distance]) {
            const stats = distanceProfile.byDistance[primaryFocus.distance];
            const trendText = stats.trend && stats.trend !== 0 
                ? `<span class="${stats.trend > 0 ? 'trend-up' : 'trend-down'}">${stats.trend > 0 ? '↑' : '↓'}${Math.abs(stats.trend)}%</span>` 
                : '';
            focusInfo = `${primaryFocus.distance}ft @ ${stats.accuracy || '—'}% ${trendText}`;
        } else {
            focusInfo = 'Tap for insights';
        }

        return `
            <div class="card work-on-card coaching-compact coaching-clickable" id="workOnCard" onclick="window.app.showCoachingModal()">
                <span class="coaching-icon">🎯</span>
                <span class="coaching-title">Coaching</span>
                <span class="coaching-divider">|</span>
                <span class="coaching-info">${focusInfo}</span>
                <span class="tier-badge-small ${overallTier.tier}">${overallTier.icon}</span>
                <span class="coaching-arrow">→</span>
            </div>
        `;
    }

    /**
     * Get consistency CSS class
     */
    getConsistencyClass(score) {
        if (score >= 85) return 'excellent';
        if (score >= 70) return 'good';
        if (score >= 50) return 'fair';
        return 'poor';
    }

    /**
     * Render the full coaching modal
     */
    renderCoachingModal() {
        if (!this.profile || !this.profile.hasEnoughData) {
            return `
                <div class="modal-overlay" id="coachingModalOverlay">
                    <div class="modal coaching-modal">
                        <div class="modal-header">
                            <h2>🎯 Coaching Dashboard</h2>
                            <button class="modal-close" id="closeCoachingModal">&times;</button>
                        </div>
                        <div class="coaching-not-enough-data">
                            <div class="icon">📊</div>
                            <h3>Not Enough Data</h3>
                            <p>Log more practice sessions to unlock your coaching dashboard</p>
                        </div>
                    </div>
                </div>
            `;
        }

        const { overallTier, weeklyProgress, streakInfo } = this.profile;

        return `
            <div class="modal-overlay" id="coachingModalOverlay">
                <div class="modal coaching-modal">
                    <div class="coaching-header">
                        <h2>🎯 Coaching Dashboard</h2>
                        <div class="coaching-tier-display">
                            <span class="coaching-tier-label">Overall Level</span>
                            <span class="coaching-tier-value">${overallTier.icon} ${overallTier.label}</span>
                        </div>
                    </div>

                    <div class="coaching-tabs">
                        <button class="coaching-tab ${this.activeTab === 'overview' ? 'active' : ''}" data-tab="overview">
                            📊 Overview
                        </button>
                        <button class="coaching-tab ${this.activeTab === 'distances' ? 'active' : ''}" data-tab="distances">
                            📏 Distances
                        </button>
                        <button class="coaching-tab ${this.activeTab === 'community' ? 'active' : ''}" data-tab="community">
                            👥 Community
                        </button>
                        <button class="coaching-tab ${this.activeTab === 'trends' ? 'active' : ''}" data-tab="trends">
                            📈 Trends
                        </button>
                        <button class="coaching-tab ${this.activeTab === 'benchmarks' ? 'active' : ''}" data-tab="benchmarks">
                            🏆 Benchmarks
                        </button>
                        <button class="coaching-tab ${this.activeTab === 'time' ? 'active' : ''}" data-tab="time">
                            ⏰ Time
                        </button>
                    </div>

                    <div class="modal-body">
                        <div class="coaching-tab-content">
                            ${this.renderTabContent()}
                        </div>
                    </div>

                    <button class="modal-close" id="closeCoachingModal" style="position: absolute; top: 1rem; right: 1rem; background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 1.25rem;">&times;</button>
                </div>
            </div>
        `;
    }

    /**
     * Render tab content based on active tab
     */
    renderTabContent() {
        switch (this.activeTab) {
            case 'overview':
                return this.renderOverviewTab();
            case 'distances':
                return this.renderDistancesTab();
            case 'community':
                return this.renderCommunityTab();
            case 'trends':
                return this.renderTrendsTab();
            case 'benchmarks':
                return this.renderBenchmarksTab();
            case 'time':
                return this.renderTimeTab();
            default:
                return this.renderOverviewTab();
        }
    }

    /**
     * Render Overview tab
     */
    renderOverviewTab() {
        const { weeklyProgress, streakInfo, consistencyScore, recommendations, drillPrescription, neglectAlerts } = this.profile;

        return `
            <!-- Weekly Progress -->
            <div class="weekly-progress-card">
                <div class="weekly-progress-header">
                    <h4>📅 This Week</h4>
                    <span style="font-size: 0.8rem; color: var(--text-muted)">${weeklyProgress.daysRemaining} days left</span>
                </div>
                <div class="weekly-progress-stats">
                    <div class="weekly-stat">
                        <div class="weekly-stat-value">${weeklyProgress.sessions}</div>
                        <div class="weekly-stat-label">Sessions</div>
                    </div>
                    <div class="weekly-stat">
                        <div class="weekly-stat-value">${weeklyProgress.daysPracticed}</div>
                        <div class="weekly-stat-label">Days</div>
                    </div>
                    <div class="weekly-stat">
                        <div class="weekly-stat-value">${weeklyProgress.totalPutts}</div>
                        <div class="weekly-stat-label">Putts</div>
                    </div>
                    <div class="weekly-stat">
                        <div class="weekly-stat-value">${weeklyProgress.accuracy || '—'}%</div>
                        <div class="weekly-stat-label">Accuracy</div>
                    </div>
                </div>
            </div>

            <!-- Key Stats -->
            <div class="overview-grid">
                <div class="overview-stat">
                    <div class="overview-stat-icon">🔥</div>
                    <div class="overview-stat-value">${streakInfo.current}</div>
                    <div class="overview-stat-label">Day Streak</div>
                </div>
                <div class="overview-stat">
                    <div class="overview-stat-icon">📊</div>
                    <div class="overview-stat-value">${consistencyScore.score || '—'}</div>
                    <div class="overview-stat-label">Consistency</div>
                </div>
                <div class="overview-stat">
                    <div class="overview-stat-icon">⚠️</div>
                    <div class="overview-stat-value">${neglectAlerts.length}</div>
                    <div class="overview-stat-label">Alerts</div>
                </div>
                <div class="overview-stat">
                    <div class="overview-stat-icon">🏆</div>
                    <div class="overview-stat-value">${streakInfo.longest}</div>
                    <div class="overview-stat-label">Best Streak</div>
                </div>
            </div>

            <!-- Recommendations -->
            <div class="recommendations-section">
                <h3>💡 Recommendations</h3>
                ${recommendations.slice(0, 4).map(rec => `
                    <div class="recommendation-card priority-${rec.priority}">
                        <span class="rec-icon">${rec.icon}</span>
                        <div class="rec-body">
                            <div class="rec-title">${rec.title}</div>
                            <p class="rec-desc">${rec.desc}</p>
                            ${rec.actionable ? `
                                <div class="rec-action">
                                    <button class="rec-action-btn" ${rec.distance ? `data-distance="${rec.distance}"` : ''}>
                                        ${rec.action}
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Drill Prescription -->
            ${drillPrescription ? `
                <div class="drill-prescription-card">
                    <div class="drill-header">
                        <h4>${drillPrescription.icon} ${drillPrescription.name}</h4>
                        <span class="drill-duration">⏱️ ${drillPrescription.duration}</span>
                    </div>
                    <p class="drill-desc">${drillPrescription.desc}</p>
                    <ol class="drill-steps">
                        ${drillPrescription.steps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                    <button class="drill-start-btn">Start This Drill</button>
                </div>
            ` : ''}
        `;
    }

    /**
     * Render Distances tab
     */
    renderDistancesTab() {
        const { distanceProfile, skillTiers, neglectAlerts } = this.profile;
        const byDistance = distanceProfile.byDistance;

        // Find weakest and strongest
        let weakest = null, strongest = null, weakestAcc = 100, strongestAcc = 0;
        Object.entries(byDistance).forEach(([dist, stats]) => {
            if (stats.accuracy !== null && stats.sessionCount >= 2) {
                if (stats.accuracy < weakestAcc) { weakestAcc = stats.accuracy; weakest = dist; }
                if (stats.accuracy > strongestAcc) { strongestAcc = stats.accuracy; strongest = dist; }
            }
        });

        // Check for neglected distances
        const neglectedDists = new Set(neglectAlerts.filter(a => a.severity === 'high').map(a => String(a.distance)));

        return `
            <h3 style="margin-bottom: 1rem;">📏 Accuracy by Distance</h3>
            <div class="distance-profile-grid">
                ${TRACKED_DISTANCES.map(dist => {
                    const stats = byDistance[dist];
                    const tier = skillTiers[dist];
                    const isWeakest = String(dist) === weakest;
                    const isStrongest = String(dist) === strongest;
                    const isNeglected = neglectedDists.has(String(dist));

                    let rowClass = '';
                    if (isNeglected) rowClass = 'neglected';
                    else if (isWeakest) rowClass = 'weakest';
                    else if (isStrongest) rowClass = 'strongest';

                    return `
                        <div class="distance-row ${rowClass}">
                            <div class="distance-value">${dist}ft</div>
                            <div class="distance-bar-wrapper">
                                <div class="distance-bar-fill ${tier?.tier || 'beginner'}" 
                                     style="width: ${stats.accuracy || 0}%"></div>
                            </div>
                            <div class="distance-accuracy">
                                ${stats.accuracy !== null ? `${stats.accuracy}%` : '—'}
                            </div>
                            <div class="distance-meta">
                                ${stats.trend !== 0 && stats.trend !== null ? `
                                    <span class="distance-trend ${stats.trend > 0 ? 'up' : 'down'}">
                                        ${stats.trend > 0 ? '↑' : '↓'} ${Math.abs(stats.trend)}%
                                    </span>
                                ` : ''}
                                <span>${stats.sessionCount} sessions</span>
                                ${stats.daysSinceLastPractice !== null ? `
                                    <span>${stats.daysSinceLastPractice}d ago</span>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- Distance Groups Summary -->
            <h3 style="margin: 1.5rem 0 1rem;">📊 By Range</h3>
            <div class="distance-profile-grid">
                ${Object.entries(distanceProfile.byGroup).map(([key, group]) => `
                    <div class="distance-row">
                        <div class="distance-value" style="font-size: 0.85rem;">${group.icon}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 0.9rem;">${group.label}</div>
                            <div class="distance-bar-wrapper" style="margin-top: 0.25rem;">
                                <div class="distance-bar-fill intermediate" style="width: ${group.accuracy || 0}%"></div>
                            </div>
                        </div>
                        <div class="distance-accuracy">${group.accuracy !== null ? `${group.accuracy}%` : '—'}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render Community Comparison tab
     */
    renderCommunityTab() {
        const { communityComparison, distanceProfile } = this.profile;

        if (!communityComparison || !communityComparison.available) {
            return `
                <div class="coaching-not-enough-data">
                    <div class="icon">👥</div>
                    <h3>Community Data Loading</h3>
                    <p>${communityComparison?.message || 'Comparing your stats to the community...'}</p>
                </div>
            `;
        }

        const { byDistance, summary, insights } = communityComparison;

        return `
            <!-- Community Stats Header -->
            <div class="community-header-card">
                <div class="community-stat">
                    <span class="community-stat-value">${communityComparison.totalUsersCompared}</span>
                    <span class="community-stat-label">Players Compared</span>
                </div>
                <div class="community-stat">
                    <span class="community-stat-value">${summary.aboveAverage}</span>
                    <span class="community-stat-label">Above Avg</span>
                </div>
                <div class="community-stat">
                    <span class="community-stat-value">${summary.belowAverage}</span>
                    <span class="community-stat-label">Below Avg</span>
                </div>
                <div class="community-stat">
                    <span class="community-stat-value">${summary.topPercentiles.length}</span>
                    <span class="community-stat-label">Top 25%</span>
                </div>
            </div>

            <!-- Insights -->
            ${insights && insights.length > 0 ? `
                <div class="community-insights">
                    ${insights.map(insight => `
                        <div class="recommendation-card" style="border-left: 3px solid ${insight.type === 'strength' ? '#4CAF50' : insight.type === 'opportunity' ? 'var(--accent-color)' : '#2196F3'};">
                            <span class="rec-icon">${insight.icon}</span>
                            <div class="rec-body">
                                <p class="rec-desc">${insight.message}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <!-- Comparison Grid -->
            <h3 style="margin: 1.5rem 0 1rem;">📊 Your Rank by Distance</h3>
            <div class="distance-profile-grid">
                ${TRACKED_DISTANCES.map(dist => {
                    const comparison = byDistance[dist];
                    const userStats = distanceProfile.byDistance[dist];
                    
                    if (!comparison || !comparison.available) {
                        return `
                            <div class="distance-row">
                                <div class="distance-value">${dist}ft</div>
                                <div style="flex: 1; color: var(--text-muted);">Not enough data</div>
                                <div class="distance-accuracy">—</div>
                            </div>
                        `;
                    }

                    const percentileClass = comparison.percentileRank >= 75 ? 'top-performer' : 
                                           comparison.percentileRank >= 50 ? 'above-avg' : 
                                           comparison.percentileRank >= 25 ? 'below-avg' : 'needs-work';

                    return `
                        <div class="distance-row community-row ${percentileClass}">
                            <div class="distance-value">${dist}ft</div>
                            <div class="community-comparison-bar">
                                <div class="comparison-bar-container">
                                    <div class="comparison-avg-marker" style="left: ${comparison.communityAvg}%" title="Community Avg: ${comparison.communityAvg}%"></div>
                                    <div class="comparison-user-marker" style="left: ${Math.min(comparison.userAccuracy, 100)}%" title="You: ${comparison.userAccuracy}%"></div>
                                    <div class="comparison-bar-fill" style="width: ${comparison.userAccuracy}%"></div>
                                </div>
                                <div class="comparison-labels">
                                    <span class="you-label ${comparison.isAboveAverage ? 'above' : 'below'}">
                                        You: ${comparison.userAccuracy}%
                                        <span class="diff">(${comparison.diff >= 0 ? '+' : ''}${comparison.diff}%)</span>
                                    </span>
                                    <span class="avg-label">Avg: ${comparison.communityAvg}%</span>
                                </div>
                            </div>
                            <div class="percentile-badge ${percentileClass}">
                                ${comparison.percentileRank !== null ? `Top ${100 - comparison.percentileRank}%` : '—'}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- Percentile Legend -->
            <div class="percentile-legend">
                <div class="legend-item">
                    <div class="legend-dot top-performer"></div>
                    <span>Top 25%</span>
                </div>
                <div class="legend-item">
                    <div class="legend-dot above-avg"></div>
                    <span>Above Avg</span>
                </div>
                <div class="legend-item">
                    <div class="legend-dot below-avg"></div>
                    <span>Below Avg</span>
                </div>
                <div class="legend-item">
                    <div class="legend-dot needs-work"></div>
                    <span>Bottom 25%</span>
                </div>
            </div>
        `;
    }

    /**
     * Render Trends tab
     */
    renderTrendsTab() {
        const { trends, predictions } = this.profile;

        if (!trends.hasEnoughData) {
            return `
                <div class="coaching-not-enough-data">
                    <div class="icon">📈</div>
                    <h3>Need More Data</h3>
                    <p>${trends.message}</p>
                </div>
            `;
        }

        return `
            <!-- Trend Summary Cards -->
            <div class="trend-cards">
                <div class="trend-card">
                    <h4>This Week</h4>
                    <div class="value">${trends.thisWeek.accuracy || '—'}%</div>
                    ${trends.weeklyTrend !== null ? `
                        <div class="change ${trends.weeklyTrend >= 0 ? 'positive' : 'negative'}">
                            ${trends.weeklyTrend >= 0 ? '↑' : '↓'} ${Math.abs(trends.weeklyTrend)}% vs last week
                        </div>
                    ` : ''}
                </div>
                <div class="trend-card">
                    <h4>Sessions This Week</h4>
                    <div class="value">${trends.thisWeek.sessions}</div>
                    ${trends.frequencyTrend !== 0 ? `
                        <div class="change ${trends.frequencyTrend >= 0 ? 'positive' : 'negative'}">
                            ${trends.frequencyTrend >= 0 ? '+' : ''}${trends.frequencyTrend} vs last week
                        </div>
                    ` : ''}
                </div>
                <div class="trend-card">
                    <h4>Volume This Week</h4>
                    <div class="value">${trends.thisWeek.volume}</div>
                    ${trends.volumeTrend !== null ? `
                        <div class="change ${trends.volumeTrend >= 0 ? 'positive' : 'negative'}">
                            ${trends.volumeTrend >= 0 ? '+' : ''}${trends.volumeTrend}% vs last week
                        </div>
                    ` : ''}
                </div>
                <div class="trend-card">
                    <h4>Monthly Average</h4>
                    <div class="value">${trends.thisMonth.accuracy || '—'}%</div>
                    <div class="change" style="color: var(--text-muted)">
                        ${trends.thisMonth.sessions} sessions
                    </div>
                </div>
            </div>

            <!-- Best/Worst Day -->
            ${trends.dailyPerformance.bestDay || trends.dailyPerformance.worstDay ? `
                <div style="margin-top: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;">📅 Day of Week Analysis</h3>
                    <div class="trend-cards">
                        ${trends.dailyPerformance.bestDay ? `
                            <div class="trend-card" style="border-left: 3px solid #4CAF50;">
                                <h4>🌟 Best Day</h4>
                                <div class="value">${trends.dailyPerformance.bestDay.day}</div>
                                <div class="change positive">${trends.dailyPerformance.bestDay.accuracy}% accuracy</div>
                            </div>
                        ` : ''}
                        ${trends.dailyPerformance.worstDay ? `
                            <div class="trend-card" style="border-left: 3px solid #f44336;">
                                <h4>📉 Worst Day</h4>
                                <div class="value">${trends.dailyPerformance.worstDay.day}</div>
                                <div class="change negative">${trends.dailyPerformance.worstDay.accuracy}% accuracy</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}

            <!-- Predictions -->
            ${predictions.length > 0 ? `
                <div style="margin-top: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;">🔮 Predictions</h3>
                    ${predictions.map(pred => `
                        <div class="recommendation-card">
                            <span class="rec-icon">${pred.icon}</span>
                            <div class="rec-body">
                                <p class="rec-desc">${pred.message}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    }

    /**
     * Render Benchmarks tab
     */
    renderBenchmarksTab() {
        const { skillTiers, distanceProfile } = this.profile;
        const byDistance = distanceProfile.byDistance;

        return `
            <!-- Legend -->
            <div class="benchmark-legend">
                <div class="benchmark-legend-item">
                    <div class="benchmark-legend-dot beginner"></div>
                    <span>Beginner</span>
                </div>
                <div class="benchmark-legend-item">
                    <div class="benchmark-legend-dot intermediate"></div>
                    <span>Intermediate</span>
                </div>
                <div class="benchmark-legend-item">
                    <div class="benchmark-legend-dot advanced"></div>
                    <span>Advanced</span>
                </div>
                <div class="benchmark-legend-item">
                    <div class="benchmark-legend-dot pro"></div>
                    <span>Pro</span>
                </div>
            </div>

            <div class="benchmark-grid">
                ${TRACKED_DISTANCES.filter(d => SKILL_BENCHMARKS[d]).map(dist => {
                    const benchmarks = SKILL_BENCHMARKS[dist];
                    const stats = byDistance[dist];
                    const userAccuracy = stats?.accuracy || 0;

                    return `
                        <div class="benchmark-row">
                            <div class="benchmark-distance">${dist}ft</div>
                            <div class="benchmark-bar-container">
                                <div class="benchmark-zones">
                                    <div class="benchmark-zone beginner" style="width: ${benchmarks.beginner}%"></div>
                                    <div class="benchmark-zone intermediate" style="width: ${benchmarks.intermediate - benchmarks.beginner}%"></div>
                                    <div class="benchmark-zone advanced" style="width: ${benchmarks.advanced - benchmarks.intermediate}%"></div>
                                    <div class="benchmark-zone pro" style="width: ${100 - benchmarks.advanced}%"></div>
                                </div>
                                ${userAccuracy > 0 ? `
                                    <div class="benchmark-user-marker" style="left: ${Math.min(userAccuracy, 100)}%" title="${userAccuracy}%"></div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- Skill Tier Summary -->
            <div style="margin-top: 1.5rem;">
                <h3 style="margin-bottom: 1rem;">Your Skill Tiers</h3>
                <div class="overview-grid">
                    ${Object.entries(skillTiers).map(([dist, data]) => `
                        <div class="overview-stat">
                            <div class="overview-stat-icon">${data.icon}</div>
                            <div class="overview-stat-value">${dist}ft</div>
                            <div class="overview-stat-label">${data.label}</div>
                            ${data.nextTier && !data.nextTier.maxed ? `
                                <div class="overview-stat-trend">
                                    +${data.nextTier.gap.toFixed(0)}% to ${data.nextTier.tier}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render Time Optimization tab
     */
    renderTimeTab() {
        const { timeOptimization, weatherInsights } = this.profile;

        return `
            <h3 style="margin-bottom: 1rem;">⏰ Performance by Time of Day</h3>
            <div class="time-optimization-grid">
                ${Object.entries(timeOptimization.byTime).map(([key, slot]) => {
                    const isBest = timeOptimization.bestTime?.slot === key;
                    return `
                        <div class="time-slot-row ${isBest ? 'best' : ''}">
                            <div class="time-slot-label">
                                <span>${slot.icon}</span>
                                <span>${slot.label}</span>
                            </div>
                            <div class="time-slot-bar">
                                <div class="time-slot-fill" style="width: ${slot.accuracy || 0}%"></div>
                            </div>
                            <div class="time-slot-accuracy">
                                ${slot.accuracy !== null ? `${slot.accuracy}%` : '—'}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            ${timeOptimization.bestTime ? `
                <div class="recommendation-card" style="margin-top: 1.5rem; border-left: 3px solid #4CAF50;">
                    <span class="rec-icon">💡</span>
                    <div class="rec-body">
                        <div class="rec-title">Optimal Practice Time</div>
                        <p class="rec-desc">${timeOptimization.bestTime.recommendation}</p>
                    </div>
                </div>
            ` : ''}

            ${timeOptimization.timeDifference && timeOptimization.timeDifference >= 5 ? `
                <div class="recommendation-card" style="margin-top: 0.75rem;">
                    <span class="rec-icon">📊</span>
                    <div class="rec-body">
                        <p class="rec-desc">
                            You putt <strong>${timeOptimization.timeDifference}%</strong> better during your best time compared to your worst time.
                        </p>
                    </div>
                </div>
            ` : ''}

            <!-- Weather Insights -->
            ${weatherInsights?.available ? `
                <div style="margin-top: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;">🌤️ Weather Impact</h3>
                    ${weatherInsights.insights.map(insight => `
                        <div class="recommendation-card">
                            <span class="rec-icon">${insight.icon}</span>
                            <div class="rec-body">
                                <p class="rec-desc">${insight.message}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-color); border-radius: 8px; text-align: center;">
                    <p style="color: var(--text-muted); margin: 0;">
                        🌤️ Enable weather tracking in your profile to see how conditions affect your putting
                    </p>
                </div>
            `}
        `;
    }

    /**
     * Set active tab
     */
    setActiveTab(tab) {
        this.activeTab = tab;
    }
}

// Export singleton
export const coachingUI = new CoachingUI();
