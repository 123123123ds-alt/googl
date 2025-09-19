import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { LabelsService } from './labels.service';

const ReferenceParamSchema = z.object({
  reference: z.string().min(1),
});

const ListLabelsQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

@Controller()
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post('orders/:reference/label')
  async generate(@Param() params: unknown) {
    const { reference } = ReferenceParamSchema.parse(params);
    return this.labelsService.generateLabel(reference);
  }

  @Get('labels')
  async list(@Query() query: unknown) {
    const parsed = ListLabelsQuerySchema.parse(query);
    return this.labelsService.listLabels(parsed);
  }
}
