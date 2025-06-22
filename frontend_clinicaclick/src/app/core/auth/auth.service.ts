import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/user/user.service';
import { catchError, Observable, of, switchMap, throwError } from 'rxjs';
import { first } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private _authenticated: boolean = false;
    private _httpClient = inject(HttpClient);
    private _userService = inject(UserService);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    set accessToken(token: string) {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string {
        const token = localStorage.getItem('accessToken');
        return token ?? '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    forgotPassword(email: string): Observable<any> {
        return this._httpClient.post('api/auth/forgot-password', { email });
    }

    resetPassword(email: string, password: string): Observable<any> {
        return this._httpClient.post('api/auth/reset-password', { email, password });
    }

    signIn(credentials: { email: string; password: string }): Observable<any> {
        if (this._authenticated) {
            return throwError('User is already logged in.');
        }

        return this._httpClient.post('http://13.38.102.65/api/auth/sign-in', credentials).pipe(
            switchMap((response: any) => {
                console.log("Response from signIn:", response);
                this.accessToken = response.token;
                this._authenticated = true;
                this._userService.user = response.user;
                return of(response.user);
            })
        );
    }

    signInUsingToken(): Observable<any> {
        return this._httpClient.post('http://13.38.102.65/api/auth/sign-in-with-token', {
            accessToken: this.accessToken,
        }).pipe(
            catchError(() => of(false)),
            switchMap((response: any) => {
                if (response.accessToken) {
                    this.accessToken = response.accessToken;
                }
                this._authenticated = true;
                this._userService.user = response.user;
                return of(response.user);
            })
        );
    }

    getCurrentUser(): Observable<any> {
        // Se usa el observable del UserService (ReplaySubject) para obtener el usuario actual
        return this._userService.user$.pipe(
            first(),
            switchMap(user => {
                if (user) {
                    console.log("User found in getCurrentUser:", user);
                    return of(user);
                } else if (!this.accessToken) {
                    console.warn("No token found in localStorage");
                    return of(null);
                }
                return this.signInUsingToken().pipe(
                    switchMap(() => this._userService.user$.pipe(first()))
                );
            })
        );
    }

    signOut(): Observable<any> {
        localStorage.removeItem('accessToken');
        this._authenticated = false;
        return of(true);
    }

    signUp(user: { name: string; email: string; password: string; company: string }): Observable<any> {
        return this._httpClient.post('http://13.38.102.65/api/auth/sign-up', user);
    }

    unlockSession(credentials: { email: string; password: string }): Observable<any> {
        return this._httpClient.post('http://13.38.102.65/api/auth/unlock-session', credentials);
    }

    check(): Observable<boolean> {
        if (this._authenticated) {
            return of(true);
        }
        if (!this.accessToken) {
            return of(false);
        }
        if (AuthUtils.isTokenExpired(this.accessToken)) {
            return of(false);
        }
        return this.signInUsingToken();
    }
}
