/**
 * Booking invoices: types, fetching and PDF download.
 *
 * The API issues one invoice per settled payment (completed or refunded).
 * The PDF is fetched through the authenticated `api` client as a blob and saved
 * with the file name from Content-Disposition.
 */
import api from '@/lib/axios'

export type InvoiceAudience = 'client' | 'store' | 'admin'

export interface InvoiceLineItem {
  key: string
  description: string
  detail: string | null
  quantity: number
  unit_price: number
  amount: number
}

export interface Invoice {
  invoice_number: string
  file_name: string
  status: 'paid' | 'refunded'
  status_label: string
  issued_at: string | null
  issued_on: string | null
  currency: string
  issuer: { name: string; tagline: string; website: string; support_email: string }
  customer: { name: string | null; email: string | null; phone: string | null }
  store: { name: string | null; address: string | null; phone: string | null; email: string | null }
  booking: {
    id: number
    booking_number: string
    event_name: string
    event_type: string | null
    event_type_label: string | null
    event_date: string | null
    event_date_label: string | null
    start_time: string | null
    end_time: string | null
    time_label: string | null
    duration_hours: number | null
    guests: number
    venue: { name: string | null; address: string | null }
  }
  line_items: InvoiceLineItem[]
  totals: {
    subtotal: number
    discount: number
    tax_rate: number
    tax_label: string
    tax: number
    total: number
    amount_paid: number
    refunded: number
    balance_due: number
  }
  payment: {
    id: number
    status: string
    method: string
    method_label: string
    transaction_id: string | null
    reference: string | null
    amount: number
    currency: string
    paid_at: string | null
    paid_at_label: string | null
    refunded_at: string | null
    refunded_at_label: string | null
    gateway_amount: number | null
    gateway_currency: string | null
    exchange_rate: number | null
  }
}

/** Bookings that have an invoice (a completed or refunded payment). */
export function hasInvoice(b: { payment_status?: string | null } | null | undefined): boolean {
  return !!b && (b.payment_status === 'paid' || b.payment_status === 'refunded')
}

/** 231000 → "231,000.00" (invoices show exact amounts). */
export function invoiceMoney(n: number | string | null | undefined): string {
  return Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export async function fetchInvoice(bookingId: number | string): Promise<Invoice> {
  const { data } = await api.get(`/client/bookings/${bookingId}/invoice`)
  return data.data as Invoice
}

/** Same pattern the API uses, for when the header can't be read. */
export function fallbackInvoiceFileName(invoiceNumber?: string | null, bookingNumber?: string | null): string {
  const safe = (v?: string | null) => String(v ?? '').replace(/[^A-Za-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
  return ['EventGenius-Invoice', safe(invoiceNumber), safe(bookingNumber)].filter(Boolean).join('-') + '.pdf'
}

function fileNameFromDisposition(header: string | undefined | null): string | null {
  if (!header) return null
  const star = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header)
  if (star) {
    try { return decodeURIComponent(star[1].trim().replace(/^"|"$/g, '')) } catch { /* fall through */ }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(header)
  return plain ? plain[1].trim() : null
}

async function blobErrorMessage(err: any): Promise<string> {
  const data = err?.response?.data
  if (data instanceof Blob) {
    try {
      const json = JSON.parse(await data.text())
      if (json?.message) return json.message
    } catch { /* not JSON */ }
  }
  if (err?.response?.status === 404) return 'No invoice is available for this booking yet.'
  return data?.message || 'Could not download the invoice. Please try again.'
}

/**
 * Download the invoice PDF and save it. Resolves with the saved file name;
 * rejects with an Error whose message is safe to show in a toast.
 */
export async function downloadInvoicePdf(
  audience: InvoiceAudience,
  bookingId: number | string,
  hint: { invoiceNumber?: string | null; bookingNumber?: string | null } = {},
): Promise<string> {
  let res
  try {
    res = await api.get(`/${audience}/bookings/${bookingId}/invoice.pdf`, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    })
  } catch (err) {
    throw new Error(await blobErrorMessage(err))
  }

  const name = fileNameFromDisposition(res.headers['content-disposition'])
    || fallbackInvoiceFileName(hint.invoiceNumber || res.headers['x-invoice-number'], hint.bookingNumber)
  const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Give mobile browsers time to start reading the blob before releasing it.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
  return name
}
