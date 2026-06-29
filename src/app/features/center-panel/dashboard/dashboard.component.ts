import { Component, OnInit } from '@angular/core';
import {
  CenterService,
  CenterProfileResponse,
  CenterDiverTierResponse,
  CenterActivityItemResponse,
  CenterBookingListItemResponse,
} from '../../../core/services/center.service';

@Component({
  selector: 'app-center-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class CenterDashboardComponent implements OnInit {

  loading         = false;
  bookingsLoading = false;

  stats = [
    { label: 'Total Bookings',   value: '—', change: '', up: true,  icon: 'event_available', color: '#005d90' },
    { label: 'Revenue (EGP)',    value: '—', change: '', up: true,  icon: 'payments',        color: '#00677d' },
    { label: 'Active Trips',     value: '—', change: '', up: true,  icon: 'sailing',         color: '#3156a2' },
    { label: 'Pending Payments', value: '—', change: '', up: false, icon: 'pending_actions', color: '#f59e0b' }
  ];

  upcomingTrips:  any[]                                = [];
  activities:     CenterActivityItemResponse[]         = [];
  diverTiers:     CenterDiverTierResponse[]            = [];
  monthlyData:    { month: string; bookings: number }[] = [];
  recentBookings: CenterBookingListItemResponse[]      = [];

  constructor(private centerService: CenterService) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadActivities();
    this.loadDiverTiers();
    this.loadRecentBookings();
  }

  // ── Dashboard ─────────────────────────────────────────────────
  loadDashboard(): void {
    this.loading = true;

    this.centerService.getDashboard('30d').subscribe({
      next: (data) => {
        this.loading = false;

        const s      = data.summary;
        const growth = s.monthlyRevenue?.growthPercentage ?? 0;

        this.stats = [
          {
            label:  'Total Bookings',
            value:  (s.totalBookings ?? 0).toString(),
            change: '',
            up:     true,
            icon:   'event_available',
            color:  '#005d90'
          },
          {
            label:  'Revenue (EGP)',
            value:  (s.monthlyRevenue?.currentMonth ?? 0).toLocaleString(),
            change: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
            up:     growth >= 0,
            icon:   'payments',
            color:  '#00677d'
          },
          {
            label:  'Active Trips',
            value:  (s.activeOfferings ?? 0).toString(),
            change: '',
            up:     true,
            icon:   'sailing',
            color:  '#3156a2'
          },
          {
            label:  'Pending Payments',
            value:  (s.pendingPaymentsCount ?? 0).toString(),
            change: '',
            up:     false,
            icon:   'pending_actions',
            color:  '#f59e0b'
          }
        ];

        this.upcomingTrips = data.upcomingTrips ?? [];

        this.monthlyData = (data.bookingTrend ?? []).map(item => ({
          month:    new Date(item.date).toLocaleString('en', { month: 'short' }),
          bookings: item.count
        }));
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  // ── Recent Bookings ───────────────────────────────────────────
  loadRecentBookings(): void {
    this.bookingsLoading = true;

    this.centerService.getCenterBookings(1, 5).subscribe({
      next: (res) => {
        this.recentBookings  = res.items ?? [];
        this.bookingsLoading = false;
      },
      error: () => {
        this.bookingsLoading = false;
      }
    });
  }

  confirmBooking(id: string): void {
    this.centerService.confirmBooking(id).subscribe({
      next:  () => this.updateLocalStatus(id, 'Confirmed'),
      error: () => {}
    });
  }

  cancelBooking(id: string): void {
    this.centerService.cancelBooking(id).subscribe({
      next:  () => this.updateLocalStatus(id, 'Cancelled'),
      error: () => {}
    });
  }

  private updateLocalStatus(id: string, status: string): void {
    this.recentBookings = this.recentBookings.map(b =>
      b.id === id ? { ...b, bookingStatus: status } : b
    );
  }

  // ── Activities ────────────────────────────────────────────────
  loadActivities(): void {
    this.centerService.getActivities().subscribe({
      next:  (data) => { this.activities = data.items ?? []; },
      error: (err)  => { console.error(err); }
    });
  }

  // ── Diver Tiers ───────────────────────────────────────────────
  loadDiverTiers(): void {
    this.centerService.getProfile().subscribe({
      next: (profile: CenterProfileResponse) => {
        const centerId = profile.id;
        if (!centerId) return;

        this.centerService.getDiverTiers(centerId).subscribe({
          next:  (data) => { this.diverTiers = data.items ?? []; },
          error: (err)  => { console.error(err); }
        });
      },
      error: (err) => { console.error(err); }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────
  get maxBookings(): number {
    return Math.max(...this.monthlyData.map(x => x.bookings), 1);
  }

  getStatusClass(status: string | null): string {
    switch ((status ?? '').toLowerCase()) {
      case 'confirmed':
      case 'completed':  return 'badge-active';
      case 'pending':    return 'badge-pending';
      case 'cancelled':
      case 'rejected':   return 'badge-blocked';
      default:           return 'badge-pending';
    }
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  getInitial(name: string): string {
    return (name ?? '?').charAt(0).toUpperCase();
  }
}