import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ContaFinanceira } from '../accounts/account.entity';
import { Categoria } from '../categories/category.entity';
import {
  UploadedReceiptFile,
  validateReceiptFile,
} from '../transactions/receipt';
import { Movimentacao } from '../transactions/transaction.entity';
import { CreateFixedExpenseDto } from './dto/create-fixed-expense.dto';
import { CreateFixedExpensePaymentDto } from './dto/create-fixed-expense-payment.dto';
import { ListFixedExpensePaymentsQueryDto } from './dto/list-fixed-expense-payments-query.dto';
import { UpdateFixedExpenseDto } from './dto/update-fixed-expense.dto';
import { UpdateFixedExpenseStatusDto } from './dto/update-fixed-expense-status.dto';
import { GastoFixo } from './fixed-expense.entity';

/** Categoria padrão do sistema usada em todo pagamento de gasto fixo. */
const FIXED_EXPENSE_CATEGORY = 'Gastos Fixos';
const FIXED_EXPENSE_CATEGORY_COLOR = '#030862';

/** Linha devolvida pelo JOIN de pagamentos (movimentacao + conta + categoria). */
interface PaymentRow {
  id_movimentacao: number;
  titulo: string;
  data_pagamento: string;
  valor_pago: string;
  id_conta_financeira: number;
  conta_financeira: string;
  tem_comprovante: boolean;
}

/** Qualquer coisa que execute SQL: `DataSource` ou o `manager` de uma transação. */
interface QueryRunner {
  query(sql: string, parameters?: unknown[]): Promise<any>;
}

function toCents(value: number | string): number {
  return Math.round(Number(value) * 100);
}

function assertValidDate(date: string | undefined) {
  if (!date) {
    return;
  }

  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new BadRequestException('Informe uma data válida.');
  }
}

/** Data de hoje (`YYYY-MM-DD`) no fuso de São Paulo, independente do servidor. */
function todayInBrazil(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
  }).format(new Date());
}

/** Primeiro e último dia do mês da data informada (`YYYY-MM-DD`). */
function monthBounds(date: string): { first: string; last: string } {
  const [year, month] = date.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;

  return {
    first: `${prefix}-01`,
    last: `${prefix}-${String(lastDay).padStart(2, '0')}`,
  };
}

