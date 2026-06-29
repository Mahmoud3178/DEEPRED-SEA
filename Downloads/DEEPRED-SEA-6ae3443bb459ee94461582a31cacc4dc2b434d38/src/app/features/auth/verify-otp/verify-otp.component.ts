import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-verify-otp',
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.css']
})
export class VerifyOtpComponent implements OnInit {
  email = '';
  role: UserRole = 'customer';
  otpDigits: string[] = ['', '', '', '', '', ''];
  loading = false;
  error = '';
  resendCooldown = 0;
  resendSuccess = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParams['email'] || '';

    if (!this.email) {
      this.router.navigate(['/auth/register']);
      return;
    }
    this.startCooldown();
  }

  get otpCode(): string {
    return this.otpDigits.join('');
  }

  onDigitInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const digit = input.value.replace(/[^0-9]/g, '').slice(-1);

    input.value = digit;
    this.otpDigits[index] = digit;

    if (digit && index < 5) {
      this.focusInput(index + 1);
    }
  }

  onKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      event.preventDefault();
      this.focusInput(index - 1);
      this.otpDigits[index - 1] = '';
      const prevEl = document.getElementById('otp-' + (index - 1)) as HTMLInputElement;
      if (prevEl) prevEl.value = '';
      return;
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusInput(index - 1);
    }
    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      this.focusInput(index + 1);
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') || '';
    const digits = pasted.replace(/[^0-9]/g, '').slice(0, 6).split('');

    digits.forEach((d, i) => {
      this.otpDigits[i] = d;
      const el = document.getElementById('otp-' + i) as HTMLInputElement;
      if (el) el.value = d;
    });

    if (digits.length > 0) {
      this.focusInput(Math.min(digits.length - 1, 5));
    }
  }

  private focusInput(index: number): void {
    const el = document.getElementById('otp-' + index) as HTMLInputElement;
    if (el) {
      el.focus();
      el.select();
    }
  }
submit(): void {
  if (this.otpCode.length !== 6) {
    this.error = 'Please enter the full 6-digit code.';
    return;
  }
  this.loading = true;
  this.error = '';

  this.auth.verifyEmail(this.email, this.otpCode).subscribe({
    next: () => {
      // ✅ refresh الـ token عشان email_verified يتحدث
      this.auth.refreshAccessToken().subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/auth/login'], {
            queryParams: { verified: 'true' }
          });
        },
        error: () => {
          this.loading = false;
          this.router.navigate(['/auth/login'], {
            queryParams: { verified: 'true' }
          });
        }
      });
    },
    error: (err) => {
      this.loading = false;
      this.error = err.message || 'Invalid or expired code. Please try again.';
      this.resetInputs();
    }
  });
}

  private resetInputs(): void {
    this.otpDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) {
      const el = document.getElementById('otp-' + i) as HTMLInputElement;
      if (el) el.value = '';
    }
    this.focusInput(0);
  }

resend(): void {
  if (this.resendCooldown > 0) return;
  this.auth.resendVerification(this.email).subscribe({
    next: () => {
      this.resendSuccess = true;
      setTimeout(() => this.resendSuccess = false, 4000);
      this.resetInputs();
      this.startCooldown();
    },
    error: (err) => {
      this.error = err.message || 'Could not resend code.';
    }
  });
}

  private startCooldown(): void {
    this.resendCooldown = 60;
    const interval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) clearInterval(interval);
    }, 1000);
  }
}
