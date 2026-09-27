import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast } from './components/toast/toast';
import {filter} from 'rxjs/operators';
import {NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import { AuthService } from './services/auth';
import { CartService } from './services/cart';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    Toast
  ],
  styleUrl: './app.css',
  templateUrl: './app.html'
})
export class App {

  profileImageError = signal(false);
  isAdminRoute = signal(false);
  mobileMenuOpen = signal(false);
  currentYear = new Date().getFullYear();

  constructor(
  public authService: AuthService,
  public cartService: CartService,
  private router: Router
) {

 this.cartService.setUser(
  this.authService.currentUser()?.id ?? null
);

  this.isAdminRoute.set(
    this.router.url.startsWith('/admin')
  );

  this.router.events
    .pipe(
      filter(
        event =>
          event instanceof NavigationEnd
      )
    )
    .subscribe(() => {

      this.isAdminRoute.set(
        this.router.url.startsWith('/admin')
      );

    });
}


toggleMobileMenu(): void {
  this.mobileMenuOpen.update(
    open => !open
  );
}

closeMobileMenu(): void {
  this.mobileMenuOpen.set(false);
}
logout(): void {

  this.authService.logout();

  this.profileImageError.set(false);

  this.router.navigate(['/']);

}

}

//ng serve --proxy-config proxy.conf.json