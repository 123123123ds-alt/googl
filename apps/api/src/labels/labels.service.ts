import { Injectable, NotFoundException } from '@nestjs/common';
import {
  EccangGetLabelUrlResponse,
  EccangGetLabelUrlResponseType,
  PaginatedResult,
} from '@googl/shared';
import { Prisma } from '@prisma/client';
import { EccangService } from '../eccang/eccang.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LabelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eccangService: EccangService,
  ) {}

  async generateLabel(referenceNo: string) {
    const order = await this.prisma.order.findUnique({
      where: { referenceNo },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const response = await this.eccangService.call<EccangGetLabelUrlResponseType>(
      'getLabelUrl',
      { reference_no: referenceNo },
      EccangGetLabelUrlResponse,
    );

    const labelData = response.datas?.[0];

    if (!labelData?.url) {
      throw new Error('Label URL not available yet');
    }

    const label = await this.prisma.label.create({
      data: {
        orderId: order.id,
        url: labelData.url,
        type: labelData.label_type ?? 'PDF',
      },
      include: {
        Order: true,
      },
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { lastLabelAt: label.createdAt },
    });

    return label;
  }

  async listLabels(params: {
    q?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResult<Prisma.LabelGetPayload<{ include: { Order: true } }>>> {
    const pageSize = Math.max(1, Math.min(params.pageSize ?? 10, 50));
    const page = Math.max(1, params.page ?? 1);
    const skip = (page - 1) * pageSize;

    const where: Prisma.LabelWhereInput | undefined = params.q
      ? {
          OR: [
            {
              Order: {
                referenceNo: {
                  contains: params.q,
                  mode: 'insensitive',
                },
              },
            },
            {
              Order: {
                orderCode: {
                  contains: params.q,
                  mode: 'insensitive',
                },
              },
            },
            {
              Order: {
                shippingMethodNo: {
                  contains: params.q,
                  mode: 'insensitive',
                },
              },
            },
          ],
        }
      : undefined;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.label.findMany({
        where,
        include: { Order: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.label.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
    };
  }
}
