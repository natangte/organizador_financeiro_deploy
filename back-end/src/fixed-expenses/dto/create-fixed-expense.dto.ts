import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateFixedExpenseDto {
  @Transform(trim)
  @IsString({ message: 'Informe o título do gasto fixo.' })
  @IsNotEmpty({ message: 'Informe o título do gasto fixo.' })
  @MaxLength(120, { message: 'O título deve ter no máximo 120 caracteres.' })
  title: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Informe um valor válido.' })
  @IsPositive({ message: 'Informe um valor maior que zero.' })
  @Max(99999999.99, { message: 'O valor máximo permitido é 99.999.999,99.' })
  estimatedAmount: number;

  @Type(() => Number)
  @IsInt({ message: 'O dia de vencimento deve ser um número inteiro.' })
  @Min(1, { message: 'O dia de vencimento deve ser entre 1 e 31.' })
  @Max(31, { message: 'O dia de vencimento deve ser entre 1 e 31.' })
  dueDay: number;
}
