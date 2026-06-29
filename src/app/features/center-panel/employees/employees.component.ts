import { Component, OnInit } from '@angular/core';
import { CenterService, EmployeeAssignmentResponse, InviteEmployeeResponse } from '../../../core/services/center.service';

@Component({
  selector: 'app-center-employees',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.css']
})
export class CenterEmployeesComponent implements OnInit {

  centerId   = '';
  employees: EmployeeAssignmentResponse[] = [];
  loading    = false;
  error      = '';

  // ── Invite modal ──
  showInviteModal = false;
  inviteEmail     = '';
  inviteScope     = 'Staff';
  inviteHours     = 48;
  inviteLoading   = false;
  inviteError     = '';
  inviteResult: InviteEmployeeResponse | null = null;

  // ── Scope edit ──
  editingScopeId  = '';
  editScopeValue  = '';
  scopeLoading    = false;

  // ── Action loading ──
  actionLoading: string | null = null;

  scopeOptions = ['Staff', 'Manager', 'Admin'];

  constructor(private centerService: CenterService) {}

  ngOnInit(): void {
    this.loadCenterThenEmployees();
  }

  // ── Load ──────────────────────────────────────────────
  private loadCenterThenEmployees(): void {
    this.loading = true;
    this.centerService.getProfile().subscribe({
      next: (profile) => {
        this.centerId = profile.id;
        this.loadEmployees();
      },
      error: () => {
        this.loading = false;
        this.error   = 'Failed to load center profile.';
      }
    });
  }

  loadEmployees(): void {
    this.loading = true;
    this.error   = '';
    this.centerService.getEmployees(this.centerId).subscribe({
      next:  (data) => { this.employees = data ?? []; this.loading = false; },
      error: ()     => { this.error = 'Failed to load employees.'; this.loading = false; }
    });
  }

  // ── Invite ────────────────────────────────────────────
  openInviteModal(): void {
    this.showInviteModal = true;
    this.inviteEmail     = '';
    this.inviteScope     = 'Staff';
    this.inviteHours     = 48;
    this.inviteError     = '';
    this.inviteResult    = null;
  }

  closeInviteModal(): void {
    this.showInviteModal = false;
    this.inviteResult    = null;
    if (!this.inviteResult) this.loadEmployees();
  }

  submitInvite(): void {
    if (!this.inviteEmail.trim()) return;
    this.inviteLoading = true;
    this.inviteError   = '';

    this.centerService.inviteEmployee(this.centerId, {
      email:          this.inviteEmail.trim(),
      scope:          this.inviteScope,
      expiresInHours: this.inviteHours
    }).subscribe({
      next:  (res)  => { this.inviteLoading = false; this.inviteResult = res; this.loadEmployees(); },
      error: ()     => { this.inviteLoading = false; this.inviteError = 'Failed to send invitation.'; }
    });
  }

  // ── Scope edit ────────────────────────────────────────
  startEditScope(emp: EmployeeAssignmentResponse): void {
    this.editingScopeId = emp.assignmentId;
    this.editScopeValue = emp.scope ?? 'Staff';
  }

  saveScope(emp: EmployeeAssignmentResponse): void {
    this.scopeLoading = true;
    this.centerService.updateEmployeeScope(this.centerId, emp.assignmentId, this.editScopeValue).subscribe({
      next: () => {
        emp.scope           = this.editScopeValue;
        this.editingScopeId = '';
        this.scopeLoading   = false;
      },
      error: () => { this.scopeLoading = false; this.error = 'Failed to update scope.'; }
    });
  }

  cancelEditScope(): void { this.editingScopeId = ''; }

  // ── Suspend / Reinstate / Remove ─────────────────────
  suspendEmployee(emp: EmployeeAssignmentResponse): void {
    this.actionLoading = emp.assignmentId;
    this.centerService.suspendEmployee(this.centerId, emp.assignmentId).subscribe({
      next: () => { emp.status = 'Suspended'; this.actionLoading = null; },
      error: (err) => {
        if (err.status === 204 || err.status === 200) { emp.status = 'Suspended'; this.actionLoading = null; return; }
        this.error = 'Failed to suspend.'; this.actionLoading = null;
      }
    });
  }

  reinstateEmployee(emp: EmployeeAssignmentResponse): void {
    this.actionLoading = emp.assignmentId;
    this.centerService.reinstateEmployee(this.centerId, emp.assignmentId).subscribe({
      next: () => { emp.status = 'Active'; this.actionLoading = null; },
      error: (err) => {
        if (err.status === 204 || err.status === 200) { emp.status = 'Active'; this.actionLoading = null; return; }
        this.error = 'Failed to reinstate.'; this.actionLoading = null;
      }
    });
  }

  removeEmployee(emp: EmployeeAssignmentResponse): void {
    if (!confirm(`Remove ${emp.invitedEmail}?`)) return;
    this.actionLoading = emp.assignmentId;
    this.centerService.removeEmployee(this.centerId, emp.assignmentId).subscribe({
      next: () => {
        this.employees     = this.employees.filter(e => e.assignmentId !== emp.assignmentId);
        this.actionLoading = null;
      },
      error: (err) => {
        // 204 No Content — السيرفر بيرد بدون body وده success
        if (err.status === 204 || err.status === 200) {
          this.employees     = this.employees.filter(e => e.assignmentId !== emp.assignmentId);
          this.actionLoading = null;
          return;
        }
        this.error         = 'Failed to remove employee.';
        this.actionLoading = null;
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────
  getStatusClass(status: string | null): string {
    switch ((status ?? '').toLowerCase()) {
      case 'active':    return 'badge-active';
      case 'pending':   return 'badge-pending';
      case 'suspended': return 'badge-blocked';
      default:          return 'badge-pending';
    }
  }

  getInitial(email: string | null): string {
    return (email ?? '?').charAt(0).toUpperCase();
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}