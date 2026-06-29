import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthGuard } from '../../core/guards/auth.guard';

import { CustomerLayoutComponent } from './layouts/customer-layout.component';
import { HomeComponent } from './home/home.component';
import { CentersComponent } from './centers/centers.component';
import { CenterDetailsComponent } from './center-details/center-details.component';
import { BookingComponent } from './booking/booking.component';
import { ProfileComponent } from './profile/profile.component';
import { ContactComponent } from './contact/contact.component';
import { AboutComponent } from './about/about.component';


const routes: Routes = [
  {
    path: '',
    component: CustomerLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'centers', component: CentersComponent },
      { path: 'centers/:id', component: CenterDetailsComponent },
      { path: 'booking/:centerId', component: BookingComponent, canActivate: [AuthGuard] },
      { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },

      { path: 'about', component: AboutComponent },
      { path: 'contact', component: ContactComponent },
    ]
  }
];

@NgModule({
  declarations: [
    CustomerLayoutComponent, HomeComponent, CentersComponent,
    CenterDetailsComponent, BookingComponent, ProfileComponent, ContactComponent, AboutComponent
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes)],
})
export class CustomerModule {}
