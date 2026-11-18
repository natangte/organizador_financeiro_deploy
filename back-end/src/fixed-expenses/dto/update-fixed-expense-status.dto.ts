import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateFixedExpenseStatusDto {
  /**
   * `true` ativa e `false` desativa. Se for omitido, o status é invertido
   * (comportamento do botão de alternar da tela).
   */
  @IsOptional()
  @IsBoolean({ message: 'Informe um status válido.' })
  isActive?: boolean;
}
