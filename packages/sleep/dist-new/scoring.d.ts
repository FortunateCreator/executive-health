import type { SleepRecord } from '@executive-health/db';
export interface SleepScore {
    overall: number;
    duration_score: number;
    consistency_score: number;
    quality_score: number;
    recovery_index: number;
    sleep_debt_minutes: number;
    recommendation: string;
    calculated_at: string;
}
export interface SleepRecommendation {
    id: string;
    category: 'duration' | 'consistency' | 'quality' | 'debt' | 'timing' | 'recovery';
    icon: string;
    title: string;
    tip: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    action?: string;
}
export declare function generateEnhancedRecommendations(durationScore: number, consistencyScore: number, qualityScore: number, sleepDebt: number, records: {
    date: string;
    bedtime: string;
    wake_time: string;
    quality: string;
    duration_minutes: number;
}[]): SleepRecommendation[];
export declare function generateContextualTip(currentHour: number, hasRecords: boolean, minutesSinceIdle?: number): string;
export declare function calculateSleepScore(records: SleepRecord[], referenceDate: string): SleepScore;
