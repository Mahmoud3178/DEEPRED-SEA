import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CenterService } from '../../../core/services/center.service';
import { environment } from '../../../../environments/environment';

interface Review {
  id: string;
  diver: string;
  avatar: string;
  rating: number;
  trip: string;
  date: string;
  text: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  starsList: boolean[];
  reply: string | null;       // الـ reply الموجود من الـ API
  replyDate: string | null;
}

interface ApprovedCommentResponse {
  commentId: string;
  authorId: string;
  targetId: string;
  text: string | null;
  createdAt: string;
}

@Component({
  selector: 'app-center-reviews',
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.css']
})
export class CenterReviewsComponent implements OnInit {

  reviews: Review[] = [];
  loading  = false;
  error    = '';

  // pagination
  page      = 1;
  pageSize  = 10;
  totalCount = 0;

  // filter
  filters: ('All' | 'Pending' | 'Approved' | 'Rejected')[] =
    ['All', 'Pending', 'Approved', 'Rejected'];
  activeFilter: 'All' | 'Pending' | 'Approved' | 'Rejected' = 'All';

  // reply state
  replyingId:    string | null = null;
  replyText      = '';
  replyLoading   = false;
  replyError     = '';

  private readonly base = environment.centerApiUrl;

  constructor(
    private centerService: CenterService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  // ── Load Reviews ──────────────────────────────────────
  loadReviews(): void {
    this.loading = true;
    this.error   = '';
    const status = this.activeFilter === 'All' ? undefined : this.activeFilter;

    this.centerService.getReviews(this.page, this.pageSize, status).subscribe({
      next: (data) => {
        this.loading    = false;
        this.totalCount = data.totalCount ?? 0;
        this.reviews    = (data.items ?? []).map((r: any) => ({
          id:        r.id,
          diver:     r.diverName    ?? 'Anonymous',
          avatar:    (r.diverName   ?? 'A').charAt(0).toUpperCase(),
          rating:    r.overallScore ?? 0,
          trip:      r.targetName   ?? '',
          date:      new Date(r.createdAt).toLocaleDateString('en', {
                       year: 'numeric', month: 'short', day: 'numeric'
                     }),
          text:      r.comment      ?? '',
          status:    r.status,
          starsList: Array.from({ length: 5 }, (_, i) => i < Math.round(r.overallScore)),
          reply:     null,
          replyDate: null,
        }));

        // بعد ما نجيب الـ reviews، نجيب الـ replies لكل واحد
        this.loadRepliesForReviews();
      },
      error: () => {
        this.loading = false;
        this.error   = 'Failed to load reviews. Please try again.';
      }
    });
  }

  // ── Load Approved Comments (replies) لكل review ──────
  private loadRepliesForReviews(): void {
    this.reviews.forEach(review => {
      this.http.get<ApprovedCommentResponse[]>(
        `${this.base}/comments/approved`,
        { params: { targetId: review.id } }
      ).subscribe({
        next: (comments) => {
          if (comments?.length) {
            // أول comment = رد المركز
            review.reply     = comments[0].text ?? '';
            review.replyDate = new Date(comments[0].createdAt)
                                 .toLocaleDateString('en', {
                                   year: 'numeric', month: 'short', day: 'numeric'
                                 });
          }
        },
        error: () => { /* silent — مش هنكسر الـ UI لو فشلت */ }
      });
    });
  }

  // ── Filter ────────────────────────────────────────────
  setFilter(filter: 'All' | 'Pending' | 'Approved' | 'Rejected'): void {
    this.activeFilter = filter;
    this.page         = 1;
    this.loadReviews();
  }

  // ── Approve / Reject ──────────────────────────────────
  updateStatus(reviewId: string, newStatus: 'Approved' | 'Rejected'): void {
    this.centerService.updateReviewStatus(reviewId, newStatus).subscribe({
      next: () => {
        const r = this.reviews.find(r => r.id === reviewId);
        if (r) r.status = newStatus;
      },
      error: () => {
        this.error = 'Failed to update review status.';
      }
    });
  }

  // ── Reply ─────────────────────────────────────────────
  openReply(id: string): void {
    this.replyingId  = id;
    this.replyText   = '';
    this.replyError  = '';
  }

  cancelReply(): void {
    this.replyingId = null;
    this.replyText  = '';
    this.replyError = '';
  }

  submitReply(): void {
    if (!this.replyingId || !this.replyText.trim()) return;

    this.replyLoading = true;
    this.replyError   = '';

    this.http.post<string>(
      `${this.base}/comments`,
      { targetId: this.replyingId, text: this.replyText.trim() }
    ).subscribe({
      next: () => {
        this.replyLoading = false;

        // نحدّث الـ review في الـ local state
        const review = this.reviews.find(r => r.id === this.replyingId);
        if (review) {
          review.reply     = this.replyText.trim();
          review.replyDate = new Date().toLocaleDateString('en', {
            year: 'numeric', month: 'short', day: 'numeric'
          });
        }

        this.replyingId = null;
        this.replyText  = '';
      },
      error: () => {
        this.replyLoading = false;
        this.replyError   = 'Failed to send reply. Please try again.';
      }
    });
  }

  // ── Pagination ────────────────────────────────────────
  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  nextPage(): void {
    if (this.page < this.totalPages) { this.page++; this.loadReviews(); }
  }

  prevPage(): void {
    if (this.page > 1) { this.page--; this.loadReviews(); }
  }

  // ── Stats ─────────────────────────────────────────────
  get avgRating(): string {
    if (!this.reviews.length) return '0.0';
    return (this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length).toFixed(1);
  }

  get goodReviewsCount(): number {
    return this.reviews.filter(r => r.rating >= 4).length;
  }
}