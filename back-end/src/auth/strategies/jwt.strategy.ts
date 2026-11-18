import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import {
  ADMIN_ROLE,
  USER_ROLE,
  getAdminEmail,
  isAdminEmail,
} from '../admin.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: number; email?: string; role?: string }) {
    // Token de administrador: a role só vale se o e-mail ainda for o ADMIN_EMAIL
    // atual do .env (trocar/remover a variável derruba o acesso na hora).
    if (payload.role === ADMIN_ROLE) {
      if (!isAdminEmail(payload.email)) {
        throw new UnauthorizedException('Acesso administrativo inválido');
      }

      return {
        id: 0,
        nome: 'Administrador',
        email: getAdminEmail(),
        role: ADMIN_ROLE,
      };
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // A role de usuário comum vem sempre do servidor, nunca do token.
    return { ...user, role: USER_ROLE };
  }
}
