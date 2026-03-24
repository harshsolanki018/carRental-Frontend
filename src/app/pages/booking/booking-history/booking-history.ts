import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';
import { FlashMessageService } from '../../../core/services/flash-message';
import { BookingsApiService } from '../../../core/services/bookings-api';
import { ImgFallbackDirective } from '../../../core/directives/img-fallback';

@Component({
  selector: 'app-booking-history',
  standalone: true,
  imports: [CommonModule, ImgFallbackDirective],
  templateUrl: './booking-history.html',
})
export class BookingHistory implements OnInit {
  bookings: any[] = [];
  today = new Date().toISOString().split('T')[0];

  constructor(
    private auth: AuthService,
    private flash: FlashMessageService,
    private bookingsApi: BookingsApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    void this.refreshUserBookings();
  }

  async cancelBooking(booking: any) {
    try {
      const response = await this.bookingsApi.cancelMyBooking(Number(booking.id));
      booking.status = response.data?.status || 'Rejected';
      this.flash.showSuccess(response.message || 'Booking cancelled.');
    } catch (error) {
      this.flash.showError(this.getErrorMessage(error, 'Failed to cancel booking.'));
    } finally {
      this.refreshView();
    }
  }

  async rateBooking(booking: any, rating: number) {
    try {
      const response = await this.bookingsApi.rateMyBooking(Number(booking.id), rating);
      booking.rating = response.data?.rating || rating;
      this.flash.showSuccess(response.message || 'Thanks for your rating.');
    } catch (error) {
      this.flash.showError(this.getErrorMessage(error, 'Failed to submit rating.'));
    } finally {
      this.refreshView();
    }
  }

  async refreshUserBookings() {
    const session = this.auth.getSession();
    if (!session) {
      this.bookings = [];
      this.refreshView();
      return;
    }

    try {
      const bookings = await this.bookingsApi.getMyBookings();
      this.bookings = bookings;
    } catch (error) {
      this.bookings = [];
      this.flash.showError(this.getErrorMessage(error, 'Failed to load bookings.'));
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
