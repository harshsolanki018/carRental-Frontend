import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlashMessageService } from '../../../core/services/flash-message';
import { AdminApiService } from '../../../core/services/admin-api';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bookings.html',
})
export class Bookings implements OnInit {
  bookings: any[] = [];
  searchText = '';
  selectedStatus = 'all';

  constructor(
    private flash: FlashMessageService,
    private adminApi: AdminApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    void this.loadBookings();
  }

  async loadBookings() {
    try {
      const rawBookings = await this.adminApi.listBookings();
      this.bookings = rawBookings.map((booking: any) => this.normalizeBooking(booking));
    } catch (error) {
      this.flash.showError(this.getErrorMessage(error, 'Failed to load bookings.'));
    } finally {
      this.refreshView();
    }
  }

  normalizeBooking(booking: any) {
    return {
      ...booking,
      bookingId: booking.bookingId || `BK-${booking.id || Date.now()}`,
      carNumber: booking.carNumber || 'N/A',
      fullName: booking.fullName || 'N/A',
      phone: booking.phone || 'N/A',
      userEmail: booking.userEmail || 'N/A',
    };
  }

  async markBookingActive(booking: any) {
    try {
      const response = await this.adminApi.markBookingActive(Number(booking.id));
      booking.status = response.data?.status || 'Active';
      this.flash.showSuccess(response.message || 'Booking marked as active.');
    } catch (error) {
      this.flash.showError(this.getErrorMessage(error, 'Failed to mark booking active.'));
    } finally {
      this.refreshView();
    }
  }

  async rejectBooking(booking: any) {
    try {
      const response = await this.adminApi.rejectBooking(Number(booking.id));
      booking.status = response.data?.status || 'Rejected';
      this.flash.showSuccess(response.message || 'Booking rejected.');
    } catch (error) {
      this.flash.showError(this.getErrorMessage(error, 'Failed to reject booking.'));
    } finally {
      this.refreshView();
    }
  }

  async completeBooking(booking: any) {
    try {
      const response = await this.adminApi.completeBooking(Number(booking.id));
      booking.status = response.data?.status || 'Completed';
      this.flash.showSuccess(response.message || 'Booking marked as completed.');
    } catch (error) {
      this.flash.showError(this.getErrorMessage(error, 'Failed to complete booking.'));
    } finally {
      this.refreshView();
    }
  }

  async markAwaitingReturn(booking: any) {
    try {
      const response = await this.adminApi.markBookingAwaitingReturn(Number(booking.id));
      booking.status = response.data?.status || 'Awaiting Return';
      this.flash.showSuccess(response.message || 'Booking marked as awaiting return.');
    } catch (error) {
      this.flash.showError(this.getErrorMessage(error, 'Failed to update booking status.'));
    } finally {
      this.refreshView();
    }
  }

  get filteredBookings() {
    return this.bookings.filter((b) => {
      const search = this.searchText.toLowerCase();

      const matchesSearch =
        b.bookingId?.toString().toLowerCase().includes(search) ||
        b.fullName?.toString().toLowerCase().includes(search) ||
        b.carName?.toString().toLowerCase().includes(search) ||
        b.carNumber?.toString().toLowerCase().includes(search);

      const matchesStatus = this.selectedStatus === 'all' || b.status === this.selectedStatus;
      return matchesSearch && matchesStatus;
    });
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
