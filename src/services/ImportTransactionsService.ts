import { getRepository } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import Transaction from '../models/Transaction';

import uploadConfig from '../config/upload';
import Category from '../models/Category';

interface Request {
  file: Express.Multer.File;
}

interface ParsedTransactions {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ file }: Request): Promise<Transaction[]> {
    const transactions: Transaction[] = [];
    const transactionRepository = getRepository(Transaction);

    const categoryRepository = getRepository(Category);

    const csvFilePath = path.resolve(uploadConfig.directory, file.filename);
    const readCSVStream = fs.createReadStream(csvFilePath);
    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);
    const parsedTransactions: ParsedTransactions[] = [];
    const categoriesTitles: Record<string, boolean> = {};
    parseCSV.on('data', line => {
      const [title, type, value, category] = line;
      parsedTransactions.push({ title, type, value, category });
      categoriesTitles[category] = !0;
    });
    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    parsedTransactions.map(t => {
      return t.category;
    });

    const categories = await Promise.all(
      Object.keys(categoriesTitles).map(async title => {
        let category = await categoryRepository.findOne({
          title,
        });
        if (!category) {
          category = categoryRepository.create({
            title,
          });
          category = await categoryRepository.save(category);
        }
        return category;
      }),
    );

    parsedTransactions.forEach(t => {
      const { category: categoryTittle, title, type, value } = t;
      const category = categories.find(c => {
        return c.title === categoryTittle;
      });
      transactions.push(
        transactionRepository.create({
          category,
          title,
          type,
          value,
        }),
      );
    });
    await (await transactionRepository.save(transactions)).length;
    return transactions;
  }
}

export default ImportTransactionsService;
