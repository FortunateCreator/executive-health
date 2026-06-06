function getDurationScore(durationMinutes) {
    if (durationMinutes >= 420 && durationMinutes <= 540)
        return 100;
    if ((durationMinutes >= 360 && durationMinutes < 420) || (durationMinutes > 540 && durationMinutes <= 600))
        return 70;
    return 40;
}
function getConsistencyScore(records) {
    if (records.length < 2)
        return 100; // Not enough data, assume good consistency
    const bedtimes = records.map(r => new Date(r.bedtime).getTime());
    const mean = bedtimes.reduce((sum, t) => sum + t, 0) / bedtimes.length;
    const varianceMs = bedtimes.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / bedtimes.length;
    const varianceMinutes = Math.sqrt(varianceMs) / 60000;
    if (varianceMinutes < 30)
        return 100;
    if (varianceMinutes < 60)
        return 70;
    if (varianceMinutes < 90)
        return 50;
    return 30;
}
function getQualityScore(quality) {
    switch (quality) {
        case 'excellent': return 100;
        case 'good': return 75;
        case 'fair': return 50;
        case 'poor': return 25;
    }
}
function generateRecommendation(durationScore, consistencyScore, qualityScore, sleepDebt) {
    const scores = [
        { label: 'duration', score: durationScore, tip: 'Aim for 7-9 hours of sleep per night. Try setting a consistent bedtime and wake-up schedule to hit this target.' },
        { label: 'consistency', score: consistencyScore, tip: 'Try to go to bed at the same time each night to improve consistency. Even weekends should follow a similar schedule.' },
        { label: 'quality', score: qualityScore, tip: 'Focus on sleep quality by avoiding screens before bed, keeping your room cool and dark, and limiting caffeine after 2pm.' },
    ];
    if (sleepDebt > 120) {
        return 'You have significant sleep debt. Try going to bed 30-60 minutes earlier for the next week to recover.';
    }
    const lowest = scores.reduce((min, curr) => curr.score < min.score ? curr : min);
    return lowest.tip;
}
export function generateEnhancedRecommendations(durationScore, consistencyScore, qualityScore, sleepDebt, records) {
    const all = [];
    // Duration recommendations
    if (durationScore < 60) {
        all.push({
            id: 'duration-critical',
            category: 'duration',
            icon: '⏰',
            title: 'Sleep Duration Needs Improvement',
            tip: 'Your sleep duration is below the recommended range. Aim for 7-9 hours per night. Start by going to bed 30 minutes earlier and gradually adjust.',
            priority: 'critical',
            action: 'Set a bedtime alarm 30 minutes before your target bedtime.',
        });
    }
    else if (durationScore < 80) {
        all.push({
            id: 'duration-moderate',
            category: 'duration',
            icon: '⏰',
            title: 'Extend Your Sleep Duration',
            tip: 'You are close to optimal sleep duration. Adding just 15-30 more minutes per night can make a noticeable difference in recovery and alertness.',
            priority: 'medium',
            action: 'Try winding down 15 minutes earlier tonight.',
        });
    }
    // Consistency recommendations
    if (consistencyScore < 50) {
        all.push({
            id: 'consistency-high',
            category: 'consistency',
            icon: '🔄',
            title: 'Bedtime Varies Too Much',
            tip: 'Your bedtimes vary significantly from night to night. Irregular sleep timing disrupts your circadian rhythm and reduces sleep quality even when you get enough hours.',
            priority: 'high',
            action: 'Pick a fixed bedtime and stick to it for the next 7 days — even on weekends.',
        });
    }
    else if (consistencyScore < 80 && records.length >= 3) {
        all.push({
            id: 'consistency-moderate',
            category: 'consistency',
            icon: '🔄',
            title: 'Improve Bedtime Consistency',
            tip: 'Your bedtimes show some variability. Tightening your sleep window by just 15-20 minutes can boost your consistency score.',
            priority: 'medium',
            action: 'Aim to go to bed within the same 30-minute window each night.',
        });
    }
    // Quality recommendations
    if (qualityScore < 60) {
        all.push({
            id: 'quality-high',
            category: 'quality',
            icon: '🛌',
            title: 'Sleep Quality Needs Attention',
            tip: 'Your self-reported sleep quality suggests restless nights. Focus on creating a wind-down routine: dim lights, no screens 60 minutes before bed, and keep your room cool (65-68°F / 18-20°C).',
            priority: 'high',
            action: 'Remove screens from your bedroom and try reading or meditation before bed.',
        });
    }
    else if (qualityScore < 80) {
        all.push({
            id: 'quality-moderate',
            category: 'quality',
            icon: '🛌',
            title: 'Boost Your Sleep Quality',
            tip: 'Your sleep quality is decent but could be better. Try limiting caffeine after 2pm, avoiding alcohol close to bedtime, and keeping your bedroom dark and quiet.',
            priority: 'medium',
            action: 'Track your caffeine intake and cut off by 2pm.',
        });
    }
    // Sleep debt recommendations
    if (sleepDebt > 120) {
        all.push({
            id: 'debt-critical',
            category: 'debt',
            icon: '🚨',
            title: 'Significant Sleep Debt Accumulated',
            tip: `You have over ${Math.round(sleepDebt / 60)} hours of sleep debt. This level of deficit impairs cognitive function, mood, and immune response. Prioritize recovery sleep over the next week.`,
            priority: 'critical',
            action: 'Go to bed 45-60 minutes earlier each night this week to pay down your sleep debt.',
        });
    }
    else if (sleepDebt > 60) {
        all.push({
            id: 'debt-medium',
            category: 'debt',
            icon: '💤',
            title: 'Moderate Sleep Debt',
            tip: `You have about ${Math.round(sleepDebt / 60)} hours of accumulated sleep debt. A few nights of extra sleep will help you recover and restore peak performance.`,
            priority: 'medium',
            action: 'Add 30 minutes to your sleep for the next 3-4 nights.',
        });
    }
    // Timing — check for late bedtimes in records
    if (records.length > 0) {
        const lateBedtimes = records.filter(r => {
            const h = new Date(r.bedtime).getHours();
            return h >= 1 && h < 5; // 1am-5am bedtimes
        });
        if (lateBedtimes.length >= 3) {
            all.push({
                id: 'timing-late',
                category: 'timing',
                icon: '🌙',
                title: 'Bedtime Is Too Late',
                tip: 'You frequently go to bed after midnight. Late bedtimes are associated with poorer sleep quality and misalignment with natural circadian rhythms.',
                priority: 'high',
                action: 'Gradually shift bedtime earlier by 15 minutes every 2-3 days.',
            });
        }
    }
    // All good — positive reinforcement
    if (durationScore > 80 && consistencyScore > 80 && qualityScore > 80 && sleepDebt < 60) {
        all.push({
            id: 'recovery-great',
            category: 'recovery',
            icon: '🌟',
            title: 'Great Sleep Habits!',
            tip: 'Your sleep metrics are all in great shape! Consistent, sufficient, high-quality sleep is one of the most powerful tools for executive health and longevity. Keep it up!',
            priority: 'low',
            action: 'Maintain your current routine — it is working well.',
        });
    }
    // Sort by priority: critical > high > medium > low
    const priorityOrder = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
    };
    all.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    // Max 5 recommendations, highest priority
    return all.slice(0, 5);
}
export function generateContextualTip(currentHour, hasRecords, minutesSinceIdle) {
    if (!hasRecords)
        return 'Start logging your sleep to get personalized tips.';
    if (currentHour >= 20 || currentHour < 3) {
        return 'It\'s a good time to wind down. Put away screens and try reading or meditation.';
    }
    if (currentHour >= 3 && currentHour < 6) {
        return 'Early morning hours — if you\'re awake, try to stay in bed and relax until it\'s time to rise.';
    }
    if (currentHour >= 6 && currentHour < 12) {
        if (minutesSinceIdle !== undefined && minutesSinceIdle > 30) {
            return 'Good morning! Log last night\'s sleep to track your patterns.';
        }
        return 'A consistent wake-up time helps regulate your circadian rhythm.';
    }
    return 'Stay active during the day to improve sleep quality tonight.';
}
export function calculateSleepScore(records, referenceDate) {
    // Use the most recent record for duration/quality scores
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    const latest = sorted[0];
    // Date 7 days before referenceDate for the lookback window
    const refDate = new Date(referenceDate);
    const sevenDaysAgo = new Date(refDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString().slice(0, 10);
    // Filter records within the last 7 days
    const recentRecords = records.filter(r => r.date >= startDate && r.date <= referenceDate);
    // Duration score from the latest record
    const durationScore = latest ? getDurationScore(latest.duration_minutes) : 0;
    // Consistency score from recent records
    const consistencyScore = getConsistencyScore(recentRecords);
    // Quality score from the latest record
    const qualityScore = latest ? getQualityScore(latest.quality) : 0;
    // Recovery index: weighted combination
    const recoveryIndex = Math.round(durationScore * 0.4 + consistencyScore * 0.3 + qualityScore * 0.3);
    // Sleep debt: sum of max(0, 480 - duration) over last 7 days
    const sleepDebtMinutes = recentRecords.reduce((debt, r) => debt + Math.max(0, 480 - r.duration_minutes), 0);
    // Overall score: weighted combination
    const overall = Math.round(durationScore * 0.35 + consistencyScore * 0.25 + qualityScore * 0.25 + recoveryIndex * 0.15);
    const recommendation = generateRecommendation(durationScore, consistencyScore, qualityScore, sleepDebtMinutes);
    return {
        overall,
        duration_score: durationScore,
        consistency_score: consistencyScore,
        quality_score: qualityScore,
        recovery_index: recoveryIndex,
        sleep_debt_minutes: sleepDebtMinutes,
        recommendation,
        calculated_at: new Date().toISOString(),
    };
}
