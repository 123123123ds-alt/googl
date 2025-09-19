import { z } from 'zod';

export const ConsigneeSchema = z.object({
  consignee_name: z.string().min(1),
  consignee_street: z.string().min(1),
  consignee_city: z.string().min(1),
  consignee_province: z.string().optional(),
  consignee_postcode: z.string().min(1),
  consignee_telephone: z.string().min(1),
  consignee_email: z.string().email().optional(),
});

export const ItemSchema = z.object({
  invoice_enname: z.string().min(1),
  invoice_cnname: z.string().optional(),
  invoice_weight: z.number(),
  invoice_quantity: z.number().int().positive(),
  unit_code: z.enum(['PCE', 'PCS', 'SET']).optional(),
  invoice_unitcharge: z.number(),
  invoice_currencycode: z.string().default('USD'),
  hs_code: z.string().optional(),
  is_magnetoelectric: z.enum(['N', 'E', 'M', 'Y']).optional(),
  box_number: z.string().default('U001'),
});

export const VolumeSchema = z.object({
  box_number: z.string().default('U001'),
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  weight: z.number().optional(),
});

export const CreateOrderInput = z.object({
  reference_no: z.string().max(50),
  shipping_method: z.string().min(1),
  country_code: z.string().length(2),
  order_weight: z.number(),
  order_pieces: z.number().int().positive(),
  mail_cargo_type: z.number().default(4),
  cargo_type: z.enum(['W', 'D', 'L']).default('W'),
  is_COD: z.enum(['Y', 'N']).default('N'),
  Consignee: ConsigneeSchema,
  ItemArr: z.array(ItemSchema).min(1),
  Volume: z.array(VolumeSchema).min(1),
});

export type CreateOrderInputType = z.infer<typeof CreateOrderInput>;

export const EccangBaseResponse = z.object({
  ask: z.enum(['Success', 'Failure']),
  message: z.string(),
});

export const EccangCreateOrderResponse = EccangBaseResponse.extend({
  track_status: z.number().optional(),
  order_code: z.string().optional(),
  shipping_method_no: z.string().optional(),
  reference_no: z.string().optional(),
  TrackingNumber: z.string().optional(),
  tracking_number: z.string().optional(),
  tracking_number_list: z
    .array(z.object({ box_number: z.string(), tracking_number: z.string() }))
    .optional(),
  TrackingNumberInfo: z.any().optional(),
  data: z.any().optional(),
});

export type EccangCreateOrderResponseType = z.infer<
  typeof EccangCreateOrderResponse
>;

export const EccangGetTrackNumberResponse = EccangBaseResponse.extend({
  track_status: z.number().optional(),
  datas: z
    .array(
      z.object({
        reference_no: z.string().optional(),
        tracking_number: z.string().optional(),
        TrackingNumber: z.string().optional(),
        tracking_number_list: z
          .array(
            z.object({ box_number: z.string(), tracking_number: z.string() })
          )
          .optional(),
      })
    )
    .optional(),
});

export type EccangGetTrackNumberResponseType = z.infer<
  typeof EccangGetTrackNumberResponse
>;

export const EccangGetLabelUrlResponse = EccangBaseResponse.extend({
  datas: z
    .array(
      z.object({
        url: z.string().url(),
        label_type: z.string().optional(),
        reference_no: z.string().optional(),
        order_code: z.string().optional(),
        shipping_method_no: z.string().optional(),
        tracking_number: z.string().optional(),
      })
    )
    .optional(),
});

export type EccangGetLabelUrlResponseType = z.infer<
  typeof EccangGetLabelUrlResponse
>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
