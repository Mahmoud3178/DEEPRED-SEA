import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {

    // مش مسجل خالص
    if (!this.auth.isAuthenticated) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    // مسجل بس email_verified = false → روح OTP
    if (!this.auth.isEmailVerified()) {
      const email = this.auth.currentUser?.email ?? '';
      this.router.navigate(['/auth/verify-otp'], {
        queryParams: { email }
      });
      return false;
    }

    // role مش مطابق → روح الـ panel الصح
    const requiredRole: UserRole | undefined = route.data['role'];
    if (requiredRole && this.auth.userRole !== requiredRole) {
      const redirectMap: Record<UserRole, string> = {
        customer: '/home',
        center: '/center/dashboard',
        admin: '/admin/overview',
      };
      this.router.navigate([redirectMap[this.auth.userRole!]]);
      return false;
    }

    return true;
  }
}