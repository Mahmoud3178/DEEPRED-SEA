import { Component } from '@angular/core';

@Component({ selector: 'app-admin-centers', templateUrl: './centers.component.html',
  styleUrls: ['./centers.component.css'] })
export class AdminCentersComponent {
  search = '';
  statusFilter = 'all';

  centers = [
    { id: 'C1', name: 'Orca Dive Club', location: 'Sharm El Sheikh', owner: 'Ahmed Nader', status: 'active', bookings: 124, rating: 4.9, joined: '2023-01' },
    { id: 'C2', name: 'Blue Ocean Divers', location: 'Hurghada', owner: 'Sara Mansour', status: 'active', bookings: 98, rating: 4.8, joined: '2023-03' },
    { id: 'C3', name: 'Dahab Divers', location: 'Dahab', owner: 'Omar Farouk', status: 'active', bookings: 87, rating: 4.7, joined: '2023-06' },
    { id: 'C4', name: 'Aqua Blue Diving', location: 'Hurghada', owner: 'Khalid Rashid', status: 'pending', bookings: 0, rating: 0, joined: '2025-07-18' },
    { id: 'C5', name: 'Sinai Dive Hub', location: 'Dahab', owner: 'Nour Ibrahim', status: 'active', bookings: 42, rating: 4.5, joined: '2024-09' },
    { id: 'C6', name: 'Red Sea Explorers', location: 'Marsa Alam', owner: 'Yara Farouk', status: 'pending', bookings: 0, rating: 0, joined: '2025-07-16' },
    { id: 'C7', name: 'Toxic Dive Co.', location: 'Sharm El Sheikh', owner: 'Unknown', status: 'blocked', bookings: 5, rating: 1.2, joined: '2024-12' },
  ];

  filterTabs = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'blocked', label: 'Blocked' },
  ];

  get filtered() {
    return this.centers
      .filter(c => this.statusFilter === 'all' || c.status === this.statusFilter)
      .filter(c => !this.search || c.name.toLowerCase().includes(this.search.toLowerCase()) || c.location.toLowerCase().includes(this.search.toLowerCase()));
  }

  countByStatus(s: string) { return s === 'all' ? this.centers.length : this.centers.filter(c => c.status === s).length; }
  setStatus(id: string, status: string) { const c = this.centers.find(c => c.id === id); if (c) c.status = status; }
  delete(id: string) { this.centers = this.centers.filter(c => c.id !== id); }
}
