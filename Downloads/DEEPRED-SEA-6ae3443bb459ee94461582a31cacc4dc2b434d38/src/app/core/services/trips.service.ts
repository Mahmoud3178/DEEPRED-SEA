import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CloudinaryUploadResult {
  url: string | null;
  publicId: string | null;
}

export interface CenterOfferingResponse {
  id: string;
  type: string | null;
  title: string | null;
  description: string | null;
  basePrice: number;
  discount: number;
  isAvailable: boolean;
  isPublished: boolean;
  departureDate: string | null;
  capacityLimit: number | null;
  difficulty: string | null;
  diverLevel: string | null;
  cancellationPolicy: string | null;
  schedule: string | null;
  diveSites: string[] | null;
  images: string[] | null;
  priceWithEquipment: number | null;
  priceWithoutEquipment: number | null;
}

// ✅ إضافة PagedOfferingsResponse
export interface PagedOfferingsResponse {
  items: CenterOfferingResponse[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CenterExpeditionItemResponse {
  id: string;
  title: string | null;
  type: string | null;
  imageUrl: string | null;
  departureDate: string | null;
  price: number;
  capacity: number;
  bookedSlots: number;
  availableSlots: number;
  occupancyPercentage: number;
  status: string | null;
}

export interface CenterExpeditionDetailsResponse {
  id: string;
  title: string | null;
  description: string | null;
  type: string | null;
  images: string[] | null;
  basePrice: number;
  discount: number;
  capacityLimit: number | null;
  diveSites: string[] | null;
  schedule: string | null;
  difficulty: string | null;
  diverLevel: string | null;
  cancellationPolicy: string | null;
  departureDate: string | null;
  status: string | null;
  isAvailable: boolean;
}

export interface PaginatedExpeditionsResponse {
  items: CenterExpeditionItemResponse[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

export interface CreateOfferingRequest {
  type: string | null;
  title: string | null;
  description?: string | null;
  basePrice: number;
  discount?: number;
  isAvailable?: boolean;
  capacityLimit?: number | null;
  difficulty?: string | null;
  diverLevel?: string | null;
  cancellationPolicy?: string | null;
  schedule?: string | null;
  departureDate?: string | null;
  diveSites?: string[] | null;
  images?: string[] | null;
}

export type UpdateOfferingRequest = Partial<CreateOfferingRequest>;

export interface OfferingAvailabilityRuleResponse {
  dayOfWeek: number;
  isClosed: boolean;
  startMinutes: number | null;
  endMinutes: number | null;
}

export interface OfferingBlackoutDateResponse {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
}

export interface OfferingPricingRuleResponse {
  id: string;
  name: string | null;
  startsAt: string;
  endsAt: string;
  specialPrice: number;
}

export interface OfferingAvailabilityResponse {
  offeringId: string;
  capacityLimit: number | null;
  rules: OfferingAvailabilityRuleResponse[] | null;
  blackoutDates: OfferingBlackoutDateResponse[] | null;
  pricingRules: OfferingPricingRuleResponse[] | null;
}

export interface OfferingAvailabilityRuleRequest {
  dayOfWeek: number;
  isClosed: boolean;
  startMinutes?: number | null;
  endMinutes?: number | null;
}

export interface UpdateOfferingAvailabilityRequest {
  rules: OfferingAvailabilityRuleRequest[] | null;
}

export interface UpdateOfferingCapacityRequest {
  capacityLimit: number;
}

export interface OfferingBlackoutDateRequest {
  startsAt: string;
  endsAt: string;
  reason?: string | null;
}

export interface OfferingPricingRuleRequest {
  name?: string | null;
  startsAt: string;
  endsAt: string;
  specialPrice: number;
}

export interface ActivityCategoryResponse {
  key: string | null;
  displayName: string | null;
  hasSubCategories: boolean;
}

export interface CategoryOfferingResponse {
  id: string;
  title: string | null;
  description: string | null;
  basePrice: number;
  priceWithEquipment: number | null;
  priceWithoutEquipment: number | null;
  difficulty: string | null;
  diverLevel: string | null;
}

// ================================================================
// SERVICE
// ================================================================

@Injectable({
  providedIn: 'root'
})
export class TripsService {

  private readonly base        = environment.centerApiUrl;
  private readonly offerings   = `${this.base}/offerings`;
  private readonly centers     = `${this.base}/centers`;
  private readonly courses     = `${this.base}/courses`;
  private readonly expeditions = `${this.base}/expeditions`;

  constructor(private http: HttpClient) {}

  getMyExpeditions(
    page     = 1,
    pageSize = 20,
    status?:  string,
    type?:    string,
    search?:  string
  ): Observable<PaginatedExpeditionsResponse> {
    let params = new HttpParams()
      .set('page',     page)
      .set('pageSize', pageSize);

    if (status) params = params.set('status', status);
    if (type)   params = params.set('type',   type);
    if (search) params = params.set('search', search);

    return this.http.get<PaginatedExpeditionsResponse>(
      `${this.centers}/me/expeditions`,
      { params }
    );
  }

  getExpeditionDetails(expeditionId: string): Observable<CenterExpeditionDetailsResponse> {
    return this.http.get<CenterExpeditionDetailsResponse>(
      `${this.centers}/me/expeditions/${expeditionId}`
    );
  }

  // ✅ عدّلنا return type لـ PagedOfferingsResponse + أضفنا pagination
  getMyOfferings(page = 1, pageSize = 50): Observable<PagedOfferingsResponse> {
    const params = new HttpParams()
      .set('page',     page)
      .set('pageSize', pageSize);
    return this.http.get<PagedOfferingsResponse>(`${this.offerings}/me`, { params });
  }

  createOffering(data: CreateOfferingRequest): Observable<string> {
    return this.http.post<string>(this.offerings, data);
  }

  updateOffering(offeringId: string, data: UpdateOfferingRequest): Observable<void> {
    return this.http.put<void>(`${this.offerings}/${offeringId}`, data);
  }

  deleteOffering(offeringId: string): Observable<void> {
    return this.http.delete<void>(`${this.offerings}/${offeringId}`);
  }

  uploadOfferingImages(offeringId: string, files: File[]): Observable<CloudinaryUploadResult[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post<CloudinaryUploadResult[]>(
      `${this.offerings}/${offeringId}/images`,
      formData
    );
  }

  getOfferingAvailability(offeringId: string): Observable<OfferingAvailabilityResponse> {
    return this.http.get<OfferingAvailabilityResponse>(
      `${this.offerings}/${offeringId}/availability`
    );
  }

  updateOfferingAvailability(
    offeringId: string,
    rules: OfferingAvailabilityRuleRequest[]
  ): Observable<void> {
    const body: UpdateOfferingAvailabilityRequest = { rules };
    return this.http.put<void>(
      `${this.offerings}/${offeringId}/availability`,
      body
    );
  }

  updateOfferingCapacity(offeringId: string, capacityLimit: number): Observable<void> {
    const body: UpdateOfferingCapacityRequest = { capacityLimit };
    return this.http.put<void>(`${this.offerings}/${offeringId}/capacity`, body);
  }

  addBlackoutDate(offeringId: string, data: OfferingBlackoutDateRequest): Observable<string> {
    return this.http.post<string>(
      `${this.offerings}/${offeringId}/blackout-dates`,
      data
    );
  }

  deleteBlackoutDate(offeringId: string, blackoutId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.offerings}/${offeringId}/blackout-dates/${blackoutId}`
    );
  }

  addPricingRule(offeringId: string, data: OfferingPricingRuleRequest): Observable<string> {
    return this.http.post<string>(
      `${this.offerings}/${offeringId}/pricing-rules`,
      data
    );
  }

  deletePricingRule(offeringId: string, ruleId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.offerings}/${offeringId}/pricing-rules/${ruleId}`
    );
  }

  publishExpedition(expeditionId: string): Observable<void> {
    return this.http.post<void>(`${this.expeditions}/${expeditionId}/publish`, {});
  }

  unpublishExpedition(expeditionId: string): Observable<void> {
    return this.http.post<void>(`${this.expeditions}/${expeditionId}/unpublish`, {});
  }

  getCourseCategories(): Observable<ActivityCategoryResponse[]> {
    return this.http.get<ActivityCategoryResponse[]>(`${this.courses}/categories`);
  }

  getCategoryOfferings(type: string): Observable<CategoryOfferingResponse[]> {
    return this.http.get<CategoryOfferingResponse[]>(
      `${this.courses}/categories/${encodeURIComponent(type)}/offerings`
    );
  }

  getPublicCenterExpeditions(
    centerId: string,
    pageNumber = 1,
    pageSize   = 20
  ): Observable<PaginatedExpeditionsResponse> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize',   pageSize);

    return this.http.get<PaginatedExpeditionsResponse>(
      `${this.base}/public/centers/${centerId}/expeditions`,
      { params }
    );
  }

  getPublicCenterOfferings(centerId: string): Observable<CenterOfferingResponse[]> {
    return this.http.get<CenterOfferingResponse[]>(
      `${this.base}/public/centers/${centerId}/offerings`
    );
  }
}