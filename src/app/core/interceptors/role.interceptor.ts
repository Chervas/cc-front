import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, switchMap, take, catchError, of } from 'rxjs';
import { RoleService, UserRole } from '../services/role.service';

/**
 * 🌐 INTERCEPTOR DE ROLES PARA HTTP
 * 
 * Agrega automáticamente headers con información de rol y usuario
 * a todas las peticiones HTTP salientes al backend
 * Se integra con RoleService existente sin modificar funcionalidad
 */
@Injectable()
export class RoleInterceptor implements HttpInterceptor {

    constructor(private roleService: RoleService) {}

    intercept(
        request: HttpRequest<any>, 
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        
        // ✅ VERIFICAR SI ES UNA PETICIÓN AL BACKEND
        if (!this.shouldAddRoleHeaders(request.url)) {
            return next.handle(request);
        }

        // ✅ AGREGAR HEADERS DE ROL DE FORMA ASÍNCRONA
        return this.roleService.currentUser$.pipe(
            take(1),
            switchMap(currentUser => {
                const modifiedRequest = this.addRoleHeaders(request, currentUser);
                return next.handle(modifiedRequest);
            }),
            catchError(error => {
                console.error('🌐 RoleInterceptor: Error agregando headers de rol:', error);
                // En caso de error, continuar con la petición original
                return next.handle(request);
            })
        );
    }

    /**
     * Determina si se deben agregar headers de rol a la petición
     */
    private shouldAddRoleHeaders(url: string): boolean {
        // ✅ CONFIGURACIÓN DE URLs QUE REQUIEREN HEADERS DE ROL
        const backendPatterns = [
            '/api/',           // APIs principales
            '/backend/',       // Backend específico
            'localhost:3000',  // Desarrollo local
            'localhost:8080',  // Backend alternativo
            // Agregar aquí otros patrones de URLs del backend
        ];

        // ✅ EXCLUIR URLs QUE NO REQUIEREN HEADERS DE ROL
        const excludePatterns = [
            '/auth/login',     // Login no requiere rol
            '/auth/register',  // Registro no requiere rol
            '/public/',        // APIs públicas
            '/health',         // Health checks
            '/version'         // Información de versión
        ];

        // Verificar si debe excluirse
        const shouldExclude = excludePatterns.some(pattern => 
            url.includes(pattern)
        );
        
        if (shouldExclude) {
            return false;
        }

        // Verificar si es una URL del backend
        return backendPatterns.some(pattern => 
            url.includes(pattern)
        );
    }

    /**
     * Agrega headers de rol y usuario a la petición
     */
    private addRoleHeaders(
        request: HttpRequest<any>, 
        currentUser: any
    ): HttpRequest<any> {
        
        if (!currentUser) {
            console.log('🌐 RoleInterceptor: No hay usuario autenticado, no se agregan headers');
            return request;
        }

        // ✅ OBTENER INFORMACIÓN ACTUAL DEL USUARIO
        const selectedRole = this.getSelectedRoleSync();
        const availableRoles = this.getAvailableRolesSync();
        const sessionId = this.getSessionIdSync();

        // ✅ CONSTRUIR HEADERS DE ROL
        const roleHeaders: { [key: string]: string } = {};

        // Header con el rol actual seleccionado
        if (selectedRole) {
            roleHeaders['X-Current-Role'] = selectedRole;
        }

        // Header con todos los roles disponibles
        if (availableRoles && availableRoles.length > 0) {
            roleHeaders['X-Available-Roles'] = availableRoles.join(',');
        }

        // Header con ID del usuario
        if (currentUser.id_usuario) {
            roleHeaders['X-User-ID'] = currentUser.id_usuario.toString();
        }

        // Header con ID de sesión (si existe)
        if (sessionId) {
            roleHeaders['X-Session-ID'] = sessionId;
        }

        // Header con información de admin
        if (currentUser.isAdmin) {
            roleHeaders['X-Is-Admin'] = 'true';
        }

        // Header con clínica seleccionada (si existe)
        const selectedClinic = this.getSelectedClinicSync();
        if (selectedClinic?.id_clinica) {
            roleHeaders['X-Selected-Clinic'] = selectedClinic.id_clinica.toString();
        }

        // Header con timestamp para debugging
        roleHeaders['X-Role-Timestamp'] = new Date().toISOString();

        // ✅ AGREGAR HEADERS SOLO SI HAY INFORMACIÓN DE ROL
        if (Object.keys(roleHeaders).length === 0) {
            console.log('🌐 RoleInterceptor: No hay información de rol para agregar');
            return request;
        }

        // ✅ CLONAR PETICIÓN Y AGREGAR HEADERS
        const modifiedRequest = request.clone({
            setHeaders: roleHeaders
        });

        console.log('🌐 RoleInterceptor: Headers agregados:', {
            url: request.url,
            headers: roleHeaders
        });

        return modifiedRequest;
    }

    /**
     * Obtiene el rol seleccionado de forma síncrona
     */
    private getSelectedRoleSync(): UserRole | null {
        try {
            if (typeof (this.roleService as any).getSelectedRoleSync === 'function') {
                return (this.roleService as any).getSelectedRoleSync();
            }
            
            // Fallback: obtener del BehaviorSubject
            return (this.roleService as any).selectedRoleSubject?.value || null;
        } catch (error) {
            console.warn('🌐 RoleInterceptor: Error obteniendo rol seleccionado:', error);
            return null;
        }
    }

    /**
     * Obtiene los roles disponibles de forma síncrona
     */
    private getAvailableRolesSync(): UserRole[] {
        try {
            if (typeof (this.roleService as any).getAvailableRolesSync === 'function') {
                return (this.roleService as any).getAvailableRolesSync();
            }
            
            // Fallback: obtener del BehaviorSubject
            return (this.roleService as any).availableRolesSubject?.value || [];
        } catch (error) {
            console.warn('🌐 RoleInterceptor: Error obteniendo roles disponibles:', error);
            return [];
        }
    }

