import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  showPassword = false;
  currentStep = 1;
  socialError = false;

  roles: { value: UserRole; label: string; icon: string; desc: string }[] = [
    { value: 'customer', label: 'Diver',      icon: 'scuba_diving', desc: 'Discover & book dives' },
    { value: 'center',   label: 'Dive Center', icon: 'storefront',   desc: 'Manage trips & bookings' },
  ];

  governorates = [
    'Cairo', 'Alexandria', 'South Sinai', 'Red Sea',
    'Suez', 'Ismailia', 'Port Said', 'Luxor', 'Aswan',
    'Giza', 'Dakahlia', 'Gharbia', 'Qalyubia', 'Other'
  ];

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      role:        ['customer', Validators.required],
      // Step 1
      centerName:  [''],
      name:        ['', [Validators.required, Validators.minLength(2)]],
      email:       ['', [Validators.required, Validators.email]],
      phone:       [''],
      password:    ['', [Validators.required, Validators.minLength(6)]],
      // Step 2
      governorate: [''],
      city:        [''],
      address:     [''],
      location:    [''],
      // Step 3
      facebook:    [''],
      instagram:   [''],
      website:     [''],
    });
  }

  get isCenter(): boolean {
    return this.form.get('role')?.value === 'center';
  }

  f(name: string) {
    return this.form.get(name);
  }

  setRole(role: UserRole) {
    this.form.get('role')?.setValue(role);
    this.currentStep = 1;
    this.socialError = false;
  }

  nextStep() {
    if (this.currentStep === 1) {
      // Validate step 1 fields
      const step1Fields = this.isCenter
        ? ['centerName', 'name', 'email', 'phone', 'password']
        : ['name', 'email', 'password'];

      // Mark touched
      step1Fields.forEach(f => this.form.get(f)?.markAsTouched());

      // Check required
      if (this.isCenter) {
        if (!this.f('centerName')?.value) return;
        if (!this.f('phone')?.value) return;
      }
      if (this.f('name')?.invalid || this.f('email')?.invalid || this.f('password')?.invalid) return;

      this.currentStep = 2;

    } else if (this.currentStep === 2) {
      ['governorate', 'city', 'address', 'location'].forEach(f => this.form.get(f)?.markAsTouched());

      if (!this.f('governorate')?.value || !this.f('city')?.value ||
          !this.f('address')?.value || !this.f('location')?.value) return;

      this.currentStep = 3;
    }
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    // Validate social for center
    if (this.isCenter) {
      const hasSocial = this.f('facebook')?.value || this.f('instagram')?.value || this.f('website')?.value;
      if (!hasSocial) { this.socialError = true; return; }
      this.socialError = false;
    }

    this.loading = true;
    const { name, email, password, role } = this.form.value;

    this.auth.register(name, email, password, role).subscribe({
      next: (user) => {
        const map: Record<UserRole, string> = {
          customer: '/home',
          center: '/center/dashboard',
          admin: '/admin/overview'
        };
        this.router.navigate([map[user.role]]);
      },
      error: () => { this.loading = false; }
    });
  }
}