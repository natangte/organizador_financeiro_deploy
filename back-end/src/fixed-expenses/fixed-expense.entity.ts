import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Mapeia a tabela `gasto_fixo` que JÁ EXISTE no banco (nenhuma tabela é
 * criada nem alterada). Segundo o DER: descricao (título do gasto),
 * valor_estimado, dia_vencimento e status_ativo.
 */
@Entity('gasto_fixo')
export class GastoFixo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_usuario', type: 'int' })
  idUsuario: number;

  /** Título do gasto fixo (ex.: "Conta de luz"). */
  @Column({ type: 'varchar' })
  titulo: string;

  @Column({ name: 'valor_estimado', type: 'numeric', precision: 10, scale: 2 })
  valorEstimado: string;

  /** Dia do mês em que o gasto vence (1 a 31). */
  @Column({ name: 'dia_vencimento', type: 'int' })
  diaVencimento: number;

  /**
   * Desativar o gasto fixo só troca este campo: o registro e o histórico de
   * pagamentos continuam no banco (diferente de excluir).
   */
  @Column({ name: 'status_ativo', type: 'boolean', default: true })
  statusAtivo: boolean;
}
