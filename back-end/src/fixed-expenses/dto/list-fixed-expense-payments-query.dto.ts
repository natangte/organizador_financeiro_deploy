import { IsOptional, Matches } from 'class-validator';
import {
  DATE_MESSAGE,
  DATE_PATTERN,
} from '../../transactions/dto/create-transaction.dto';

export class ListFixedExpensePaymentsQueryDto {
  @IsOptional()
  @Matches(DATE_PATTERN, { message: DATE_MESSAGE })
  startDate?: string;

  @IsOptional()
  @Matches(DATE_PATTERN, { message: DATE_MESSAGE })
  endDate?: string;
}
