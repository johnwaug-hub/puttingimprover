/**
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL - Unauthorized copying, modification,
 * distribution, or use is strictly prohibited. Protected under DMCA.
 * Contact: lockjawdiscgolf@gmail.com
 */
/**
 * Interactive Feature Tutorial
 * Clean screenshot with legend on side (no markers)
 */

export const TUTORIAL_SCREENS = [
    {
        step: 1,
        title: "Practice Tab",
        image: "practice-view.png",
        features: [
            { icon: "👤", label: "Profile", location: "top right", desc: "Access settings, friends & goals" },
            { icon: "🚪", label: "Logout", location: "top right", desc: "Sign out of your account" },
            { icon: "📊", label: "Navigation Tabs", location: "below header", desc: "Practice, Routines, Games, Challenges, Leaderboard, Stats" },
            { icon: "💯", label: "Stat Cards", location: "orange cards", desc: "Points, Activities, Makes, Accuracy" },
            { icon: "👥", label: "Multiplayer Log", location: "white button", desc: "Log practice for friends" },
            { icon: "➕", label: "Add Session", location: "orange button", desc: "Quick-log in 10 seconds!" }
        ]
    },
    {
        step: 2,
        title: "Routines Tab",
        image: "routines-view.png",
        features: [
            { icon: "📋", label: "Suggested", location: "sub-tab", desc: "Pre-built pro routines" },
            { icon: "🎨", label: "My Custom", location: "sub-tab", desc: "Create your own routines" },
            { icon: "🌍", label: "Community", location: "sub-tab", desc: "Shared by other players" },
            { icon: "👥", label: "Multiplayer Log", location: "right side", desc: "Log routine for friends too" },
            { icon: "🟢", label: "Beginner", location: "first row", desc: "5 routines - start here!" },
            { icon: "🟡", label: "Intermediate", location: "second row", desc: "6 routines - level up" },
            { icon: "🟠", label: "Advanced", location: "third row", desc: "6 routines - challenge yourself" },
            { icon: "🔴", label: "Expert", location: "fourth row", desc: "3 routines - pro level!" }
        ]
    },
    {
        step: 3,
        title: "Games Tab",
        image: "games-view.png",
        features: [
            { icon: "🎮", label: "Built-In Games", location: "sub-tab", desc: "10 ready-to-play games" },
            { icon: "🎨", label: "My Custom", location: "sub-tab", desc: "Create custom games" },
            { icon: "🌍", label: "Community", location: "sub-tab", desc: "Games from other players" },
            { icon: "🌍", label: "Around the World", location: "game card", desc: "EASY - 8 positions around basket" },
            { icon: "🐴", label: "HORSE", location: "game card", desc: "MEDIUM - Classic letter game" },
            { icon: "🪜", label: "Distance Ladder", location: "game card", desc: "HARD - Move back each make" },
            { icon: "💯", label: "Perfect 10", location: "game card", desc: "HARD - 10 in a row!" },
            { icon: "🃏", label: "Points Poker", location: "game card", desc: "EASY - Cards meet putting" }
        ]
    },
    {
        step: 4,
        title: "Challenges & Achievements",
        image: "achievements-view.png",
        features: [
            { icon: "🎯", label: "Weekly Challenge", location: "purple card", desc: "New challenge every week for 400 bonus points!" },
            { icon: "🏆", label: "Your Achievements", location: "white card", desc: "15 categories with 100+ badges to unlock" },
            { icon: "🚀", label: "Getting Started", location: "category", desc: "First achievements for new users" },
            { icon: "🎯", label: "Accuracy", location: "category", desc: "Hit accuracy milestones" },
            { icon: "🔥", label: "Streaks", location: "category", desc: "Practice daily for streak badges" },
            { icon: "📏", label: "Distance", location: "category", desc: "Challenge yourself at longer distances" }
        ]
    },
    {
        step: 5,
        title: "Leaderboard",
        image: "leaderboard-view.png",
        features: [
            { icon: "💯", label: "Points Leader", location: "filter button", desc: "Rankings by total points" },
            { icon: "📊", label: "Sessions Leader", location: "filter button", desc: "Most practice sessions" },
            { icon: "📋", label: "Routines Leader", location: "filter button", desc: "Most routines completed" },
            { icon: "🎮", label: "Games Leader", location: "filter button", desc: "Most games played" },
            { icon: "👥", label: "Gender Filter", location: "below filters", desc: "Male, Female, or Both" },
            { icon: "🏆", label: "Rankings", location: "player list", desc: "Top players with points & activities" }
        ]
    },
    {
        step: 6,
        title: "Stats Tab",
        image: "stats-view.png",
        features: [
            { icon: "🔍", label: "Search Players", location: "top", desc: "Find any player by name" },
            { icon: "📊", label: "Quick Stats", location: "stat row", desc: "Points, Sessions, Routines, Games, Achievements, Streak" },
            { icon: "⭐", label: "Best Session", location: "orange card", desc: "Your highest scoring session ever" },
            { icon: "📈", label: "Performance", location: "metrics row", desc: "Accuracy, distance, makes, attempts" },
            { icon: "📊", label: "Distance Chart", location: "bottom", desc: "See which distances you practice most" }
        ]
    },
    {
        step: 7,
        title: "Profile & Settings",
        image: "profile-view.png",
        features: [
            { icon: "👤", label: "Profile Photo", location: "top", desc: "Upload your avatar" },
            { icon: "📝", label: "Basic Info", location: "form fields", desc: "Name, gender, birthday" },
            { icon: "🥏", label: "Favorite Discs", location: "form fields", desc: "Share your putter, mid, driver" },
            { icon: "📍", label: "Location & Weather", location: "form fields", desc: "Auto-track conditions during practice" },
            { icon: "🎯", label: "Weekly Goals", location: "form fields", desc: "Set practice targets" },
            { icon: "👥", label: "Friends", location: "bottom section", desc: "Add friends for multiplayer logging" },
            { icon: "💾", label: "Save / Export", location: "buttons", desc: "Save changes or export all your data" }
        ]
    }
];

