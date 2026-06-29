import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import {
  User,
  UserRole,
  AuthResponse,
  RegisterUserPayload,
  RegisterCenterPayload
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl + '/auth';

  private currentUserSubject =
    new BehaviorSubject<User | null>(this.getStoredUser());

  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // =========================================================
  // Getters
  // =========================================================

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  get userRole(): UserRole | null {
    return this.currentUserSubject.value?.role ?? null;
  }

  get accessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  get refreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  // =========================================================
  // Token Decoder
  // =========================================================

  decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  getRoleFromToken(token: string): string {
    const decoded = this.decodeToken(token);
    const roleRaw =
      decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? '';
    return roleRaw.toLowerCase();
  }

  // =========================================================
  // Storage
  // =========================================================

  private getStoredUser(): User | null {
    try {
      const raw = localStorage.getItem('current_user');
      if (!raw || raw === 'undefined' || raw === 'null') return null;
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem('current_user');
      return null;
    }
  }

  private storeAuthData(res: AuthResponse): void {
    localStorage.setItem('access_token', res.accessToken);
    localStorage.setItem('refresh_token', res.refreshToken);

    if (res.user) {
      const user: User = {
        ...res.user,
        role: res.user.role.toLowerCase() as UserRole
      };
      localStorage.setItem('current_user', JSON.stringify(user));
      this.currentUserSubject.next(user);

    } else {
      const decoded = this.decodeToken(res.accessToken);
      if (decoded) {
        const roleRaw =
          decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? '';
        const role = roleRaw.toLowerCase() as UserRole;

        const user: User = {
          id: decoded.sub,
          email: decoded.email ?? '',
          name: '',
          role
        };
        localStorage.setItem('current_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }
    }
  }

  // =========================================================
  // Error Handler
  // =========================================================

  private handleError(error: HttpErrorResponse): Observable<never> {
  let message = 'Something went wrong. Please try again.';

  if (error.status === 0) {
    message = 'Network error. Please check your connection.';
  } else if (error.error) {
    message =
      error.error.message ||
      error.error.title   ||
      (Array.isArray(error.error.errors) ? error.error.errors.join(', ') : '') ||
      (typeof error.error === 'string' ? error.error : '') ||
      message;
  }

  // ✅ أضفنا errors و raw زي CenterService
  return throwError(() => ({
    status:  error.status,
    message,
    errors:  error.error?.errors ?? null,
    raw:     error.error          ?? null,
  }));
}

  // =========================================================
  // Register
  // =========================================================

  registerUser(payload: RegisterUserPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/register-user`,
      payload
    ).pipe(
      tap(res => {
        this.storeAuthData(res);
        if (!res.user) this.fetchAndStoreProfile();
      }),
      catchError(this.handleError)
    );
  }

  registerCenter(
    payload: RegisterCenterPayload
  ): Observable<{ message: string; email: string }> {
    return this.http.post<{ message: string; email: string }>(
      `${this.apiUrl}/register-center`,
      payload
    ).pipe(catchError(this.handleError));
  }

  verifyEmail(
    email: string,
    otpCode: string
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/verify-center-email`,
      { email, otpCode }
    ).pipe(catchError(this.handleError));
  }

  resendVerification(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/resend-center-verification`,
      { email }
    ).pipe(catchError(this.handleError));
  }

  // =========================================================
  // Login
  // =========================================================

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      { email, password }
    ).pipe(
      tap(res => {
        this.storeAuthData(res);
        const role = this.getRoleFromToken(res.accessToken);

        if (role === 'center') {
          this.fetchCenterProfile();
        } else {
          this.fetchAndStoreProfile();
        }
      }),
      catchError(this.handleError)
    );
  }

  isEmailVerified(): boolean {
  const token = this.accessToken;
  if (!token) return false;
  const decoded = this.decodeToken(token);
  return decoded?.email_verified === 'true';
}

  // =========================================================
  // Profile
  // =========================================================

  private fetchAndStoreProfile(): void {
    this.getMyProfile().subscribe({
      next: (user) => {
        const normalized: User = {
          ...user,
          role: user.role.toLowerCase() as UserRole
        };
        localStorage.setItem('current_user', JSON.stringify(normalized));
        this.currentUserSubject.next(normalized);
      },
      error: (err) => console.error(err)
    });
  }

  private fetchCenterProfile(): void {
    this.getCenterProfile().subscribe({
      next: (center) => {
        const user: User = {
          id: center.id,
          email: center.contactEmail,
          name: center.name,
          role: 'center' as UserRole
        };
        localStorage.setItem('current_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      },
      error: (err) => console.error(err)
    });
  }

  refreshAccessToken(): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>(
      `${this.apiUrl}/refresh`,
      { refreshToken: this.refreshToken }
    ).pipe(
      tap(res => localStorage.setItem('access_token', res.accessToken)),
      catchError(this.handleError)
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/forgot-password`,
      { email }
    ).pipe(catchError(this.handleError));
  }

  resetPassword(
    token: string,
    newPassword: string
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/reset-password`,
      { token, newPassword }
    ).pipe(catchError(this.handleError));
  }

  changePassword(
    currentPassword: string,
    newPassword: string
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/change-password`,
      { currentPassword, newPassword }
    ).pipe(catchError(this.handleError));
  }

  getMyProfile(): Observable<User> {
    return this.http.get<User>(
      `${this.apiUrl}/me`
    ).pipe(catchError(this.handleError));
  }

  getCenterProfile(): Observable<any> {
    return this.http.get<any>(
      `${environment.centerApiUrl}/centers/profile`
    ).pipe(catchError(this.handleError));
  }

  logout(): void {
    if (this.refreshToken) {
      this.http.post(
        `${this.apiUrl}/logout`,
        { refreshToken: this.refreshToken }
      ).subscribe();
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');

    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }
}