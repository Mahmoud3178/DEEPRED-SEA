import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorService } from '../../../core/services/error.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  form: FormGroup;
  loading      = false;
  error        = '';
  showPassword = false;

  constructor(
    private fb:       FormBuilder,
    private auth:     AuthService,
    private router:   Router,
    private errorSvc: ErrorService
  ) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading = true;
    this.error   = '';

    const { email, password } = this.form.value;

    this.auth.login(email, password).subscribe({
      next: (res) => {
        this.loading = false;   // ✅ reset قبل الـ navigation
        const role = this.auth.getRoleFromToken(res.accessToken);
        this.navigateByRole(role);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.error   = this.resolveLoginError(err);
      }
    });
  }

  private resolveLoginError(err: any): string {
    const status = err?.status;

    // 401 → غالباً credentials غلط
    if (status === 401)
      return 'Incorrect email or password. Please try again.';

    // 403 → الحساب موجود بس مش مفعّل
    if (status === 403)
      return 'Your account is not verified yet. Please check your email.';

    // 429 → محاولات كتير
    if (status === 429)
      return 'Too many login attempts. Please wait a moment and try again.';

    // 0 → مفيش internet
    if (status === 0)
      return 'No internet connection. Please check your network.';

    // 500+
    if (status >= 500)
      return 'Something went wrong on our end. Please try again in a few moments.';

    // لو السيرفر بعت رسالة واضحة استخدمها
    return err?.message || 'Unable to sign in. Please try again.';
  }

  private navigateByRole(role: string): void {
    const map: Record<string, string> = {
      customer: '/home',
      center:   '/center/dashboard',
      admin:    '/admin/overview',
    };
    this.router.navigate([map[role] ?? '/home']);
  }
}