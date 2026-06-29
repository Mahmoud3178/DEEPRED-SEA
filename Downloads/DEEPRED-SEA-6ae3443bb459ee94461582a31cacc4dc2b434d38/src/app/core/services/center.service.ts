import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { map, catchError } from 'rxjs/operators';   // ✅ أضفنا catchError

// ── كل الـ interfaces زي ما هي بدون تغيير ──────────────────
export interface LocationDto {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
}
export interface CloudinaryUploadResult { url: string; publicId: string; }
export interface CenterProfileImageResponse { id: string; url: string; displayOrder: number; }
export interface CenterProfileResponse {
  id: string; name: string; description: string; location: LocationDto;
  address: string; operatingHours: string; isVisibleInPublicSearch: boolean;
  contactEmail: string; contactPhone: string; whatsAppNumber: string;
  enableWhatsAppDirect: boolean; websiteUrl: string; facebookUrl: string;
  instagramUrl: string; tikTokUrl: string; receiveBookingAlerts: boolean;
  receiveReviewAlerts: boolean; images: CenterProfileImageResponse[];
  publicationStatus: string; status: string; streakWindowDays: number;
}
export interface CreateCenterProfileRequest {
  name: string; description: string; location: LocationDto; address: string;
  operatingHours?: string; isVisibleInPublicSearch?: boolean;
  contactEmail: string; contactPhone: string; whatsAppNumber?: string;
  enableWhatsAppDirect?: boolean; websiteUrl?: string; facebookUrl?: string;
  instagramUrl?: string; tikTokUrl?: string; receiveBookingAlerts?: boolean;
  receiveReviewAlerts?: boolean; images?: string[];
}
export type UpdateCenterProfileRequest = Partial<CreateCenterProfileRequest>;
export interface CenterOperatingHoursResponse { dayOfWeek: number; isClosed: boolean; openMinutes: number; closeMinutes: number; }
export interface CenterOperatingHoursItemRequest { dayOfWeek: number; isClosed: boolean; openMinutes: number; closeMinutes: number; }
export interface CenterKycDocumentResponse { id: string; documentType: string; url: string; uploadedAt: string; status: string; }
export interface CenterDashboardResponse {
  summary: { totalBookings: number; activeOfferings: number; pendingPaymentsCount: number; monthlyRevenue: { currentMonth: number; previousMonth: number; growthPercentage: number; }; };
  upcomingTrips: any[];
  bookingTrend: { date: string; count: number }[];
}
export interface CenterActivityItemResponse { id: string; type: string; message: string; referenceId: string; createdAt: string; }
export interface PagedActivitiesResponse { items: CenterActivityItemResponse[]; page: number; pageSize: number; totalCount: number; }
export interface CenterDiverTierResponse { diverId: string; displayName: string; currentStreak: number; peakStreak: number; totalDivesAtCenter: number; currentDiscountPercent: number; }
export interface CenterDiverTiersResponse { items: CenterDiverTierResponse[]; totalCount: number; page: number; limit: number; }
export interface CenterBookingListItemResponse { id: string; customerName: string; customerEmail: string; departureDate: string; diversCount: number; bookingStatus: string; paymentStatus: string; finalPriceAmount: number; currency: string; offeringId: string; canReview: boolean; hasReview: boolean; }
export interface PagedCenterBookingsResponse { items: CenterBookingListItemResponse[]; page: number; pageSize: number; totalCount: number; totalPages: number; }
export interface CenterReviewListItemResponse { id: string; diverId: string; diverName: string; overallScore: number; instructorScore?: number; equipmentScore?: number; safetyScore?: number; comment?: string; status: string; createdAt: string; }
export interface PagedCenterReviewsResponse { items: CenterReviewListItemResponse[]; page: number; pageSize: number; totalCount: number; }
export interface CenterExpeditionItemResponse { id: string; title: string; type: string; imageUrl: string; departureDate: string; price: number; capacity: number; bookedSlots: number; availableSlots: number; occupancyPercentage: number; status: string; }
export interface CenterExpeditionDetailsResponse { id: string; title: string; description: string; type: string; images: string[]; basePrice: number; discount: number; capacityLimit: number; diveSites: any[]; schedule: string; difficulty: string; diverLevel: string; cancellationPolicy: string; departureDate: string; status: string; isAvailable: boolean; }
export interface PaginatedExpeditionsResponse { items: CenterExpeditionItemResponse[]; pageNumber: number; pageSize: number; totalCount: number; }
export interface CreateBoatResourceRequest { name: string; capacity: number; }
export interface CreateInstructorResourceRequest { fullName: string; certificationLevel: string; }
export interface InviteEmployeeRequest { email: string; scope: string; expiresInHours: number; }
export interface InviteEmployeeResponse { assignmentId: string; inviteToken: string; expiresAt: string; invitedEmail: string; scope: string; }
export interface EmployeeAssignmentResponse { assignmentId: string; centerId: string; employeeAccountId: string; invitedEmail: string; scope: string; status: string; invitedAt: string; acceptedAt: string; }
export interface CreateOfferingRequest { type: string; title: string; description: string; basePrice: number; discount?: number; isAvailable?: boolean; capacityLimit: number; difficulty?: string; diverLevel?: string; cancellationPolicy?: string; schedule?: string; departureDate?: string; diveSites?: string[]; images?: string[]; }
export type UpdateOfferingRequest = Partial<CreateOfferingRequest>;
export interface OfferingAvailabilityRule { dayOfWeek?: number; startTime?: string; endTime?: string; [key: string]: any; }
export interface OfferingAvailabilityResponse { offeringId: string; rules: OfferingAvailabilityRule[]; }
export interface OfferingPricingRuleRequest { name: string; startsAt: string; endsAt: string; specialPrice: number; }
export interface OfferingBlackoutDateRequest { startsAt: string; endsAt: string; reason?: string; }

