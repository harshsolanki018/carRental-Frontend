import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { FlashMessageService } from '../../../core/services/flash-message';
import { AdminApiService } from '../../../core/services/admin-api';
import { filter, Subscription } from 'rxjs';

interface TopUser {
  email: string;
  count: number;
}

interface TopCar {
  label: string;
  count: number;
}

type DateRangeKey = 'today' | '7d' | '30d';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.html',
})
export class Stats implements OnInit, OnDestroy {
  private navSub: Subscription | null = null;
  lastUpdated = '';
  selectedRange: DateRangeKey = '30d';
  rangeStartDisplay = '';
  rangeEndDisplay = '';
  totalBookingsAll = 0;
  revenueDisplay = 'Rs. 0';

  readonly rangeOptions: Array<{ key: DateRangeKey; label: string }> = [
    { key: 'today', label: 'Today' },
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
  ];

  overview = {
    totalCars: 0,
    availableCars: 0,
    bookedCars: 0,
    maintenanceCars: 0,
    totalBookings: 0,
    totalRevenue: 0,
    overallRating: 0,
    availabilityRate: 0,
    utilizationRate: 0,
  };

  userStats = {
    totalUsers: 0,
    activeUsers: 0,
    activeUserRate: 0,
    avgBookingsPerUser: 0,
  };

  bookingStats = {
    confirmed: 0,
    active: 0,
    awaitingReturn: 0,
    completed: 0,
    rejected: 0,
    paid: 0,
    confirmationRate: 0,
    activeRate: 0,
    awaitingReturnRate: 0,
    completionRate: 0,
    paidRate: 0,
    rejectionRate: 0,
  };

  topUsers: TopUser[] = [];
  topCars: TopCar[] = [];

  constructor(
    private adminApi: AdminApiService,
    private flash: FlashMessageService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    void this.loadStats();

    this.navSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const nav = event as NavigationEnd;
        if (nav.urlAfterRedirects.includes('/admin/stats')) {
          void this.loadStats();
        }
      });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
    this.navSub = null;
  }

  setRange(range: DateRangeKey): void {
    this.selectedRange = range;
    void this.loadStats();
  }

  async loadStats() {
    try {
      const payload = await this.adminApi.getStats(this.selectedRange);
      this.selectedRange = payload.selectedRange || this.selectedRange;
      this.rangeStartDisplay = payload.rangeStartDisplay || '';
      this.rangeEndDisplay = payload.rangeEndDisplay || '';
      this.totalBookingsAll = payload.totalBookingsAll || 0;
      this.lastUpdated = payload.lastUpdated || '';
      this.revenueDisplay = payload.revenueDisplay || 'Rs. 0';
      this.overview = payload.overview || this.overview;
      this.userStats = payload.userStats || this.userStats;
      this.bookingStats = payload.bookingStats || this.bookingStats;
      this.topUsers = payload.topUsers || [];
      this.topCars = payload.topCars || [];
    } catch (error) {
      this.flash.showError(this.getErrorMessage(error, 'Failed to load statistics.'));
    } finally {
      this.refreshView();
    }
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }
    return fallback;
  }

  private refreshView(): void {
    try {
      this.cdr.detectChanges();
    } catch {}
  }
}
