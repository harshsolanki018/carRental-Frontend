import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlashMessageService } from '../../../core/services/flash-message';
import { AdminApiService } from '../../../core/services/admin-api';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
})
export class Users implements OnInit {
  users: any[] = [];
  bookings: any[] = [];
  searchText = '';

  constructor(
    private flash: FlashMessageService,
    private adminApi: AdminApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    void this.loadData();
  }

  async loadData() {
    try {
      const [users, bookings] = await Promise.all([
        this.adminApi.listUsers(),
        this.adminApi.listBookings(),
      ]);
      this.users = users;
      this.bookings = bookings;
    } catch (error) {
      this.flash.showError(this.getErrorMessage(error, 'Failed to load users.'));
    } finally {
      this.refreshView();
    }
  }

  getUserStats(userEmail: string) {
    const user = this.users.find((u) => u.email === userEmail);
    if (user?.stats) {
      return user.stats;
    }

    const userBookings = this.bookings.filter((b) => b.userEmail === userEmail);
    const totalSpent = userBookings
      .filter((b) => b.status === 'Completed')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    return {
      totalBookings: userBookings.length,
      totalSpent,
    };
  }

  async toggleBlock(user: any) {
    try {
      const response = await this.adminApi.toggleUserBlock(user.id);
      user.blocked = !!response.data?.blocked;
      this.flash.showSuccess(
        response.message ||
          (user.blocked ? 'User blocked successfully.' : 'User unblocked successfully.')
      );
    } catch (error) {
      this.flash.showError(this.getErrorMessage(error, 'Failed to update user status.'));
    } finally {
      this.refreshView();
    }
  }

  async deleteUser(userEmail: string) {
    const user = this.users.find((u) => u.email === userEmail);
    if (!user?.id) {
      this.flash.showError('User not found.');
      return;
    }

    try {
      const response = await this.adminApi.deleteUser(user.id);
      this.users = this.users.filter((u) => u.email !== userEmail);
      this.flash.showSuccess(response.message || 'User deleted successfully.');
    } catch (error) {
      this.flash.showError(this.getErrorMessage(error, 'Failed to delete user.'));
    } finally {
      this.refreshView();
    }
  }

  get filteredUsers() {
    return this.users.filter(
      (user) =>
        user.email.toLowerCase().includes(this.searchText.toLowerCase()) ||
        user.name?.toLowerCase().includes(this.searchText.toLowerCase())
    );
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