// =========================================================
// SERVICE
// =========================================================

@Injectable({ providedIn: 'root' })
export class CenterService {

  private readonly base       = environment.centerApiUrl;
  private readonly centersUrl = `${this.base}/centers`;

  constructor(private http: HttpClient) {}

  // ✅ handleError موحد — بيبعت object منظم للـ components
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

    return throwError(() => ({
      status:  error.status,
      message,
      errors:  error.error?.errors ?? null,
      raw:     error.error          ?? null,
    }));
  }

  // ── helper: بيتعامل مع 204 No Content كـ success ────────
  private noContent(obs: Observable<HttpResponse<any>>): Observable<void> {
    return obs.pipe(
      map(() => void 0),
      catchError(err => this.handleError(err))   // ✅ ربطنا الأخطاء
    );
  }

  // ── Profile ───────────────────────────────────────────────
  getProfile(): Observable<CenterProfileResponse> {
    return this.http.get<CenterProfileResponse>(`${this.centersUrl}/profile`)
      .pipe(catchError(err => this.handleError(err)));
  }

  createProfile(data: CreateCenterProfileRequest): Observable<CenterProfileResponse> {
    return this.http.post<CenterProfileResponse>(`${this.centersUrl}/profile`, data)
      .pipe(catchError(err => this.handleError(err)));
  }

  updateProfile(data: UpdateCenterProfileRequest): Observable<void> {
    return this.noContent(
      this.http.put<any>(`${this.centersUrl}/profile`, data, { observe: 'response' })
    );
  }

  uploadImages(files: File[]): Observable<CloudinaryUploadResult[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post<CloudinaryUploadResult[]>(`${this.centersUrl}/images`, formData)
      .pipe(catchError(err => this.handleError(err)));
  }

  // ── Operating Hours ───────────────────────────────────────
  getOperatingHours(centerId: string): Observable<CenterOperatingHoursResponse[]> {
    return this.http.get<CenterOperatingHoursResponse[]>(`${this.centersUrl}/${centerId}/operating-hours`)
      .pipe(catchError(err => this.handleError(err)));
  }

  updateOperatingHours(centerId: string, hours: CenterOperatingHoursItemRequest[]): Observable<void> {
    return this.noContent(
      this.http.put<any>(`${this.centersUrl}/${centerId}/operating-hours`, { hours }, { observe: 'response' })
    );
  }

  // ── KYC ──────────────────────────────────────────────────
  getKycDocuments(centerId: string): Observable<CenterKycDocumentResponse[]> {
    return this.http.get<CenterKycDocumentResponse[]>(`${this.centersUrl}/${centerId}/kyc-documents`)
      .pipe(catchError(err => this.handleError(err)));
  }

  uploadKycDocument(centerId: string, documentType: string, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);
    return this.http.post<string>(`${this.centersUrl}/${centerId}/kyc-documents`, formData)
      .pipe(catchError(err => this.handleError(err)));
  }

  // ── Dashboard & Activities ────────────────────────────────
  getDashboard(period: '7d' | '30d' | '90d' | '1y' = '30d'): Observable<CenterDashboardResponse> {
    return this.http.get<CenterDashboardResponse>(`${this.centersUrl}/me/dashboard?period=${period}`)
      .pipe(catchError(err => this.handleError(err)));
  }

  getActivities(page = 1, pageSize = 20): Observable<PagedActivitiesResponse> {
    return this.http.get<PagedActivitiesResponse>(`${this.centersUrl}/me/activities?page=${page}&pageSize=${pageSize}`)
      .pipe(catchError(err => this.handleError(err)));
  }

  // ── Diver Tiers ───────────────────────────────────────────
  getDiverTiers(centerId: string, page = 1, limit = 20): Observable<CenterDiverTiersResponse> {
    return this.http.get<CenterDiverTiersResponse>(`${this.centersUrl}/${centerId}/diver-tiers?page=${page}&limit=${limit}`)
      .pipe(catchError(err => this.handleError(err)));
  }

  // ── Bookings ──────────────────────────────────────────────
  getCenterBookings(page = 1, pageSize = 20, status?: string, paymentStatus?: string): Observable<PagedCenterBookingsResponse> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (status)        params = params.set('status', status);
    if (paymentStatus) params = params.set('paymentStatus', paymentStatus);
    return this.http.get<PagedCenterBookingsResponse>(`${this.base}/bookings/center`, { params })
      .pipe(catchError(err => this.handleError(err)));
  }

  confirmBooking(bookingId: string): Observable<void> {
    return this.noContent(
      this.http.post<any>(`${this.base}/bookings/${bookingId}/confirm`, {}, { observe: 'response' })
    );
  }

  cancelBooking(bookingId: string, reason?: string): Observable<void> {
    return this.noContent(
      this.http.post<any>(`${this.base}/bookings/${bookingId}/cancel`, { reason: reason ?? null }, { observe: 'response' })
    );
  }

  // ── Reviews ───────────────────────────────────────────────
  getReviews(page = 1, pageSize = 10, status?: string): Observable<PagedCenterReviewsResponse> {
    let url = `${this.centersUrl}/me/reviews?page=${page}&pageSize=${pageSize}`;
    if (status) url += `&status=${status}`;
    return this.http.get<PagedCenterReviewsResponse>(url)
      .pipe(catchError(err => this.handleError(err)));
  }

  updateReviewStatus(reviewId: string, newStatus: 'Approved' | 'Rejected'): Observable<void> {
    return this.noContent(
      this.http.patch<any>(`${this.centersUrl}/me/reviews/${reviewId}/status`, { newStatus }, { observe: 'response' })
    );
  }

  // ── Expeditions ───────────────────────────────────────────
  getExpeditions(page = 1, pageSize = 20, status?: string, type?: string, search?: string): Observable<PaginatedExpeditionsResponse> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    if (type)   params = params.set('type', type);
    if (search) params = params.set('search', search);
    return this.http.get<PaginatedExpeditionsResponse>(`${this.centersUrl}/me/expeditions`, { params })
      .pipe(catchError(err => this.handleError(err)));
  }

  getExpeditionDetails(expeditionId: string): Observable<CenterExpeditionDetailsResponse> {
    return this.http.get<CenterExpeditionDetailsResponse>(`${this.centersUrl}/me/expeditions/${expeditionId}`)
      .pipe(catchError(err => this.handleError(err)));
  }

  // ── Resources ─────────────────────────────────────────────
  addBoat(centerId: string, name: string, capacity: number): Observable<any> {
    return this.http.post<any>(`${this.centersUrl}/${centerId}/resources/boats`, { name, capacity })
      .pipe(catchError(err => this.handleError(err)));
  }

  addInstructor(centerId: string, fullName: string, certificationLevel: string): Observable<any> {
    return this.http.post<any>(`${this.centersUrl}/${centerId}/resources/instructors`, { fullName, certificationLevel })
      .pipe(catchError(err => this.handleError(err)));
  }

  // ── Employees ─────────────────────────────────────────────
  getEmployees(centerId: string): Observable<EmployeeAssignmentResponse[]> {
    return this.http.get<EmployeeAssignmentResponse[]>(`${this.centersUrl}/${centerId}/employees`)
      .pipe(catchError(err => this.handleError(err)));
  }

  inviteEmployee(centerId: string, payload: InviteEmployeeRequest): Observable<InviteEmployeeResponse> {
    return this.http.post<InviteEmployeeResponse>(`${this.centersUrl}/${centerId}/employees/invitations`, payload)
      .pipe(catchError(err => this.handleError(err)));
  }

  updateEmployeeScope(centerId: string, employeeId: string, scope: string): Observable<void> {
    return this.noContent(
      this.http.put<any>(`${this.centersUrl}/${centerId}/employees/${employeeId}/scope`, { scope }, { observe: 'response' })
    );
  }

  suspendEmployee(centerId: string, employeeId: string): Observable<void> {
    return this.noContent(
      this.http.post<any>(`${this.centersUrl}/${centerId}/employees/${employeeId}/suspend`, {}, { observe: 'response' })
    );
  }

  reinstateEmployee(centerId: string, employeeId: string): Observable<void> {
    return this.noContent(
      this.http.post<any>(`${this.centersUrl}/${centerId}/employees/${employeeId}/reinstate`, {}, { observe: 'response' })
    );
  }

  removeEmployee(centerId: string, employeeId: string): Observable<void> {
    return this.noContent(
      this.http.delete<any>(`${this.centersUrl}/${centerId}/employees/${employeeId}`, { observe: 'response' })
    );
  }

  acceptEmployeeInvitation(token: string): Observable<void> {
    return this.noContent(
      this.http.post<any>(`${this.base}/employees/invitations/${token}/accept`, {}, { observe: 'response' })
    );
  }

  // ── Offerings ─────────────────────────────────────────────
  createOffering(data: CreateOfferingRequest): Observable<any> {
    return this.http.post<any>(`${this.base}/offerings`, data)
      .pipe(catchError(err => this.handleError(err)));
  }

  updateOffering(offeringId: string, data: UpdateOfferingRequest): Observable<any> {
    return this.http.put<any>(`${this.base}/offerings/${offeringId}`, data)
      .pipe(catchError(err => this.handleError(err)));
  }

  deleteOffering(offeringId: string): Observable<void> {
    return this.noContent(
      this.http.delete<any>(`${this.base}/offerings/${offeringId}`, { observe: 'response' })
    );
  }

  uploadOfferingImages(offeringId: string, files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post<any>(`${this.base}/offerings/${offeringId}/images`, formData)
      .pipe(catchError(err => this.handleError(err)));
  }

  getOfferingAvailability(offeringId: string): Observable<OfferingAvailabilityResponse> {
    return this.http.get<OfferingAvailabilityResponse>(`${this.base}/offerings/${offeringId}/availability`)
      .pipe(catchError(err => this.handleError(err)));
  }

  updateOfferingAvailability(offeringId: string, rules: OfferingAvailabilityRule[]): Observable<void> {
    return this.noContent(
      this.http.put<any>(`${this.base}/offerings/${offeringId}/availability`, { rules }, { observe: 'response' })
    );
  }

  updateOfferingCapacity(offeringId: string, capacityLimit: number): Observable<void> {
    return this.noContent(
      this.http.put<any>(`${this.base}/offerings/${offeringId}/capacity`, { capacityLimit }, { observe: 'response' })
    );
  }

  addBlackoutDate(offeringId: string, data: OfferingBlackoutDateRequest): Observable<any> {
    return this.http.post<any>(`${this.base}/offerings/${offeringId}/blackout-dates`, data)
      .pipe(catchError(err => this.handleError(err)));
  }

  deleteBlackoutDate(offeringId: string, blackoutId: string): Observable<void> {
    return this.noContent(
      this.http.delete<any>(`${this.base}/offerings/${offeringId}/blackout-dates/${blackoutId}`, { observe: 'response' })
    );
  }

  addPricingRule(offeringId: string, data: OfferingPricingRuleRequest): Observable<any> {
    return this.http.post<any>(`${this.base}/offerings/${offeringId}/pricing-rules`, data)
      .pipe(catchError(err => this.handleError(err)));
  }

  // ── Images ────────────────────────────────────────────────
  uploadProfileImage(file: File): Observable<CloudinaryUploadResult> {
    const formData = new FormData();
    formData.append('files', file);
    return this.http.post<CloudinaryUploadResult[]>(`${this.centersUrl}/images`, formData).pipe(
      map((results: CloudinaryUploadResult[]) => results[0]),
      catchError(err => this.handleError(err))
    );
  }
}