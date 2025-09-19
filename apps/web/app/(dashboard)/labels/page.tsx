'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { StatusMessage } from '@/components/status-message';
import { apiFetch } from '@/lib/api-client';

type OrderRecord = {
  id: string;
  referenceNo: string;
  orderCode: string | null;
  shippingMethodNo: string | null;
  trackStatus: number | null;
  trackingNumberList: any;
};

type LabelRecord = {
  id: string;
  url: string;
  type: string;
  createdAt: string;
  Order: OrderRecord;
};

type LabelsResponse = {
  items: LabelRecord[];
  total: number;
  page: number;
  pageSize: number;
};

function parseTrackingNumbers(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === 'string') {
          return entry;
        }
        if (entry && typeof entry === 'object' && 'tracking_number' in entry) {
          return String((entry as { tracking_number?: unknown }).tracking_number ?? '');
        }
        return '';
      })
      .filter(Boolean);
  }

  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map((item) => (item ? String(item) : ''))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return [value];
  }

  return [];
}

export default function LabelsPage() {
  const [labels, setLabels] = useState<LabelRecord[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const fetchLabels = useCallback(
    async (requestedPage: number, term: string) => {
      setLoading(true);
      setStatus(null);
      try {
        const params = new URLSearchParams();
        params.set('page', String(requestedPage));
        params.set('pageSize', String(pageSize));
        if (term) {
          params.set('q', term);
        }
        const response = await apiFetch<LabelsResponse>(`/labels?${params.toString()}`);
        setLabels(response.items);
        setTotal(response.total);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load labels.';
        setStatus({ type: 'error', message });
      } finally {
        setLoading(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    fetchLabels(page, search);
  }, [page, search, fetchLabels]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(pendingSearch.trim());
  };

  const handleReprint = async (referenceNo: string) => {
    setStatus(null);
    try {
      await apiFetch(`/orders/${referenceNo}/label`, { method: 'POST', skipJson: true });
      setStatus({ type: 'success', message: 'Label reprint requested successfully.' });
      fetchLabels(page, search);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to request label.';
      setStatus({ type: 'error', message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Labels</h1>
          <p className="mt-2 text-sm text-slate-600">
            View and reprint labels generated for ECCang orders.
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Search reference or code"
            value={pendingSearch}
            onChange={(event) => setPendingSearch(event.target.value)}
            className="w-60"
          />
          <button type="submit">Search</button>
        </form>
      </div>

      {status && <StatusMessage type={status.type} message={status.message} />}

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Tracking</th>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3" aria-label="actions">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {labels.map((label) => {
              const trackingNumbers = parseTrackingNumbers(label.Order?.trackingNumberList);
              return (
                <tr key={label.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">
                    {dayjs(label.createdAt).format('YYYY-MM-DD HH:mm')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{label.Order?.referenceNo}</div>
                    <div className="text-xs text-slate-500">
                      {label.Order?.shippingMethodNo || label.Order?.orderCode || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {trackingNumbers.length ? trackingNumbers.join(', ') : 'Pending'}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={label.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Open label
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => handleReprint(label.Order.referenceNo)}>
                      Reprint
                    </button>
                  </td>
                </tr>
              );
            })}
            {!labels.length && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No labels found.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <div>
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
