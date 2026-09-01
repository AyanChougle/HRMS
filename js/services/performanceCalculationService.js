/**
 * DIALLO HRMS — PERFORMANCE CALCULATION & SCORING SERVICE (PHASE 8)
 * Central mathematical engine for weighted Goal achievements, Competency evaluations, and Overall Ratings
 */

const performanceCalculationService = {
  // Standard 5-Point Rating Scale Definitions
  RATING_SCALE: [
    { score: 1, label: 'Needs Improvement', min: 1.0, max: 1.9, color: 'var(--danger)' },
    { score: 2, label: 'Developing', min: 2.0, max: 2.9, color: 'var(--warning)' },
    { score: 3, label: 'Meets Expectations', min: 3.0, max: 3.9, color: 'var(--primary)' },
    { score: 4, label: 'Exceeds Expectations', min: 4.0, max: 4.5, color: 'var(--info)' },
    { score: 5, label: 'Outstanding', min: 4.6, max: 5.0, color: 'var(--success)' }
  ],

  // 1. Calculate weighted goal achievement score (Scale 1 to 5)
  calculateGoalScore(goals = []) {
    if (!goals || goals.length === 0) return 3.0;

    let weightedSum = 0;
    let totalWeight = 0;

    goals.forEach(g => {
      const weight = Number(g.weight) || (100 / goals.length);
      const progress = Math.min(100, Math.max(0, Number(g.progress) || 0));
      // Convert progress percentage (0-100%) to 1-5 score: Score = 1 + (Progress / 100) * 4
      const goalScore = 1 + (progress / 100) * 4;
      weightedSum += goalScore * weight;
      totalWeight += weight;
    });

    if (totalWeight === 0) return 3.0;
    const finalScore = weightedSum / totalWeight;
    return Number(finalScore.toFixed(2));
  },

  // 2. Calculate average competency rating (Scale 1 to 5)
  calculateCompetencyScore(competencyRatings = []) {
    if (!competencyRatings || competencyRatings.length === 0) return 3.0;

    let sum = 0;
    competencyRatings.forEach(c => {
      sum += Math.min(5, Math.max(1, Number(c.rating) || 3));
    });

    const avg = sum / competencyRatings.length;
    return Number(avg.toFixed(2));
  },

  // 3. Calculate overall composite performance score
  // Default Policy: 60% Goals Weight + 40% Competencies Weight
  calculateOverallScore(goalScore, competencyScore, goalWeight = 0.60, compWeight = 0.40) {
    const gScore = Number(goalScore) || 3.0;
    const cScore = Number(competencyScore) || 3.0;
    const overall = (gScore * goalWeight) + (cScore * compWeight);
    return Number(overall.toFixed(2));
  },

  // 4. Get descriptive rating label for a numerical score
  getRatingLabel(score) {
    const num = Number(score) || 3.0;
    for (const r of this.RATING_SCALE) {
      if (num >= r.min && num <= r.max) {
        return r.label;
      }
    }
    return num >= 4.6 ? 'Outstanding' : 'Meets Expectations';
  },

  // 5. Validate that total goal weights do not exceed 100%
  validateTotalWeights(goals = []) {
    const total = goals.reduce((acc, g) => acc + (Number(g.weight) || 0), 0);
    return {
      isValid: total <= 100,
      totalWeight: total,
      remainingWeight: Math.max(0, 100 - total)
    };
  }
};

window.performanceCalculationService = performanceCalculationService;
