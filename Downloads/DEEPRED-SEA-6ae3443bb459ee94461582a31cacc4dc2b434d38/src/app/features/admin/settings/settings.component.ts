import { Component } from '@angular/core';

@Component({ selector: 'app-admin-settings', templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'] })
export class AdminSettingsComponent {
  platformName = 'DeepRed Sea';
  maintenanceMode = false;
  allowRegistrations = true;
  requireCenterVerification = true;
  commissionRate = 10;
  saved = false;

  save() { this.saved = true; setTimeout(() => this.saved = false, 3000); }
}
