import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap, take } from 'rxjs/operators';
import { RoleService } from '../../services/role.service';

/**
 * 🌐 ROLE INTERCEPTOR FUNCTION
 * Interceptor funcional para agregar headers automáticos con información de roles
 * Compatible con Angular 17+ (HttpInterceptorFn)
 */
export const roleInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const roleService = inject(RoleService);

    // Solo interceptar peticiones al backend
    if (!shouldInterceptRequest(req.url)) {
        return next(req);
    }

    // Usar observables públicos del RoleService
    return roleService.currentUser$.pipe(
        take(1),
        switchMap(currentUser => {
            try {
                // Si no hay usuario, continuar sin headers
                if (!currentUser) {
                    return next(req);
                }

                // Usar métodos públicos síncronos
                const currentRole = roleService.getCurrentRole();
                
                if (!currentRole) {
                    return next(req);
                }

                // Crear headers con información de roles
                const headers: { [key: string]: string } = {
                    'X-Current-Role': currentRole,
                    'X-User-ID': currentUser.id_usuario?.toString() || '',
                    'X-Is-Admin': roleService.isAdmin().toString(),
                    'X-Role-Timestamp': new Date().toISOString()
                };

                // Agregar roles disponibles si existen
                if (currentUser.roles && currentUser.roles.length > 0) {
                    headers['X-Available-Roles'] = currentUser.roles.join(',');
                }

                // Agregar información de sesión si existe
                if (currentUser.sessionId) {
                    headers['X-Session-ID'] = currentUser.sessionId;
                }

                // Agregar clínica seleccionada si existe
                const clinicas = roleService.getClinicasByCurrentRole();
                if (clinicas && clinicas.length > 0) {
                    headers['X-Selected-Clinic'] = clinicas[0].id_clinica?.toString() || '';
                }

                // Clonar request con nuevos headers
                const modifiedReq = req.clone({
                    setHeaders: headers
                });

                console.log('🌐 roleInterceptor: Headers agregados:', headers);
                return next(modifiedReq);

            } catch (error) {
                console.error('🌐 roleInterceptor: Error agregando headers:', error);
                // En caso de error, continuar sin headers
                return next(req);
            }
        })
    );
};

/**
 * Función auxiliar para determinar si interceptar la petición
 */
function shouldInterceptRequest(url: string): boolean {
    // Solo interceptar peticiones al backend
    const backendPatterns = [
        '/api/',
        '/auth/',
        '/user/',
        '/clinicas/',
        '/pacientes/',
        '/citas/',
        '/reportes/'
    ];

    // Excluir assets y archivos estáticos
    const excludePatterns = [
        '/assets/',
        '.js',
        '.css',
        '.png',
        '.jpg',
        '.svg',
        '.ico',
        '/sign-in',
        '/sign-up'
    ];

    // No interceptar si es un archivo excluido
    if (excludePatterns.some(pattern => url.includes(pattern))) {
        return false;
    }

    // Interceptar si coincide con patrones de backend
    return backendPatterns.some(pattern => url.includes(pattern));
}

/**
 * 🔧 VERSIÓN SIMPLIFICADA DEL INTERCEPTOR
 * Solo usa métodos síncronos para evitar complejidad
 */
export const simpleRoleInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const roleService = inject(RoleService);

    if (!shouldInterceptRequest(req.url)) {
        return next(req);
    }

    try {
        // Solo usar métodos síncronos públicos
        const currentRole = roleService.getCurrentRole();
        const isAdmin = roleService.isAdmin();
        
        if (!currentRole) {
            return next(req);
        }

        // Headers básicos usando solo métodos públicos
        const headers: { [key: string]: string } = {
            'X-Current-Role': currentRole,
            'X-Is-Admin': isAdmin.toString(),
            'X-Role-Timestamp': new Date().toISOString()
        };

        // Agregar clínica si existe
        const clinicas = roleService.getClinicasByCurrentRole();
        if (clinicas && clinicas.length > 0) {
            headers['X-Selected-Clinic'] = clinicas[0].id_clinica?.toString() || '';
            headers['X-Clinicas-Count'] = clinicas.length.toString();
        }

        const modifiedReq = req.clone({ setHeaders: headers });
        console.log('🌐 simpleRoleInterceptor: Headers agregados:', headers);
        
        return next(modifiedReq);

    } catch (error) {
        console.error('🌐 simpleRoleInterceptor: Error:', error);
        return next(req);
    }
};

