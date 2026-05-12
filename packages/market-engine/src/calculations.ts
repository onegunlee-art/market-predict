import Decimal from 'decimal.js';
import { LMSR, LMSRState } from './lmsr';

/**
 * Calculate the current probability from market state
 */
export function calculateProbability(
  yesShares: number,
  noShares: number,
  liquidityParam: number
): number {
  const lmsr = new LMSR(liquidityParam);
  const state: LMSRState = {
    yesShares: new Decimal(yesShares),
    noShares: new Decimal(noShares),
    liquidityParam: new Decimal(liquidityParam),
  };
  return lmsr.probability(state.yesShares, state.noShares).toNumber();
}

/**
 * Calculate the cost of a trade
 */
export function calculateCost(
  yesShares: number,
  noShares: number,
  liquidityParam: number,
  side: 'YES' | 'NO',
  shares: number
): number {
  const lmsr = new LMSR(liquidityParam);
  const state: LMSRState = {
    yesShares: new Decimal(yesShares),
    noShares: new Decimal(noShares),
    liquidityParam: new Decimal(liquidityParam),
  };
  return lmsr.calculateBuyCost(state, side, shares).toNumber();
}

/**
 * Calculate shares for a given cost
 */
export function calculateShares(
  yesShares: number,
  noShares: number,
  liquidityParam: number,
  side: 'YES' | 'NO',
  cost: number
): number {
  const lmsr = new LMSR(liquidityParam);
  const state: LMSRState = {
    yesShares: new Decimal(yesShares),
    noShares: new Decimal(noShares),
    liquidityParam: new Decimal(liquidityParam),
  };
  return lmsr.calculateSharesForCost(state, side, cost).toNumber();
}

/**
 * Calculate the price impact of a trade
 */
export function calculatePriceImpact(
  yesShares: number,
  noShares: number,
  liquidityParam: number,
  side: 'YES' | 'NO',
  shares: number
): {
  probabilityBefore: number;
  probabilityAfter: number;
  priceImpact: number;
} {
  const lmsr = new LMSR(liquidityParam);
  const state: LMSRState = {
    yesShares: new Decimal(yesShares),
    noShares: new Decimal(noShares),
    liquidityParam: new Decimal(liquidityParam),
  };

  const probabilityBefore = lmsr.probability(state.yesShares, state.noShares);
  const { newProbability } = lmsr.executeTrade(state, side, shares);

  const priceImpact = newProbability.minus(probabilityBefore).abs();

  return {
    probabilityBefore: probabilityBefore.toNumber(),
    probabilityAfter: newProbability.toNumber(),
    priceImpact: priceImpact.toNumber(),
  };
}

/**
 * Calculate the expected value of a position
 */
export function calculateExpectedValue(
  shares: number,
  probability: number,
  side: 'YES' | 'NO'
): number {
  const effectiveProbability = side === 'YES' ? probability : 1 - probability;
  return shares * effectiveProbability;
}

/**
 * Calculate unrealized PnL for a position
 */
export function calculateUnrealizedPnl(
  shares: number,
  avgPrice: number,
  currentProbability: number,
  side: 'YES' | 'NO'
): number {
  const currentPrice = side === 'YES' ? currentProbability : 1 - currentProbability;
  return shares * (currentPrice - avgPrice);
}

/**
 * Calculate the maximum loss for a position
 */
export function calculateMaxLoss(shares: number, avgPrice: number): number {
  return shares * avgPrice;
}

/**
 * Calculate the maximum profit for a position
 */
export function calculateMaxProfit(shares: number, avgPrice: number): number {
  return shares * (1 - avgPrice);
}

/**
 * Calculate the breakeven probability for a position
 */
export function calculateBreakeven(
  shares: number,
  cost: number,
  side: 'YES' | 'NO'
): number {
  const avgPrice = cost / shares;
  return side === 'YES' ? avgPrice : 1 - avgPrice;
}

/**
 * Calculate payout at resolution
 */
export function calculatePayout(
  shares: number,
  side: 'YES' | 'NO',
  outcome: 'YES' | 'NO' | 'CANCELLED'
): number {
  if (outcome === 'CANCELLED') {
    return 0;
  }
  return side === outcome ? shares : 0;
}
