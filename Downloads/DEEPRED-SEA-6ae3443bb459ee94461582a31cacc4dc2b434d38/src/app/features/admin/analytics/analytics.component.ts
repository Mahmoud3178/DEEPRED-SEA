import { Component } from '@angular/core';

@Component({ selector: 'app-admin-analytics', templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'] })
export class AdminAnalyticsComponent {
  selectedPeriod = '6m';

  monthlyRevenue = [
    { month: 'Feb', revenue: 180000, bookings: 412 },
    { month: 'Mar', revenue: 240000, bookings: 548 },
    { month: 'Apr', revenue: 210000, bookings: 490 },
    { month: 'May', revenue: 290000, bookings: 672 },
    { month: 'Jun', revenue: 350000, bookings: 820 },
    { month: 'Jul', revenue: 420000, bookings: 980 },
  ];

  topLocations = [
    { name: 'Sharm El Sheikh', percent: 42, bookings: 1640 },
    { name: 'Hurghada', percent: 28, bookings: 1090 },
    { name: 'Dahab', percent: 18, bookings: 700 },
    { name: 'Marsa Alam', percent: 12, bookings: 467 },
  ];

  get maxRevenue() { return Math.max(...this.monthlyRevenue.map(d => d.revenue)); }
}
