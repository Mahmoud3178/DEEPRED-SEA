import { Component } from '@angular/core';

@Component({ selector: 'app-admin-overview', templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css'] })
export class AdminOverviewComponent {
  stats = [
    { label: 'Total Centers', value: '152', change: '+8 this month', up: true, icon: 'storefront', color: '#005d90' },
    { label: 'Total Users', value: '52,481', change: '+1,240 this month', up: true, icon: 'group', color: '#00677d' },
    { label: 'Total Revenue', value: '2.4M', change: '+18% YoY', up: true, icon: 'payments', color: '#3156a2' },
    { label: 'Active Bookings', value: '3,891', change: '+234 today', up: true, icon: 'event_available', color: '#f59e0b' },
  ];

  recentCenters = [
    { name: 'Aqua Blue Diving', location: 'Hurghada', owner: 'Khalid Rashid', status: 'pending', date: '2025-07-18' },
    { name: 'Sinai Dive Hub', location: 'Dahab', owner: 'Nour Ibrahim', status: 'active', date: '2025-07-17' },
    { name: 'Red Sea Explorers', location: 'Marsa Alam', owner: 'Yara Farouk', status: 'pending', date: '2025-07-16' },
    { name: 'Crystal Waters', location: 'Sharm', owner: 'Amr Salah', status: 'active', date: '2025-07-15' },
  ];

  topCenters = [
    { name: 'Orca Dive Club', bookings: 124, revenue: 43200, rating: 4.9 },
    { name: 'Blue Ocean Divers', bookings: 98, revenue: 32100, rating: 4.8 },
    { name: 'Dahab Divers', bookings: 87, revenue: 27400, rating: 4.7 },
  ];

  approve(name: string) {
    const c = this.recentCenters.find(c => c.name === name);
    if (c) c.status = 'active';
  }
}
