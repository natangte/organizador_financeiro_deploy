import { PartialType } from '@nestjs/mapped-types';
import { CreateFixedExpenseDto } from './create-fixed-expense.dto';

/** Edição: título, valor estimado e dia de vencimento (todos opcionais). */
export class UpdateFixedExpenseDto extends PartialType(
  CreateFixedExpenseDto,
) {}
