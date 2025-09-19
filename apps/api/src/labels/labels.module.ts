import { Module } from '@nestjs/common';
import { EccangModule } from '../eccang/eccang.module';
import { OrdersModule } from '../orders/orders.module';
import { LabelsController } from './labels.controller';
import { LabelsService } from './labels.service';

@Module({
  imports: [EccangModule, OrdersModule],
  controllers: [LabelsController],
  providers: [LabelsService],
})
export class LabelsModule {}
