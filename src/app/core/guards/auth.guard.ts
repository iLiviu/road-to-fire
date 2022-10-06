import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlSegment, Route } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';


/**
 * Guard to restrict access to authenticated users only
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {

  }

  async isAuthenticated(): Promise<boolean> {
    const result = await this.authService.isAuthenticated();
    if (!result) {
      // no UI interaction here, queue the event
      setTimeout(() => {
        this.router.navigate(['login']);
      }, 0);
      return false;
    }

    return true;
  }


  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean {
    return this.isAuthenticated();
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    return this.isAuthenticated();
  }
}
