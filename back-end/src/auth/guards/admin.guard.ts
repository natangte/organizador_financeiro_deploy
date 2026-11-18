import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ADMIN_ROLE, isAdminEmail } from '../admin.util';

/**
 * Libera a rota somente para o administrador. Deve ser usado depois do
 * JwtAuthGuard (`@UseGuards(JwtAuthGuard, AdminGuard)`), que preenche req.user.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.role === ADMIN_ROLE && isAdminEmail(user.email)) {
      return true;
    }

    throw new ForbiddenException('Acesso restrito ao administrador.');
  }
}
