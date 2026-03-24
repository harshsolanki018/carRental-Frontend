import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FlashMessageService } from '../../../core/services/flash-message';
import { AdminApiService } from '../../../core/services/admin-api';
import { ImgFallbackDirective } from '../../../core/directives/img-fallback';
import {
  faUser,
  faCar,
  faImage,
  faMapPin,
  faGear,
  faSackDollar,
  faMessage,
} from '@fortawesome/free-solid-svg-icons';

interface AdminCar {
  id: number;
  ownerName: string;
  ownerContact: string;
  name: string;
  carNumber: string;
  image?: string;
  imagePublicId?: string;
  location: string;
  fuelType: 'Petrol' | 'Diesel' | 'Electric';
  transmission: 'Manual' | 'Automatic';
  seats: number;
  pricePerDay: number;
  description: string;
  status: 'Available' | 'Booked' | 'Maintenance';
}

@Component({
  selector: 'app-cars',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, ImgFallbackDirective],
  templateUrl: './cars.html',
})
export class Cars implements OnInit {
  faUser = faUser;
  faCar = faCar;
  faImage = faImage;
  faMapPin = faMapPin;
  faGear = faGear;
  faSackDollar = faSackDollar;
  faMessage = faMessage;
  searchText = '';

  cars: AdminCar[] = [];

  showAddModal = false;
  isEditMode = false;
  selectedCarId: number | null = null;
  isUploadingImage = false;
  pendingImageFile: File | null = null;
  pendingImagePreview: string | null = null;

  newCar: AdminCar = this.getEmptyCar();

  constructor(
    private flash: FlashMessageService,
    private adminApi: AdminApiService,
    private cdr: ChangeDetectorRef
  ) {}

  get filteredCars() {
    if (!this.searchText.trim()) {
      return this.cars;
    }

    const search = this.searchText.toLowerCase();
    return this.cars.filter((car) => {
      const matchesId = car.id.toString().includes(search);
      const matchesNumber = car.carNumber?.toLowerCase().includes(search);
      const matchesName = car.name?.toLowerCase().includes(search);
      return matchesId || matchesNumber || matchesName;
    });
  }

  ngOnInit(): void {
    void this.loadCars();
  }

  async loadCars() {
    try {
      this.cars = await this.adminApi.listCars();
    } catch (error) {
      this.flash.showError(this.getErrorMessage(error, 'Failed to load cars.'));
    } finally {
      this.refreshView();
    }
  }

  openAddModal() {
    this.isEditMode = false;
    this.newCar = this.getEmptyCar();
    this.resetPendingImage();
    this.showAddModal = true;
  }

  editCarById(carId: number) {
    const car = this.cars.find((c) => c.id === carId);
    if (!car) {
      return;
    }

    this.isEditMode = true;
    this.selectedCarId = carId;
    this.newCar = { ...car };
    this.resetPendingImage();
    this.showAddModal = true;
  }

  async saveCar(form: any) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.flash.showError('Please fill all required fields correctly.');
      return;
    }

    const uploadSucceeded = await this.uploadPendingImage();
    if (!uploadSucceeded) {
      return;
    }

    try {
      if (this.isEditMode && this.selectedCarId !== null) {
        const response = await this.adminApi.updateCar(this.selectedCarId, this.newCar);
        this.flash.showSuccess(response.message || 'Car updated successfully.');
      } else {
        const response = await this.adminApi.createCar(this.newCar);
        this.flash.showSuccess(response.message || 'Car added successfully.');
      }

      this.closeModal();
      await this.loadCars();
    } catch (error) {
      this.flash.showError(this.getErrorMessage(error, 'Failed to save car.'));
    } finally {
      this.refreshView();
    }
  }

  async setMaintenance(car: AdminCar) {
    try {
      const response = await this.adminApi.toggleCarMaintenance(car.id);
      car.status = response.data?.status || car.status;
      this.flash.showSuccess(response.message || 'Car status updated.');
    } catch (error) {
      this.flash.showError(this.getErrorMessage(error, 'Failed to update car status.'));
    } finally {
      this.refreshView();
    }
  }

  async safeDelete(car: AdminCar) {
    const confirmed = confirm('Are you sure you want to delete this car?');
    if (!confirmed) {
      return;
    }

    try {
      const response = await this.adminApi.deleteCar(car.id);
      this.cars = this.cars.filter((c) => c.id !== car.id);
      this.flash.showSuccess(response.message || 'Car deleted successfully.');
    } catch (error) {
      this.flash.showError(this.getErrorMessage(error, 'Failed to delete car.'));
    } finally {
      this.refreshView();
    }
  }

  async onImageSelect(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    this.pendingImageFile = file;
    this.pendingImagePreview = await this.readFilePreview(file);
    this.refreshView();
  }

  closeModal() {
    this.showAddModal = false;
    this.selectedCarId = null;
    this.resetPendingImage();
  }

  getEmptyCar(): AdminCar {
    return {
      id: 0,
      ownerName: '',
      ownerContact: '',
      name: '',
      carNumber: '',
      image: '',
      imagePublicId: '',
      location: '',
      fuelType: 'Petrol',
      transmission: 'Manual',
      seats: 4,
      pricePerDay: 0,
      description: '',
      status: 'Available',
    };
  }

  private async uploadPendingImage(): Promise<boolean> {
    if (!this.pendingImageFile) {
      return true;
    }

    this.isUploadingImage = true;
    try {
      const uploaded = await this.adminApi.uploadCarImage(this.pendingImageFile);
      this.newCar.image = uploaded.url;
      this.newCar.imagePublicId = uploaded.publicId;
      this.resetPendingImage();
      return true;
    } catch (error) {
      this.flash.showError(this.getErrorMessage(error, 'Failed to upload image.'));
      return false;
    } finally {
      this.isUploadingImage = false;
      this.refreshView();
    }
  }

  private async readFilePreview(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  private resetPendingImage(): void {
    this.pendingImageFile = null;
    this.pendingImagePreview = null;
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
