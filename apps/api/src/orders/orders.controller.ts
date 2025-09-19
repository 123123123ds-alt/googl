import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { CreateOrderInput } from '@googl/shared';
import { OrdersService } from './orders.service';

const ReferenceParamSchema = z.object({
  reference: z.string().min(1),
});

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() body: unknown) {
    const parsed = CreateOrderInput.parse(body);
    return this.ordersService.createOrder(parsed);
  }

  @Get(':reference')
  async findOne(@Param() params: unknown) {
    const { reference } = ReferenceParamSchema.parse(params);
    return this.ordersService.getOrder(reference);
  }
}
