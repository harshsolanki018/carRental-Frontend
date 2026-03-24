import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin-guard';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/auth/register/register').then((m) => m.Register),
  },
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'cars',
    loadComponent: () =>
      import('./pages/cars/cars').then((m) => m.Cars),
  },
  {
    path: 'cars/:id',
    loadComponent: () =>
      import('./pages/cars/car-details/car-details')
        .then((m) => m.CarDetails),
  },
  {
    path: 'booking/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/booking/booking').then((m) => m.Booking),
  },
  {
    path: 'my-bookings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/booking/booking-history/booking-history')
        .then((m) => m.BookingHistory),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./pages/about/about').then((m) => m.About),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/contact/contact').then((m) => m.Contact),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/layout/layout')
        .then((m) => m.AdminLayout),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/admin/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./pages/admin/bookings/bookings').then((m) => m.Bookings),
      },
      {
        path: 'cars',
        loadComponent: () =>
          import('./pages/admin/cars/cars').then((m) => m.Cars),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/admin/users/users').then((m) => m.Users),
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./pages/admin/messages/messages').then((m) => m.Messages),
      },
      {
        path: 'home-cars',
        loadComponent: () =>
          import('./pages/admin/home-cars/home-cars').then((m) => m.HomeCars),
      },
      {
        path: 'stats',
        loadComponent: () =>
          import('./pages/admin/stats/stats').then((m) => m.Stats),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
