/**
 * backgrounds.js — Background picker, unlock system & rotation
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 *
 * Images stored locally in /images/backgrounds/
 * Run `node download-backgrounds.js` from project root to download all images.
 */

export const BACKGROUNDS = [

    // ── Always unlocked (5) ───────────────────────────────────────────────────
    {
        id: 'sonoran_desert',
        name: 'Sonoran Desert',
        region: 'Arizona',
        emoji: '🌵',
        tier: 'default',
        unlockAchievement: null,
        file: '../background.webp',  // Original app background — unchanged
        gradient: 'linear-gradient(160deg, #FF8C42 0%, #E85D2F 25%, #D4A574 50%, #C4814A 70%, #8B4513 100%)',
    },
    {
        id: 'red_rock',
        name: 'Red Rock Canyon',
        region: 'Utah / Nevada',
        emoji: '🏜️',
        tier: 'default',
        unlockAchievement: null,
        file: '../images/backgrounds/red_rock.jpg',
        gradient: 'linear-gradient(175deg, #87CEEB 0%, #E8B86D 30%, #C0392B 55%, #8B2500 75%, #5C1A00 100%)',
    },
    {
        id: 'great_plains',
        name: 'Great Plains',
        region: 'Kansas',
        emoji: '🌾',
        tier: 'default',
        unlockAchievement: null,
        file: '../images/backgrounds/great_plains.jpg',
        gradient: 'linear-gradient(180deg, #87CEEB 0%, #FFF3B0 35%, #F4C430 55%, #D4A017 75%, #8B6914 100%)',
    },
    {
        id: 'new_england_fall',
        name: 'New England Fall',
        region: 'Vermont',
        emoji: '🍂',
        tier: 'default',
        unlockAchievement: null,
        file: '../images/backgrounds/new_england_fall.jpg',
        gradient: 'linear-gradient(155deg, #87CEEB 0%, #FF8C00 20%, #FF4500 40%, #DC143C 58%, #8B0000 78%, #5C3317 100%)',
    },
    {
        id: 'smoky_mountains',
        name: 'Smoky Mountains',
        region: 'Tennessee',
        emoji: '🌁',
        tier: 'default',
        unlockAchievement: null,
        file: '../images/backgrounds/smoky_mountains.jpg',
        gradient: 'linear-gradient(170deg, #B0C4DE 0%, #9B8FA6 25%, #7B6D8D 45%, #556B2F 65%, #2E4A1E 100%)',
    },

    // ── Earned unlocks (12) ──────────────────────────────────────────────────
    {
        id: 'texas_bluebonnets',
        name: 'Texas Bluebonnets',
        region: 'Texas',
        emoji: '💜',
        tier: 'earned',
        unlockAchievement: 'three_day_starter',
        unlockHint: 'Practice 3 days in a row',
        file: '../images/backgrounds/texas_bluebonnets.jpg',
        gradient: 'linear-gradient(165deg, #87CEEB 0%, #9370DB 25%, #6A0DAD 45%, #228B22 65%, #32CD32 100%)',
    },
    {
        id: 'outer_banks',
        name: 'Outer Banks',
        region: 'North Carolina',
        emoji: '🌊',
        tier: 'earned',
        unlockAchievement: 'week_warrior',
        unlockHint: 'Practice 7 days in a row',
        file: '../images/backgrounds/outer_banks.jpg',
        gradient: 'linear-gradient(165deg, #FF6B35 0%, #FFD700 25%, #87CEEB 50%, #1E90FF 75%, #00008B 100%)',
    },
    {
        id: 'louisiana_bayou',
        name: 'Louisiana Bayou',
        region: 'Louisiana',
        emoji: '🐊',
        tier: 'earned',
        unlockAchievement: 'point_king',
        unlockHint: 'Earn 1,000 total points',
        file: '../images/backgrounds/louisiana_bayou.jpg',
        gradient: 'linear-gradient(160deg, #2F4F2F 0%, #1C5C1C 20%, #008B45 40%, #3CB371 60%, #90EE90 80%, #7CFC00 100%)',
    },
    {
        id: 'great_lakes',
        name: 'Great Lakes',
        region: 'Michigan',
        emoji: '🏞️',
        tier: 'earned',
        unlockAchievement: 'point_king',
        unlockHint: 'Earn 1,000 total points',
        file: '../images/backgrounds/great_lakes.jpg',
        gradient: 'linear-gradient(160deg, #87CEEB 0%, #5DADE2 30%, #1A5276 55%, #0A3D62 75%, #051E3E 100%)',
    },
    {
        id: 'blue_ridge',
        name: 'Blue Ridge Parkway',
        region: 'Virginia / NC',
        emoji: '🌄',
        tier: 'earned',
        unlockAchievement: 'two_week_streak',
        unlockHint: 'Practice 14 days in a row',
        file: '../images/backgrounds/blue_ridge.jpg',
        gradient: 'linear-gradient(170deg, #B0C4DE 0%, #8B7BB5 20%, #6A5ACD 38%, #483D8B 55%, #2F4F4F 75%, #1A2E1A 100%)',
    },
    {
        id: 'california_redwoods',
        name: 'California Redwoods',
        region: 'Northern California',
        emoji: '🌲',
        tier: 'earned',
        unlockAchievement: 'point_legend',
        unlockHint: 'Earn 5,000 total points',
        file: '../images/backgrounds/california_redwoods.jpg',
        gradient: 'linear-gradient(175deg, #1A0A00 0%, #2D1B00 15%, #4A2C00 30%, #2E5A1A 50%, #1A3A0A 70%, #0D1F05 100%)',
    },
    {
        id: 'rocky_mountains',
        name: 'Rocky Mountain Lake',
        region: 'Colorado',
        emoji: '🏔️',
        tier: 'earned',
        unlockAchievement: 'point_legend',
        unlockHint: 'Earn 5,000 total points',
        file: '../images/backgrounds/rocky_mountains.jpg',
        gradient: 'linear-gradient(170deg, #87CEEB 0%, #B0D4E8 20%, #FFFFFF 35%, #5B9BD5 50%, #1E6FA8 65%, #0A3D5C 85%, #0A2440 100%)',
    },
    {
        id: 'florida_everglades',
        name: 'Florida Everglades',
        region: 'Florida',
        emoji: '🌅',
        tier: 'earned',
        unlockAchievement: 'committed',
        unlockHint: 'Practice for 30 days',
        file: '../images/backgrounds/florida_everglades.jpg',
        gradient: 'linear-gradient(165deg, #FF8C00 0%, #FFD700 20%, #ADFF2F 40%, #228B22 60%, #1C4A1C 80%, #0A2A0A 100%)',
    },
    {
        id: 'mount_rainier',
        name: 'Mount Rainier',
        region: 'Washington',
        emoji: '🌋',
        tier: 'earned',
        unlockAchievement: 'committed',
        unlockHint: 'Practice for 30 days',
        file: '../images/backgrounds/mount_rainier.jpg',
        gradient: 'linear-gradient(170deg, #FF6B35 0%, #FFB347 20%, #87CEEB 40%, #FFFFFF 52%, #B0C4DE 62%, #4682B4 78%, #2E5A8A 100%)',
    },
    {
        id: 'midwest_barn',
        name: 'Midwest Autumn',
        region: 'Ohio / Indiana',
        emoji: '🏚️',
        tier: 'earned',
        unlockAchievement: 'game_on',
        unlockHint: 'Complete your first game',
        file: '../images/backgrounds/midwest_barn.jpg',
        gradient: 'linear-gradient(170deg, #FF8C00 0%, #E8A020 20%, #C8851C 38%, #8B2020 55%, #5C1414 70%, #3A0A0A 100%)',
    },
    {
        id: 'midwest_wheat',
        name: 'Kansas Wheat Fields',
        region: 'Kansas',
        emoji: '🌻',
        tier: 'earned',
        unlockAchievement: 'game_legend',
        unlockHint: 'Complete 50 total games',
        file: '../images/backgrounds/midwest_wheat.jpg',
        gradient: 'linear-gradient(175deg, #FF6B00 0%, #FFB800 15%, #FFD700 30%, #E8C840 50%, #C8A020 68%, #7A5A10 85%, #3A2A08 100%)',
    },

    // ── Rare unlocks (4) ─────────────────────────────────────────────────────
    {
        id: 'alaska_fjords',
        name: 'Alaska Fjords',
        region: 'Alaska',
        emoji: '🧊',
        tier: 'rare',
        unlockAchievement: 'podium_finish',
        unlockHint: 'Reach top 3 on the leaderboard',
        file: '../images/backgrounds/alaska_fjords.jpg',
        gradient: 'linear-gradient(165deg, #C0D8E8 0%, #A8C4D8 15%, #7BA8C4 30%, #4A84A8 48%, #2A5A78 65%, #1A3A52 80%, #0A1E2E 100%)',
    },
    {
        id: 'desert_milky_way',
        name: 'Desert Milky Way',
        region: 'Southwest Night Sky',
        emoji: '🌌',
        tier: 'rare',
        unlockAchievement: 'daily_grinder',
        unlockHint: 'Practice 365 total days',
        file: '../images/backgrounds/desert_milky_way.jpg',
        gradient: 'linear-gradient(170deg, #0A0014 0%, #120028 15%, #1E0040 30%, #0A0828 45%, #050414 60%, #020208 80%, #000000 100%)',
    },
    {
        id: 'hawaii_black_sand',
        name: 'Hawaii Black Sand',
        region: 'Hawaii',
        emoji: '🌺',
        tier: 'rare',
        unlockAchievement: 'session_legend',
        unlockHint: 'Complete 500 practice sessions',
        file: '../images/backgrounds/hawaii_black_sand.jpg',
        gradient: 'linear-gradient(165deg, #FF4500 0%, #8B0000 20%, #1A0A00 38%, #000000 50%, #001A1A 62%, #003333 75%, #005555 88%, #006666 100%)',
    },
    {
        id: 'aurora_borealis',
        name: 'Aurora Borealis',
        region: 'Alaska',
        emoji: '✨',
        tier: 'rare',
        unlockAchievement: 'number_one',
        unlockHint: 'Reach #1 on any leaderboard',
        file: '../images/backgrounds/aurora_borealis.jpg',
        gradient: 'linear-gradient(165deg, #000814 0%, #001A0A 15%, #003320 30%, #006633 45%, #00AA55 58%, #00CC66 68%, #00FFAA 75%, #88FFDD 82%, #AAFFEE 88%, #000814 100%)',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// BackgroundManager
// ─────────────────────────────────────────────────────────────────────────────
export class BackgroundManager {
    constructor() {
        this._rotationTimer = null;
        this._rotationIndex = 0;
        this.ROTATION_INTERVAL_MS = 5 * 60 * 1000;
    }

    init(user) {
        const pref = this._getPreference(user);
        if (pref.rotation) {
            this._startRotation(user);
        } else {
            this.apply(pref.selectedId || 'sonoran_desert', user);
        }
    }

    apply(backgroundId, user) {
        const bg = BACKGROUNDS.find(b => b.id === backgroundId);
        if (!bg) return;
        if (!this.isUnlocked(backgroundId, user)) return;

        const body = document.body;
        body.style.backgroundImage = `url('${bg.file}')`;
        body.style.backgroundSize = 'cover';
        body.style.backgroundPosition = 'center';
        body.style.backgroundAttachment = 'fixed';
        body.style.backgroundRepeat = 'no-repeat';
        body.dataset.backgroundId = backgroundId;

        // Fall back to gradient if photo fails to load
        const testImg = new Image();
        testImg.onerror = () => {
            body.style.backgroundImage = bg.gradient;
            body.style.backgroundSize = '100% 100%';
        };
        testImg.src = bg.file;
    }

    getUnlocked(user) {
        if (!user) return BACKGROUNDS.filter(b => !b.unlockAchievement).map(b => b.id);
        const userAchievements = user.achievements || [];
        return BACKGROUNDS
            .filter(bg => !bg.unlockAchievement || userAchievements.includes(bg.unlockAchievement))
            .map(bg => bg.id);
    }

    isUnlocked(backgroundId, user) {
        return this.getUnlocked(user).includes(backgroundId);
    }

    checkNewUnlocks(user, previousAchievements = []) {
        const newAchievements = (user.achievements || []).filter(a => !previousAchievements.includes(a));
        return BACKGROUNDS.filter(bg =>
            bg.unlockAchievement && newAchievements.includes(bg.unlockAchievement)
        );
    }

    savePreference(user, backgroundId, rotationEnabled) {
        if (!user) return;
        user.backgroundPreference = { selectedId: backgroundId, rotation: rotationEnabled };
        try {
            localStorage.setItem('bg_pref', JSON.stringify({ selectedId: backgroundId, rotation: rotationEnabled }));
        } catch(e) {}
    }

    _startRotation(user) {
        this.stopRotation();
        const unlocked = this.getUnlocked(user);
        if (unlocked.length < 2) {
            this.apply(unlocked[0] || 'sonoran_desert', user);
            return;
        }
        this.apply(unlocked[this._rotationIndex % unlocked.length], user);
        this._rotationTimer = setInterval(() => {
            this._rotationIndex = (this._rotationIndex + 1) % unlocked.length;
            this.apply(unlocked[this._rotationIndex], user);
        }, this.ROTATION_INTERVAL_MS);
    }

    stopRotation() {
        if (this._rotationTimer) {
            clearInterval(this._rotationTimer);
            this._rotationTimer = null;
        }
    }

    _getPreference(user) {
        if (user?.backgroundPreference) return user.backgroundPreference;
        try {
            const local = localStorage.getItem('bg_pref');
            if (local) return JSON.parse(local);
        } catch(e) {}
        return { selectedId: 'sonoran_desert', rotation: false };
    }

    renderPicker(user) {
        const unlocked = this.getUnlocked(user);
        const pref = this._getPreference(user);
        const currentId = pref.selectedId || 'sonoran_desert';
        const rotationOn = !!pref.rotation;
        const tierLabels = { default: '🌵 Default', earned: '🏆 Earned', rare: '💎 Rare' };

        return `
        <div class="profile-section-divider"></div>
        <h4>🎨 Background</h4>
        <p class="profile-hint" style="margin-bottom:14px">Unlock new backgrounds by earning achievements.</p>

        <div class="bg-rotation-row">
            <div class="bg-rotation-info">
                <span class="bg-rotation-icon">🔄</span>
                <div>
                    <div class="bg-rotation-label">Auto-Rotate</div>
                    <div class="bg-rotation-sub">Cycle through all unlocked backgrounds every 5 min</div>
                </div>
            </div>
            <label class="toggle-switch">
                <input type="checkbox" id="bgRotationToggle" ${rotationOn ? 'checked' : ''}>
                <span class="toggle-slider"></span>
            </label>
        </div>

        <div id="bgPickerGrid" class="${rotationOn ? 'bg-grid-muted' : ''}">
            ${['default','earned','rare'].map(tier => {
                const tierBgs = BACKGROUNDS.filter(b => b.tier === tier);
                return `
                <div class="bg-tier-section">
                    <div class="bg-tier-label">${tierLabels[tier]}</div>
                    <div class="bg-grid">
                        ${tierBgs.map(bg => {
                            const isUnlocked = unlocked.includes(bg.id);
                            const isSelected = currentId === bg.id && !rotationOn;
                            const previewStyle = `background-image:url('${bg.file}');background-size:cover;background-position:center;`;
                            return `
                            <div class="bg-swatch ${isSelected ? 'bg-swatch-selected' : ''} ${!isUnlocked ? 'bg-swatch-locked' : ''}"
                                 data-bg-id="${bg.id}" data-unlocked="${isUnlocked}"
                                 title="${bg.name} — ${bg.region}">
                                <div class="bg-swatch-preview" style="${previewStyle}">
                                    ${!isUnlocked ? '<div class="bg-lock-overlay"><span>🔒</span></div>' : ''}
                                    ${isSelected ? '<div class="bg-active-check">✓</div>' : ''}
                                </div>
                                <div class="bg-swatch-info">
                                    <div class="bg-swatch-name">${bg.emoji} ${bg.name}</div>
                                    <div class="bg-swatch-region">${bg.region}</div>
                                    ${!isUnlocked ? `<div class="bg-swatch-hint">🔒 ${bg.unlockHint}</div>` : ''}
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    }
}

export const backgroundManager = new BackgroundManager();
