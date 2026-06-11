import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingComponent {
  step = 1;
  personalForm: FormGroup;
  selectedPayment = 'deposit';
  loading = false;
  divers = 1;
  receiptFile: File | null = null;
  receiptPreview: string | null = null;
  receiptError = false;

  center = { name: 'Orca Dive Club', location: 'Sharm El Sheikh' };
  trip = { name: 'Morning Reef Dive', date: '2025-07-15', duration: '3 hrs', depth: '18m', price: 350 };

  paymentOptions = [
    { id: 'deposit', icon: 'payments', label: 'Pay Deposit (30%)', desc: 'Secure your spot — pay the rest at the center' },
    { id: 'wallet', icon: 'account_balance_wallet', label: 'Mobile Wallet', desc: 'Vodafone Cash, InstaPay, Orange Money' },
  ];

  get total()     { return this.trip.price * this.divers; }
  get deposit()   { return Math.ceil(this.total * 0.3); }
  get amountDue() { return this.selectedPayment === 'deposit' ? this.deposit : this.total; }
  get paymentLabel() {
    return this.selectedPayment === 'deposit' ? 'Deposit (30%)' : 'Mobile Wallet (Full)';
  }

  constructor(private fb: FormBuilder) {
    this.personalForm = this.fb.group({
      firstName:  ['', Validators.required],
      lastName:   ['', Validators.required],
      email:      ['', [Validators.required, Validators.email]],
      phone:      ['', Validators.required],
      diverLevel: ['beginner'],
      notes:      [''],
    });
  }

  nextStep() {
    if (this.step === 1) {
      if (this.personalForm.invalid) { this.personalForm.markAllAsTouched(); return; }
    }
    if (this.step === 2) {
      if (!this.receiptFile) { this.receiptError = true; return; }
      this.receiptError = false;
    }
    if (this.step < 3) this.step++;
  }

  prevStep() { if (this.step > 1) this.step--; }

  confirm() {
    this.loading = true;
    // هنا بتبعت الـ FormData للـ backend فيها الـ receipt
    const formData = new FormData();
    formData.append('firstName',  this.personalForm.value.firstName);
    formData.append('lastName',   this.personalForm.value.lastName);
    formData.append('email',      this.personalForm.value.email);
    formData.append('phone',      this.personalForm.value.phone);
    formData.append('diverLevel', this.personalForm.value.diverLevel);
    formData.append('notes',      this.personalForm.value.notes || '');
    formData.append('payment',    this.selectedPayment);
    formData.append('amountDue',  this.amountDue.toString());
    formData.append('divers',     this.divers.toString());
    if (this.receiptFile) formData.append('receipt', this.receiptFile);

    // TODO: inject HttpClient وابعت للـ API
    // this.http.post('/api/bookings', formData).subscribe(...)
    setTimeout(() => { this.loading = false; this.step = 4; }, 1800);
  }

  onReceiptSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.setReceipt(input.files[0]);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.setReceipt(file);
  }

  private setReceipt(file: File) {
    this.receiptFile = file;
    this.receiptError = false;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => this.receiptPreview = e.target?.result as string;
      reader.readAsDataURL(file);
    } else {
      // PDF — بنعرض أيقونة بدل preview
      this.receiptPreview = null;
    }
  }

  removeReceipt(e: Event) {
    e.stopPropagation();
    this.receiptFile = null;
    this.receiptPreview = null;
  }

  incDivers() { if (this.divers < 10) this.divers++; }
  decDivers() { if (this.divers > 1)  this.divers--; }
}