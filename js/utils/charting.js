/**
 * Charting Utilities - Data visualization for Putting Improver
 * Uses Chart.js for rendering
 */

/**
 * Wait for Chart.js to be loaded
 */
function waitForChart() {
    return new Promise((resolve, reject) => {
        if (window.Chart) {
            resolve();
        } else {
            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                if (window.Chart) {
                    clearInterval(interval);
                    resolve();
                } else if (attempts > 50) {
                    clearInterval(interval);
                    reject(new Error('Chart.js failed to load'));
                }
            }, 100);
        }
    });
}

/**
 * Initialize all charts for stats page
 */
export async function initializeCharts(sessions = [], games = [], routines = []) {
    try {
        // Wait for Chart.js to be available
        await waitForChart();

        // Wait for next tick to ensure DOM is ready
        setTimeout(() => {
            drawAccuracyChart(sessions, games, routines);
            drawPointsChart(sessions, games, routines);
            drawActivityMixChart(sessions, games, routines);
            drawDistanceChart(sessions);
            drawStreakCalendar(sessions, games, routines);
            drawGamePerformanceChart(games);
            drawWeeklyHeatmap(sessions, games, routines);
            drawPointsByActivityChart(sessions, games, routines);
        }, 100);
    } catch (error) {
        console.error('Failed to initialize charts:', error);
    }
}

/**
 * Destroy all charts (cleanup before re-render)
 */
export function destroyAllCharts() {
    const chartIds = [
        'accuracyChart',
        'pointsChart',
        'activityMixChart',
        'distanceChart',
        'streakCalendar',
        'gamePerformanceChart',
        'weeklyHeatmap',
        'pointsByActivityChart'
    ];

    chartIds.forEach(id => {
        const canvas = document.getElementById(id);
        if (canvas && canvas.chart) {
            canvas.chart.destroy();
        }
    });
}

/**
 * 1. Accuracy Over Time - Line chart
 */