    /**
     * Obtiene el ID de sesión de forma síncrona
     */
    private getSessionIdSync(): string | null {
        try {
            const currentUser = (this.roleService as any).currentUserSubject?.value;
            return currentUser?.sessionId || null;
        } catch (error) {
            console.warn('🌐 RoleInterceptor: Error obteniendo session ID:', error);
            return null;
        }
    }

    /**
     * Obtiene la clínica seleccionada de forma síncrona
     */
    private getSelectedClinicSync(): any {
        try {
            // Intentar obtener de localStorage o del servicio
            const selectedClinicData = localStorage.getItem('selectedClinic');
            if (selectedClinicData) {
                return JSON.parse(selectedClinicData);
            }
            return null;
        } catch (error) {
            console.warn('🌐 RoleInterceptor: Error obteniendo clínica seleccionada:', error);
            return null;
        }
    }
}

/**
 * 🔧 CONFIGURACIÓN AVANZADA DEL INTERCEPTOR
 */

/**
 * Interceptor con configuración personalizada
 */
@Injectable()
export class ConfigurableRoleInterceptor implements HttpInterceptor {
    
    private config: RoleInterceptorConfig;

    constructor(
        private roleService: RoleService,
        config?: RoleInterceptorConfig
    ) {
        this.config = {
            enableLogging: true,
            includeTimestamp: true,
            includeSessionId: true,
            includeClinicInfo: true,
            customHeaders: {},
            ...config
        };
    }

    intercept(
        request: HttpRequest<any>, 
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        
        if (!this.shouldAddHeaders(request.url)) {
            return next.handle(request);
        }

        return this.roleService.currentUser$.pipe(
            take(1),
            switchMap(currentUser => {
                const modifiedRequest = this.addConfigurableHeaders(request, currentUser);
                return next.handle(modifiedRequest);
            }),
            catchError(error => {
                if (this.config.enableLogging) {
                    console.error('🌐 ConfigurableRoleInterceptor: Error:', error);
                }
                return next.handle(request);
            })
        );
    }

    private shouldAddHeaders(url: string): boolean {
        const includePatterns = this.config.includeUrls || ['/api/', '/backend/'];
        const excludePatterns = this.config.excludeUrls || ['/auth/login', '/auth/register'];

        const shouldExclude = excludePatterns.some(pattern => url.includes(pattern));
        if (shouldExclude) return false;

        return includePatterns.some(pattern => url.includes(pattern));
    }

    private addConfigurableHeaders(
        request: HttpRequest<any>, 
        currentUser: any
    ): HttpRequest<any> {
        
        if (!currentUser) return request;

        const headers: { [key: string]: string } = {};

        // Headers básicos de rol
        const selectedRole = this.getSelectedRoleSync();
        if (selectedRole) {
            headers['X-Current-Role'] = selectedRole;
        }

        // Headers opcionales según configuración
        if (this.config.includeSessionId) {
            const sessionId = this.getSessionIdSync();
            if (sessionId) {
                headers['X-Session-ID'] = sessionId;
            }
        }

        if (this.config.includeTimestamp) {
            headers['X-Role-Timestamp'] = new Date().toISOString();
        }

        if (this.config.includeClinicInfo) {
            const selectedClinic = this.getSelectedClinicSync();
            if (selectedClinic?.id_clinica) {
                headers['X-Selected-Clinic'] = selectedClinic.id_clinica.toString();
            }
        }

        // Headers personalizados
        if (this.config.customHeaders) {
            Object.assign(headers, this.config.customHeaders);
        }

        if (Object.keys(headers).length === 0) return request;

        const modifiedRequest = request.clone({ setHeaders: headers });

        if (this.config.enableLogging) {
            console.log('🌐 ConfigurableRoleInterceptor: Headers agregados:', headers);
        }

        return modifiedRequest;
    }

    private getSelectedRoleSync(): UserRole | null {
        try {
            return (this.roleService as any).getSelectedRoleSync?.() || 
                   (this.roleService as any).selectedRoleSubject?.value || null;
        } catch {
            return null;
        }
    }

    private getSessionIdSync(): string | null {
        try {
            const currentUser = (this.roleService as any).currentUserSubject?.value;
            return currentUser?.sessionId || null;
        } catch {
            return null;
        }
    }

    private getSelectedClinicSync(): any {
        try {
            const selectedClinicData = localStorage.getItem('selectedClinic');
            return selectedClinicData ? JSON.parse(selectedClinicData) : null;
        } catch {
            return null;
        }
    }
}

/**
 * 🔧 INTERFACE PARA CONFIGURACIÓN DEL INTERCEPTOR
 */
export interface RoleInterceptorConfig {
    enableLogging?: boolean;
    includeTimestamp?: boolean;
    includeSessionId?: boolean;
    includeClinicInfo?: boolean;
    includeUrls?: string[];
    excludeUrls?: string[];
    customHeaders?: { [key: string]: string };
}

/**
 * 🎯 FACTORY PARA CREAR INTERCEPTOR CON CONFIGURACIÓN
 */
export function createRoleInterceptor(config?: RoleInterceptorConfig) {
    return {
        provide: HTTP_INTERCEPTORS,
        useFactory: (roleService: RoleService) => 
            new ConfigurableRoleInterceptor(roleService, config),
        deps: [RoleService],
        multi: true
    };
}

// Importar HTTP_INTERCEPTORS
import { HTTP_INTERCEPTORS } from '@angular/common/http';

