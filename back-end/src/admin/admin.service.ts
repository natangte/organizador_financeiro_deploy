import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { isAdminEmail } from '../auth/admin.util';

@Injectable()
export class AdminService {
  constructor(private readonly dataSource: DataSource) {}

  /** GET /api/admin/users — lista paginada de usuários cadastrados. */
  async listUsers(page: number, limit: number) {
    const [{ total }] = await this.dataSource.query(
      'SELECT COUNT(u.id) AS total FROM usuario u',
    );

    const totalUsers = Number(total);
    const totalPages = Math.max(1, Math.ceil(totalUsers / limit));

    const rows: Array<{
      id: number;
      name: string;
      email: string;
      createdAt: Date | string | null;
    }> = await this.dataSource.query(
      `SELECT u.id,
              u.nome AS name,
              u.email,
              u.criado_em AS "createdAt"
         FROM usuario u
        ORDER BY u.criado_em DESC NULLS LAST, u.id DESC
        LIMIT $1 OFFSET $2`,
      [limit, (page - 1) * limit],
    );

    return {
      items: rows,
      total: totalUsers,
      page,
      totalPages,
    };
  }

  /** GET /api/admin/metrics — contagens reais do banco (relatório do sistema). */
  async getMetrics() {
    const [users, transactions, accounts, fixedExpenses] = await Promise.all([
      this.dataSource.query('SELECT COUNT(u.id) AS total FROM usuario u'),
      this.dataSource.query('SELECT COUNT(m.id) AS total FROM movimentacao m'),
      this.dataSource.query(
        'SELECT COUNT(cf.id) AS total FROM conta_financeira cf',
      ),
      this.dataSource.query('SELECT COUNT(gf.id) AS total FROM gasto_fixo gf'),
    ]);

    return {
      users: Number(users[0].total),
      accounts: Number(accounts[0].total),
      transactions: Number(transactions[0].total),
      fixedExpenses: Number(fixedExpenses[0].total),
    };
  }

  /**
   * DELETE /api/admin/users/:id — exclusão em cascata.
   *
   * Tudo que pertence ao usuário é apagado numa única transação (ou apaga
   * tudo, ou não apaga nada). A ordem respeita as chaves estrangeiras:
   * movimentações → gastos fixos → contas financeiras → categorias próprias
   * → usuário. As FKs com ON DELETE CASCADE do banco continuam como rede de
   * segurança para qualquer outra tabela ligada ao usuário.
   */
  async deleteUser(userId: number) {
    await this.dataSource.transaction(async (manager) => {
      const found: Array<{ id: number; email: string }> = await manager.query(
        'SELECT id, email FROM usuario WHERE id = $1',
        [userId],
      );

      if (found.length === 0) {
        throw new NotFoundException('Usuário não encontrado.');
      }

      if (isAdminEmail(found[0].email)) {
        throw new BadRequestException(
          'A conta do administrador não pode ser excluída.',
        );
      }

      await manager.query('DELETE FROM movimentacao WHERE id_usuario = $1', [
        userId,
      ]);
      await manager.query('DELETE FROM gasto_fixo WHERE id_usuario = $1', [
        userId,
      ]);
      await manager.query(
        'DELETE FROM conta_financeira WHERE id_usuario = $1',
        [userId],
      );
      await manager.query('DELETE FROM categoria WHERE id_usuario = $1', [
        userId,
      ]);
      await manager.query('DELETE FROM usuario WHERE id = $1', [userId]);
    });

    return { message: 'Usuário e todos os dados vinculados foram excluídos.' };
  }
}
