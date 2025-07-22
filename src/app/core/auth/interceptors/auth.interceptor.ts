import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth.service';

/**
  * 🚫 Dominios externos relacionados con OAuth
 *     - No se debe enviar el token JWT
 *     - Un 401 no debe forzar logout automático
 **/


/**
 * Determina si la URL pertenece a un dominio OAuth externo.
 */
const OAUTH_DOMAINS = ['autenticacion.clinicaclick.com'];

function isOAuthDomain(url: string): boolean {
  // Evitar problemas de parseo usando una comprobación simple
    return OAUTH_DOMAINS.some((domain) => url.includes(domain));
}

function shouldAttachToken(url: string): boolean {
    return !isOAuthDomain(url);
}

function shouldIgnore401(url: string): boolean {
    return isOAuthDomain(url);
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    // 🔍 DEBUG: Log de la petición original
    console.log('🔍 [AuthInterceptor] Petición:', req.method, req.url);
    
     // Agregar token a headers si existe y no es dominio OAuth
    if (authService.accessToken && shouldAttachToken(req.url)) {
        console.log('🔍 [AuthInterceptor] Token disponible:', authService.accessToken.substring(0, 50) + '...');

        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${authService.accessToken}`
            }
        });

        console.log('✅ [AuthInterceptor] Header Authorization agregado');
        console.log('🔍 [AuthInterceptor] Headers finales:', req.headers.get('Authorization')?.substring(0, 50) + '...');
    } else if (!authService.accessToken) {
                            console.warn('🚫 [AuthInterceptor] 401 de dominio excluido, ignorando');
    } else {
        console.log('🚫 [AuthInterceptor] Dominio OAuth - no se envía token');
    }
    
        return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && shouldIgnore401(req.url)) {
                console.warn('🚫 [AuthInterceptor] 401 de dominio excluido, ignorando');
            } else {
                console.error('❌ [AuthInterceptor] Error en petición:', error.status, error.message);
                console.error('❌ [AuthInterceptor] Error completo:', error);
            }

            if (error.status === 401) {
                if (!shouldIgnore401(req.url)) {
                    console.log('🔐 [AuthInterceptor] Error 401 - Token inválido o expirado');
                    console.log('🔐 [AuthInterceptor] Token actual:', authService.accessToken?.substring(0, 50) + '...');
                    console.log('🔐 [AuthInterceptor] URL que falló:', req.url);

                    // Token expirado o inválido, forzar logout
                    authService.signOut();
                    router.navigate(['/sign-in']);
                }
            } else if (error.status === 403) {
                console.log('🚫 [AuthInterceptor] Error 403 - Sin permisos suficientes');
            }
            
            return throwError(() => error);
        })
    );
};


// 📋 INSTRUCCIONES DE USO:
//
// 1. Reemplazar el AuthInterceptor actual:
//    cp auth.interceptor-FUNCTIONAL-DEBUG.ts src/app/core/auth/interceptors/auth.interceptor.ts
//
// 2. Compilar y probar login:
//    npm run build -- --configuration=production
//
// 3. Revisar logs en consola del navegador:
//    - ¿Se envía el token correctamente?