/**
 * Simplifies group debts by calculating net positions of all members
 * and finding the minimal list of transactions to settle the group.
 * 
 * @param {Array} members - Array of group member user objects: [ { _id, name, email } ]
 * @param {Array} expenses - Array of expenses in the group
 * @param {Array} settlements - Array of settlements recorded in the group
 * @returns {Object} { balances: { userId: netBalance }, settlements: [ { from, to, amount } ] }
 */
export const simplifyDebts = (members, expenses, settlements) => {
  const netBalances = {};

  // Initialize all members with a net balance of 0
  members.forEach((member) => {
    const id = member._id ? member._id.toString() : member.user.toString();
    netBalances[id] = 0;
  });

  // 1. Process Expenses
  expenses.forEach((expense) => {
    const payerId = expense.paidBy._id ? expense.paidBy._id.toString() : expense.paidBy.toString();
    
    // Add amount to the payer's balance (they are credited)
    if (netBalances[payerId] !== undefined) {
      netBalances[payerId] += expense.amount;
    }

    // Subtract owed amounts from each participant's balance (they are debited)
    expense.splits.forEach((split) => {
      const splitUserId = split.user._id ? split.user._id.toString() : split.user.toString();
      if (netBalances[splitUserId] !== undefined) {
        netBalances[splitUserId] -= split.owedAmount;
      }
    });
  });

  // 2. Process Settlements
  settlements.forEach((settlement) => {
    const payerId = settlement.payerId._id ? settlement.payerId._id.toString() : settlement.payerId.toString();
    const payeeId = settlement.payeeId._id ? settlement.payeeId._id.toString() : settlement.payeeId.toString();

    // Payer gave money, so their net balance increases (closer to 0/positive)
    if (netBalances[payerId] !== undefined) {
      netBalances[payerId] += settlement.amount;
    }
    // Payee received money, so their net balance decreases (closer to 0/negative)
    if (netBalances[payeeId] !== undefined) {
      netBalances[payeeId] -= settlement.amount;
    }
  });

  // Round all balances to 2 decimal places to resolve floating point issues
  Object.keys(netBalances).forEach((key) => {
    netBalances[key] = Math.round(netBalances[key] * 100) / 100;
  });

  // 3. Separate into debtors and creditors
  let debtors = [];
  let creditors = [];

  Object.keys(netBalances).forEach((userId) => {
    const balance = netBalances[userId];
    if (balance < -0.009) {
      debtors.push({ userId, balance });
    } else if (balance > 0.009) {
      creditors.push({ userId, balance });
    }
  });

  const suggestedSettlements = [];

  // Greedy match largest debtors and creditors
  while (debtors.length > 0 && creditors.length > 0) {
    // Sort debtors ascending (most negative first)
    debtors.sort((a, b) => a.balance - b.balance);
    // Sort creditors descending (most positive first)
    creditors.sort((a, b) => b.balance - a.balance);

    const debtor = debtors[0];
    const creditor = creditors[0];

    const debitAmount = Math.abs(debtor.balance);
    const creditAmount = creditor.balance;

    const settlementAmount = Math.round(Math.min(debitAmount, creditAmount) * 100) / 100;

    if (settlementAmount > 0) {
      suggestedSettlements.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: settlementAmount,
      });
    }

    // Update balances
    debtor.balance += settlementAmount;
    creditor.balance -= settlementAmount;

    // Filter out settled participants
    debtors = debtors.filter((d) => Math.round(d.balance * 100) / 100 < -0.009);
    creditors = creditors.filter((c) => Math.round(c.balance * 100) / 100 > 0.009);
  }

  return {
    netBalances,
    suggestedSettlements,
  };
};
