import { Injectable } from '@angular/core';
import { ApiClientService } from './api-client';

@Injectable({
  providedIn: 'root',
})
export class BookingsApiService {
  constructor(private api: ApiClientService) {}

  async getBookedRangesForCar(carId: number) {
    const response = await this.api.get<Array<{ start: string; end: string }>>(
      `/bookings/car/${carId}/ranges`
    );
    return response.data || [];
  }

  async createPaymentOrder(payload: {
    carId: number;
    pickupDate: string;
    returnDate: string;
    fullName: string;
    phone: string;
    alternatePhone: string;
    address: string;
    aadhaar: string;
  }) {
    return this.api.post<any>('/bookings/create-order', payload);
  }

  async verifyPayment(payload: {
    carId: number;
    pickupDate: string;
    returnDate: string;
    fullName: string;
    phone: string;
    alternatePhone: string;
    address: string;
    aadhaar: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    return this.api.post<any>('/bookings/verify-payment', payload);
  }

  async getMyBookings() {
    const response = await this.api.get<any[]>('/bookings/me');
    return response.data || [];
  }

  async cancelMyBooking(bookingId: number) {
    return this.api.patch<any>(`/bookings/${bookingId}/cancel`, {});
  }

  async rateMyBooking(bookingId: number, rating: number) {
    return this.api.patch<any>(`/bookings/${bookingId}/rating`, { rating });
  }
}
