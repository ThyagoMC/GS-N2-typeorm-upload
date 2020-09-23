import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionRepository = getRepository(Transaction);
    const transactionFound = await transactionRepository.findOne(id);
    if (!transactionFound) {
      throw new AppError('No transaction found', 400);
    }
    await (await transactionRepository.remove(transactionFound)).id;
  }
}

export default DeleteTransactionService;
