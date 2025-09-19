'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { StatusMessage } from '@/components/status-message';
import { apiFetch } from '@/lib/api-client';

const ShipmentSchema = z.object({
  reference_no: z.string().min(1).max(50),
  shipping_method: z.string().min(1),
  country_code: z.string().min(2).max(2),
  order_weight: z.coerce.number().positive(),
  order_pieces: z.coerce.number().int().positive(),
  consignee_name: z.string().min(1),
  consignee_street: z.string().min(1),
  consignee_city: z.string().min(1),
  consignee_province: z.string().optional(),
  consignee_postcode: z.string().min(1),
  consignee_telephone: z.string().min(1),
  consignee_email: z.string().email().optional(),
  item_invoice_enname: z.string().min(1),
  item_invoice_weight: z.coerce.number().positive(),
  item_invoice_quantity: z.coerce.number().int().positive(),
  item_invoice_unitcharge: z.coerce.number().positive(),
  volume_length: z.coerce.number().positive().optional(),
  volume_width: z.coerce.number().positive().optional(),
  volume_height: z.coerce.number().positive().optional(),
  volume_weight: z.coerce.number().positive().optional(),
});

type ShipmentFormValues = z.infer<typeof ShipmentSchema>;

type TrackingSummary = {
  status?: number | null;
  primary?: string;
  trackingNumbers: string[];
  list?: { box_number: string; tracking_number: string }[];
};

type OrderRecord = {
  id: string;
  referenceNo: string;
  orderCode: string | null;
  shippingMethodNo: string | null;
  countryCode: string;
  shippingMethod: string;
  orderWeightKg: number;
  orderPieces: number;
  trackStatus: number | null;
  createdAt: string;
  updatedAt: string;
  trackingNumberList: any;
  lastLabelAt: string | null;
  latestLabel?: LabelRecord | null;
};

type LabelRecord = {
  id: string;
  url: string;
  type: string;
  createdAt: string;
  Order?: OrderRecord;
};

type CreateOrderResponse = {
  order: OrderRecord;
  tracking?: TrackingSummary | null;
  eccang: unknown;
};

