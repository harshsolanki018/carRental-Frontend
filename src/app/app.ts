import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Navbar } from './shared/components/navbar/navbar';
import { Footer } from './shared/components/footer/footer';
import { CommonModule } from '@angular/common';
import { FlashMessage } from './shared/components/flash-message/flash-message';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer, CommonModule, FlashMessage],
  templateUrl: './app.html',
})

export class AppComponent {
  isAdminRoute = false;

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      this.isAdminRoute = this.router.url.startsWith('/admin');
    });
  }
}
