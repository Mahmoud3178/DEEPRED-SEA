import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';
import {
  TripsService,
  CenterOfferingResponse,
  CreateOfferingRequest,
  UpdateOfferingRequest,
  CloudinaryUploadResult,
  OfferingAvailabilityResponse,
  OfferingAvailabilityRuleRequest,
  OfferingBlackoutDateResponse,
  OfferingPricingRuleResponse,
  OfferingBlackoutDateRequest,
  OfferingPricingRuleRequest,
} from '../../../core/services/trips.service';

const DAY_LABELS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function minutesToTime(minutes: number | null | undefined): string {
  if (minutes == null) return '';
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function timeToMinutes(time: string): number | null {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

@Component({
  selector: 'app-center-trips',
  templateUrl: './trips.component.html',
  styleUrls: ['./trips.component.css']
})
export class CenterTripsComponent implements OnInit {

  offerings: CenterOfferingResponse[] = [];
  isLoading  = false;
  errorMsg: string | null = null;

  isDeleting: string | null  = null;
  isToggling: string | null  = null;

  filterType   = '';
  filterSearch = '';
  filterStatus = '';

  showModal = false;
  editOffering: CenterOfferingResponse | null = null;
  isSaving = false;
  tripForm: FormGroup;

  diveSiteInput = '';
  diveSitesList: string[] = [];

  mainPhotoPreview: string | null = null;
  mainPhotoFile: File | null = null;
  additionalPhotos: string[] = [];
  additionalPhotoFiles: File[] = [];

  showAvailModal = false;
  availOfferingId: string | null = null;
  availOfferingTitle: string | null = null;
  availLoading  = false;
  availSaving   = false;
  availError: string | null = null;
  availTab: 'schedule' | 'blackout' | 'pricing' = 'schedule';

  weeklyRules: {
    dayOfWeek: number;
    label: string;
    isClosed: boolean;
    startTime: string;
    endTime: string;
  }[] = [];

  blackoutDates: OfferingBlackoutDateResponse[] = [];
  blackoutForm: FormGroup;
  isAddingBlackout = false;
  isDeletingBlackout: string | null = null;

  pricingRules: OfferingPricingRuleResponse[] = [];
  pricingForm: FormGroup;
  isAddingPricing = false;
  isDeletingPricing: string | null = null;

  get bStartsAt(): FormControl { return this.blackoutForm.get('startsAt') as FormControl; }
  get bEndsAt():   FormControl { return this.blackoutForm.get('endsAt')   as FormControl; }
  get bReason():   FormControl { return this.blackoutForm.get('reason')   as FormControl; }

  get pName():         FormControl { return this.pricingForm.get('name')         as FormControl; }
  get pStartsAt():     FormControl { return this.pricingForm.get('startsAt')     as FormControl; }
  get pEndsAt():       FormControl { return this.pricingForm.get('endsAt')       as FormControl; }
  get pSpecialPrice(): FormControl { return this.pricingForm.get('specialPrice') as FormControl; }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private tripsService: TripsService
  ) {
    this.tripForm = this.fb.group({
      title:              ['', Validators.required],
      type:               ['DayTrip', Validators.required],
      description:        [''],
      basePrice:          [null, [Validators.required, Validators.min(0)]],
      discount:           [0],
      capacityLimit:      [null, [Validators.required, Validators.min(1)]],
      difficulty:         [''],
      diverLevel:         [''],
      cancellationPolicy: [''],
      schedule:           [''],
      departureDate:      [null],
      isAvailable:        [true],
    });

    this.blackoutForm = this.fb.group({
      startsAt: ['', Validators.required],
      endsAt:   ['', Validators.required],
      reason:   [''],
    });

    this.pricingForm = this.fb.group({
      name:         [''],
      startsAt:     ['', Validators.required],
      endsAt:       ['', Validators.required],
      specialPrice: [null, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.loadOfferings();
    if (this.route.snapshot.queryParams['action'] === 'add') {
      this.openAdd();
    }
  }

  // ✅ التعديل الأساسي هنا — بناخد .items من الـ response
  loadOfferings(): void {
    this.isLoading = true;
    this.errorMsg  = null;
    this.tripsService.getMyOfferings()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next:  (res) => (this.offerings = res.items ?? []),
        error: (err) => (this.errorMsg = err?.error?.detail || err?.message || 'Failed to load offerings.'),
      });
  }

  get filteredOfferings(): CenterOfferingResponse[] {
    return this.offerings.filter(o => {
      const matchType   = !this.filterType   || o.type === this.filterType;
      const matchSearch = !this.filterSearch ||
        (o.title ?? '').toLowerCase().includes(this.filterSearch.toLowerCase());
      const matchStatus = !this.filterStatus ||
        (this.filterStatus === 'published'   &&  o.isPublished) ||
        (this.filterStatus === 'unpublished' && !o.isPublished) ||
        (this.filterStatus === 'available'   &&  o.isAvailable) ||
        (this.filterStatus === 'unavailable' && !o.isAvailable);
      return matchType && matchSearch && matchStatus;
    });
  }

  applyFilters(): void { }

  openAdd(): void {
    this.editOffering = null;
    this.tripForm.reset({ type: 'DayTrip', isAvailable: true, discount: 0 });
    this.diveSitesList = [];
    this.diveSiteInput = '';
    this.clearImages();
    this.errorMsg  = null;
    this.showModal = true;
  }

  openEdit(o: CenterOfferingResponse): void {
    this.editOffering = o;
    this.tripForm.patchValue({
      title:              o.title,
      type:               o.type,
      description:        o.description,
      basePrice:          o.basePrice,
      discount:           o.discount,
      capacityLimit:      o.capacityLimit,
      difficulty:         o.difficulty,
      diverLevel:         o.diverLevel,
      cancellationPolicy: o.cancellationPolicy,
      schedule:           o.schedule,
      departureDate:      o.departureDate ? o.departureDate.substring(0, 10) : null,
      isAvailable:        o.isAvailable,
    });
    this.diveSitesList    = o.diveSites ? [...o.diveSites] : [];
    this.diveSiteInput    = '';
    this.mainPhotoPreview = o.images?.[0] ?? null;
    this.mainPhotoFile    = null;
    this.additionalPhotos     = o.images?.slice(1) ?? [];
    this.additionalPhotoFiles = [];
    this.errorMsg  = null;
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  addDiveSite(): void {
    const site = this.diveSiteInput.trim();
    if (site && !this.diveSitesList.includes(site)) {
      this.diveSitesList.push(site);
    }
    this.diveSiteInput = '';
  }

  onDiveSiteKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') { event.preventDefault(); this.addDiveSite(); }
  }

  removeDiveSite(i: number): void { this.diveSitesList.splice(i, 1); }

  onMainPhoto(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.mainPhotoFile = file;
    const reader = new FileReader();
    reader.onload = (e) => (this.mainPhotoPreview = e.target?.result as string);
    reader.readAsDataURL(file);
  }

  onAdditionalPhotos(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files || []);
    const remaining = 10 - this.additionalPhotoFiles.length;
    files.slice(0, remaining).forEach(file => {
      this.additionalPhotoFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => this.additionalPhotos.push(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }

  removeAdditionalPhoto(i: number): void {
    this.additionalPhotos.splice(i, 1);
    this.additionalPhotoFiles.splice(i, 1);
  }

  private uploadImagesAndFinish(offeringId: string): void {
    const filesToUpload: File[] = [
      ...(this.mainPhotoFile ? [this.mainPhotoFile] : []),
      ...this.additionalPhotoFiles,
    ];
    if (filesToUpload.length > 0) {
      this.tripsService.uploadOfferingImages(offeringId, filesToUpload)
        .pipe(finalize(() => { this.isSaving = false; this.showModal = false; }))
        .subscribe({
          next:  (_: CloudinaryUploadResult[]) => this.loadOfferings(),
          error: (_: unknown)                  => this.loadOfferings(),
        });
    } else {
      this.isSaving  = false;
      this.showModal = false;
      this.loadOfferings();
    }
  }

  save(): void {
    if (this.tripForm.invalid) { this.tripForm.markAllAsTouched(); return; }

    const v = this.tripForm.value;
    const payload: CreateOfferingRequest = {
      type:               v.type,
      title:              v.title,
      description:        v.description        || null,
      basePrice:          +v.basePrice,
      discount:           v.discount != null ? +v.discount : 0,
      isAvailable:        v.isAvailable ?? true,
      capacityLimit:      v.capacityLimit ? +v.capacityLimit : null,
      difficulty:         v.difficulty         || null,
      diverLevel:         v.diverLevel         || null,
      cancellationPolicy: v.cancellationPolicy  || null,
      schedule:           v.schedule           || null,
      departureDate:      v.departureDate
                            ? new Date(v.departureDate).toISOString()
                            : null,
      diveSites:          this.diveSitesList.length ? this.diveSitesList : null,
    };

    this.isSaving = true;
    this.errorMsg = null;

    if (!this.editOffering) {
      this.tripsService.createOffering(payload).subscribe({
        next:  (newId: string) => this.uploadImagesAndFinish(newId),
        error: (err: { error?: { detail?: string }; message?: string }) => {
          this.isSaving = false;
          this.errorMsg = err?.error?.detail || err?.message || 'Failed to create trip.';
        },
      });
    } else {
      const editId = this.editOffering.id;
      this.tripsService.updateOffering(editId, payload as UpdateOfferingRequest).subscribe({
        next:  () => this.uploadImagesAndFinish(editId),
        error: (err: { error?: { detail?: string }; message?: string }) => {
          this.isSaving = false;
          this.errorMsg = err?.error?.detail || err?.message || 'Failed to update trip.';
        },
      });
    }
  }

  delete(id: string): void {
    if (!confirm('Are you sure you want to delete this trip?')) return;
    this.isDeleting = id;
    this.tripsService.deleteOffering(id)
      .pipe(finalize(() => (this.isDeleting = null)))
      .subscribe({
        next:  () => this.loadOfferings(),
        error: (err: { error?: { detail?: string }; message?: string }) => {
          this.errorMsg = err?.error?.detail || err?.message || 'Failed to delete trip.';
        },
      });
  }

  togglePublish(o: CenterOfferingResponse): void {
    this.isToggling = o.id;
    const req$ = o.isPublished
      ? this.tripsService.unpublishExpedition(o.id)
      : this.tripsService.publishExpedition(o.id);

    req$.pipe(finalize(() => (this.isToggling = null)))
      .subscribe({
        next:  () => this.loadOfferings(),
        error: (err: { error?: { detail?: string }; message?: string }) => {
          this.errorMsg = err?.error?.detail || err?.message || 'Failed to update publish status.';
        },
      });
  }

  trackById(_: number, item: CenterOfferingResponse): string { return item.id; }

  private clearImages(): void {
    this.mainPhotoPreview     = null;
    this.mainPhotoFile        = null;
    this.additionalPhotos     = [];
    this.additionalPhotoFiles = [];
  }

  openAvailability(o: CenterOfferingResponse): void {
    this.availOfferingId    = o.id;
    this.availOfferingTitle = o.title;
    this.availTab           = 'schedule';
    this.availError         = null;
    this.showAvailModal     = true;
    this.loadAvailability();
  }

  closeAvailModal(): void { this.showAvailModal = false; }

  loadAvailability(): void {
    if (!this.availOfferingId) return;
    this.availLoading = true;
    this.availError   = null;

    this.tripsService.getOfferingAvailability(this.availOfferingId)
      .pipe(finalize(() => (this.availLoading = false)))
      .subscribe({
        next:  (res) => this.hydrateAvailability(res),
        error: (err) => (this.availError = err?.error?.detail || err?.message || 'Failed to load availability.'),
      });
  }

  private hydrateAvailability(res: OfferingAvailabilityResponse): void {
    this.weeklyRules = Array.from({ length: 7 }, (_, i) => {
      const existing = res.rules?.find(r => r.dayOfWeek === i);
      return {
        dayOfWeek: i,
        label:     DAY_LABELS[i],
        isClosed:  existing ? existing.isClosed : false,
        startTime: existing ? minutesToTime(existing.startMinutes) : '08:00',
        endTime:   existing ? minutesToTime(existing.endMinutes)   : '18:00',
      };
    });

    this.blackoutDates = res.blackoutDates ?? [];
    this.pricingRules  = res.pricingRules  ?? [];
  }

  saveSchedule(): void {
    if (!this.availOfferingId) return;

    const invalidDay = this.weeklyRules.find(r => !r.isClosed && (!r.startTime || !r.endTime));
    if (invalidDay) {
      this.availError = `Please set start and end times for ${invalidDay.label}.`;
      return;
    }
    const badRange = this.weeklyRules.find(r => {
      if (r.isClosed) return false;
      const s = timeToMinutes(r.startTime) ?? 0;
      const e = timeToMinutes(r.endTime)   ?? 0;
      return e <= s;
    });
    if (badRange) {
      this.availError = `${badRange.label}: end time must be after start time.`;
      return;
    }

    this.availSaving = true;
    this.availError  = null;

    const rules: OfferingAvailabilityRuleRequest[] = this.weeklyRules.map(r => ({
      dayOfWeek:    r.dayOfWeek,
      isClosed:     r.isClosed,
      startMinutes: r.isClosed ? null : (timeToMinutes(r.startTime) ?? 480),
      endMinutes:   r.isClosed ? null : (timeToMinutes(r.endTime)   ?? 1080),
    }));

    this.tripsService.updateOfferingAvailability(this.availOfferingId, rules)
      .pipe(finalize(() => (this.availSaving = false)))
      .subscribe({
        next:  () => { },
        error: (err) => (this.availError = err?.error?.detail || err?.message || 'Failed to save schedule.'),
      });
  }

  addBlackout(): void {
    if (this.blackoutForm.invalid || !this.availOfferingId) {
      this.blackoutForm.markAllAsTouched();
      return;
    }
    const v = this.blackoutForm.value;
    if (v.endsAt < v.startsAt) {
      this.availError = 'End date must be after start date.';
      return;
    }
    const payload: OfferingBlackoutDateRequest = {
      startsAt: v.startsAt + 'T00:00:00',
      endsAt:   v.endsAt   + 'T00:00:00',
      reason:   v.reason || null,
    };
    this.isAddingBlackout = true;
    this.tripsService.addBlackoutDate(this.availOfferingId, payload)
      .pipe(finalize(() => (this.isAddingBlackout = false)))
      .subscribe({
        next: (newId: string) => {
          this.blackoutDates.push({
            id:       newId,
            startsAt: payload.startsAt,
            endsAt:   payload.endsAt,
            reason:   payload.reason ?? null,
          });
          this.blackoutForm.reset();
        },
        error: (err) => (this.availError = err?.error?.detail || err?.message || 'Failed to add blackout date.'),
      });
  }

  removeBlackout(id: string): void {
    if (!this.availOfferingId) return;
    this.isDeletingBlackout = id;
    this.tripsService.deleteBlackoutDate(this.availOfferingId, id)
      .pipe(finalize(() => (this.isDeletingBlackout = null)))
      .subscribe({
        next:  () => (this.blackoutDates = this.blackoutDates.filter(b => b.id !== id)),
        error: (err) => (this.availError = err?.error?.detail || err?.message || 'Failed to remove blackout date.'),
      });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
  }

  addPricingRule(): void {
    if (this.pricingForm.invalid || !this.availOfferingId) {
      this.pricingForm.markAllAsTouched();
      return;
    }
    const v = this.pricingForm.value;
    if (v.endsAt < v.startsAt) {
      this.availError = 'End date must be after start date.';
      return;
    }
    const payload: OfferingPricingRuleRequest = {
      name:         v.name || null,
      startsAt:     v.startsAt + 'T00:00:00',
      endsAt:       v.endsAt   + 'T00:00:00',
      specialPrice: +v.specialPrice,
    };
    this.isAddingPricing = true;
    this.tripsService.addPricingRule(this.availOfferingId, payload)
      .pipe(finalize(() => (this.isAddingPricing = false)))
      .subscribe({
        next: (newId: string) => {
          this.pricingRules.push({
            id:           newId,
            name:         payload.name ?? null,
            startsAt:     payload.startsAt,
            endsAt:       payload.endsAt,
            specialPrice: payload.specialPrice,
          });
          this.pricingForm.reset();
        },
        error: (err) => (this.availError = err?.error?.detail || err?.message || 'Failed to add pricing rule.'),
      });
  }

  removePricingRule(id: string): void {
    if (!this.availOfferingId) return;
    this.isDeletingPricing = id;
    this.tripsService.deletePricingRule(this.availOfferingId, id)
      .pipe(finalize(() => (this.isDeletingPricing = null)))
      .subscribe({
        next:  () => (this.pricingRules = this.pricingRules.filter(p => p.id !== id)),
        error: (err) => (this.availError = err?.error?.detail || err?.message || 'Failed to remove pricing rule.'),
      });
  }
}