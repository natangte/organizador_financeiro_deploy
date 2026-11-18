import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  RECEIPT_MAX_SIZE,
  UploadedReceiptFile,
} from '../transactions/receipt';
import { CreateFixedExpenseDto } from './dto/create-fixed-expense.dto';
import { CreateFixedExpensePaymentDto } from './dto/create-fixed-expense-payment.dto';
import { ListFixedExpensePaymentsQueryDto } from './dto/list-fixed-expense-payments-query.dto';
import { UpdateFixedExpenseDto } from './dto/update-fixed-expense.dto';
import { UpdateFixedExpenseStatusDto } from './dto/update-fixed-expense-status.dto';
import { FixedExpensesService } from './fixed-expenses.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
  };
}

@Controller('fixed-expenses')
@UseGuards(JwtAuthGuard)
export class FixedExpensesController {
  constructor(private readonly fixedExpensesService: FixedExpensesService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.fixedExpensesService.findAll(req.user.id);
  }

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateFixedExpenseDto,
  ) {
    return this.fixedExpensesService.create(req.user.id, dto);
  }

  @Put(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFixedExpenseDto,
  ) {
    return this.fixedExpensesService.update(req.user.id, id, dto);
  }

  /** Ativa/desativa: só troca o campo booleano, sem apagar nada. */
  @Patch(':id/status')
  updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFixedExpenseStatusDto,
  ) {
    return this.fixedExpensesService.updateStatus(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.fixedExpensesService.remove(req.user.id, id);
  }

  /** Registra o pagamento do mês: cria a movimentação e debita a conta. */
  @Post(':id/payments')
  @UseInterceptors(
    FileInterceptor('receipt', { limits: { fileSize: RECEIPT_MAX_SIZE } }),
  )
  registerPayment(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateFixedExpensePaymentDto,
    @UploadedFile() receipt?: UploadedReceiptFile,
  ) {
    return this.fixedExpensesService.registerPayment(
      req.user.id,
      id,
      dto,
      receipt,
    );
  }

  /** Histórico de pagamentos (JOIN com movimentações) com filtro de datas. */
  @Get(':id/payments')
  findPayments(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ListFixedExpensePaymentsQueryDto,
  ) {
    return this.fixedExpensesService.findPayments(req.user.id, id, query);
  }
}
