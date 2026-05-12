export interface TradeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface TradeRequest {
  userId: string;
  marketId: string;
  side: 'YES' | 'NO';
  amount: number;
  userBalance: number;
}

interface MarketState {
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'RESOLVED';
  probability: number;
  volume: number;
}

export function validateTrade(
  request: TradeRequest,
  marketState: MarketState,
  minAmount: number,
  maxAmount: number
): TradeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!request.userId) {
    errors.push('User ID is required');
  }

  if (!request.marketId) {
    errors.push('Market ID is required');
  }

  if (request.side !== 'YES' && request.side !== 'NO') {
    errors.push('Side must be YES or NO');
  }

  if (typeof request.amount !== 'number' || isNaN(request.amount)) {
    errors.push('Amount must be a valid number');
  } else {
    if (request.amount < minAmount) {
      errors.push(`Amount must be at least ${minAmount}`);
    }
    if (request.amount > maxAmount) {
      errors.push(`Amount cannot exceed ${maxAmount}`);
    }
  }

  if (request.userBalance < request.amount) {
    errors.push('Insufficient balance');
  }

  if (marketState.status !== 'ACTIVE') {
    errors.push(`Market is ${marketState.status.toLowerCase()}, trading not allowed`);
  }

  const probability = marketState.probability;
  if (request.side === 'YES' && probability > 0.99) {
    warnings.push('YES probability is very high, consider the risk');
  }
  if (request.side === 'NO' && probability < 0.01) {
    warnings.push('YES probability is very low, consider the risk');
  }

  const priceImpactThreshold = 0.1;
  const estimatedImpact = request.amount / (marketState.volume + 1000);
  if (estimatedImpact > priceImpactThreshold) {
    warnings.push('This trade may have significant price impact');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateMarketCreation(params: {
  question: string;
  initialProbability: number;
  liquidityParam: number;
  closesAt: Date;
}): TradeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!params.question || params.question.length < 10) {
    errors.push('Question must be at least 10 characters');
  }

  if (params.question && params.question.length > 500) {
    errors.push('Question cannot exceed 500 characters');
  }

  if (params.initialProbability < 0.01 || params.initialProbability > 0.99) {
    errors.push('Initial probability must be between 0.01 and 0.99');
  }

  if (params.liquidityParam < 10) {
    errors.push('Liquidity parameter must be at least 10');
  }

  if (params.liquidityParam > 10000) {
    warnings.push('High liquidity parameter may reduce price sensitivity');
  }

  const now = new Date();
  if (params.closesAt <= now) {
    errors.push('Close date must be in the future');
  }

  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  if (params.closesAt > oneYearFromNow) {
    warnings.push('Market closes more than a year from now');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateMarketResolution(params: {
  outcome: 'YES' | 'NO' | 'CANCELLED';
  resolutionSource: string;
}): TradeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!['YES', 'NO', 'CANCELLED'].includes(params.outcome)) {
    errors.push('Outcome must be YES, NO, or CANCELLED');
  }

  if (!params.resolutionSource || params.resolutionSource.length < 5) {
    errors.push('Resolution source must be at least 5 characters');
  }

  if (params.outcome === 'CANCELLED') {
    warnings.push('Cancelling a market will refund all positions');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
