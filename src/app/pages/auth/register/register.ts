import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';
import { FlashMessageService } from '../../../core/services/flash-message';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register {
  name = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  acceptTerms = false;

  errorMessage = '';
  successMessage = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private flash: FlashMessageService
  ) {}

  private messageTimer: ReturnType<typeof setTimeout> | null = null;

  async register() {
    this.errorMessage = '';
    this.successMessage = '';

    const name = this.name.trim();
    const email = this.email.toLowerCase().trim();
    const phone = this.phone.trim();
    const password = this.password;

    if (!name || !email || !phone || !password) {
      this.setError('Please fill all required fields.');
      return;
    }

    if (!this.validateEmail(email)) {
      this.setError('Invalid email format.');
      return;
    }

    if (!this.validatePhone(phone)) {
      this.setError('Phone number must be 10 digits.');
      return;
    }

    if (!this.validatePassword(password)) {
      this.setError(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
      );
      return;
    }

    if (password !== this.confirmPassword) {
      this.setError('Passwords do not match.');
      return;
    }

    if (!this.acceptTerms) {
      this.setError('You must accept terms & conditions.');
      return;
    }

    const result = await this.auth.register({
      name,
      email,
      phone,
      password,
    });

    if (!result.success) {
      this.setError(result.message);
      return;
    }

    this.setSuccess(`${result.message} Redirecting...`);

    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 1200);
  }

  validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  validatePhone(phone: string): boolean {
    return /^[0-9]{10}$/.test(phone);
  }

  validatePassword(password: string): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
  }

  private setError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    this.flash.showError(message);
    this.scheduleMessageClear();
  }

  private setSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    this.flash.showSuccess(message);
    this.scheduleMessageClear();
  }

  private scheduleMessageClear(): void {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }

    this.messageTimer = setTimeout(() => {
      this.errorMessage = '';
      this.successMessage = '';
      this.messageTimer = null;
    }, 2000);
  }
}
