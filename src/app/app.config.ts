import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { API_BASE_URL } from './core/services/app-data-store';
import { AuthService } from './core/services/auth';

function initializeAuthSession(auth: AuthService): () => Promise<void> {
  return () => auth.ensureSessionLoaded();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideRouter(routes),
    { provide: API_BASE_URL, useValue: 'https://carrental-backend-aylh.onrender.com/api' },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuthSession,
      deps: [AuthService],
      multi: true,
    },
  ],
};