export default function NewShipmentPage() {
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [result, setResult] = useState<CreateOrderResponse | null>(null);
  const [label, setLabel] = useState<LabelRecord | null>(null);
  const [isLabelLoading, setIsLabelLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ShipmentFormValues>({
    resolver: zodResolver(ShipmentSchema),
    defaultValues: {
      reference_no: '',
      shipping_method: '',
      country_code: 'US',
      order_weight: 0.5,
      order_pieces: 1,
      consignee_name: '',
      consignee_street: '',
      consignee_city: '',
      consignee_province: '',
      consignee_postcode: '',
      consignee_telephone: '',
      consignee_email: '',
      item_invoice_enname: '',
      item_invoice_weight: 0.5,
      item_invoice_quantity: 1,
      item_invoice_unitcharge: 10,
      volume_length: undefined,
      volume_width: undefined,
      volume_height: undefined,
      volume_weight: undefined,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setStatus(null);
    setLabel(null);

    const payload = {
      reference_no: values.reference_no,
      shipping_method: values.shipping_method,
      country_code: values.country_code.toUpperCase(),
      order_weight: values.order_weight,
      order_pieces: values.order_pieces,
      mail_cargo_type: 4,
      cargo_type: 'W',
      is_COD: 'N',
      Consignee: {
        consignee_name: values.consignee_name,
        consignee_street: values.consignee_street,
        consignee_city: values.consignee_city,
        consignee_province: values.consignee_province || undefined,
        consignee_postcode: values.consignee_postcode,
        consignee_telephone: values.consignee_telephone,
        consignee_email: values.consignee_email || undefined,
      },
      ItemArr: [
        {
          invoice_enname: values.item_invoice_enname,
          invoice_weight: values.item_invoice_weight,
          invoice_quantity: values.item_invoice_quantity,
          invoice_unitcharge: values.item_invoice_unitcharge,
          invoice_currencycode: 'USD',
          box_number: 'U001',
        },
      ],
      Volume: [
        {
          box_number: 'U001',
          length: values.volume_length || undefined,
          width: values.volume_width || undefined,
          height: values.volume_height || undefined,
          weight: values.volume_weight || undefined,
        },
      ],
    };

    try {
      const response = await apiFetch<CreateOrderResponse>('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setResult(response);
      setLabel(response.order.latestLabel ?? null);
      setStatus({ type: 'success', message: 'Order created successfully.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create order.';
      setStatus({ type: 'error', message });
    }
  });

  const handleGetLabel = async () => {
    if (!result?.order?.referenceNo) {
      return;
    }

    setIsLabelLoading(true);
    setStatus(null);

    try {
      const newLabel = await apiFetch<LabelRecord>(`/orders/${result.order.referenceNo}/label`, {
        method: 'POST',
      });
      setLabel(newLabel);
      setStatus({ type: 'success', message: 'Label retrieved successfully.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch label.';
      setStatus({ type: 'error', message });
    } finally {
      setIsLabelLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Create ECCang Shipment</h1>
        <p className="mt-2 text-sm text-slate-600">
          Complete the required shipment details to create an order in ECCang.
        </p>
      </div>

      {status && <StatusMessage type={status.type} message={status.message} />}

      <form className="grid grid-cols-1 gap-6 lg:grid-cols-2" onSubmit={onSubmit}>
        <section className="space-y-4 rounded-lg bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Order details</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="reference_no">
                Reference number
              </label>
              <input id="reference_no" {...register('reference_no')} />
              {errors.reference_no && (
                <p className="mt-1 text-sm text-red-600">{errors.reference_no.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="shipping_method">
                Shipping method
              </label>
              <input id="shipping_method" {...register('shipping_method')} />
              {errors.shipping_method && (
                <p className="mt-1 text-sm text-red-600">{errors.shipping_method.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="country_code">
                Country code
              </label>
              <input id="country_code" maxLength={2} {...register('country_code')} />
              {errors.country_code && (
                <p className="mt-1 text-sm text-red-600">{errors.country_code.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="order_weight">
                  Total weight (kg)
                </label>
                <input id="order_weight" type="number" step="0.01" {...register('order_weight')} />
                {errors.order_weight && (
                  <p className="mt-1 text-sm text-red-600">{errors.order_weight.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="order_pieces">
                  Pieces
                </label>
                <input id="order_pieces" type="number" {...register('order_pieces')} />
                {errors.order_pieces && (
                  <p className="mt-1 text-sm text-red-600">{errors.order_pieces.message}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Consignee</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="consignee_name">
                Name
              </label>
              <input id="consignee_name" {...register('consignee_name')} />
              {errors.consignee_name && (
                <p className="mt-1 text-sm text-red-600">{errors.consignee_name.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="consignee_street">
                Street
              </label>
              <input id="consignee_street" {...register('consignee_street')} />
              {errors.consignee_street && (
                <p className="mt-1 text-sm text-red-600">{errors.consignee_street.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="consignee_city">
                City
              </label>
              <input id="consignee_city" {...register('consignee_city')} />
              {errors.consignee_city && (
                <p className="mt-1 text-sm text-red-600">{errors.consignee_city.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="consignee_province">
                Province / State
              </label>
              <input id="consignee_province" {...register('consignee_province')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="consignee_postcode">
                Postal code
              </label>
              <input id="consignee_postcode" {...register('consignee_postcode')} />
              {errors.consignee_postcode && (
                <p className="mt-1 text-sm text-red-600">{errors.consignee_postcode.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="consignee_telephone">
                Telephone
              </label>
              <input id="consignee_telephone" {...register('consignee_telephone')} />
              {errors.consignee_telephone && (
                <p className="mt-1 text-sm text-red-600">{errors.consignee_telephone.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="consignee_email">
                Email (optional)
              </label>
              <input id="consignee_email" type="email" {...register('consignee_email')} />
              {errors.consignee_email && (
                <p className="mt-1 text-sm text-red-600">{errors.consignee_email.message}</p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Item</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="item_invoice_enname">
                Description
              </label>
              <input id="item_invoice_enname" {...register('item_invoice_enname')} />
              {errors.item_invoice_enname && (
                <p className="mt-1 text-sm text-red-600">{errors.item_invoice_enname.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="item_invoice_weight">
                  Weight (kg)
                </label>
                <input
                  id="item_invoice_weight"
                  type="number"
                  step="0.01"
                  {...register('item_invoice_weight')}
                />
                {errors.item_invoice_weight && (
                  <p className="mt-1 text-sm text-red-600">{errors.item_invoice_weight.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="item_invoice_quantity">
                  Quantity
                </label>
                <input id="item_invoice_quantity" type="number" {...register('item_invoice_quantity')} />
                {errors.item_invoice_quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.item_invoice_quantity.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="item_invoice_unitcharge">
                Unit price
              </label>
              <input
                id="item_invoice_unitcharge"
                type="number"
                step="0.01"
                {...register('item_invoice_unitcharge')}
              />
              {errors.item_invoice_unitcharge && (
                <p className="mt-1 text-sm text-red-600">{errors.item_invoice_unitcharge.message}</p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-lg bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Volume (optional)</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="volume_length">
                Length (cm)
              </label>
              <input id="volume_length" type="number" step="0.1" {...register('volume_length')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="volume_width">
                Width (cm)
              </label>
              <input id="volume_width" type="number" step="0.1" {...register('volume_width')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="volume_height">
                Height (cm)
              </label>
              <input id="volume_height" type="number" step="0.1" {...register('volume_height')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="volume_weight">
                Box weight (kg)
              </label>
              <input id="volume_weight" type="number" step="0.01" {...register('volume_weight')} />
            </div>
          </div>
        </section>

        <div className="lg:col-span-2 flex justify-end">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Create order'}
          </button>
        </div>
      </form>

      {result && (
        <section className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Order result</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Reference</p>
              <p className="font-medium text-slate-900">{result.order.referenceNo}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Order code</p>
              <p className="font-medium text-slate-900">{result.order.orderCode ?? 'Pending'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Shipping method no.</p>
              <p className="font-medium text-slate-900">{result.order.shippingMethodNo ?? 'Pending'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Track status</p>
              <p className="font-medium text-slate-900">{result.tracking?.status ?? result.order.trackStatus ?? '—'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-slate-500">Tracking numbers</p>
              {result.tracking?.trackingNumbers?.length ? (
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-800">
                  {result.tracking.trackingNumbers.map((tracking) => (
                    <li key={tracking}>{tracking}</li>
                  ))}
                </ul>
              ) : (
                <p className="font-medium text-slate-900">Pending</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={handleGetLabel} disabled={isLabelLoading}>
              {isLabelLoading ? 'Fetching label…' : 'Get label'}
            </button>
            {label && (
              <a
                href={label.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600"
              >
                Open latest label
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
