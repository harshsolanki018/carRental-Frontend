import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { FlashMessageService } from '../../core/services/flash-message';
import { CarsApiService } from '../../core/services/cars-api';
import { BookingsApiService } from '../../core/services/bookings-api';
import { ImgFallbackDirective } from '../../core/directives/img-fallback';

declare const Razorpay: any;

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule, ImgFallbackDirective],
  templateUrl: './booking.html',
})
export class Booking implements OnInit {
  carId!: number;
  car: any;
  bookedRanges: Array<{ start: string; end: string }> = [];

  today = new Date().toISOString().split('T')[0];

  fullName = '';
  phone = '';
  alternatePhone = '';
  address = '';
  aadhaar = '';

  pickupDate = '';
  returnDate = '';
  totalDays = 0;
  totalPrice = 0;
  isPaying = false;

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private flash: FlashMessageService,
    private carsApi: CarsApiService,
    private bookingsApi: BookingsApiService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carId = Number(this.route.snapshot.paramMap.get('id'));
    void this.loadInitialData();
  }

  calculatePrice() {
    if (!this.pickupDate || !this.returnDate || !this.car) {
      this.totalDays = 0;
      this.totalPrice = 0;
      return;
    }

    const start = new Date(this.pickupDate);
    const end = new Date(this.returnDate);

    const diff = end.getTime() - start.getTime();
    this.totalDays = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (this.totalDays <= 0) {
      this.showError('Return date must be after pickup date.');
      this.totalPrice = 0;
      return;
    }

    if (this.hasDateConflict(start, end)) {
      this.showError('Selected dates are unavailable.');
      this.totalDays = 0;
      this.totalPrice = 0;
      return;
    }

    this.totalPrice = this.totalDays * this.car.pricePerDay;
  }

  hasDateConflict(newStart: Date, newEnd: Date): boolean {
    return this.bookedRanges.some((range) => {
      const existingStart = new Date(range.start);
      const existingEnd = new Date(range.end);
      return newStart <= existingEnd && newEnd >= existingStart;
    });
  }

  isAadhaarValid(): boolean {
    return /^\d{12}$/.test(this.aadhaar);
  }

  async payAndBook() {
    if (!this.car) {
      return;
    }

    if (!this.pickupDate || !this.returnDate) {
      this.showError('Please select pickup and return dates.');
      return;
    }

    if (!this.fullName.trim() || !this.phone.trim()) {
      this.showError('Please enter full name and phone number.');
      return;
    }

    if (!/^[0-9]{10}$/.test(this.phone.trim())) {
      this.showError('Phone number must be 10 digits.');
      return;
    }

    if (
      this.alternatePhone.trim() &&
      !/^[0-9]{10}$/.test(this.alternatePhone.trim())
    ) {
      this.showError('Alternate phone number must be 10 digits.');
      return;
    }

    if (!this.isAadhaarValid()) {
      this.showError('Aadhaar number must be exactly 12 digits.');
      return;
    }

    const start = new Date(this.pickupDate);
    const end = new Date(this.returnDate);
    const diff = end.getTime() - start.getTime();
    this.totalDays = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (this.totalDays <= 0) {
      this.showError('Return date must be after pickup date.');
      return;
    }

    if (this.hasDateConflict(start, end)) {
      this.showError('Selected dates are unavailable.');
      return;
    }

    const session = this.auth.getSession();
    if (!session) {
      this.showError('Please login to continue.');
      return;
    }

    if (typeof Razorpay === 'undefined') {
      this.showError('Payment system is unavailable. Please try again shortly.');
      return;
    }

    const payload = {
      carId: this.car.id,
      pickupDate: this.pickupDate,
      returnDate: this.returnDate,
      fullName: this.fullName.trim(),
      phone: this.phone.trim(),
      alternatePhone: this.alternatePhone.trim(),
      address: this.address.trim(),
      aadhaar: this.aadhaar.trim(),
    };

    this.isPaying = true;
    this.refreshView();

    try {
      const orderResponse = await this.bookingsApi.createPaymentOrder(payload);
      const order = orderResponse.data;

      if (!order?.orderId) {
        throw new Error('Failed to create payment order.');
      }

      const session = this.auth.getSession();
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Car2Go Rentals',
        description: `Booking for ${this.car?.name || 'Car Rental'}`,
        order_id: order.orderId,
        prefill: {
          name: payload.fullName,
          email: session?.email || '',
          contact: payload.phone,
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyResponse = await this.bookingsApi.verifyPayment({
              ...payload,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            this.flash.showSuccess(verifyResponse.message || 'Booking confirmed.');
            this.resetForm();
            await this.loadBookedRanges();
            this.router.navigateByUrl('/cars');
          } catch (error) {
            this.showError(this.getErrorMessage(error, 'Payment verification failed.'));
          } finally {
            this.isPaying = false;
            this.refreshView();
          }
        },
      };

      const razorpay = new Razorpay(options);
      razorpay.on('payment.failed', () => {
        this.isPaying = false;
        this.showError('Payment failed. Please try again.');
        this.refreshView();
      });

      razorpay.open();
    } catch (error) {
      this.isPaying = false;
      this.showError(this.getErrorMessage(error, 'Failed to start payment.'));
      this.refreshView();
    }
  }

  getBookedRanges() {
    return this.bookedRanges;
  }

  private async loadInitialData(): Promise<void> {
    await Promise.all([this.loadCar(), this.loadBookedRanges()]);
    this.refreshView();
  }

  private async loadCar(): Promise<void> {
    try {
      this.car = await this.carsApi.getCarById(this.carId);
    } catch {
      this.car = null;
    }
  }

  private async loadBookedRanges(): Promise<void> {
    try {
      this.bookedRanges = await this.bookingsApi.getBookedRangesForCar(this.carId);
    } catch {
      this.bookedRanges = [];
    }
  }

  private resetForm(): void {
    this.pickupDate = '';
    this.returnDate = '';
    this.totalDays = 0;
    this.totalPrice = 0;
    this.fullName = '';
    this.phone = '';
    this.alternatePhone = '';
    this.address = '';
    this.aadhaar = '';
  }

  private showError(message: string): void {
    this.flash.showError(message);
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
