import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export interface AppError {
  message: string;
  detail?: string;
  status: number;
  field?: string;
}

@Injectable({ providedIn: 'root' })
export class ErrorService {

  /**
   * الـ method الرئيسية — بتاخد HttpErrorResponse وبترجع AppError واضح
   */
  parse(error: HttpErrorResponse, context?: ErrorContext): AppError {
    const status  = error.status;
    const body    = error.error;

    // استخرج الـ detail من الـ ProblemDetails body
    const serverDetail: string =
      body?.detail  ||
      body?.message ||
      body?.title   ||
      (typeof body === 'string' ? body : '');

    const userMessage = this.resolveMessage(status, serverDetail, context);

    return {
      message: userMessage,
      detail:  serverDetail !== userMessage ? serverDetail : undefined,
      status,
    };
  }

  /**
   * بترجع string مباشرة لو محتاج تستخدمه في template
   */
  getMessage(error: HttpErrorResponse, context?: ErrorContext): string {
    return this.parse(error, context).message;
  }

  // ── Private ──────────────────────────────────────────────
  private resolveMessage(
    status: number,
    serverDetail: string,
    context?: ErrorContext
  ): string {

    // لو السيرفر بعت رسالة محددة وواضحة، استخدمها
    if (serverDetail && this.isUserFriendly(serverDetail)) {
      return serverDetail;
    }

    // HTTP status → رسالة حسب الـ context
    switch (status) {

      case 0:
        return 'No internet connection. Please check your network and try again.';

      case 400:
        return this.resolve400(serverDetail, context);

      case 401:
        return 'Your session has expired. Please log in again.';

      case 403:
        return 'You don\'t have permission to perform this action.';

      case 404:
        return this.resolve404(context);

      case 409:
        return this.resolve409(serverDetail, context);

      case 413:
        return 'The file you\'re trying to upload is too large.';

      case 422:
        return 'Some of the information you entered is invalid. Please check and try again.';

      case 429:
        return 'Too many requests. Please wait a moment and try again.';

      case 500:
      case 502:
      case 503:
        return 'Something went wrong on our end. Please try again in a few moments.';

      default:
        return context?.fallback ?? 'Something went wrong. Please try again.';
    }
  }

  // ── 400 Bad Request ───────────────────────────────────────
  private resolve400(detail: string, context?: ErrorContext): string {
    const d = detail.toLowerCase();

    if (d.includes('password'))
      return 'The current password you entered is incorrect.';
    if (d.includes('otp') || d.includes('code') || d.includes('verification'))
      return 'The verification code is invalid or has expired.';
    if (d.includes('email'))
      return 'This email address is not valid.';
    if (d.includes('image') || d.includes('file'))
      return 'The file format is not supported or the file is too large.';
    if (d.includes('limit'))
      return 'You\'ve reached the maximum limit allowed.';
    if (d.includes('date') || d.includes('time'))
      return 'The date or time you entered is not valid.';
    if (d.includes('price') || d.includes('amount'))
      return 'Please enter a valid price or amount.';
    if (d.includes('capacity'))
      return 'Please enter a valid capacity value.';
    if (d.includes('blackout'))
      return 'The blackout date range is not valid.';
    if (d.includes('booking'))
      return 'This booking cannot be processed. It may already be confirmed or cancelled.';
    if (d.includes('review'))
      return 'This review status cannot be changed.';

    return context?.bad ?? 'The information you entered is not valid. Please check and try again.';
  }

  // ── 404 Not Found ─────────────────────────────────────────
  private resolve404(context?: ErrorContext): string {
    switch (context?.resource) {
      case 'profile':    return 'Center profile not found. Please complete your profile setup.';
      case 'employee':   return 'Employee not found. They may have already been removed.';
      case 'booking':    return 'Booking not found.';
      case 'review':     return 'Review not found.';
      case 'offering':   return 'This offering no longer exists.';
      case 'document':   return 'Document not found.';
      default:           return 'The requested item was not found.';
    }
  }

  // ── 409 Conflict ──────────────────────────────────────────
  private resolve409(detail: string, context?: ErrorContext): string {
    const d = detail.toLowerCase();
    if (d.includes('email') || context?.resource === 'auth')
      return 'An account with this email address already exists.';
    if (d.includes('employee'))
      return 'This employee is already assigned to your center.';
    return 'This action conflicts with existing data. Please try again.';
  }

  // ── هل الرسالة اللي جت من السيرفر واضحة ليوزر؟ ──────────
  private isUserFriendly(msg: string): boolean {
    // رفض الرسائل التقنية
    const technical = [
      'exception', 'stack', 'null reference', 'object reference',
      'unhandled', 'internal server', 'system.', 'microsoft.',
      'an error occurred', 'see inner exception'
    ];
    const lower = msg.toLowerCase();
    return !technical.some(t => lower.includes(t)) && msg.length < 200;
  }
}

// ── Context type ─────────────────────────────────────────────
export interface ErrorContext {
  resource?: 'profile' | 'employee' | 'booking' | 'review' |
             'offering' | 'document' | 'auth' | 'kyc' | 'image';
  action?:   'create' | 'update' | 'delete' | 'upload' | 'invite' | 'load';
  fallback?: string;
  bad?:      string;  // custom 400 message
}