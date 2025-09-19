import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  CreateOrderInputType,
  EccangCreateOrderResponse,
  EccangCreateOrderResponseType,
  EccangGetTrackNumberResponse,
  EccangGetTrackNumberResponseType,
} from '@googl/shared';
import { Prisma } from '@prisma/client';
import { EccangService } from '../eccang/eccang.service';
import { PrismaService } from '../prisma/prisma.service';

interface TrackingSummary {
  status?: number;
  primary?: string;
  trackingNumbers: string[];
  list?: { box_number: string; tracking_number: string }[];
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eccangService: EccangService,
  ) {}

  async createOrder(input: CreateOrderInputType) {
    const eccangResponse = await this.eccangService.call<EccangCreateOrderResponseType>(
      'createOrder',
      input,
      EccangCreateOrderResponse,
    );

    let tracking = this.extractTrackingSummary(eccangResponse);

    if (eccangResponse.track_status === 2) {
      const polled = await this.pollTrackingNumbers(input.reference_no);
      if (polled) {
        tracking = polled;
      }
    }

    const orderData: Prisma.OrderUpsertArgs['create'] = {
      referenceNo: input.reference_no,
      orderCode: eccangResponse.order_code ?? null,
      shippingMethodNo: eccangResponse.shipping_method_no ?? null,
      countryCode: input.country_code,
      shippingMethod: input.shipping_method,
      orderWeightKg: input.order_weight,
      orderPieces: input.order_pieces,
      trackStatus: tracking?.status ?? eccangResponse.track_status ?? null,
      trackingNumberList: tracking?.list?.length
        ? tracking.list
        : tracking?.trackingNumbers?.length
        ? tracking.trackingNumbers
        : undefined,
    };

    const order = await this.prisma.order.upsert({
      where: { referenceNo: input.reference_no },
      update: {
        ...orderData,
        updatedAt: new Date(),
      },
      create: orderData,
      include: {
        Labels: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const latestLabel = order.Labels[0] ?? null;

    return {
      order: {
        ...order,
        latestLabel,
        Labels: undefined,
      },
      tracking,
      eccang: eccangResponse,
    };
  }

  async getOrder(referenceNo: string) {
    const order = await this.prisma.order.findUnique({
      where: { referenceNo },
      include: {
        Labels: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const latestLabel = order.Labels[0] ?? null;

    return {
      ...order,
      latestLabel,
    };
  }

  private extractTrackingSummary(
    response: EccangCreateOrderResponseType,
  ): TrackingSummary {
    const list = this.normalizeTrackingList(response.tracking_number_list);
    const numbers = new Set<string>();

    if (response.tracking_number) {
      numbers.add(response.tracking_number);
    }

    if (response.TrackingNumber) {
      numbers.add(response.TrackingNumber);
    }

    list.forEach((item) => {
      if (item.tracking_number) {
        numbers.add(item.tracking_number);
      }
    });

    const trackingNumbers = Array.from(numbers);

    return {
      status: response.track_status ?? undefined,
      primary: trackingNumbers[0],
      trackingNumbers,
      list: list.length ? list : undefined,
    };
  }

  private normalizeTrackingList(
    list?:
      | { box_number?: string; tracking_number?: string }[]
      | Record<string, string>
      | null,
  ): { box_number: string; tracking_number: string }[] {
    if (!list) {
      return [];
    }

    if (Array.isArray(list)) {
      return list
        .map((entry) => ({
          box_number: entry.box_number ?? 'PRIMARY',
          tracking_number: entry.tracking_number ?? '',
        }))
        .filter((entry) => !!entry.tracking_number);
    }

    return Object.entries(list).map(([box, tracking]) => ({
      box_number: box,
      tracking_number: tracking,
    }));
  }

  private async pollTrackingNumbers(
    referenceNo: string,
    attempts = 5,
    delayMs = 2000,
  ): Promise<TrackingSummary | null> {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const response = await this.eccangService.call<EccangGetTrackNumberResponseType>(
        'getTrackNumber',
        { reference_no: [referenceNo] },
        EccangGetTrackNumberResponse,
      );

      const summary = this.extractTrackingSummaryFromGet(response);
      if (summary) {
        return summary;
      }

      if (attempt < attempts - 1) {
        await this.delay(delayMs);
      }
    }

    this.logger.warn(`Tracking number polling timed out for ${referenceNo}`);
    return null;
  }

  private extractTrackingSummaryFromGet(
    response: EccangGetTrackNumberResponseType,
  ): TrackingSummary | null {
    const entry = response.datas?.[0];
    if (!entry) {
      return null;
    }

    const list = this.normalizeTrackingList(entry.tracking_number_list as any);
    const numbers = new Set<string>();

    if (entry.tracking_number) {
      numbers.add(entry.tracking_number);
    }

    if (entry.TrackingNumber) {
      numbers.add(entry.TrackingNumber);
    }

    list.forEach((item) => numbers.add(item.tracking_number));

    const trackingNumbers = Array.from(numbers);

    if (!trackingNumbers.length) {
      return null;
    }

    return {
      status: response.track_status ?? undefined,
      primary: trackingNumbers[0],
      trackingNumbers,
      list: list.length ? list : undefined,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
