import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { catchError, Observable, throwError } from 'rxjs';

/**
 * Intercept
 *
 * @param req
 * @param next
 */
export const authInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> =>
{
    const authService = inject(AuthService);

    // Función para verificar si es una ruta OAuth DE VERIFICACIÓN que no debe causar logout
    function isOAuthStatusRoute(url: string): boolean {
        const oauthStatusRoutes = [
            '/oauth/meta/connection-status',    // Meta: llega al servidor real pero no causa logout
            '/oauth/google/connection-status',  // Google: mock
            '/oauth/tiktok/connection-status'   // TikTok: mock
        ];
        return oauthStatusRoutes.some(route => url.includes(route));
    }

    // Clone the request object
    let newReq = req.clone();

    // Request
    //
    // If the access token didn't expire, add the Authorization header.
    // We won't add the Authorization header if the access token expired.
    // This will force the server to return a "401 Unauthorized" response
    // for the protected API routes which our response interceptor will
    // catch and delete the access token from the local storage while logging
    // the user out from the app.
    if ( authService.accessToken && !AuthUtils.isTokenExpired(authService.accessToken) )
    {
        console.log('✅ [AuthInterceptor] Token disponible:', authService.accessToken.substring(0, 50) + '...');
        console.log('🔍 [AuthInterceptor] Petición:', req.method, req.url);
        
        newReq = req.clone({
            headers: req.headers.set('Authorization', 'Bearer ' + authService.accessToken),
        });
        
        console.log('✅ [AuthInterceptor] Header Authorization agregado');
        console.log('🔍 [AuthInterceptor] Headers finales:', newReq.headers.get('Authorization')?.substring(0, 50) + '...');
    }

    // Response
    return next(newReq).pipe(
        catchError((error) =>
        {
            // Catch "401 Unauthorized" responses
            if ( error instanceof HttpErrorResponse && error.status === 401 )
            {
                console.log('❌ [AuthInterceptor] Error en petición:', error.status);
                console.log('❌ [AuthInterceptor] Error completo:', error);
                
                // CORRECCIÓN QUIRÚRGICA: No hacer logout si es una ruta OAuth DE VERIFICACIÓN
                if (isOAuthStatusRoute(req.url)) {
                    console.log('🚫 [AuthInterceptor] 401 de ruta OAuth de verificación, ignorando logout automático');
                    console.log('⚠️ [AuthInterceptor] URL que falló:', req.url);
                    return throwError(error);
                }
                
                console.log('⚠️ [AuthInterceptor] Error 401 - Token inválido o expirado');
                console.log('⚠️ [AuthInterceptor] Token actual:', authService.accessToken?.substring(0, 50) + '...');
                console.log('⚠️ [AuthInterceptor] URL que falló:', req.url);

                // Sign out solo si NO es ruta OAuth
                authService.signOut();

                // Reload the app
                location.reload();
            }

            return throwError(error);
        }),
    );
};

