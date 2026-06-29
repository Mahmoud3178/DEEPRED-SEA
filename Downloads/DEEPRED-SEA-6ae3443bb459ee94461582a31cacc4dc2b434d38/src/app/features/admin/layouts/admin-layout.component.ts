import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({ selector: 'app-admin-layout', templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'] })
export class AdminLayoutComponent {
  sidebarOpen = false;

  navLinks = [
    { label: 'Overview', icon: 'dashboard', route: '/admin/overview' },
    { label: 'Centers', icon: 'storefront', route: '/admin/centers' },
    { label: 'Users', icon: 'group', route: '/admin/users' },
    { label: 'Analytics', icon: 'bar_chart', route: '/admin/analytics' },
    { label: 'Settings', icon: 'settings', route: '/admin/settings' },
  ];

  constructor(public auth: AuthService) {}
  logout() { this.auth.logout(); }
}
