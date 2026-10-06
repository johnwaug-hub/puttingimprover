/**
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL - Unauthorized copying, modification,
 * distribution, or use is strictly prohibited. Protected under DMCA.
 * Contact: lockjawdiscgolf@gmail.com
 */

/**
 * First-Time User Onboarding Flow
 * 4 steps: Welcome → Features → Setup → Ready
 */

export const ONBOARDING_STEPS = 4;

/**
 * Main render entry point — call with current step and collected data
 * @param {number} step - Current step (1–4)
 * @param {object} data - { displayName, skillLevel }
 */
export function renderOnboarding(step, data = {}) {
    const stepRenderers = {
        1: renderWelcomeStep,
        2: renderFeaturesStep,
        3: renderSetupStep,
        4: renderReadyStep,
    };
    const renderer = stepRenderers[step];
    if (!renderer) return '';

    const progressPct = ((step - 1) / (ONBOARDING_STEPS - 1)) * 100;

    return `
        <div class="ob-overlay" id="onboardingOverlay">
            <div class="ob-card" id="onboardingCard">
                <!-- Close button -->
                <button class="ob-close-btn" id="obClose" title="Close">✕</button>

                <!-- Progress bar -->
                <div class="ob-progress-track">
                    <div class="ob-progress-fill" style="width: ${progressPct}%"></div>
                </div>

                <!-- Step content -->
                <div class="ob-content" id="obContent">
                    ${renderer(data)}
                </div>
            </div>
        </div>
    `;
}

/* ─── Step 1: Welcome ─────────────────────────────────────────── */
function renderWelcomeStep() {
    return `
        <div class="ob-step ob-step-welcome">
            <div class="ob-welcome-illustration">
                ${discIllustration()}
            </div>
            <div class="ob-welcome-text">
                <div class="ob-brand-badge">🔒 Lock Jaw Disc Golf</div>
                <h1 class="ob-headline">Welcome to<br><span class="ob-brand-name">Putting Improver</span></h1>
                <p class="ob-subhead">The putting practice tracker built for disc golfers who want to get serious about their short game.</p>
            </div>
            <div class="ob-footer">
                <button class="ob-btn ob-btn-primary ob-btn-wide" id="obNext">
                    Let's Go <span class="ob-arrow">→</span>
                </button>
                <p class="ob-step-hint">Takes about 30 seconds to set up</p>
            </div>
        </div>
    `;
}

/* ─── Step 2: Core Features ───────────────────────────────────── */
function renderFeaturesStep() {
    return `
        <div class="ob-step ob-step-features">
            <div class="ob-step-header">
                <h2 class="ob-title">Everything you need to improve</h2>
                <p class="ob-desc">Three ways to build a better putting game.</p>
            </div>

            <div class="ob-feature-grid">

                <!-- Practice -->
                <div class="ob-feature-card">
                    <div class="ob-feature-mockup ob-mockup-practice">
                        <div class="obm-header">
                            <span class="obm-dot orange"></span>
                            <span class="obm-label">Quick Session</span>
                        </div>
                        <div class="obm-stat-row">
                            <div class="obm-stat">
                                <div class="obm-stat-val">24</div>
                                <div class="obm-stat-key">Ft</div>
                            </div>
                            <div class="obm-stat">
                                <div class="obm-stat-val">8</div>
                                <div class="obm-stat-key">Makes</div>
                            </div>
                            <div class="obm-stat">
                                <div class="obm-stat-val">80%</div>
                                <div class="obm-stat-key">Acc</div>
                            </div>
                        </div>
                        <div class="obm-bar-chart">
                            <div class="obm-bar" style="height: 55%"></div>
                            <div class="obm-bar" style="height: 80%"></div>
                            <div class="obm-bar" style="height: 65%"></div>
                            <div class="obm-bar" style="height: 90%"></div>
                            <div class="obm-bar" style="height: 70%"></div>
                        </div>
                    </div>
                    <div class="ob-feature-info">
                        <span class="ob-feature-icon">📊</span>
                        <div>
                            <strong>Track Practice</strong>
                            <p>Log sessions in seconds. Track accuracy, distance trends, and streaks.</p>
                        </div>
                    </div>
                </div>

                <!-- Routines -->
                <div class="ob-feature-card">
                    <div class="ob-feature-mockup ob-mockup-routines">
                        <div class="obm-header">
                            <span class="obm-dot green"></span>
                            <span class="obm-label">Routines</span>
                        </div>
                        <div class="obm-routine-list">
                            <div class="obm-routine-row">
                                <span class="obm-difficulty beginner">●</span>
                                <span class="obm-routine-name">Circle 1 Basics</span>
                                <span class="obm-routine-pts">+50</span>
                            </div>
                            <div class="obm-routine-row active">
                                <span class="obm-difficulty intermediate">●</span>
                                <span class="obm-routine-name">21 Disc Challenge</span>
                                <span class="obm-routine-pts">+75</span>
                            </div>
                            <div class="obm-routine-row">
                                <span class="obm-difficulty advanced">●</span>
                                <span class="obm-routine-name">Distance Ladder</span>
                                <span class="obm-routine-pts">+100</span>
                            </div>
                        </div>
                    </div>
                    <div class="ob-feature-info">
                        <span class="ob-feature-icon">📋</span>
                        <div>
                            <strong>Follow Routines</strong>
                            <p>Structured drills from beginner to expert. Community routines too.</p>
                        </div>
                    </div>
                </div>

                <!-- Games -->
                <div class="ob-feature-card">
                    <div class="ob-feature-mockup ob-mockup-games">
                        <div class="obm-header">
                            <span class="obm-dot purple"></span>
                            <span class="obm-label">Games</span>
                        </div>
                        <div class="obm-game-grid">
                            <div class="obm-game-pill">🌍 Around the World</div>
                            <div class="obm-game-pill">🐴 HORSE</div>
                            <div class="obm-game-pill">🪜 Ladder</div>
                            <div class="obm-game-pill">💯 Perfect 10</div>
                        </div>
                        <div class="obm-game-badge">10 built-in games</div>
                    </div>
                    <div class="ob-feature-info">
                        <span class="ob-feature-icon">🎮</span>
                        <div>
                            <strong>Play Games</strong>
                            <p>10 putting games to keep practice fun. Create your own too.</p>
                        </div>
                    </div>
                </div>

            </div>

            <div class="ob-footer">
                <button class="ob-btn ob-btn-ghost" id="obPrev">← Back</button>
                <button class="ob-btn ob-btn-primary" id="obNext">Next →</button>
            </div>
        </div>
    `;
}

