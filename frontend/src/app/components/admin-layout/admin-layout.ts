import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-admin-layout',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],

  templateUrl: './admin-layout.html',

  styleUrl: './admin-layout.css'
})
export class AdminLayout {

  constructor(
    public authService: AuthService
  ) {}

  logout(): void {

    this.authService.logout();

    window.location.href = '/';
  }

}