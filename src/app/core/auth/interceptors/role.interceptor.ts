import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RoleService } from '../../services/role.service';

/**
 * 🌐 ROLE INTERCEPTOR - HEADERS HTTP AUTOMÁTICOS
 * 
 * Ubicación: src/app/core/auth/interceptors/role.interceptor.ts
 * 
 * Interceptor que agrega automáticamente headers con información de roles
 * a todas las peticiones HTTP dirigidas al backend.
 * Sigue la estructura de Fuse colocando interceptors dentro de core/auth/interceptors/
 */

@Injectable()
export class RoleInterceptor implements HttpInterceptor {

    constructor(private roleService: RoleService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Solo agregar headers a peticiones del backend
        if (!this.shouldAddHeaders(req.url)) {
            return next.handle(req);
        }

        try {
            // Obtener información actual del usuario y roles
            const currentUser = this.roleService.getCurrentUserSync();
            const selectedRole = this.roleService.getSelectedRoleSync();
            const availableRoles = this.roleService.getAvailableRolesSync();
            const selectedClinic = this.roleService.getSelectedClinicSync();

            // Crear headers con información de roles
            const headers: { [key: string]: string } = {};

            if (selectedRole) {
                headers['X-Current-Role'] = selectedRole;
            }

            if (availableRoles && availableRoles.length > 0) {
                headers['X-Available-Roles'] = availableRoles.join(',');
            }

            if (currentUser?.id_usuario) {
                headers['X-User-ID'] = currentUser.id_usuario.toString();
            }

            if (selectedClinic?.id_clinica) {
                headers['X-Selected-Clinic'] = selectedClinic.id_clinica.toString();
            }

            // Agregar timestamp para debugging
            headers['X-Role-Timestamp'] = new Date().toISOString();

            // Agregar indicador de admin
            if (selectedRole === 'admin') {
                headers['X-Is-Admin'] = 'true';
            }

            // Crear nueva request con headers
            const modifiedReq = req.clone({
                setHeaders: headers
            });

            console.log('🌐 RoleInterceptor: Headers agregados:', headers);
            return next.handle(modifiedReq);

        } catch (error) {
            console.warn('🌐 RoleInterceptor: Error al obtener información de roles:', error);
            // En caso de error, continuar sin headers adicionales
            return next.handle(req);
        }
    }

    private shouldAddHeaders(url: string): boolean {
        // Solo agregar headers a URLs del backend
        const backendPatterns = [
            '/api/',
            'localhost:3000',
            'localhost:8000',
            'clinicaclick.com',
            // Agregar otros patrones de backend según sea necesario
        ];

        return backendPatterns.some(pattern => url.includes(pattern));
    }
}

/**
 * 🔧 VERSIÓN CONFIGURABLE DEL INTERCEPTOR
 */

export interface RoleInterceptorConfig {
    enableLogging?: boolean;
    customHeaders?: { [key: string]: string };
    backendPatterns?: string[];
    excludePatterns?: string[];
}

@Injectable()
export class ConfigurableRoleInterceptor implements HttpInterceptor {

    private config: RoleInterceptorConfig = {
        enableLogging: true,
        customHeaders: {},
        backendPatterns: ['/api/', 'localhost:3000', 'localhost:8000'],
        excludePatterns: ['/auth/login', '/auth/register']
    };

    constructor(
        private roleService: RoleService,
        config?: RoleInterceptorConfig
    ) {
        if (config) {
            this.config = { ...this.config, ...config };
        }
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!this.shouldAddHeaders(req.url)) {
            return next.handle(req);
        }

        try {
            const headers = this.buildHeaders();
            
            if (Object.keys(headers).length === 0) {
                return next.handle(req);
            }

            const modifiedReq = req.clone({ setHeaders: headers });

            if (this.config.enableLogging) {
                console.log('🌐 ConfigurableRoleInterceptor: Headers agregados:', headers);
            }

            return next.handle(modifiedReq);

        } catch (error) {
            if (this.config.enableLogging) {
                console.warn('🌐 ConfigurableRoleInterceptor: Error:', error);
            }
            return next.handle(req);
        }
    }

    private buildHeaders(): { [key: string]: string } {
        const headers: { [key: string]: string } = {};

        // Headers básicos de roles
        const currentUser = this.roleService.getCurrentUserSync();
        const selectedRole = this.roleService.getSelectedRoleSync();
        const availableRoles = this.roleService.getAvailableRolesSync();
        const selectedClinic = this.roleService.getSelectedClinicSync();

        if (selectedRole) headers['X-Current-Role'] = selectedRole;
        if (availableRoles?.length) headers['X-Available-Roles'] = availableRoles.join(',');
        if (currentUser?.id_usuario) headers['X-User-ID'] = currentUser.id_usuario.toString();
        if (selectedClinic?.id_clinica) headers['X-Selected-Clinic'] = selectedClinic.id_clinica.toString();
        
        // Headers personalizados
        Object.assign(headers, this.config.customHeaders);

        // Headers de metadatos
        headers['X-Role-Timestamp'] = new Date().toISOString();
        if (selectedRole === 'admin') headers['X-Is-Admin'] = 'true';

        return headers;
    }

    private shouldAddHeaders(url: string): boolean {
        // Verificar patrones de exclusión
        if (this.config.excludePatterns?.some(pattern => url.includes(pattern))) {
            return false;
        }

        // Verificar patrones de backend
        return this.config.backendPatterns?.some(pattern => url.includes(pattern)) || false;
    }
}