/* ─── Step 3: Setup ───────────────────────────────────────────── */
function renderSetupStep(data) {
    const { displayName = '', skillLevel = '' } = data;
    const skills = [
        { id: 'beginner',     label: 'Beginner',     icon: '🌱', desc: 'Just starting out' },
        { id: 'intermediate', label: 'Intermediate',  icon: '🎯', desc: 'Some experience' },
        { id: 'advanced',     label: 'Advanced',      icon: '🔥', desc: 'Consistent practice' },
        { id: 'pro',          label: 'Pro',           icon: '🏆', desc: 'Competitive level' },
    ];

    return `
        <div class="ob-step ob-step-setup">
            <div class="ob-step-header">
                <h2 class="ob-title">Personalize your experience</h2>
                <p class="ob-desc">This takes 20 seconds and helps us tailor your practice.</p>
            </div>

            <div class="ob-form">
                <div class="ob-form-group">
                    <label class="ob-label" for="obDisplayName">Your display name</label>
                    <input
                        class="ob-input"
                        type="text"
                        id="obDisplayName"
                        placeholder="How you'll appear on leaderboards"
                        value="${displayName}"
                        maxlength="30"
                        autocomplete="off"
                        autocorrect="off"
                        spellcheck="false"
                    >
                    <span class="ob-input-hint">Shown on leaderboards and to friends</span>
                </div>

                <div class="ob-form-group">
                    <label class="ob-label">Your skill level</label>
                    <div class="ob-skill-grid">
                        ${skills.map(s => `
                            <button
                                class="ob-skill-btn ${skillLevel === s.id ? 'selected' : ''}"
                                data-skill="${s.id}"
                                type="button"
                            >
                                <span class="ob-skill-icon">${s.icon}</span>
                                <span class="ob-skill-label">${s.label}</span>
                                <span class="ob-skill-desc">${s.desc}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="ob-footer">
                <button class="ob-btn ob-btn-ghost" id="obPrev">← Back</button>
                <button class="ob-btn ob-btn-primary" id="obNext" ${!displayName.trim() ? 'disabled' : ''}>
                    Continue →
                </button>
            </div>
        </div>
    `;
}

/* ─── Step 4: Ready ───────────────────────────────────────────── */
function renderReadyStep(data) {
    const name = data.displayName?.trim() || 'Disc Golfer';
    const skillLabel = {
        beginner: 'Beginner', intermediate: 'Intermediate',
        advanced: 'Advanced', pro: 'Pro'
    }[data.skillLevel] || '';

    return `
        <div class="ob-step ob-step-ready">
            <div class="ob-ready-celebrate">
                ${confettiSVG()}
            </div>

            <div class="ob-ready-hero">
                <div class="ob-ready-avatar">${name.charAt(0).toUpperCase()}</div>
                <h2 class="ob-ready-name">You're all set, ${name}!</h2>
                ${skillLabel ? `<div class="ob-ready-skill-badge">${skillLabel} Player</div>` : ''}
            </div>

            <div class="ob-ready-tips">
                <p class="ob-tips-heading">Start here →</p>
                <div class="ob-tip-row">
                    <span class="ob-tip-icon">➕</span>
                    <div class="ob-tip-text">
                        <strong>Log your first session</strong>
                        <span>Hit the orange button on the Practice tab</span>
                    </div>
                    <span class="ob-tip-pts">+10 pts</span>
                </div>
                <div class="ob-tip-row">
                    <span class="ob-tip-icon">📋</span>
                    <div class="ob-tip-text">
                        <strong>Try a routine</strong>
                        <span>Start with "Circle 1 Basics" in the Routines tab</span>
                    </div>
                    <span class="ob-tip-pts">+50 pts</span>
                </div>
                <div class="ob-tip-row">
                    <span class="ob-tip-icon">🎯</span>
                    <div class="ob-tip-text">
                        <strong>Check the daily challenge</strong>
                        <span>New challenge every day in the Challenges tab</span>
                    </div>
                    <span class="ob-tip-pts">+100 pts</span>
                </div>
            </div>

            <div class="ob-footer ob-footer-single">
                <button class="ob-btn ob-btn-primary ob-btn-wide ob-btn-cta" id="obFinish">
                    🥏 Start Practicing!
                </button>
                <p class="ob-achievement-note">🏆 You'll earn <strong>50 bonus points</strong> for completing setup!</p>
            </div>
        </div>
    `;
}

/* ─── SVG Illustrations ───────────────────────────────────────── */
function discIllustration() {
    return `
        <svg class="ob-disc-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <!-- Glow -->
            <defs>
                <radialGradient id="discGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#FF6B35;stop-opacity:0.25"/>
                    <stop offset="100%" style="stop-color:#FF6B35;stop-opacity:0"/>
                </radialGradient>
                <radialGradient id="discFill" cx="40%" cy="35%" r="70%">
                    <stop offset="0%" style="stop-color:#FF8C5A"/>
                    <stop offset="100%" style="stop-color:#D9534F"/>
                </radialGradient>
            </defs>
            <!-- Glow halo -->
            <ellipse cx="100" cy="108" rx="72" ry="16" fill="url(#discGlow)"/>
            <!-- Disc shadow -->
            <ellipse cx="100" cy="112" rx="52" ry="8" fill="rgba(0,0,0,0.18)"/>
            <!-- Disc body -->
            <ellipse cx="100" cy="96" rx="58" ry="22" fill="url(#discFill)"/>
            <!-- Disc dome -->
            <ellipse cx="100" cy="90" rx="40" ry="18" fill="#FF6B35" opacity="0.6"/>
            <!-- Disc rim highlight -->
            <ellipse cx="100" cy="82" rx="28" ry="10" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
            <!-- Flight rings -->
            <ellipse cx="100" cy="96" rx="48" ry="18" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
            <ellipse cx="100" cy="96" rx="36" ry="13" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
            <!-- Shine -->
            <ellipse cx="87" cy="86" rx="12" ry="5" fill="rgba(255,255,255,0.3)" transform="rotate(-20,87,86)"/>
            <!-- Basket silhouette below -->
            <rect x="91" y="120" width="18" height="3" rx="1.5" fill="rgba(255,255,255,0.25)"/>
            <rect x="95" y="123" width="10" height="18" rx="1" fill="rgba(255,255,255,0.2)"/>
            <rect x="86" y="139" width="28" height="2" rx="1" fill="rgba(255,255,255,0.25)"/>
            <!-- Chains -->
            <line x1="90" y1="122" x2="86" y2="138" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
            <line x1="95" y1="122" x2="93" y2="138" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
            <line x1="100" y1="122" x2="100" y2="138" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
            <line x1="105" y1="122" x2="107" y2="138" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
            <line x1="110" y1="122" x2="114" y2="138" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
        </svg>
    `;
}

function confettiSVG() {
    const pieces = [
        { x: 20, y: 30, r: 12, c: '#FF6B35', rot: 20 },
        { x: 50, y: 15, r: 8,  c: '#10b981', rot: -15 },
        { x: 80, y: 25, r: 10, c: '#8b5cf6', rot: 35 },
        { x: 120, y: 10, r: 7, c: '#f59e0b', rot: -25 },
        { x: 155, y: 30, r: 9, c: '#FF6B35', rot: 45 },
        { x: 175, y: 18, r: 6, c: '#10b981', rot: 10 },
        { x: 35, y: 55, r: 6,  c: '#8b5cf6', rot: -40 },
        { x: 145, y: 55, r: 7, c: '#f59e0b', rot: 30 },
    ];
    return `
        <svg class="ob-confetti-svg" viewBox="0 0 200 75" xmlns="http://www.w3.org/2000/svg">
            ${pieces.map(p => `
                <rect x="${p.x}" y="${p.y}" width="${p.r}" height="${p.r * 0.55}"
                      rx="1" fill="${p.c}" opacity="0.85"
                      transform="rotate(${p.rot},${p.x + p.r/2},${p.y + p.r*0.275})"/>
            `).join('')}
        </svg>
    `;
}
