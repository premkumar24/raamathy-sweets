import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = (
  route,
  state
) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();

  if (!user) {

    return router.createUrlTree(
      ['/login'],
      {
        queryParams: {
          returnUrl: state.url
        }
      }
    );

  }

  if (user.role === 'ADMIN') {
    return true;
  }

  return router.createUrlTree(['/']);

};