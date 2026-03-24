import { Injectable, InjectionToken } from '@angular/core';

export const STORAGE_KEYS = {
  session: 'session',
  authToken: 'authToken',
  userEmail: 'userEmail',
  role: 'role',
  users: 'users',
  cars: 'cars',
  adminBookings: 'adminBookings',
  contactMessages: 'contactMessages',
  homeFeaturedCarsConfig: 'homeFeaturedCarsConfig',
} as const;

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:5000/api',
});

@Injectable({
  providedIn: 'root',
})
export class AppDataStore {
  readonly keys = STORAGE_KEYS;
  private sessionValue: unknown | null = null;

  getSession<T>(): T | null {
    return (this.sessionValue as T | null) || null;
  }

  setSession(value: unknown): void {
    this.sessionValue = value;
  }

  clearSession(): void {
    this.sessionValue = null;
  }

  getAuthToken(): string | null {
    return null;
  }

  setAuthToken(_token: string): void {
    // Auth token is cookie-based (HttpOnly) and not stored in browser storage.
  }

  clearAuthToken(): void {}

  setLegacySession(_userEmail: string, _role: string): void {
    // Legacy browser keys intentionally disabled.
  }

  clearLegacySession(): void {
    // Legacy browser keys intentionally disabled.
  }

  getUsers<T>(): T[] {
    return [];
  }

  setUsers(_users: unknown[]): void {}

  getCars<T>(): T[] {
    return [];
  }

  setCars(_cars: unknown[]): void {}

  getBookings<T>(): T[] {
    return [];
  }

  setBookings(_bookings: unknown[]): void {}

  getContactMessages<T>(): T[] {
    return [];
  }

  setContactMessages(_messages: unknown[]): void {}

  getHomeFeaturedConfigRaw<T>(): T | null {
    return null;
  }

  setHomeFeaturedConfig(_value: unknown): void {}

  clearHomeFeaturedConfig(): void {}
}
