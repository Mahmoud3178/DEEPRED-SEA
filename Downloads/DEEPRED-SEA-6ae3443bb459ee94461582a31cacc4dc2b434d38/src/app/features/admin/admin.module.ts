import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AdminLayoutComponent } from './layouts/admin-layout.component';
import { AdminOverviewComponent } from './overview/overview.component';
import { AdminCentersComponent } from './centers/centers.component';
import { AdminUsersComponent } from './users/users.component';
import { AdminAnalyticsComponent } from './analytics/analytics.component';
import { AdminSettingsComponent } from './settings/settings.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: AdminOverviewComponent },
      { path: 'centers', component: AdminCentersComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'analytics', component: AdminAnalyticsComponent },
      { path: 'settings', component: AdminSettingsComponent },
    ]
  }
];

@NgModule({
  declarations: [
    AdminLayoutComponent, AdminOverviewComponent, AdminCentersComponent,
    AdminUsersComponent, AdminAnalyticsComponent, AdminSettingsComponent
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes)],
})
export class AdminModule {}
