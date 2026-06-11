import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-customer-layout',
  templateUrl: './customer-layout.component.html',
  styleUrls: ['./customer-layout.component.css'],
})
export class CustomerLayoutComponent {
  menuOpen = false;

  navLinks = [
    { label: 'Destinations', route: '/home', icon: 'explore', exact: true },
    { label: 'All Centers', route: '/home/centers', icon: 'storefront', exact: false },
    { label: 'About', route: '/home/about', icon: 'info', exact: true },
    { label: 'Contact', route: '/home/contact', icon: 'phone', exact: true },
  ];

  constructor(public auth: AuthService, private router: Router) {}

  logout() { this.auth.logout(); }
}