function drawAccuracyChart(sessions, games, routines) {
    const canvas = document.getElementById('accuracyChart');
    if (!canvas || !window.Chart) {
        console.log('Canvas or Chart.js not available for accuracyChart');
        return;
    }
    // Combine all activities
    const allActivities = [
        ...sessions.map(s => ({ date: s.date, accuracy: s.percentage })),
        ...games.filter(g => g.percentage).map(g => ({
            date: new Date(g.endTime || g.timestamp).toISOString().split('T')[0],
            accuracy: g.percentage
        })),
        ...routines.filter(r => r.totalStats?.overallPercentage).map(r => ({
            date: new Date(r.endTime || r.timestamp).toISOString().split('T')[0],
            accuracy: r.totalStats.overallPercentage
        }))
    ];

    // Group by date and calculate daily average
    const dailyData = {};
    allActivities.forEach(activity => {
        if (!dailyData[activity.date]) {
            dailyData[activity.date] = { total: 0, count: 0 };
        }
        dailyData[activity.date].total += activity.accuracy;
        dailyData[activity.date].count += 1;
    });

    // Convert to sorted array
    const sortedDates = Object.keys(dailyData).sort();
    const last30Days = sortedDates.slice(-30);

    const labels = last30Days.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const data = last30Days.map(date => (dailyData[date].total / dailyData[date].count).toFixed(1));

    // Calculate 7-day moving average
    const movingAvg = [];
    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - 6);
        const values = data.slice(start, i + 1);
        const avg = values.reduce((sum, val) => sum + parseFloat(val), 0) / values.length;
        movingAvg.push(avg.toFixed(1));
    }

    if (canvas.chart) canvas.chart.destroy();

    canvas.chart = new window.Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Daily Accuracy',
                    data: data,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.3,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: '7-Day Average',
                    data: movingAvg,
                    borderColor: '#3b82f6',
                    borderDash: [5, 5],
                    tension: 0.3,
                    pointRadius: 0,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${context.parsed.y}%`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: Math.max(0, Math.min(...data) - 10),
                    max: 100,
                    ticks: {
                        callback: (value) => value + '%'
                    }
                }
            }
        }
    });
}

/**
 * 2. Points Progress - Area chart
 */
function drawPointsChart(sessions, games, routines) {
    const canvas = document.getElementById('pointsChart');
    if (!canvas || !window.Chart) return;

    // Combine all activities with points
    const allActivities = [
        ...sessions.map(s => ({ date: s.date, points: s.points || 0 })),
        ...games.map(g => ({
            date: new Date(g.endTime || g.timestamp).toISOString().split('T')[0],
            points: g.points || 0
        })),
        ...routines.map(r => ({
            date: new Date(r.endTime || r.timestamp).toISOString().split('T')[0],
            points: r.points || 0
        }))
    ];

    // Sort by date and calculate cumulative
    allActivities.sort((a, b) => new Date(a.date) - new Date(b.date));

    let cumulative = 0;
    const cumulativeData = {};

    allActivities.forEach(activity => {
        cumulative += activity.points;
        cumulativeData[activity.date] = cumulative;
    });

    const sortedDates = Object.keys(cumulativeData).sort();
    const last30Days = sortedDates.slice(-30);

    const labels = last30Days.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const data = last30Days.map(date => cumulativeData[date]);

    if (canvas.chart) canvas.chart.destroy();

    canvas.chart = new window.Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Points',
                data: data,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => value.toLocaleString()
                    }
                }
            }
        }
    });
}

/**
 * 3. Activity Mix - Doughnut chart
 */
function drawActivityMixChart(sessions, games, routines) {
    const canvas = document.getElementById('activityMixChart');
    if (!canvas || !window.Chart) return;

    const sessionCount = sessions.length;
    const gameCount = games.length;
    const routineCount = routines.length;

    if (canvas.chart) canvas.chart.destroy();

    canvas.chart = new window.Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['🎯 Practice Sessions', '🎮 Games', '📋 Routines'],
            datasets: [{
                data: [sessionCount, gameCount, routineCount],
                backgroundColor: [
                    '#8b5cf6',
                    '#3b82f6',
                    '#10b981'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const total = sessionCount + gameCount + routineCount;
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * 4. Distance Breakdown - Bar chart
 */
function drawDistanceChart(sessions) {
    const canvas = document.getElementById('distanceChart');
    if (!canvas || !window.Chart) return;

    const ranges = {
        '0-5ft': 0,
        '5-10ft': 0,
        '10-15ft': 0,
        '15-20ft': 0,
        '20-25ft': 0,
        '25-30ft': 0,
        '30+ft': 0
    };

    sessions.forEach(s => {
        const dist = s.distance || 0;
        if (dist < 5) ranges['0-5ft']++;
        else if (dist < 10) ranges['5-10ft']++;
        else if (dist < 15) ranges['10-15ft']++;
        else if (dist < 20) ranges['15-20ft']++;
        else if (dist < 25) ranges['20-25ft']++;
        else if (dist < 30) ranges['25-30ft']++;
        else ranges['30+ft']++;
    });

    if (canvas.chart) canvas.chart.destroy();

    canvas.chart = new window.Chart(canvas, {
        type: 'bar',
        data: {
            labels: Object.keys(ranges),
            datasets: [{
                label: 'Sessions',
                data: Object.values(ranges),
                backgroundColor: '#8b5cf6',
                borderColor: '#7c3aed',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

/**
 * 5. Streak Calendar - Heatmap-style calendar
 */
function drawStreakCalendar(sessions, games, routines) {
    const canvas = document.getElementById('streakCalendar');
    if (!canvas) return;

    // Get last 90 days
    const today = new Date();
    const daysAgo90 = new Date(today);
    daysAgo90.setDate(daysAgo90.getDate() - 89);

    // Count activities per day
    const activityCounts = {};

    const addActivity = (dateStr) => {
        activityCounts[dateStr] = (activityCounts[dateStr] || 0) + 1;
    };

    sessions.forEach(s => s.date && addActivity(s.date));
    games.forEach(g => {
        const date = new Date(g.endTime || g.timestamp).toISOString().split('T')[0];
        addActivity(date);
    });
    routines.forEach(r => {
        const date = new Date(r.endTime || r.timestamp).toISOString().split('T')[0];
        addActivity(date);
    });

    // Create day labels and data
    const days = [];
    const counts = [];

    for (let i = 0; i < 90; i++) {
        const date = new Date(daysAgo90);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        counts.push(activityCounts[dateStr] || 0);
    }

    // Color based on activity count
    const backgroundColors = counts.map(count => {
        if (count === 0) return '#f3f4f6';
        if (count === 1) return '#d8b4fe';
        if (count === 2) return '#c084fc';
        if (count === 3) return '#a855f7';
        return '#8b5cf6';
    });

    if (canvas.chart) canvas.chart.destroy();

    canvas.chart = new window.Chart(canvas, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Activities',
                data: counts,
                backgroundColor: backgroundColors,
                borderWidth: 1,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.parsed.y} activit${context.parsed.y !== 1 ? 'ies' : 'y'}`
                    }
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

