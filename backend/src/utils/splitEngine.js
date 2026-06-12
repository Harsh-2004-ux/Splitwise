/**
 * Calculates and validates splits for an expense.
 * Handles floating-point rounding errors (penny remainders) by adjusting the last participant's share.
 * 
 * @param {number} totalAmount - Total amount of the expense
 * @param {string} splitType - 'EQUAL', 'UNEQUAL', 'PERCENTAGE', or 'SHARE'
 * @param {Array} splitsInput - Array of items containing user details and inputs:
 *                              e.g., [ { user: 'userId', value: 10 } ]
 *                              - For EQUAL: splitsInput can just be list of users [ { user: 'userId' } ]
 *                              - For UNEQUAL: [ { user: 'userId', value: owedAmount } ]
 *                              - For PERCENTAGE: [ { user: 'userId', value: percent } ]
 *                              - For SHARE: [ { user: 'userId', value: shareUnits } ]
 * @returns {Array} Array of final splits: [ { user: 'userId', owedAmount: number, shareUnits: number|null } ]
 */
export const calculateSplits = (totalAmount, splitType, splitsInput) => {
  if (!totalAmount || totalAmount <= 0) {
    throw new Error('Total amount must be greater than zero');
  }
  if (!splitsInput || splitsInput.length === 0) {
    throw new Error('At least one user must be included in the split');
  }

  const count = splitsInput.length;
  // Convert total to cents to prevent floating point issues during division
  const totalCents = Math.round(totalAmount * 100);
  let computedSplits = [];

  switch (splitType) {
    case 'EQUAL': {
      const baseCents = Math.floor(totalCents / count);
      let remainderCents = totalCents - (baseCents * count);

      computedSplits = splitsInput.map((item, idx) => {
        // Add 1 cent of the remainder to users until remainder is 0
        const extra = remainderCents > 0 ? 1 : 0;
        if (extra > 0) remainderCents--;

        return {
          user: item.user,
          owedAmount: (baseCents + extra) / 100,
          shareUnits: null,
        };
      });
      break;
    }

    case 'UNEQUAL': {
      let sumCents = 0;
      computedSplits = splitsInput.map((item) => {
        const itemCents = Math.round((item.value || 0) * 100);
        sumCents += itemCents;
        return {
          user: item.user,
          owedAmount: itemCents / 100,
          shareUnits: null,
        };
      });

      if (sumCents !== totalCents) {
        throw new Error(`The sum of split amounts ($${sumCents / 100}) must equal the total expense amount ($${totalAmount})`);
      }
      break;
    }

    case 'PERCENTAGE': {
      let sumPercent = 0;
      let totalAllocatedCents = 0;

      splitsInput.forEach((item) => {
        sumPercent += item.value || 0;
      });

      // Allow slight floating point tolerance for percentages (e.g. 99.999 to 100.001)
      if (Math.abs(sumPercent - 100) > 0.01) {
        throw new Error(`The sum of split percentages (${sumPercent}%) must equal 100%`);
      }

      computedSplits = splitsInput.map((item, idx) => {
        const percent = item.value || 0;
        // Calculate shares
        let itemCents = Math.floor((percent / 100) * totalCents);
        totalAllocatedCents += itemCents;

        return {
          user: item.user,
          owedAmount: itemCents / 100,
          shareUnits: null,
        };
      });

      // Handle penny discrepancy if any due to Math.floor
      let diffCents = totalCents - totalAllocatedCents;
      if (diffCents !== 0) {
        // Apply remainder to the last participant
        computedSplits[computedSplits.length - 1].owedAmount = 
          Math.round((computedSplits[computedSplits.length - 1].owedAmount * 100 + diffCents)) / 100;
      }
      break;
    }

    case 'SHARE': {
      let totalShares = 0;
      splitsInput.forEach((item) => {
        totalShares += item.value || 0;
      });

      if (totalShares <= 0) {
        throw new Error('Total shares must be greater than zero');
      }

      let totalAllocatedCents = 0;
      computedSplits = splitsInput.map((item) => {
        const shareUnits = item.value || 0;
        const itemCents = Math.floor((shareUnits / totalShares) * totalCents);
        totalAllocatedCents += itemCents;

        return {
          user: item.user,
          owedAmount: itemCents / 100,
          shareUnits,
        };
      });

      // Adjust last user's cents for penny remainder
      let diffCents = totalCents - totalAllocatedCents;
      if (diffCents !== 0) {
        computedSplits[computedSplits.length - 1].owedAmount = 
          Math.round((computedSplits[computedSplits.length - 1].owedAmount * 100 + diffCents)) / 100;
      }
      break;
    }

    default:
      throw new Error(`Invalid split type: ${splitType}`);
  }

  return computedSplits;
};
