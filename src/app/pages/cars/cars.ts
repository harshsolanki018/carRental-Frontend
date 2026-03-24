import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CarsApiService } from '../../core/services/cars-api';
import { ImgFallbackDirective } from '../../core/directives/img-fallback';

interface Car {
  id: number;
  name: string;
  fuelType: string;
  transmission: string;
  pricePerDay: number;
  location: string;
  image?: string;
  status: string;
  ratingAvg?: number;
  ratingCount?: number;
}

@Component({
  selector: 'app-cars',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, FontAwesomeModule, ImgFallbackDirective],
  templateUrl: './cars.html',
  styleUrls: ['./cars.css'],
})
export class Cars implements OnInit {
  faMagnifyingGlass = faMagnifyingGlass;

  searchText = '';
  selectedFuel = 'all';
  selectedTransmission = 'all';
  selectedLocation = 'all';
  maxPrice = 10000;

  enableFilters = false;
  cars: Car[] = [];

  constructor(
    private carsApi: CarsApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    void this.loadCars();
  }

  async loadCars(): Promise<void> {
    try {
      this.cars = await this.carsApi.listCars();
    } catch {
      this.cars = [];
    } finally {
      this.refreshView();
    }
  }

  getCarRating(carId: number): { avg: number; count: number } {
    const car = this.cars.find((item) => item.id === carId);
    return {
      avg: Number(car?.ratingAvg || 0),
      count: Number(car?.ratingCount || 0),
    };
  }

  get filteredCars(): Car[] {
    const visibleCars = this.cars.filter((car) => car.status !== 'Maintenance');

    if (!this.enableFilters) {
      return visibleCars;
    }

    return visibleCars.filter((car) => {
      const matchesSearch = car.name
        .toLowerCase()
        .includes(this.searchText.toLowerCase());

      const matchesFuel =
        this.selectedFuel === 'all' || car.fuelType === this.selectedFuel;

      const matchesTransmission =
        this.selectedTransmission === 'all' ||
        car.transmission === this.selectedTransmission;

      const matchesLocation =
        this.selectedLocation === 'all' || car.location === this.selectedLocation;

      const matchesPrice = car.pricePerDay <= this.maxPrice;

      return (
        matchesSearch &&
        matchesFuel &&
        matchesTransmission &&
        matchesLocation &&
        matchesPrice
      );
    });
  }

  private refreshView(): void {
    try {
      this.cdr.detectChanges();
    } catch {}
  }
}
