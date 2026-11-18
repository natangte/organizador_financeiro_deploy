import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContaFinanceira } from '../accounts/account.entity';
import { Categoria } from '../categories/category.entity';
import { Movimentacao } from '../transactions/transaction.entity';
import { GastoFixo } from './fixed-expense.entity';
import { FixedExpensesController } from './fixed-expenses.controller';
import { FixedExpensesService } from './fixed-expenses.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GastoFixo,
      Movimentacao,
      ContaFinanceira,
      Categoria,
    ]),
  ],
  controllers: [FixedExpensesController],
  providers: [FixedExpensesService],
})
export class FixedExpensesModule {}
