import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({ selector: 'app-center-trips', templateUrl: './trips.component.html',
  styleUrls: ['./trips.component.css'] })
export class CenterTripsComponent {
  showModal = false;
  editTrip: any = null;
  tripForm: FormGroup;

  mainPhotoPreview: string | null = null;
  additionalPhotos: string[] = [];

  trips = [
    { id: 'T1', name: 'Morning Reef Dive', type: 'Day Trip', price: 350, capacity: 10, booked: 6, status: 'active', depth: '18m', duration: '3 hrs', mainPhoto: null, photos: [] },
    { id: 'T2', name: 'Ras Mohammed NP', type: 'Day Trip', price: 650, capacity: 8, booked: 5, status: 'active', depth: '30m', duration: '6 hrs', mainPhoto: null, photos: [] },
    { id: 'T3', name: 'Thistlegorm Wreck', type: 'Liveaboard', price: 850, capacity: 8, booked: 3, status: 'active', depth: '32m', duration: '8 hrs', mainPhoto: null, photos: [] },
    { id: 'T4', name: 'PADI Open Water', type: 'Course', price: 2800, capacity: 12, booked: 4, status: 'draft', depth: '18m', duration: '4 days', mainPhoto: null, photos: [] },
    { id: 'T5', name: 'Advanced Nitrox', type: 'Course', price: 1900, capacity: 6, booked: 2, status: 'active', depth: '40m', duration: '2 days', mainPhoto: null, photos: [] },
  ];

  constructor(private fb: FormBuilder) {
    this.tripForm = this.fb.group({
      name: ['', Validators.required],
      type: ['Day Trip', Validators.required],
      price: ['', [Validators.required, Validators.min(1)]],
      capacity: ['', [Validators.required, Validators.min(1)]],
      depth: ['', Validators.required],
      duration: ['', Validators.required],
    });
  }

  openAdd() {
    this.editTrip = null;
    this.tripForm.reset({ type: 'Day Trip' });
    this.mainPhotoPreview = null;
    this.additionalPhotos = [];
    this.showModal = true;
  }

  openEdit(t: any) {
    this.editTrip = t;
    this.tripForm.patchValue(t);
    this.mainPhotoPreview = t.mainPhoto || null;
    this.additionalPhotos = [...(t.photos || [])];
    this.showModal = true;
  }

  onMainPhoto(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => this.mainPhotoPreview = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  onAdditionalPhotos(event: Event) {
    const files = Array.from((event.target as HTMLInputElement).files || []);
    const remaining = 10 - this.additionalPhotos.length;
    files.slice(0, remaining).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => this.additionalPhotos.push(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }

  removeAdditionalPhoto(i: number) { this.additionalPhotos.splice(i, 1); }

  save() {
    if (this.tripForm.invalid) { this.tripForm.markAllAsTouched(); return; }
    if (this.editTrip) {
      Object.assign(this.editTrip, this.tripForm.value, {
        mainPhoto: this.mainPhotoPreview,
        photos: [...this.additionalPhotos]
      });
    } else {
      this.trips.push({
        id: 'T' + Date.now(), booked: 0, status: 'draft',
        mainPhoto: this.mainPhotoPreview,
        photos: [...this.additionalPhotos],
        ...this.tripForm.value
      });
    }
    this.showModal = false;
  }

  delete(id: string) { this.trips = this.trips.filter(t => t.id !== id); }
  toggleStatus(t: any) { t.status = t.status === 'active' ? 'draft' : 'active'; }
}