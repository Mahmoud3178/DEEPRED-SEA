import { Component, OnInit } from '@angular/core';
import { CenterService } from '../../../core/services/center.service';

@Component({
  selector: 'app-center-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class CenterSettingsComponent implements OnInit {

  // Notifications — مربوطين بالـ API
  newBooking = true;
  cancellation = true;
  review = true;
  payment = false;

  // Booking Settings — مش موجودين في الـ API لسه
  autoApprove = false;
  depositRequired = true;

  saved = false;
  loading = false;
  error = '';

  // بنحتاجهم عشان نبعتهم في الـ updateProfile
  private profileSnapshot: any = null;

  notifItems = [
    { key: 'newBooking' as const,   label: 'New Booking',       desc: 'Notify me when a new booking arrives' },
    { key: 'cancellation' as const, label: 'Cancellation',      desc: 'Notify me when a booking is cancelled' },
    { key: 'review' as const,       label: 'New Review',        desc: 'Notify me when a customer leaves a review' },
    { key: 'payment' as const,      label: 'Payment Received',  desc: 'Notify me when payment is confirmed' },
  ];

  bookingItems = [
    { key: 'autoApprove' as const,    label: 'Auto-Approve Bookings', desc: 'Automatically confirm new bookings without review' },
    { key: 'depositRequired' as const, label: 'Require Deposit',      desc: 'Require 30% deposit to confirm a booking' },
  ];

  constructor(private centerService: CenterService) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.centerService.getProfile().subscribe({
      next: (data) => {
        this.profileSnapshot = data;
        this.newBooking = data.receiveBookingAlerts ?? true;
        this.review     = data.receiveReviewAlerts  ?? true;
      },
      error: () => {
        this.error = 'Failed to load settings.';
      }
    });
  }

  save(): void {
    if (!this.profileSnapshot) return;
    this.loading = true;
    this.error = '';

    const payload = {
      ...this.profileSnapshot,
      receiveBookingAlerts: this.newBooking,
      receiveReviewAlerts:  this.review,
    };

    this.centerService.updateProfile(payload).subscribe({
      next: () => {
        this.loading = false;
        this.saved = true;
        setTimeout(() => this.saved = false, 3000);
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to save settings.';
      }
    });
  }
}