import { Component, OnInit } from '@angular/core';
import { CenterService, CenterKycDocumentResponse } from '../../../core/services/center.service';

@Component({
  selector: 'app-center-kyc',
  templateUrl: './kyc.component.html',
  styleUrls: ['./kyc.component.css']
})
export class CenterKycComponent implements OnInit {

  centerId  = '';
  documents: CenterKycDocumentResponse[] = [];
  loading   = false;
  error     = '';

  // ── Upload ──
  selectedType    = 'CommercialRegister';
  selectedFile: File | null = null;
  uploadLoading   = false;
  uploadError     = '';
  uploadSuccess   = false;

  documentTypes = [
    { value: 'CommercialRegister', label: 'Commercial Register' },
    { value: 'TaxCard',            label: 'Tax Card'            },
    { value: 'NationalId',         label: 'National ID'         },
    { value: 'DivingLicense',      label: 'Diving License'      },
    { value: 'InsuranceCert',      label: 'Insurance Certificate'},
    { value: 'Other',              label: 'Other'               },
  ];

  constructor(private centerService: CenterService) {}

  ngOnInit(): void {
    this.loadCenterThenDocs();
  }

  private loadCenterThenDocs(): void {
    this.loading = true;
    this.centerService.getProfile().subscribe({
      next: (profile) => {
        this.centerId = profile.id;
        this.loadDocuments();
      },
      error: () => {
        this.loading = false;
        this.error   = 'Failed to load center profile.';
      }
    });
  }

  loadDocuments(): void {
    this.loading = true;
    this.error   = '';
    this.centerService.getKycDocuments(this.centerId).subscribe({
      next:  (docs) => { this.documents = docs ?? []; this.loading = false; },
      error: ()     => { this.error = 'Failed to load documents.'; this.loading = false; }
    });
  }

  // ── File select ──
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.uploadError = 'File must be under 10 MB.';
      return;
    }
    this.uploadError   = '';
    this.selectedFile  = file;
  }

  // ── Upload ──
  uploadDocument(): void {
    if (!this.selectedFile) return;
    this.uploadLoading = true;
    this.uploadError   = '';
    this.uploadSuccess = false;

    this.centerService.uploadKycDocument(
      this.centerId,
      this.selectedType,
      this.selectedFile
    ).subscribe({
      next: () => {
        this.uploadLoading = false;
        this.uploadSuccess = true;
        this.selectedFile  = null;
        setTimeout(() => this.uploadSuccess = false, 3000);
        this.loadDocuments();
      },
      error: () => {
        this.uploadLoading = false;
        this.uploadError   = 'Upload failed. Please try again.';
      }
    });
  }

  // ── Helpers ──
  getStatusClass(status: string | null): string {
    switch ((status ?? '').toLowerCase()) {
      case 'approved': return 'badge-active';
      case 'pending':  return 'badge-pending';
      case 'rejected': return 'badge-blocked';
      default:         return 'badge-pending';
    }
  }

  getTypeLabel(value: string | null): string {
    return this.documentTypes.find(t => t.value === value)?.label ?? value ?? '—';
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}