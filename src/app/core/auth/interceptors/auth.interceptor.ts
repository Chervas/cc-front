import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    // 🔍 DEBUG: Log de la petición original
    console.log('🔍 [AuthInterceptor] Petición:', req.method, req.url);
    
    // Agregar token a headers si existe
    if (authService.accessToken) {
        console.log('🔍 [AuthInterceptor] Token disponible:', authService.accessToken.substring(0, 50) + '...');
        
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${authService.accessToken}`
            }
        });
        
        console.log('✅ [AuthInterceptor] Header Authorization agregado');
        console.log('🔍 [AuthInterceptor] Headers finales:', req.headers.get('Authorization')?.substring(0, 50) + '...');
    } else {
        console.log('⚠️ [AuthInterceptor] No hay token disponible');
    }
    
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            console.error('❌ [AuthInterceptor] Error en petición:', error.status, error.message);
            console.error('❌ [AuthInterceptor] Error completo:', error);
            
            if (error.status === 401) {
                console.log('🔐 [AuthInterceptor] Error 401 - Token inválido o expirado');
                console.log('🔐 [AuthInterceptor] Token actual:', authService.accessToken?.substring(0, 50) + '...');
                console.log('🔐 [AuthInterceptor] URL que falló:', req.url);
                
                // Token expirado o inválido, forzar logout
                authService.signOut();
                router.navigate(['/sign-in']);
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
//    - ¿Llega íntegro al backend?
//    - ¿Qué error específico devuelve el backend?
//
// 📊 LOGS ESPERADOS:
//
// ✅ CASO EXITOSO:
// 🔍 [AuthInterceptor] Petición: GET /api/userclinicas/list
// 🔍 [AuthInterceptor] Token disponible: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
// ✅ [AuthInterceptor] Header Authorization agregado
// 🔍 [AuthInterceptor] Headers finales: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
//
// ❌ CASO CON ERROR JWT:
// 🔍 [AuthInterceptor] Petición: GET /api/userclinicas/list
// 🔍 [AuthInterceptor] Token disponible: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
// ✅ [AuthInterceptor] Header Authorization agregado
// ❌ [AuthInterceptor] Error en petición: 401 Unauthorized
// ❌ [AuthInterceptor] Error completo: {error: "JsonWebTokenError: invalid signature"}
// 🔐 [AuthInterceptor] Error 401 - Token inválido o expirado
// 🔐 [AuthInterceptor] Token actual: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
// 🔐 [AuthInterceptor] URL que falló: /api/userclinicas/list

