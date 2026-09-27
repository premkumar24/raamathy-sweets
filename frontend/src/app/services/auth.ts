import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CartService } from './cart';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  phone: string;
  address: string;
  role: string;
}

export interface GoogleLoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface LocalAuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LocalAuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = `${environment.apiUrl}/api/auth`;

  currentUser =
    signal<User | null>(this.loadUser());

  constructor(
    private http: HttpClient,
    private cartService: CartService
  ) {}

  loginWithGoogle(
    credential: string
  ): Observable<GoogleLoginResponse> {

    return this.http.post<GoogleLoginResponse>(
      `${this.apiUrl}/google`,
      {
        credential
      }
    );
  }

  register(
    request: RegisterRequest
  ): Observable<LocalAuthResponse> {

    return this.http.post<LocalAuthResponse>(
      `${this.apiUrl}/register`,
      request
    );
  }

  login(
    request: LocalAuthRequest
  ): Observable<LocalAuthResponse> {

    return this.http.post<LocalAuthResponse>(
      `${this.apiUrl}/login`,
      request
    );
  }

  updateProfile(
    phone: string,
    address: string
  ): Observable<UpdateProfileResponse> {

    return this.http.put<UpdateProfileResponse>(
      `${this.apiUrl}/profile`,
      {
        phone,
        address
      }
    );
  }

  setUser(
  user: User,
  token: string
): void {

  localStorage.setItem(
    'raamathy_user',
    JSON.stringify(user)
  );

  localStorage.setItem(
    'raamathy_token',
    token
  );

  this.currentUser.set(user);

  this.cartService.setUser(
    user.id
  );
}

  getToken(): string | null {

    return localStorage.getItem(
      'raamathy_token'
    );
  }

  logout(): void {

  localStorage.removeItem(
    'raamathy_user'
  );

  localStorage.removeItem(
    'raamathy_token'
  );

  this.currentUser.set(null);

  this.cartService.setUser(null);
}

  private loadUser(): User | null {

    const savedUser =
      localStorage.getItem(
        'raamathy_user'
      );

    if (!savedUser) {
      return null;
    }

    try {

      return JSON.parse(savedUser);

    } catch {

      return null;

    }
  }
}