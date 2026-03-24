import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AppDataStore } from './app-data-store';
import { ApiClientService } from './api-client';

export interface SessionUser {
  userId: string;
  name: string;
  email: string;
  role: string;
  loginTime: string;
}

interface AuthResult {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private sessionLoaded = false;
  private sessionLoadPromise: Promise<void> | null = null;

  constructor(
    private router: Router,
    private dataStore: AppDataStore,
    private api: ApiClientService
  ) {}

  getSession(): SessionUser | null {
    return this.dataStore.getSession<SessionUser>();
  }

  isLoggedIn(): boolean {
    return !!this.getSession();
  }

  getUser() {
    return this.getSession();
  }

  getRole(): string | null {
    return this.getSession()?.role || null;
  }

  getCurrentUserEmail(): string | null {
    return this.getSession()?.email || null;
  }

  getCurrentUserId(): string | null {
    return this.getSession()?.userId || null;
  }

  async ensureSessionLoaded(force = false): Promise<void> {
    if (this.sessionLoaded && !force) {
      return;
    }

    if (this.sessionLoadPromise && !force) {
      return this.sessionLoadPromise;
    }

    this.sessionLoadPromise = this.syncSessionFromBackend()
      .catch(() => {})
      .finally(() => {
        this.sessionLoaded = true;
        this.sessionLoadPromise = null;
      });

    return this.sessionLoadPromise;
  }

  async logout(redirectTo: string = '/login'): Promise<void> {
    try {
      await this.api.post<null>('/auth/logout', {});
    } catch {}

    this.dataStore.clearSession();
    this.dataStore.clearAuthToken();
    this.dataStore.clearLegacySession();
    this.sessionLoaded = true;
    await this.router.navigate([redirectTo]);
  }

  async logoutIfAuthenticated(redirectTo: string = '/login'): Promise<boolean> {
    if (!this.isLoggedIn()) {
      await this.router.navigate(['/login']);
      return false;
    }

    await this.logout(redirectTo);
    return true;
  }

  async confirmAndLogout(redirectTo: string = '/login'): Promise<boolean> {
    return this.logoutIfAuthenticated(redirectTo);
  }

  async register(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<AuthResult> {
    try {
      const response = await this.api.post<{ user: any }>(
        '/auth/register',
        {
          name: userData.name.trim(),
          email: userData.email.toLowerCase().trim(),
          phone: userData.phone.trim(),
          password: userData.password,
        }
      );

      return {
        success: true,
        message: response.message || 'Registration successful.',
      };
    } catch (error) {
      return {
        success: false,
        message: this.getErrorMessage(error, 'Registration failed.'),
      };
    }
  }

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const response = await this.api.post<{
        session: SessionUser;
      }>('/auth/login', {
        email: email.toLowerCase().trim(),
        password,
      });

      const session = response.data?.session;

      if (!session) {
        return {
          success: false,
          message: 'Invalid login response.',
        };
      }

      this.dataStore.setSession(session);
      this.syncLegacySessionKeys(session);
      this.sessionLoaded = true;

      return {
        success: true,
        message: response.message || 'Login successful.',
      };
    } catch (error) {
      return {
        success: false,
        message: this.getErrorMessage(error, 'Login failed.'),
      };
    }
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }
    return fallback;
  }

  private syncLegacySessionKeys(session: SessionUser | null): void {
    if (!session) {
      this.dataStore.clearLegacySession();
      return;
    }

    this.dataStore.setLegacySession(session.email, session.role);
  }

  private async syncSessionFromBackend(): Promise<void> {
    try {
      const response = await this.api.get<{ session: SessionUser }>('/auth/me');
      const session = response.data?.session || null;
      if (session) {
        this.dataStore.setSession(session);
        return;
      }
    } catch {}

    this.dataStore.clearSession();
    this.dataStore.clearAuthToken();
    this.dataStore.clearLegacySession();
  }
}