/**
 * 6. Game Performance - Radar chart
 */
function drawGamePerformanceChart(games) {
    const canvas = document.getElementById('gamePerformanceChart');
    if (!canvas || !window.Chart) return;

    // Group by game name and calculate average score
    const gameStats = {};

    games.forEach(g => {
        if (!gameStats[g.gameName]) {
            gameStats[g.gameName] = { total: 0, count: 0 };
        }
        gameStats[g.gameName].total += g.percentage || g.score || 0;
        gameStats[g.gameName].count += 1;
    });

    const gameNames = Object.keys(gameStats);
    const averages = gameNames.map(name =>
        (gameStats[name].total / gameStats[name].count).toFixed(1)
    );

    if (gameNames.length === 0) {
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    if (canvas.chart) canvas.chart.destroy();

    canvas.chart = new window.Chart(canvas, {
        type: 'radar',
        data: {
            labels: gameNames,
            datasets: [{
                label: 'Average Performance',
                data: averages,
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                borderColor: '#8b5cf6',
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#8b5cf6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

/**
 * 7. Weekly Heatmap - Best practice times
 */
function drawWeeklyHeatmap(sessions, games, routines) {
    const canvas = document.getElementById('weeklyHeatmap');
    if (!canvas) return;

    // Count activities by day of week
    const dayCounts = {
        'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0
    };

    const countByDay = (dateStr) => {
        const date = new Date(dateStr);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        dayCounts[dayName]++;
    };

    sessions.forEach(s => s.date && countByDay(s.date));
    games.forEach(g => countByDay(g.endTime || g.timestamp));
    routines.forEach(r => countByDay(r.endTime || r.timestamp));

    if (canvas.chart) canvas.chart.destroy();

    canvas.chart = new window.Chart(canvas, {
        type: 'bar',
        data: {
            labels: Object.keys(dayCounts),
            datasets: [{
                label: 'Activities',
                data: Object.values(dayCounts),
                backgroundColor: '#8b5cf6',
                borderColor: '#7c3aed',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

/**
 * 8. Points by Activity Type - Stacked bar
 */
function drawPointsByActivityChart(sessions, games, routines) {
    const canvas = document.getElementById('pointsByActivityChart');
    if (!canvas || !window.Chart) return;

    const sessionPoints = sessions.reduce((sum, s) => sum + (s.points || 0), 0);
    const gamePoints = games.reduce((sum, g) => sum + (g.points || 0), 0);
    const routinePoints = routines.reduce((sum, r) => sum + (r.points || 0), 0);

    if (canvas.chart) canvas.chart.destroy();

    canvas.chart = new window.Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['Total Points'],
            datasets: [
                {
                    label: '🎯 Sessions',
                    data: [sessionPoints],
                    backgroundColor: '#8b5cf6'
                },
                {
                    label: '🎮 Games',
                    data: [gamePoints],
                    backgroundColor: '#3b82f6'
                },
                {
                    label: '📋 Routines',
                    data: [routinePoints],
                    backgroundColor: '#10b981'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${context.parsed.y.toLocaleString()} pts`
                    }
                }
            },
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => value.toLocaleString()
                    }
                }
            }
        }
    });
}
