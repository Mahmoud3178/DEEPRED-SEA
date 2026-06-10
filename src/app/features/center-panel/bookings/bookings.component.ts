import { Component } from '@angular/core';

@Component({ selector: 'app-center-bookings', templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css'] })
export class CenterBookingsComponent {
  filter = 'all';
  search = '';

  bookings = [
    { id: 'B041', diver: 'Sarah Mitchell', email: 'sarah@email.com', trip: 'Morning Reef Dive', date: '2025-07-18', divers: 2, total: 700, status: 'confirmed', payment: 'deposit' },
    { id: 'B040', diver: 'James Kowalski', email: 'james@email.com', trip: 'Thistlegorm Wreck', date: '2025-07-17', divers: 1, total: 850, status: 'pending', payment: 'unpaid' },
    { id: 'B039', diver: 'Lena Petrova', email: 'lena@email.com', trip: 'PADI Open Water', date: '2025-07-16', divers: 3, total: 8400, status: 'confirmed', payment: 'paid' },
    { id: 'B038', diver: 'Omar Hassan', email: 'omar@email.com', trip: 'Ras Mohammed NP', date: '2025-07-15', divers: 2, total: 1300, status: 'confirmed', payment: 'paid' },
    { id: 'B037', diver: 'Emma Wilson', email: 'emma@email.com', trip: 'Morning Reef Dive', date: '2025-07-14', divers: 1, total: 350, status: 'cancelled', payment: 'refunded' },
    { id: 'B036', diver: 'Ali Karim', email: 'ali@email.com', trip: 'Advanced Nitrox', date: '2025-07-12', divers: 2, total: 3800, status: 'confirmed', payment: 'paid' },
  ];

  filterTabs = [
    { value: 'all', label: 'All' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  get filtered() {
    return this.bookings
      .filter(b => this.filter === 'all' || b.status === this.filter)
      .filter(b => !this.search || b.diver.toLowerCase().includes(this.search.toLowerCase()) || b.id.toLowerCase().includes(this.search.toLowerCase()));
  }

  get totalRevenue() { return this.bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.total, 0); }
  countByStatus(s: string) { return s === 'all' ? this.bookings.length : this.bookings.filter(b => b.status === s).length; }
  update(id: string, status: string) {
  const b = this.bookings.find(b => b.id === id);
  if (b) { b.status = status; }
  if (this.selectedBooking?.id === id) this.selectedBooking.status = status;
}


  selectedBooking: any = null;
  openBooking(b: any) { this.selectedBooking = b; }
  closeBooking() { this.selectedBooking = null; }
}
