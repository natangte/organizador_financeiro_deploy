import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { ListAdminUsersQueryDto } from './dto/list-admin-users-query.dto';

/**
 * Todas as rotas exigem token válido (JwtAuthGuard) E role ADMIN (AdminGuard).
 * O prefixo `api/admin` é o que o front-end (lib/adminApi.ts) já usa.
 */
@Controller('api/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers(@Query() query: ListAdminUsersQueryDto) {
    return this.adminService.listUsers(query.page, query.limit);
  }

  @Get('metrics')
  getMetrics() {
    return this.adminService.getMetrics();
  }

  @Delete('users/:id')
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }
}
