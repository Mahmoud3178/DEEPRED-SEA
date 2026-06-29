import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorService } from '../../../core/services/error.service';
import { UserRole, RegisterUserPayload, RegisterCenterPayload } from '../../../core/models/user.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  form: FormGroup;
  loading      = false;
  showPassword = false;
  currentStep  = 1;
  socialError  = false;
  errorMessage  = '';
  errorMessages: string[] = [];

  roles: { value: UserRole; label: string; icon: string; desc: string }[] = [
    { value: 'customer', label: 'Diver',       icon: 'scuba_diving', desc: 'Discover & book dives'    },
    { value: 'center',   label: 'Dive Center',  icon: 'storefront',   desc: 'Manage trips & bookings' },
  ];

  governorates = [
    'Cairo', 'Alexandria', 'South Sinai', 'Red Sea',
    'Suez', 'Ismailia', 'Port Said', 'Luxor', 'Aswan',
    'Giza', 'Dakahlia', 'Gharbia', 'Qalyubia', 'Other'
  ];

  constructor(
    private fb:       FormBuilder,
    private auth:     AuthService,
    private router:   Router,
    private errorSvc: ErrorService   // ✅ أضفنا ErrorService
  ) {
    this.form = this.fb.group({
      role:        ['customer', Validators.required],
      centerName:  [''],
      name:        ['', [Validators.required, Validators.minLength(2)]],
      email:       ['', [Validators.required, Validators.email]],
      phone:       [''],
      password:    ['', [Validators.required, Validators.minLength(6)]],
      governorate: [''],
      city:        [''],
      address:     [''],
      location:    [''],
      facebook:    [''],
      instagram:   [''],
      website:     [''],
    });
  }

  get isCenter(): boolean {
    return this.form.get('role')?.value === 'center';
  }

  f(name: string) { return this.form.get(name); }

  setRole(role: UserRole): void {
    this.form.get('role')?.setValue(role);
    this.currentStep  = 1;
    this.socialError  = false;
    this.errorMessage = '';
    this.errorMessages = [];
  }

  nextStep(): void {
    this.clearErrors();

    if (this.currentStep === 1) {
      const step1Fields = this.isCenter
        ? ['centerName', 'name', 'email', 'phone', 'password']
        : ['name', 'email', 'password'];

      step1Fields.forEach(f => this.form.get(f)?.markAsTouched());

      if (this.isCenter) {
        if (!this.f('centerName')?.value) return;
        if (!this.f('phone')?.value)      return;
      }
      if (this.f('name')?.invalid || this.f('email')?.invalid || this.f('password')?.invalid) return;

      this.currentStep = 2;

    } else if (this.currentStep === 2) {
      ['governorate', 'city', 'address', 'location'].forEach(f => this.form.get(f)?.markAsTouched());

      if (!this.f('governorate')?.value || !this.f('city')?.value ||
          !this.f('address')?.value     || !this.f('location')?.value) return;

      this.currentStep = 3;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.clearErrors();
    }
  }

  private clearErrors(): void {
    this.errorMessage  = '';
    this.errorMessages = [];
  }

  private extractLatLng(url: string): { lat: number; lng: number } {
    const match = url.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    return { lat: 0, lng: 0 };
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.clearErrors();

    if (this.isCenter) {
      const hasSocial = this.f('facebook')?.value || this.f('instagram')?.value || this.f('website')?.value;
      if (!hasSocial) { this.socialError = true; return; }
      this.socialError = false;
    }

    this.loading = true;
    const v = this.form.value;

    if (this.isCenter) {
      const { lat, lng } = this.extractLatLng(v.location);

      const payload: RegisterCenterPayload = {
        centerName:      v.centerName,
        ownerName:       v.name,
        email:           v.email,
        phoneNumber:     v.phone,
        password:        v.password,
        confirmPassword: v.password,
        governorate:     v.governorate,
        city:            v.city,
        address:         v.address,
        latitude:        lat,
        longitude:       lng,
        facebookPage:    v.facebook  || '',
        website:         v.website   || '',
        instagramPage:   v.instagram || '',
      };

      this.auth.registerCenter(payload).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/auth/verify-otp'], { queryParams: { email: v.email } });
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.handleSubmitError(err, 'auth');
        }
      });

    } else {
      const payload: RegisterUserPayload = {
        email:       v.email,
        password:    v.password,
        displayName: v.name,
      };

      this.auth.registerUser(payload).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/home']);
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.handleSubmitError(err, 'auth');
        }
      });
    }
  }

  // ✅ منطق موحد لمعالجة الأخطاء — يستخدم ErrorService
  private handleSubmitError(err: HttpErrorResponse, resource: 'auth'): void {
    // أولاً: جرب تستخرج field-level errors (validation errors object)
    const fieldErrors = this.extractFieldErrors(err);

    if (fieldErrors.length > 1) {
      // أكتر من رسالة → اعرضهم في list
      this.errorMessages = fieldErrors;
      this.errorMessage  = '';
    } else if (fieldErrors.length === 1) {
      // رسالة واحدة → اعرضها كـ message عادية
      this.errorMessage  = fieldErrors[0];
      this.errorMessages = [];
    } else {
      // مفيش field errors → استخدم ErrorService عشان يفسر الـ HTTP status
      this.errorMessage  = this.errorSvc.getMessage(err, { resource, action: 'create' });
      this.errorMessages = [];
    }

    // Scroll للبانر
    setTimeout(() => {
      document.querySelector('.error-banner')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }

  // ✅ استخرج validation errors من الـ response body
  private extractFieldErrors(err: any): string[] {
  // ✅ جرب كل المصادر الممكنة
  const errors =
    err?.errors         ||   // من AuthService الجديد
    err?.raw?.errors    ||   // من raw body
    err?.error?.errors  ||   // fallback
    null;

  if (!errors || typeof errors !== 'object') return [];

  const messages: string[] = [];
  for (const field of Object.keys(errors)) {
    const fieldMsgs = Array.isArray(errors[field]) ? errors[field] : [errors[field]];
    fieldMsgs.forEach((m: string) => { if (m) messages.push(m); });
  }
  return messages;
}
}