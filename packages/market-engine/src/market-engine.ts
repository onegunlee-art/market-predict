import Decimal from 'decimal.js';
import { LMSR, LMSRState } from './lmsr';
import { validateTrade, TradeValidationResult } from './validation';

export interface MarketEngineConfig {
  liquidityParam: number;
  minTradeAmount: number;
  maxTradeAmount: number;
  tradeFeePercent: number;
}

export interface TradeRequest {
  userId: string;
  marketId: string;
  side: 'YES' | 'NO';
  amount: number;
  userBalance: number;
}

export interface TradeResult {
  success: boolean;
  trade?: {
    shares: number;
    cost: number;
    fee: number;
    totalCost: number;
    avgPrice: number;
    probabilityBefore: number;
    probabilityAfter: number;
    priceImpact: number;
  };
  error?: string;
  newState?: {
    yesShares: number;
    noShares: number;
    probability: number;
    volume: number;
  };
}

export interface MarketState {
  yesShares: number;
  noShares: number;
  liquidityParam: number;
  probability: number;
  volume: number;
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'RESOLVED';
}

export class MarketEngine {
  private config: MarketEngineConfig;

  constructor(config: Partial<MarketEngineConfig> = {}) {
    this.config = {
      liquidityParam: config.liquidityParam ?? 100,
      minTradeAmount: config.minTradeAmount ?? 1,
      maxTradeAmount: config.maxTradeAmount ?? 10000,
      tradeFeePercent: config.tradeFeePercent ?? 0.02,
    };
  }

  /**
   * Initialize a new market with given parameters
   */
  initializeMarket(initialProbability: number = 0.5): MarketState {
    const state = LMSR.initializeMarket(
      this.config.liquidityParam,
      initialProbability
    );

    return {
      yesShares: state.yesShares.toNumber(),
      noShares: state.noShares.toNumber(),
      liquidityParam: this.config.liquidityParam,
      probability: initialProbability,
      volume: 0,
      status: 'ACTIVE',
    };
  }

  /**
   * Get a quote for a potential trade
   */
  getQuote(
    marketState: MarketState,
    side: 'YES' | 'NO',
    amount: number
  ): {
    shares: number;
    cost: number;
    fee: number;
    totalCost: number;
    avgPrice: number;
    probabilityAfter: number;
    priceImpact: number;
  } {
    const lmsr = new LMSR(marketState.liquidityParam);
    const state: LMSRState = {
      yesShares: new Decimal(marketState.yesShares),
      noShares: new Decimal(marketState.noShares),
      liquidityParam: new Decimal(marketState.liquidityParam),
    };

    const shares = lmsr.calculateSharesForCost(state, side, amount);
    const cost = amount;
    const fee = cost * this.config.tradeFeePercent;
    const totalCost = cost + fee;
    const avgPrice = new Decimal(cost).div(shares).toNumber();

    const { newProbability, priceImpact } = lmsr.executeTrade(
      state,
      side,
      shares.toNumber()
    );

    return {
      shares: shares.toNumber(),
      cost,
      fee,
      totalCost,
      avgPrice,
      probabilityAfter: newProbability.toNumber(),
      priceImpact: priceImpact.toNumber(),
    };
  }

  /**
   * Execute a trade
   */
  executeTrade(marketState: MarketState, request: TradeRequest): TradeResult {
    const validation = validateTrade(
      request,
      marketState,
      this.config.minTradeAmount,
      this.config.maxTradeAmount
    );

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', '),
      };
    }

    const quote = this.getQuote(marketState, request.side, request.amount);

    if (quote.totalCost > request.userBalance) {
      return {
        success: false,
        error: 'Insufficient balance',
      };
    }

    const lmsr = new LMSR(marketState.liquidityParam);
    const state: LMSRState = {
      yesShares: new Decimal(marketState.yesShares),
      noShares: new Decimal(marketState.noShares),
      liquidityParam: new Decimal(marketState.liquidityParam),
    };

    const probabilityBefore = lmsr
      .probability(state.yesShares, state.noShares)
      .toNumber();

    const { newState, newProbability, priceImpact } = lmsr.executeTrade(
      state,
      request.side,
      quote.shares
    );

    return {
      success: true,
      trade: {
        shares: quote.shares,
        cost: quote.cost,
        fee: quote.fee,
        totalCost: quote.totalCost,
        avgPrice: quote.avgPrice,
        probabilityBefore,
        probabilityAfter: newProbability.toNumber(),
        priceImpact: priceImpact.toNumber(),
      },
      newState: {
        yesShares: newState.yesShares.toNumber(),
        noShares: newState.noShares.toNumber(),
        probability: newProbability.toNumber(),
        volume: marketState.volume + quote.cost,
      },
    };
  }

  /**
   * Calculate payouts at market resolution
   */
  calculateResolutionPayouts(
    positions: Array<{
      userId: string;
      yesShares: number;
      noShares: number;
    }>,
    outcome: 'YES' | 'NO' | 'CANCELLED'
  ): Array<{
    userId: string;
    payout: number;
  }> {
    return positions.map((position) => {
      let payout = 0;

      if (outcome === 'YES') {
        payout = position.yesShares;
      } else if (outcome === 'NO') {
        payout = position.noShares;
      }

      return {
        userId: position.userId,
        payout,
      };
    });
  }

  /**
   * Update liquidity parameter
   */
  updateLiquidity(marketState: MarketState, newLiquidity: number): MarketState {
    const currentProbability = this.calculateProbability(marketState);
    const newState = LMSR.initializeMarket(newLiquidity, currentProbability);

    return {
      ...marketState,
      yesShares: newState.yesShares.toNumber(),
      noShares: newState.noShares.toNumber(),
      liquidityParam: newLiquidity,
    };
  }

  /**
   * Calculate current probability
   */
  calculateProbability(marketState: MarketState): number {
    const lmsr = new LMSR(marketState.liquidityParam);
    return lmsr
      .probability(
        new Decimal(marketState.yesShares),
        new Decimal(marketState.noShares)
      )
      .toNumber();
  }

  /**
   * Get current prices
   */
  getCurrentPrices(marketState: MarketState): { yes: number; no: number } {
    const probability = this.calculateProbability(marketState);
    return {
      yes: probability,
      no: 1 - probability,
    };
  }

  get configuration(): MarketEngineConfig {
    return { ...this.config };
  }
}
