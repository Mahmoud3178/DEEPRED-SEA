import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface CenterBookingListItemResponse {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  departureDate: string;
  diversCount: number;
  bookingStatus: string | null;
  paymentStatus: string | null;
  finalPriceAmount: number;
  currency: string | null;
  offeringId: string;
  canReview: boolean;
  hasReview: boolean;
}

export interface PagedBookingsResponse {
  items: CenterBookingListItemResponse[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// ── Booking Status Enum (integer values من الـ API) ──────────────
// الـ response بيرجع string، بس الـ filter query بياخد integer
const BOOKING_STATUS_MAP: Record<string, number> = {
  'Pending':    1,
  'Confirmed':  2,
  'Cancelled':  3,
  'Completed':  4,
  'NoShow':     5,
  'CheckedIn':  6,
  'Started':    7,
  'Rejected':   8,
  'Approved':   9,
};

const PAYMENT_STATUS_MAP: Record<string, number> = {
  'Unpaid':   1,
  'Deposit':  2,
  'Paid':     3,
  'Refunded': 4,
  'Failed':   5,
};

@Component({
  selector: 'app-center-bookings',
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css']
})
export class CenterBookingsComponent implements OnInit {

  // ── State ─────────────────────────────────────────────
  bookings: CenterBookingListItemResponse[] = [];
  isLoading = false;
  errorMsg  = '';

  // ── Filters ───────────────────────────────────────────
  filter           = 'all';
  filterStatusCode: number | null = null;
  search           = '';

  // ── Pagination ────────────────────────────────────────
  page       = 1;
  pageSize   = 20;
  totalCount = 0;
  totalPages = 0;

  // ── Actions ───────────────────────────────────────────
  actionLoading   : string | null = null;
  cancelReason      = '';
  showCancelModal   = false;
  pendingCancelId : string | null = null;

  // ── Modal ─────────────────────────────────────────────
  selectedBooking: CenterBookingListItemResponse | null = null;

  filterTabs = [
    { value: 'all',       label: 'All',       statusCode: null },
    { value: 'Pending',   label: 'Pending',   statusCode: BOOKING_STATUS_MAP['Pending']   },
    { value: 'Confirmed', label: 'Confirmed', statusCode: BOOKING_STATUS_MAP['Confirmed'] },
    { value: 'Cancelled', label: 'Cancelled', statusCode: BOOKING_STATUS_MAP['Cancelled'] },
    { value: 'Completed', label: 'Completed', statusCode: BOOKING_STATUS_MAP['Completed'] },
  ];

  private readonly base = environment.centerApiUrl;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  // ── Load ──────────────────────────────────────────────
  loadBookings(): void {
    this.isLoading = true;
    this.errorMsg  = '';

    let params = new HttpParams()
      .set('page',     this.page)
      .set('pageSize', this.pageSize);

    // ✅ ابعت integer مش string
    if (this.filterStatusCode !== null) {
      params = params.set('status', this.filterStatusCode);
    }

    this.http.get<PagedBookingsResponse>(
      `${this.base}/bookings/center`,
      { params }
    ).subscribe({
      next: (res) => {
        this.bookings   = res.items ?? [];
        this.totalCount = res.totalCount;
        this.totalPages = res.totalPages;
        this.isLoading  = false;
      },
      error: () => {
        this.errorMsg  = 'Failed to load bookings. Please try again.';
        this.isLoading = false;
      }
    });
  }

  // ── Filter ────────────────────────────────────────────
  setFilter(tab: { value: string; statusCode: number | null }): void {
    this.filter           = tab.value;
    this.filterStatusCode = tab.statusCode;
    this.page             = 1;
    this.loadBookings();
  }

  // ── Search (client-side) ──────────────────────────────
  get filtered(): CenterBookingListItemResponse[] {
    if (!this.search) return this.bookings;
    const q = this.search.toLowerCase();
    return this.bookings.filter(b =>
      (b.customerName  ?? '').toLowerCase().includes(q) ||
      (b.customerEmail ?? '').toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q)
    );
  }

  // ── Pagination ────────────────────────────────────────
  prevPage(): void {
    if (this.page > 1) { this.page--; this.loadBookings(); }
  }

  nextPage(): void {
    if (this.page < this.totalPages) { this.page++; this.loadBookings(); }
  }

  // ── Confirm ───────────────────────────────────────────
  confirmBooking(id: string, event?: Event): void {
    event?.stopPropagation();
    this.actionLoading = id;
    this.http.post<void>(`${this.base}/bookings/${id}/confirm`, {}).subscribe({
      next: () => {
        this.actionLoading = null;
        this.updateLocalStatus(id, 'Confirmed');
      },
      error: () => {
        this.actionLoading = null;
        this.errorMsg = 'Failed to confirm booking.';
      }
    });
  }

  // ── Cancel ────────────────────────────────────────────
  openCancelModal(id: string, event?: Event): void {
    event?.stopPropagation();
    this.pendingCancelId = id;
    this.cancelReason    = '';
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.pendingCancelId = null;
  }

  submitCancel(): void {
    if (!this.pendingCancelId) return;
    const id = this.pendingCancelId;
    this.actionLoading = id;

    this.http.post<void>(
      `${this.base}/bookings/${id}/cancel`,
      { reason: this.cancelReason || null }
    ).subscribe({
      next: () => {
        this.actionLoading   = null;
        this.showCancelModal = false;
        this.updateLocalStatus(id, 'Cancelled');
      },
      error: () => {
        this.actionLoading = null;
        this.errorMsg = 'Failed to cancel booking.';
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────
  private updateLocalStatus(id: string, status: string): void {
    this.bookings = this.bookings.map(b =>
      b.id === id ? { ...b, bookingStatus: status } : b
    );
    if (this.selectedBooking?.id === id) {
      this.selectedBooking = { ...this.selectedBooking, bookingStatus: status };
    }
  }

  get totalRevenue(): number {
    return this.bookings
      .filter(b => (b.bookingStatus ?? '').toLowerCase() !== 'cancelled')
      .reduce((s, b) => s + b.finalPriceAmount, 0);
  }

  countByStatus(value: string): number {
    if (value === 'all') return this.totalCount;
    return this.bookings.filter(b =>
      (b.bookingStatus ?? '').toLowerCase() === value.toLowerCase()
    ).length;
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  getStatusClass(status: string | null): string {
    switch ((status ?? '').toLowerCase()) {
      case 'confirmed':
      case 'completed':  return 'badge-active';
      case 'pending':    return 'badge-pending';
      case 'cancelled':
      case 'rejected':
      case 'noshow':     return 'badge-blocked';
      default:           return 'badge-pending';
    }
  }

  getPaymentClass(status: string | null): string {
    switch ((status ?? '').toLowerCase()) {
      case 'paid':       return 'badge-active';
      case 'deposit':
      case 'partial':    return 'badge-pending';
      case 'refunded':   return 'badge-pending';
      case 'unpaid':
      case 'failed':     return 'badge-blocked';
      default:           return 'badge-pending';
    }
  }

  openBooking(b: CenterBookingListItemResponse): void  { this.selectedBooking = b; }
  closeBooking(): void { this.selectedBooking = null; }
}