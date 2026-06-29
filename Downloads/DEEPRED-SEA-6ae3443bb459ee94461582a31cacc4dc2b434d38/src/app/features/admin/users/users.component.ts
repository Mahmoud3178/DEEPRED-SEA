import { Component } from '@angular/core';

@Component({ selector: 'app-admin-users', templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'] })
export class AdminUsersComponent {
  search = '';
  roleFilter = 'all';

  users = [
    { id: 'U1', name: 'Ahmed Nader', email: 'ahmed@email.com', role: 'customer', status: 'active', dives: 24, joined: '2024-01-15' },
    { id: 'U2', name: 'Sara Mansour', email: 'sara@email.com', role: 'customer', status: 'active', dives: 12, joined: '2024-03-08' },
    { id: 'U3', name: 'James Kowalski', email: 'james@email.com', role: 'customer', status: 'active', dives: 8, joined: '2024-05-22' },
    { id: 'U4', name: 'Khalid Rashid', email: 'khalid@email.com', role: 'center', status: 'active', dives: 0, joined: '2024-02-10' },
    { id: 'U5', name: 'Nour Ibrahim', email: 'nour@email.com', role: 'center', status: 'active', dives: 0, joined: '2024-09-01' },
    { id: 'U6', name: 'Suspicious User', email: 'spam@fake.com', role: 'customer', status: 'blocked', dives: 0, joined: '2025-01-03' },
    { id: 'U7', name: 'Emma Wilson', email: 'emma@email.com', role: 'customer', status: 'active', dives: 6, joined: '2024-11-15' },
    { id: 'U8', name: 'Omar Hassan', email: 'omar@email.com', role: 'customer', status: 'active', dives: 18, joined: '2023-06-20' },
  ];

  filterTabs = [
    { value: 'all', label: 'All Divers' },
  ];

  get filtered() {
    return this.users
      .filter(u => this.roleFilter === 'all' || u.role === this.roleFilter)
      .filter(u => !this.search || u.name.toLowerCase().includes(this.search.toLowerCase()) || u.email.toLowerCase().includes(this.search.toLowerCase()));
  }

  countByRole(r: string) { return r === 'all' ? this.users.length : this.users.filter(u => u.role === r).length; }
  toggleStatus(id: string) { const u = this.users.find(u => u.id === id); if (u) u.status = u.status === 'active' ? 'blocked' : 'active'; }
  delete(id: string) { this.users = this.users.filter(u => u.id !== id); }
}
