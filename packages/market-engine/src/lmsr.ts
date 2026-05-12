import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface LMSRState {
  yesShares: Decimal;
  noShares: Decimal;
  liquidityParam: Decimal;
}

export interface LMSRConfig {
  liquidityParam: number;
  minLiquidity?: number;
  maxLiquidity?: number;
}

export class LMSR {
  private b: Decimal;

  constructor(liquidityParam: number) {
    this.b = new Decimal(liquidityParam);
  }

  /**
   * Cost function: C(q) = b * ln(exp(q_yes/b) + exp(q_no/b))
   */
  cost(yesShares: Decimal, noShares: Decimal): Decimal {
    const expYes = yesShares.div(this.b).exp();
    const expNo = noShares.div(this.b).exp();
    return this.b.mul(expYes.plus(expNo).ln());
  }

  /**
   * Calculate the probability of YES outcome
   * p_yes = exp(q_yes/b) / (exp(q_yes/b) + exp(q_no/b))
   */
  probability(yesShares: Decimal, noShares: Decimal): Decimal {
    const expYes = yesShares.div(this.b).exp();
    const expNo = noShares.div(this.b).exp();
    return expYes.div(expYes.plus(expNo));
  }

  /**
   * Calculate the cost of buying shares
   * Cost = C(q_after) - C(q_before)
   */
  calculateBuyCost(
    state: LMSRState,
    side: 'YES' | 'NO',
    shares: number
  ): Decimal {
    const sharesDecimal = new Decimal(shares);
    const costBefore = this.cost(state.yesShares, state.noShares);

    let costAfter: Decimal;
    if (side === 'YES') {
      costAfter = this.cost(state.yesShares.plus(sharesDecimal), state.noShares);
    } else {
      costAfter = this.cost(state.yesShares, state.noShares.plus(sharesDecimal));
    }

    return costAfter.minus(costBefore);
  }

  /**
   * Calculate the payout for selling shares
   * Payout = C(q_before) - C(q_after)
   */
  calculateSellPayout(
    state: LMSRState,
    side: 'YES' | 'NO',
    shares: number
  ): Decimal {
    const sharesDecimal = new Decimal(shares);
    const costBefore = this.cost(state.yesShares, state.noShares);

    let costAfter: Decimal;
    if (side === 'YES') {
      costAfter = this.cost(state.yesShares.minus(sharesDecimal), state.noShares);
    } else {
      costAfter = this.cost(state.yesShares, state.noShares.minus(sharesDecimal));
    }

    return costBefore.minus(costAfter);
  }

  /**
   * Calculate how many shares you get for a given cost
   */
  calculateSharesForCost(
    state: LMSRState,
    side: 'YES' | 'NO',
    cost: number
  ): Decimal {
    const costDecimal = new Decimal(cost);
    const currentCost = this.cost(state.yesShares, state.noShares);
    const targetCost = currentCost.plus(costDecimal);

    const expTarget = targetCost.div(this.b).exp();

    if (side === 'YES') {
      const expNo = state.noShares.div(this.b).exp();
      const expYesNew = expTarget.minus(expNo);
      return expYesNew.ln().mul(this.b).minus(state.yesShares);
    } else {
      const expYes = state.yesShares.div(this.b).exp();
      const expNoNew = expTarget.minus(expYes);
      return expNoNew.ln().mul(this.b).minus(state.noShares);
    }
  }

  /**
   * Execute a trade and return the new state
   */
  executeTrade(
    state: LMSRState,
    side: 'YES' | 'NO',
    shares: number
  ): {
    newState: LMSRState;
    cost: Decimal;
    newProbability: Decimal;
    priceImpact: Decimal;
  } {
    const sharesDecimal = new Decimal(shares);
    const probabilityBefore = this.probability(state.yesShares, state.noShares);
    const cost = this.calculateBuyCost(state, side, shares);

    let newState: LMSRState;
    if (side === 'YES') {
      newState = {
        yesShares: state.yesShares.plus(sharesDecimal),
        noShares: state.noShares,
        liquidityParam: state.liquidityParam,
      };
    } else {
      newState = {
        yesShares: state.yesShares,
        noShares: state.noShares.plus(sharesDecimal),
        liquidityParam: state.liquidityParam,
      };
    }

    const newProbability = this.probability(newState.yesShares, newState.noShares);
    const priceImpact = newProbability.minus(probabilityBefore).abs();

    return {
      newState,
      cost,
      newProbability,
      priceImpact,
    };
  }

  /**
   * Initialize market with a starting probability
   * Sets the shares to achieve the desired probability
   */
  static initializeMarket(
    liquidityParam: number,
    initialProbability: number
  ): LMSRState {
    const b = new Decimal(liquidityParam);
    const p = new Decimal(initialProbability);

    const logOdds = p.div(new Decimal(1).minus(p)).ln();
    const diff = b.mul(logOdds);

    const baseShares = b.mul(10);
    const yesShares = baseShares.plus(diff.div(2));
    const noShares = baseShares.minus(diff.div(2));

    return {
      yesShares,
      noShares,
      liquidityParam: b,
    };
  }

  /**
   * Get the instantaneous price (marginal cost) for buying one more share
   */
  getPrice(state: LMSRState, side: 'YES' | 'NO'): Decimal {
    if (side === 'YES') {
      return this.probability(state.yesShares, state.noShares);
    } else {
      return new Decimal(1).minus(this.probability(state.yesShares, state.noShares));
    }
  }

  /**
   * Calculate the average price for a given number of shares
   */
  getAveragePrice(
    state: LMSRState,
    side: 'YES' | 'NO',
    shares: number
  ): Decimal {
    const cost = this.calculateBuyCost(state, side, shares);
    return cost.div(new Decimal(shares));
  }

  get liquidityParameter(): Decimal {
    return this.b;
  }
}
