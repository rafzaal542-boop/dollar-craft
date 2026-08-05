import BigNumber from 'bignumber.js';

// Configure BigNumber for extreme financial precision (18 decimal places, explicit ROUND_DOWN for safety)
BigNumber.config({
  DECIMAL_PLACES: 18,
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
  EXPONENTIAL_AT: [-18, 30]
});

export { BigNumber };

/**
 * Calculates continuous micro-yield earned over an elapsed time delta.
 * Formula:
 * MicroYield = (Principal * (DailyRate / 100)) / (86400 / IntervalInSeconds) * (ElapsedSeconds / IntervalInSeconds)
 * Simplified direct rate per second:
 * MicroYieldPerSecond = Principal * (DailyRate / 100) / 86400
 * AccruedYield = MicroYieldPerSecond * ElapsedSeconds
 */
export function calculateMicroYield(
  principal: string | number | BigNumber,
  dailyYieldPercent: string | number | BigNumber,
  elapsedSeconds: number
): BigNumber {
  const p = new BigNumber(principal);
  const dailyRateFraction = new BigNumber(dailyYieldPercent).dividedBy(100);
  const secondsInDay = new BigNumber(86400);

  // Rate earned per single second
  const yieldPerSecond = p.multipliedBy(dailyRateFraction).dividedBy(secondsInDay);

  // Accrued yield over exact elapsed seconds (with sub-second micro precision if needed)
  const accrued = yieldPerSecond.multipliedBy(elapsedSeconds);

  return accrued;
}

/**
 * Calculate rate earned per second for live counter ticking on UI
 */
export function calculateYieldPerSecond(
  principal: string | number | BigNumber,
  dailyYieldPercent: string | number | BigNumber
): BigNumber {
  const p = new BigNumber(principal);
  const dailyRateFraction = new BigNumber(dailyYieldPercent).dividedBy(100);
  return p.multipliedBy(dailyRateFraction).dividedBy(86400);
}

/**
 * Fraud verification check: Validates if accrued yield exceeds maximum mathematical possibility
 */
export function isYieldWithinMathematicalLimit(
  principal: string | number,
  dailyYieldPercent: number,
  startTimeMs: number,
  totalAccruedYield: string | number
): { valid: boolean; maxAllowed: BigNumber; actual: BigNumber; deviationFactor: number } {
  const nowMs = Date.now();
  const totalElapsedSeconds = Math.max(0, (nowMs - startTimeMs) / 1000);

  // Max theoretical output assuming 100% execution without compounding glitches + 0.1% tolerance margin
  const maxAllowed = calculateMicroYield(principal, dailyYieldPercent, totalElapsedSeconds).multipliedBy(1.001);
  const actual = new BigNumber(totalAccruedYield);

  const isValid = actual.isLessThanOrEqualTo(maxAllowed);
  const deviationFactor = actual.dividedBy(maxAllowed.isZero() ? 1 : maxAllowed).toNumber();

  return {
    valid: isValid,
    maxAllowed,
    actual,
    deviationFactor
  };
}

/**
 * Format high precision decimal string for display with controlled decimal places
 */
export function formatPrecision(
  val: string | number | BigNumber,
  decimals: number = 12
): string {
  const bn = new BigNumber(val || 0);
  if (bn.isNaN()) return '0.' + '0'.repeat(decimals);
  
  const parts = bn.toFixed(18).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fractionalPart = (parts[1] || '').substring(0, decimals).padEnd(decimals, '0');
  
  return `${integerPart}.${fractionalPart}`;
}

/**
 * Formats currency standard display ($1,234.56)
 */
export function formatCurrency(val: string | number | BigNumber): string {
  const bn = new BigNumber(val || 0);
  return `$${bn.toFormat(2, BigNumber.ROUND_DOWN)}`;
}
