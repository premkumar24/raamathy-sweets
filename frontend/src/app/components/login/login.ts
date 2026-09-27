import {
  AfterViewInit,
  AfterViewChecked,
  Component,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { AuthService } from '../../services/auth';

import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',

  imports: [
    CommonModule,
    ReactiveFormsModule
  ],

  templateUrl: './login.html',

  styleUrl: './login.css'
})
export class Login
  implements AfterViewInit,AfterViewChecked  {

  // --------------------------------
  // UI state
  // --------------------------------

  errorMessage = signal('');

  loading = signal(false);

  isRegisterMode = signal(false);
  showLoginPassword = signal(false);

showRegisterPassword = signal(false);

showConfirmPassword = signal(false);
private googleButtonRendered = false;


  // --------------------------------
  // Login form
  // --------------------------------

  loginForm = new FormGroup({

    email: new FormControl('', {
      nonNullable: true,

      validators: [
        Validators.required,
        Validators.email
      ]
    }),

    password: new FormControl('', {
      nonNullable: true,

      validators: [
        Validators.required
      ]
    })

  });


  // --------------------------------
  // Register form
  // --------------------------------

  registerForm = new FormGroup({

    name: new FormControl('', {
      nonNullable: true,

      validators: [
        Validators.required,
        Validators.minLength(2)
      ]
    }),

    email: new FormControl('', {
      nonNullable: true,

      validators: [
        Validators.required,
        Validators.email
      ]
    }),

    password: new FormControl('', {
      nonNullable: true,

      validators: [
        Validators.required,
        Validators.minLength(6)
      ]
    }),

    confirmPassword: new FormControl('', {
      nonNullable: true,

      validators: [
        Validators.required
      ]
    })

  });


  constructor(
    private authService: AuthService,

    private router: Router,

    private activatedRoute: ActivatedRoute
  ) {}


  // --------------------------------
  // Google Login
  // --------------------------------

 ngAfterViewInit(): void {

  google.accounts.id.initialize({

    client_id:
      environment.googleClientId,

    callback: (response: any) => {

      this.handleGoogleLogin(
        response.credential
      );

    }

  });

  this.renderGoogleButton();

}

ngAfterViewChecked(): void {

  if (
    !this.isRegisterMode() &&
    !this.googleButtonRendered
  ) {

    this.renderGoogleButton();

  }

}

private renderGoogleButton(): void {

  const googleButton =
    document.getElementById(
      'google-button'
    );

  if (
    !googleButton ||
    this.isRegisterMode()
  ) {

    return;

  }

  google.accounts.id.renderButton(

    googleButton,

    {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular'
    }

  );

  this.googleButtonRendered = true;

}


  handleGoogleLogin(
    credential: string
  ): void {

    this.loading.set(true);

    this.errorMessage.set('');

    this.authService
      .loginWithGoogle(credential)
      .subscribe({

        next: (response) => {

          this.authService.setUser(
            response.user,
            response.token
          );

          this.loading.set(false);

          this.navigateAfterLogin();

        },

        error: (error) => {

          console.error(
            'GOOGLE LOGIN ERROR:',
            error
          );

          this.errorMessage.set(
            error?.error?.message ||
            'Google login failed. Please try again.'
          );

          this.loading.set(false);

        }

      });

  }


  // --------------------------------
  // Local Login
  // --------------------------------

  login(): void {

    if (this.loginForm.invalid) {

      this.loginForm.markAllAsTouched();

      return;

    }

    if (this.loading()) {
      return;
    }

    this.loading.set(true);

    this.errorMessage.set('');

    const email =
      this.loginForm.controls.email.value
        .trim();

    const password =
      this.loginForm.controls.password.value;

    this.authService
      .login({
        email,
        password
      })
      .subscribe({

        next: (response) => {

          this.authService.setUser(
            response.user,
            response.token
          );

          this.loading.set(false);

          this.navigateAfterLogin();

        },

        error: (error) => {

          console.error(
            'LOGIN ERROR:',
            error
          );

          this.errorMessage.set(
            error?.error?.message ||
            'Unable to login. Please try again.'
          );

          this.loading.set(false);

        }

      });

  }


  // --------------------------------
  // Register
  // --------------------------------

  register(): void {

    if (this.registerForm.invalid) {

      this.registerForm.markAllAsTouched();

      return;

    }

    if (this.loading()) {
      return;
    }

    const name =
      this.registerForm.controls.name.value
        .trim();

    const email =
      this.registerForm.controls.email.value
        .trim();

    const password =
      this.registerForm.controls.password.value;

    const confirmPassword =
      this.registerForm.controls.confirmPassword.value;


    if (
      password !== confirmPassword
    ) {

      this.errorMessage.set(
        'Passwords do not match.'
      );

      return;

    }


    this.loading.set(true);

    this.errorMessage.set('');


    this.authService
      .register({
        name,
        email,
        password
      })
      .subscribe({

        next: (response) => {

          this.authService.setUser(
            response.user,
            response.token
          );

          this.loading.set(false);

          this.navigateAfterLogin();

        },

        error: (error) => {

          console.error(
            'REGISTER ERROR:',
            error
          );

          this.errorMessage.set(
            error?.error?.message ||
            'Unable to create account. Please try again.'
          );

          this.loading.set(false);

        }

      });

  }


  // --------------------------------
  // Switch Login / Register
  // --------------------------------

 toggleMode(): void {

  this.isRegisterMode.update(
    value => !value
  );

  this.googleButtonRendered = false;

  this.errorMessage.set('');

  this.loginForm.reset();

  this.registerForm.reset();

}


  // --------------------------------
  // Navigation
  // --------------------------------

  private navigateAfterLogin(): void {

    const returnUrl =
      this.activatedRoute
        .snapshot
        .queryParamMap
        .get('returnUrl');

    if (
      returnUrl &&
      returnUrl.startsWith('/')
    ) {

      this.router.navigateByUrl(
        returnUrl
      );

    } else {

      this.router.navigate(['/']);

    }

  }

}