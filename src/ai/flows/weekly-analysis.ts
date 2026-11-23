import type { WeeklyAnalysis, ProgressData } from '@/types';

interface WeeklyAnalysisInput {
  weekData: ProgressData[];
  previousWeekData?: ProgressData[];
  apiKey: string;
}

function safeAverage(values: number[], fallback = 0): number {
  if (!values || values.length === 0) return fallback;
  const sum = values.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);
  return sum / values.length;
}

function calculateSimpleAnalysis(current: ProgressData[], previous: ProgressData[] = []): WeeklyAnalysis {
  const completionRates = current.map(d => d.completionRate || 0);
  const productivityScores = current.map(d => d.productivityScore || 0);
  const consistencyScores = current.map(d => d.consistencyScore || 0);
  const balanceScores = current.map(d => d.balanceScore || 0);

  const totalWorkHours = current.reduce((acc, d) => acc + (d.workHours || 0), 0);
  const totalPersonalHours = current.reduce((acc, d) => acc + (d.personalHours || 0), 0);

  const avgCompletion = safeAverage(completionRates, 0);
  const avgProductivity = safeAverage(productivityScores, 0);
  const avgConsistency = safeAverage(consistencyScores, 0);
  const avgBalance = safeAverage(balanceScores, 0);

  // Simple weighted overall score
  const overallScore = Math.round(
    0.35 * avgCompletion +
    0.30 * avgProductivity +
    0.20 * avgConsistency +
    0.15 * avgBalance
  );

  // Compare against previous week (if provided)
  const prevAvgCompletion = safeAverage(previous.map(d => d.completionRate || 0), 0);
  const prevAvgProductivity = safeAverage(previous.map(d => d.productivityScore || 0), 0);
  const prevAvgConsistency = safeAverage(previous.map(d => d.consistencyScore || 0), 0);
  const prevAvgBalance = safeAverage(previous.map(d => d.balanceScore || 0), 0);

  const completionDelta = avgCompletion - prevAvgCompletion;
  const productivityDelta = avgProductivity - prevAvgProductivity;
  const consistencyDelta = avgConsistency - prevAvgConsistency;
  const balanceDelta = avgBalance - prevAvgBalance;

  const insights: WeeklyAnalysis['insights'] = [
    {
      title: 'Completion performance',
      description: `Your average completion rate is ${Math.round(avgCompletion)}%.` ,
      type: 'productivity',
      impact: avgCompletion >= 70 ? 'positive' : avgCompletion >= 50 ? 'neutral' : 'negative',
      metric: Math.round(avgCompletion),
      previousWeek: Math.round(prevAvgCompletion)
    },
    {
      title: 'Productivity trend',
      description: `Productivity score changed by ${Math.round(productivityDelta)} points vs last week.`,
      type: 'improvement',
      impact: productivityDelta >= 0 ? 'positive' : 'negative',
      metric: Math.round(avgProductivity),
      previousWeek: Math.round(prevAvgProductivity)
    }
  ];

  const recommendations: WeeklyAnalysis['recommendations'] = [
    {
      title: 'Focus on consistent scheduling',
      description: 'Block similar tasks together and set realistic durations to improve consistency.',
      priority: avgConsistency < 60 ? 'high' : 'medium',
      expectedImpact: 8,
      actionable: true
    },
    {
      title: 'Balance work and personal time',
      description: 'Ensure at least 30–40% of time is reserved for recovery and personal activities.',
      priority: avgBalance < 60 ? 'medium' : 'low',
      expectedImpact: 5,
      actionable: true
    }
  ];

  const trends: WeeklyAnalysis['trends'] = [
    {
      metric: 'Completion',
      currentValue: Math.round(avgCompletion),
      previousValue: Math.round(prevAvgCompletion),
      change: Math.round(completionDelta),
      direction: completionDelta > 1 ? 'up' : completionDelta < -1 ? 'down' : 'stable',
      significance: Math.abs(completionDelta) > 5 ? 'high' : 'medium'
    },
    {
      metric: 'Productivity',
      currentValue: Math.round(avgProductivity),
      previousValue: Math.round(prevAvgProductivity),
      change: Math.round(productivityDelta),
      direction: productivityDelta > 1 ? 'up' : productivityDelta < -1 ? 'down' : 'stable',
      significance: Math.abs(productivityDelta) > 5 ? 'high' : 'medium'
    }
  ];

  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    completionRate: Math.round(avgCompletion),
    productivityScore: Math.round(avgProductivity),
    consistencyScore: Math.round(avgConsistency),
    balanceScore: Math.round(avgBalance),
    totalWorkHours,
    totalPersonalHours,
    totalBreakHours: 0,
    totalStudyHours: 0,
    insights,
    recommendations,
    trends
  };
}

export async function getWeeklyAnalysis(input: WeeklyAnalysisInput): Promise<WeeklyAnalysis> {
  const { weekData, previousWeekData } = input;
  // Minimal, deterministic implementation to satisfy API usage
  return calculateSimpleAnalysis(Array.isArray(weekData) ? weekData : [], Array.isArray(previousWeekData) ? previousWeekData : []);
}