/**
 * Render tutorial with clean screenshot and legend
 */
export function renderInteractiveTutorial(currentStep) {
    const screen = TUTORIAL_SCREENS[currentStep - 1];
    if (!screen) return '';

    const progress = (currentStep / TUTORIAL_SCREENS.length) * 100;

    return `
        <div class="tutorial-modal-overlay" id="tutorialModal">
            <div class="tutorial-modal-legend">
                <button class="tutorial-close" id="tutorialClose">✕</button>

                <div class="tutorial-header-compact">
                    <h2>${screen.title}</h2>
                    <div class="tutorial-progress-mini">
                        <div class="tutorial-progress-fill-mini" style="width: ${progress}%"></div>
                    </div>
                    <span class="tutorial-step-mini">${currentStep} of ${TUTORIAL_SCREENS.length}</span>
                </div>

                <div class="tutorial-content-split">
                    <!-- Clean screenshot -->
                    <div class="tutorial-screenshot-side">
                        <div class="screenshot-container-legend ${currentStep === 7 ? 'zoomed' : (currentStep === 1 ? 'scroll-vertical' : '')}" id="screenshotContainer" data-screen="${currentStep}">
                            <img src="screenshots/${screen.image}" alt="${screen.title}" class="screenshot-actual">
                        </div>
                    </div>

                    <!-- Legend -->
                    <div class="tutorial-legend-side">
                        <div class="legend-header">Features on this page:</div>
                        <div class="legend-list">
                            ${screen.features.map(f => `
                                <div class="legend-item">
                                    <span class="legend-icon">${f.icon}</span>
                                    <div class="legend-text">
                                        <strong>${f.label}</strong>
                                        <span class="legend-location">${f.location}</span>
                                        <span class="legend-desc">${f.desc}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="tutorial-footer-compact">
                    ${currentStep > 1 ?
                        '<button class="btn btn-secondary btn-sm" id="tutorialPrev">← Back</button>' :
                        '<button class="btn btn-secondary btn-sm" id="tutorialSkip">Skip</button>'
                    }

                    <div class="tutorial-dots-mini">
                        ${TUTORIAL_SCREENS.map((_, index) => `
                            <div class="dot-mini ${index + 1 === currentStep ? 'active' : ''} ${index + 1 < currentStep ? 'done' : ''}"></div>
                        `).join('')}
                    </div>

                    ${currentStep < TUTORIAL_SCREENS.length ?
                        '<button class="btn btn-primary btn-sm" id="tutorialNext">Next →</button>' :
                        '<button class="btn btn-success btn-sm" id="tutorialFinish">🎉 Start Practicing!</button>'
                    }
                </div>
            </div>
        </div>
    `;
}

/**
 * Initialize - no hotspots needed for this version
 */
export function initializeHotspots() {
    // No interactive markers in this version
}