@Injectable()
export class FixedExpensesService {
  constructor(
    @InjectRepository(GastoFixo)
    private readonly fixedExpensesRepository: Repository<GastoFixo>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(userId: number) {
    const expenses = await this.fixedExpensesRepository.find({
      where: { idUsuario: userId },
      order: { diaVencimento: 'ASC', titulo: 'ASC' },
    });

    const rows = await this.queryPayments(
      this.dataSource,
      userId,
      expenses.map((expense) => expense.titulo),
    );

    const paymentsByTitle = new Map<string, PaymentRow[]>();

    for (const row of rows) {
      const list = paymentsByTitle.get(row.titulo) ?? [];
      list.push(row);
      paymentsByTitle.set(row.titulo, list);
    }

    return expenses.map((expense) =>
      this.toResponse(expense, paymentsByTitle.get(expense.titulo) ?? []),
    );
  }

  async create(userId: number, dto: CreateFixedExpenseDto) {
    await this.assertTitleAvailable(this.dataSource, userId, dto.title);

    let saved: GastoFixo;

    try {
      saved = await this.fixedExpensesRepository.save(
        this.fixedExpensesRepository.create({
          idUsuario: userId,
          titulo: dto.title,
          valorEstimado: dto.estimatedAmount.toFixed(2),
          diaVencimento: dto.dueDay,
          statusAtivo: true,
        }),
      );
    } catch (error) {
      this.rethrowDuplicateTitle(error);
      throw error;
    }

    return this.toResponse(saved, []);
  }

  async update(userId: number, id: number, dto: UpdateFixedExpenseDto) {
    let saved: GastoFixo;

    try {
      saved = await this.dataSource.transaction(async (manager) => {
        const existing = await this.findOwnedOrFail(manager, userId, id, true);

        if (dto.title !== undefined && dto.title !== existing.titulo) {
          await this.assertTitleAvailable(manager, userId, dto.title, id);

          // O histórico é encontrado pelo título (JOIN com movimentações).
          // Ao renomear, os pagamentos antigos acompanham o novo título para
          // não se perderem do histórico do gasto fixo.
          await manager.query(
            `UPDATE movimentacao AS m
                SET titulo = $1
               FROM categoria AS cat
              WHERE m.id_categoria = cat.id
                AND cat.nome = $2
                AND m.id_usuario = $3
                AND m.titulo = $4`,
            [dto.title, FIXED_EXPENSE_CATEGORY, userId, existing.titulo],
          );

          existing.titulo = dto.title;
        }

        if (dto.estimatedAmount !== undefined) {
          existing.valorEstimado = dto.estimatedAmount.toFixed(2);
        }

        if (dto.dueDay !== undefined) {
          existing.diaVencimento = dto.dueDay;
        }

        return manager.save(existing);
      });
    } catch (error) {
      this.rethrowDuplicateTitle(error);
      throw error;
    }

    return this.toResponse(
      saved,
      await this.queryPayments(this.dataSource, userId, [saved.titulo]),
    );
  }

  /**
   * Desativação: não apaga nada, apenas troca o valor booleano `status_ativo`.
   * O histórico de pagamentos continua intacto.
   */
  async updateStatus(
    userId: number,
    id: number,
    dto: UpdateFixedExpenseStatusDto,
  ) {
    const existing = await this.findOwnedOrFail(
      this.fixedExpensesRepository.manager,
      userId,
      id,
    );

    existing.statusAtivo = dto.isActive ?? !existing.statusAtivo;

    const saved = await this.fixedExpensesRepository.save(existing);

    return this.toResponse(
      saved,
      await this.queryPayments(this.dataSource, userId, [saved.titulo]),
    );
  }

  /**
   * Exclusão: remove o gasto fixo. As movimentações dos pagamentos já feitos
   * continuam em `movimentacao` (o histórico financeiro nunca é apagado).
   */
  async remove(userId: number, id: number) {
    const existing = await this.findOwnedOrFail(
      this.fixedExpensesRepository.manager,
      userId,
      id,
    );

    await this.fixedExpensesRepository.remove(existing);

    return {
      message:
        'Gasto fixo excluído com sucesso. As movimentações já registradas foram mantidas.',
    };
  }

  /**
   * Registra o pagamento do mês. Tudo acontece na mesma transação SQL:
   * debita a conta e cria a movimentação de despesa (título do gasto fixo +
   * categoria "Gastos Fixos"), com o comprovante opcional.
   */
  async registerPayment(
    userId: number,
    id: number,
    dto: CreateFixedExpensePaymentDto,
    file?: UploadedReceiptFile,
  ) {
    const paymentDate = dto.date ?? todayInBrazil();

    assertValidDate(paymentDate);

    const receipt = file ? validateReceiptFile(file) : null;

    return this.dataSource.transaction(async (manager) => {
      // Trava o gasto fixo: dois cliques simultâneos não geram dois pagamentos.
      const expense = await this.findOwnedOrFail(manager, userId, id, true);

      if (!expense.statusAtivo) {
        throw new BadRequestException(
          'Reative o gasto fixo antes de registrar um novo pagamento.',
        );
      }

      const { first, last } = monthBounds(paymentDate);
      const alreadyPaid = await this.queryPayments(
        manager,
        userId,
        [expense.titulo],
        first,
        last,
      );

      if (alreadyPaid.length > 0) {
        throw new BadRequestException(
          'Este gasto fixo já foi pago no mês informado.',
        );
      }

      const category = await this.resolveFixedExpenseCategory(manager, userId);
      const amount = Number(expense.valorEstimado);

      await this.applyBalanceDelta(
        manager,
        userId,
        dto.accountId,
        -toCents(amount),
      );

      const { id: transactionId } = await manager.save(
        manager.create(Movimentacao, {
          idUsuario: userId,
          idContaFinanceira: dto.accountId,
          idCategoria: category.id,
          titulo: expense.titulo,
          valor: amount.toFixed(2),
          tipo: 'DESPESA',
          dataTransacao: paymentDate,
          comprovanteDados: receipt?.dados ?? null,
        }),
      );

      const account = await manager.findOneOrFail(ContaFinanceira, {
        where: { id: dto.accountId },
      });

      return {
        payment: {
          id: String(transactionId),
          transactionId: String(transactionId),
          paidAt: paymentDate,
          amount,
          accountId: String(account.id),
          accountName: account.nomeConta,
          receiptName: receipt ? 'Comprovante' : null,
          receipt: receipt
            ? { url: `/transactions/${transactionId}/receipt` }
            : null,
        },
        accountBalance: Number(account.saldoAtual),
      };
    });
  }

  /** Histórico de pagamentos de um gasto fixo, filtrado por data no banco. */
  async findPayments(
    userId: number,
    id: number,
    query: ListFixedExpensePaymentsQueryDto,
  ) {
    assertValidDate(query.startDate);
    assertValidDate(query.endDate);

    if (query.startDate && query.endDate && query.startDate > query.endDate) {
      throw new BadRequestException(
        'A data inicial não pode ser maior que a data final.',
      );
    }

    const expense = await this.findOwnedOrFail(
      this.fixedExpensesRepository.manager,
      userId,
      id,
    );

    const rows = await this.queryPayments(
      this.dataSource,
      userId,
      [expense.titulo],
      query.startDate,
      query.endDate,
    );

    return rows.map((row) => this.toPayment(row));
  }

  /**
   * Consulta de pagamentos: JOIN de `movimentacao` com `conta_financeira` e
   * `categoria`, filtrando pelo título do gasto fixo e pela categoria
   * "Gastos Fixos":
   *
   *   select m.data_transacao as Data_pagamento,
   *          m.valor as Valor_pago,
   *          cf.nome_conta as conta_financeira
   *   from movimentacao m
   *   inner join conta_financeira cf on m.id_conta_financeira = cf.id
   *   inner join categoria cat on m.id_categoria = cat.id
   *   where m.titulo = 'Conta de luz'
   *     and cat.nome = 'Gastos Fixos';
   *
   * Além disso, filtra por `m.id_usuario` (isolamento entre usuários) e,
   * opcionalmente, pelo período (`startDate`/`endDate`).
   */
  private async queryPayments(
    runner: QueryRunner,
    userId: number,
    titles: string[],
    startDate?: string,
    endDate?: string,
  ): Promise<PaymentRow[]> {
    if (titles.length === 0) {
      return [];
    }

    const params: unknown[] = [userId, FIXED_EXPENSE_CATEGORY, titles];
    const conditions = [
      'm.id_usuario = $1',
      'cat.nome = $2',
      'm.titulo = ANY($3)',
    ];

    if (startDate) {
      params.push(startDate);
      conditions.push(`CAST(m.data_transacao AS DATE) >= $${params.length}`);
    }

    if (endDate) {
      params.push(endDate);
      conditions.push(`CAST(m.data_transacao AS DATE) <= $${params.length}`);
    }

    return runner.query(
      `SELECT m.id AS id_movimentacao,
              m.titulo AS titulo,
              TO_CHAR(m.data_transacao, 'YYYY-MM-DD') AS data_pagamento,
              m.valor AS valor_pago,
              cf.id AS id_conta_financeira,
              cf.nome_conta AS conta_financeira,
              (m.comprovante_dados IS NOT NULL) AS tem_comprovante
         FROM movimentacao m
        INNER JOIN conta_financeira cf ON m.id_conta_financeira = cf.id
        INNER JOIN categoria cat ON m.id_categoria = cat.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY m.data_transacao DESC, m.id DESC`,
      params,
    );
  }

  private async findOwnedOrFail(
    manager: EntityManager,
    userId: number,
    id: number,
    lock = false,
  ) {
    const expense = await manager.findOne(GastoFixo, {
      where: { id, idUsuario: userId },
      ...(lock ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });

    if (!expense) {
      throw new NotFoundException('Gasto fixo não encontrado.');
    }

    return expense;
  }

  /**
   * Como o histórico é localizado pelo título, não podem existir dois gastos
   * fixos com o mesmo título para o mesmo usuário (sem diferenciar maiúsculas).
   */
  private async assertTitleAvailable(
    runner: QueryRunner,
    userId: number,
    title: string,
    ignoreId?: number,
  ) {
    const rows: { id: number }[] = await runner.query(
      `SELECT id
         FROM gasto_fixo
        WHERE id_usuario = $1
          AND LOWER(titulo) = LOWER($2)
          AND ($3::int IS NULL OR id <> $3::int)
        LIMIT 1`,
      [userId, title, ignoreId ?? null],
    );

    if (rows.length > 0) {
      throw new ConflictException('Já existe um gasto fixo com esse título.');
    }
  }

  private rethrowDuplicateTitle(error: unknown) {
    const code = (error as { driverError?: { code?: string } }).driverError
      ?.code;

    if (code === '23505') {
      throw new ConflictException('Já existe um gasto fixo com esse título.');
    }
  }

  /** Categoria padrão "Gastos Fixos" (cria só se ainda não existir). */
  private async resolveFixedExpenseCategory(
    manager: EntityManager,
    userId: number,
  ): Promise<Categoria> {
    const existing = await manager
      .createQueryBuilder(Categoria, 'c')
      .where('(c.idUsuario IS NULL OR c.idUsuario = :userId)', { userId })
      .andWhere('LOWER(c.nome) = LOWER(:nome)', {
        nome: FIXED_EXPENSE_CATEGORY,
      })
      .orderBy('c.idUsuario', 'ASC', 'NULLS FIRST')
      .addOrderBy('c.id', 'ASC')
      .getOne();

    if (existing) {
      return existing;
    }

    return manager.save(
      manager.create(Categoria, {
        idUsuario: null,
        nome: FIXED_EXPENSE_CATEGORY,
        cor: FIXED_EXPENSE_CATEGORY_COLOR,
      }),
    );
  }

  /** Mesmo cálculo de saldo das movimentações: atômico, na mesma transação. */
  private async applyBalanceDelta(
    manager: EntityManager,
    userId: number,
    accountId: number,
    deltaInCents: number,
  ) {
    const result = await manager
      .createQueryBuilder()
      .update(ContaFinanceira)
      .set({ saldoAtual: () => 'saldo_atual + :delta' })
      .where('id = :accountId AND id_usuario = :userId', { accountId, userId })
      .setParameter('delta', (deltaInCents / 100).toFixed(2))
      .execute();

    if (!result.affected) {
      throw new NotFoundException('Conta não encontrada.');
    }
  }

  private toPayment(row: PaymentRow) {
    const hasReceipt = Boolean(row.tem_comprovante);

    return {
      id: String(row.id_movimentacao),
      transactionId: String(row.id_movimentacao),
      // `YYYY-MM-DD`, para não deslocar a data por fuso horário.
      paidAt: row.data_pagamento,
      amount: Number(row.valor_pago),
      accountId: String(row.id_conta_financeira),
      accountName: row.conta_financeira,
      receiptName: hasReceipt ? 'Comprovante' : null,
      // O arquivo é baixado em `GET /transactions/:id/receipt` (com o token).
      receipt: hasReceipt
        ? { url: `/transactions/${row.id_movimentacao}/receipt` }
        : null,
    };
  }

  private toResponse(expense: GastoFixo, payments: PaymentRow[]) {
    return {
      id: String(expense.id),
      title: expense.titulo,
      estimatedAmount: Number(expense.valorEstimado),
      dueDay: expense.diaVencimento,
      isActive: expense.statusAtivo,
      category: FIXED_EXPENSE_CATEGORY,
      // A tabela existente não tem coluna de data de criação.
      createdAt: null,
      payments: payments.map((row) => this.toPayment(row)),
    };
  }
}
