import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LabelsModule } from './labels/labels.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { EccangModule } from './eccang/eccang.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    EccangModule,
    OrdersModule,
    LabelsModule,
  ],
})
export class AppModule {}
