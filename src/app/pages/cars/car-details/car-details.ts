import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CarsApiService } from '../../../core/services/cars-api';
import { ImgFallbackDirective } from '../../../core/directives/img-fallback';

@Component({
  selector: 'app-car-details',
  standalone: true,
  imports: [CommonModule, RouterModule, ImgFallbackDirective],
  templateUrl: './car-details.html',
})
export class CarDetails implements OnInit {
  car: any;
  carId!: number;

  constructor(
    private route: ActivatedRoute,
    private carsApi: CarsApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carId = Number(this.route.snapshot.paramMap.get('id'));
    void this.loadCar();
  }

  private async loadCar(): Promise<void> {
    try {
      this.car = await this.carsApi.getCarById(this.carId);
    } catch {
      this.car = null;
    } finally {
      this.refreshView();
    }
  }

  private refreshView(): void {
    try {
      this.cdr.detectChanges();
    } catch {}
  }
}
