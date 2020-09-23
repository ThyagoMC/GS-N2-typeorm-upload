import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();
    const balance = transactions.reduce<Balance>(
      (acc: Balance, current: Transaction): Balance => {
        acc.income += current.type === 'income' ? current.value : 0;
        acc.outcome += current.type === 'outcome' ? current.value : 0;
        return acc;
      },
      { income: 0, outcome: 0, total: 0 },
    );
    balance.total = balance.income - balance.outcome;
    return balance;
  }
}

export default TransactionsRepository;
