import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { CenterService, CenterProfileResponse } from '../../../core/services/center.service';

@Component({
  selector: 'app-center-layout',
  templateUrl: './center-layout.component.html',
  styleUrls: ['./center-layout.component.css']
})
export class CenterLayoutComponent implements OnInit {

  sidebarOpen = false;

  centerName     = '';
  centerImageUrl = '';
  centerInitial  = '';

  navLinks = [
    { label: 'Dashboard', icon: 'dashboard',       route: '/center/dashboard' },
    { label: 'Trips',     icon: 'sailing',          route: '/center/trips'    },
    { label: 'Bookings',  icon: 'event_available',  route: '/center/bookings' },
    { label: 'Reviews',   icon: 'star',             route: '/center/reviews'  },
    { label: 'Profile',   icon: 'store',            route: '/center/profile'  },
    { label: 'Employees', icon: 'group',            route: '/center/employees' },
    { label: 'KYC',       icon: 'verified_user',    route: '/center/kyc'      },
    { label: 'Settings',  icon: 'settings',         route: '/center/settings' },
  ];

  constructor(
    public  auth:          AuthService,
    private centerService: CenterService
  ) {}

  ngOnInit(): void {
    this.loadCenterProfile();
  }

  private loadCenterProfile(): void {
    this.centerService.getProfile().subscribe({
      next: (profile: CenterProfileResponse) => {
        this.centerName     = profile.name     ?? '';
        this.centerInitial  = (profile.name ?? '?').charAt(0).toUpperCase();
        this.centerImageUrl = profile.images?.[0]?.url ?? '';
      },
      error: () => {
        // fallback: استخدم اسم اليوزر من الـ auth لو الـ profile فشل
        this.centerName    = this.auth.currentUser?.name ?? '';
        this.centerInitial = (this.auth.currentUser?.name ?? '?').charAt(0).toUpperCase();
      }
    });
  }

  logout(): void {
    this.auth.logout();
  }
}