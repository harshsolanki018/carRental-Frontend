import { Injectable } from '@angular/core';
import { ApiClientService } from './api-client';

type DateRangeKey = 'today' | '7d' | '30d';

@Injectable({
  providedIn: 'root',
})
export class AdminApiService {
  constructor(private api: ApiClientService) {}

  async getDashboard() {
    const response = await this.api.get<{
      stats: any[];
      carStats: any[];
      overallRating: number;
    }>('/admin/dashboard');
    return response.data;
  }

  async getStats(range: DateRangeKey) {
    const response = await this.api.get<any>(`/admin/stats?range=${range}`);
    return response.data;
  }

  async listUsers() {
    const response = await this.api.get<any[]>('/admin/users');
    return response.data || [];
  }

  async toggleUserBlock(userId: string) {
    const response = await this.api.patch<any>(
      `/admin/users/${encodeURIComponent(userId)}/toggle-block`,
      {}
    );
    return response;
  }

  async deleteUser(userId: string) {
    const response = await this.api.delete<null>(`/admin/users/${encodeURIComponent(userId)}`);
    return response;
  }

  async listBookings() {
    const response = await this.api.get<any[]>('/admin/bookings');
    return response.data || [];
  }

  async markBookingActive(bookingId: number) {
    const response = await this.api.patch<any>(
      `/admin/bookings/${bookingId}/activate`,
      {}
    );
    return response;
  }

  async rejectBooking(bookingId: number) {
    const response = await this.api.patch<any>(`/admin/bookings/${bookingId}/reject`, {});
    return response;
  }

  async completeBooking(bookingId: number) {
    const response = await this.api.patch<any>(
      `/admin/bookings/${bookingId}/complete`,
      {}
    );
    return response;
  }

  async markBookingAwaitingReturn(bookingId: number) {
    const response = await this.api.patch<any>(
      `/admin/bookings/${bookingId}/awaiting-return`,
      {}
    );
    return response;
  }

  async listMessages() {
    const response = await this.api.get<any[]>('/admin/messages');
    return response.data || [];
  }

  async updateMessageStatus(ticketId: string, status: string) {
    const response = await this.api.patch<any>(
      `/admin/messages/${encodeURIComponent(ticketId)}/status`,
      { status }
    );
    return response;
  }

  async deleteMessage(ticketId: string) {
    const response = await this.api.delete<null>(`/admin/messages/${encodeURIComponent(ticketId)}`);
    return response;
  }

  async getHomeCars() {
    const response = await this.api.get<{
      cars: any[];
      featuredIds: number[];
      updatedAt: string | null;
    }>('/admin/home-cars');
    return response.data;
  }

  async saveHomeCars(carIds: number[]) {
    const response = await this.api.put<any>('/admin/home-cars', { carIds });
    return response;
  }

  async clearHomeCars() {
    const response = await this.api.delete<null>('/admin/home-cars');
    return response;
  }

  async listCars() {
    const response = await this.api.get<any[]>('/cars');
    return response.data || [];
  }

  async createCar(carPayload: unknown) {
    const response = await this.api.post<any>('/admin/cars', carPayload);
    return response;
  }

  async updateCar(carId: number, carPayload: unknown) {
    const response = await this.api.put<any>(`/admin/cars/${carId}`, carPayload);
    return response;
  }

  async toggleCarMaintenance(carId: number) {
    const response = await this.api.patch<any>(`/admin/cars/${carId}/toggle-maintenance`, {});
    return response;
  }

  async deleteCar(carId: number) {
    const response = await this.api.delete<null>(`/admin/cars/${carId}`);
    return response;
  }

  async uploadCarImage(file: File): Promise<{ url: string; publicId: string }> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await this.api.post<{ url: string; publicId: string }>(
      '/admin/uploads/car-image',
      formData
    );
    const url = response.data?.url;
    const publicId = response.data?.publicId;
    if (!url || !publicId) {
      throw new Error('Image upload failed.');
    }
    return { url, publicId };
  }
}
