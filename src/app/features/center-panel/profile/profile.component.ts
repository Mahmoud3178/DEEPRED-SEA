import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CenterService } from '../../../core/services/center.service';

@Component({
  selector: 'app-center-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class CenterProfileComponent implements OnInit {

  form: FormGroup;
  saved         = false;
  loading       = false;
  error         = '';

  profileImageUrl  = '';
  profilePublicId  = '';
  imagePreviewUrl  = '';
  pendingImageFile: File | null = null;
  imageUploading   = false;
  imageError       = '';

  // ── Location ──────────────────────────────────────────
  locationLat = 0;
  locationLng = 0;
  locationPickerOpen = false;
  latInput = '';
  lngInput = '';
  locationError = '';

  constructor(private fb: FormBuilder, private centerService: CenterService) {
    this.form = this.fb.group({
      name:                    ['', Validators.required],
      address:                 ['', Validators.required],
      phone:                   ['', Validators.required],
      whatsapp:                [''],
      enableWhatsAppDirect:    [false],
      email:                   ['', [Validators.required, Validators.email]],
      website:                 [''],
      description:             ['', Validators.required],
      operatingHours:          [''],
      facebook:                [''],
      instagram:               [''],
      tiktok:                  [''],
      isVisibleInPublicSearch: [true],
      receiveBookingAlerts:    [true],
      receiveReviewAlerts:     [true],
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  // ── Load ─────────────────────────────────────────────
  loadProfile(): void {
    this.loading = true;
    this.centerService.getProfile().subscribe({
      next: (data) => {
        this.loading = false;

        if (data.images?.length) {
          this.profileImageUrl = data.images[0].url;
          const url   = data.images[0].url;
          const match = url.match(/\/v\d+\/(.+)\.\w+$/);
          this.profilePublicId = match ? match[1] : '';
        }

        // location
        if (data.location) {
          this.locationLat = data.location.latitude  ?? 0;
          this.locationLng = data.location.longitude ?? 0;
        }

        this.form.patchValue({
          name:                    data.name                    ?? '',
          address:                 data.address                 ?? '',
          phone:                   data.contactPhone            ?? '',
          whatsapp:                data.whatsAppNumber          ?? '',
          enableWhatsAppDirect:    data.enableWhatsAppDirect    ?? false,
          email:                   data.contactEmail            ?? '',
          website:                 data.websiteUrl              ?? '',
          description:             data.description             ?? '',
          operatingHours:          data.operatingHours          ?? '',
          facebook:                data.facebookUrl             ?? '',
          instagram:               data.instagramUrl            ?? '',
          tiktok:                  data.tikTokUrl               ?? '',
          isVisibleInPublicSearch: data.isVisibleInPublicSearch ?? true,
          receiveBookingAlerts:    data.receiveBookingAlerts    ?? true,
          receiveReviewAlerts:     data.receiveReviewAlerts     ?? true,
        });
      },
      error: () => {
        this.loading = false;
        this.error   = 'Failed to load profile. Please try again.';
      }
    });
  }

  // ── Image ─────────────────────────────────────────────
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) { this.imageError = 'Please select a valid image file.'; return; }
    if (file.size > 5 * 1024 * 1024)    { this.imageError = 'Image must be under 5 MB.'; return; }

    this.imageError       = '';
    this.pendingImageFile = file;
    const reader  = new FileReader();
    reader.onload = (e) => this.imagePreviewUrl = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  // ── Location picker ───────────────────────────────────
  openLocationPicker(): void {
    this.latInput          = this.locationLat ? this.locationLat.toString() : '';
    this.lngInput          = this.locationLng ? this.locationLng.toString() : '';
    this.locationError     = '';
    this.locationPickerOpen = true;
  }

  applyLocation(): void {
    const lat = parseFloat(this.latInput);
    const lng = parseFloat(this.lngInput);

    if (isNaN(lat) || lat < -90  || lat > 90)  { this.locationError = 'Latitude must be between -90 and 90.';    return; }
    if (isNaN(lng) || lng < -180 || lng > 180) { this.locationError = 'Longitude must be between -180 and 180.'; return; }

    this.locationLat        = lat;
    this.locationLng        = lng;
    this.locationError      = '';
    this.locationPickerOpen = false;
  }

  cancelLocationPicker(): void {
    this.locationPickerOpen = false;
    this.locationError      = '';
  }

  get hasLocation(): boolean {
    return this.locationLat !== 0 || this.locationLng !== 0;
  }

  get googleMapsUrl(): string {
    return `https://www.google.com/maps?q=${this.locationLat},${this.locationLng}`;
  }

  // ── Save ─────────────────────────────────────────────
  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error   = '';

    if (this.pendingImageFile) {
      this.imageUploading = true;
      this.centerService.uploadImages([this.pendingImageFile]).subscribe({
        next: (results) => {
          this.imageUploading  = false;
          this.profileImageUrl = results[0]?.url      ?? '';
          this.profilePublicId = results[0]?.publicId ?? '';
          this.imagePreviewUrl = '';
          this.pendingImageFile = null;
          this.saveProfile(this.profilePublicId);
        },
        error: (err) => {
          this.imageUploading = false;
          this.loading        = false;
          this.imageError     = err?.error?.title?.includes('12-image limit')
            ? 'Image gallery is full. Please contact support to update your profile picture.'
            : 'Image upload failed. Please try again.';
        }
      });
    } else {
      this.saveProfile(this.profilePublicId);
    }
  }

  private saveProfile(publicId: string): void {
    const v = this.form.value;

    const payload: any = {
      name:                    v.name,
      description:             v.description,
      address:                 v.address,
      location:                { latitude: this.locationLat, longitude: this.locationLng },
      operatingHours:          v.operatingHours       || '',
      isVisibleInPublicSearch: v.isVisibleInPublicSearch ?? true,
      contactEmail:            v.email,
      contactPhone:            v.phone,
      whatsAppNumber:          v.whatsapp             || '',
      enableWhatsAppDirect:    v.enableWhatsAppDirect ?? false,
      websiteUrl:              v.website              || '',
      facebookUrl:             v.facebook             || '',
      instagramUrl:            v.instagram            || '',
      tikTokUrl:               v.tiktok               || '',
      receiveBookingAlerts:    v.receiveBookingAlerts ?? true,
      receiveReviewAlerts:     v.receiveReviewAlerts  ?? true,
    };

    if (publicId) payload.images = [publicId];

    this.centerService.updateProfile(payload).subscribe({
      next: () => {
        this.loading = false;
        this.saved   = true;
        setTimeout(() => this.saved = false, 3000);
      },
      error: (err) => {
        if (err.status === 204 || err.status === 200) {
          this.loading = false;
          this.saved   = true;
          setTimeout(() => this.saved = false, 3000);
          return;
        }
        this.loading = false;
        this.error   = 'Failed to save profile. Please try again.';
      }
    });
  }

  get nameInitial(): string {
    return (this.form.get('name')?.value ?? '?').charAt(0).toUpperCase();
  }
}