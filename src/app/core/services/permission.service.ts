import { Injectable } from '@angular/core';
import { Observable, of, map, catchError } from 'rxjs';
import { RoleService, UserRole } from './role.service';
import { ROLE_CONFIG } from '../constants/role.constants';

/**
 * 🔐 PERMISSION SERVICE - SISTEMA DE PERMISOS GRANULARES
 * 
 * Servicio para verificación de permisos específicos basado en roles.
 * Adaptado al RoleService real que usa observables y métodos síncronos.
 */
@Injectable({
    providedIn: 'root'
})
export class PermissionService {

    constructor(private roleService: RoleService) {}

    // ========================================
    // 🎯 MÉTODOS PRINCIPALES DE VERIFICACIÓN
    // ========================================

    /**
     * Verifica si el usuario tiene un permiso específico
     */
    hasPermission(permission: string): Observable<boolean> {
        try {
            const currentRole = this.roleService.getCurrentRole();
            if (!currentRole) {
                console.warn('🚨 PermissionService: No hay rol actual');
                return of(false);
            }

            const permissions = this.getPermissionsForRole(currentRole);
            const hasAccess = permissions.includes(permission);
            
            console.log(`🔐 hasPermission(${permission}): ${hasAccess} [rol: ${currentRole}]`);
            return of(hasAccess);
        } catch (error) {
            console.error('🚨 Error verificando permiso:', error);
            return of(false);
        }
    }

    /**
     * Verifica si el usuario tiene alguno de los permisos especificados (OR)
     */
    hasAnyPermission(permissions: string[]): Observable<boolean> {
        try {
            if (!permissions || permissions.length === 0) {
                return of(false);
            }

            const currentRole = this.roleService.getCurrentRole();
            if (!currentRole) {
                return of(false);
            }

            const userPermissions = this.getPermissionsForRole(currentRole);
            const hasAccess = permissions.some(permission => userPermissions.includes(permission));
            
            console.log(`🔐 hasAnyPermission([${permissions.join(', ')}]): ${hasAccess}`);
            return of(hasAccess);
        } catch (error) {
            console.error('🚨 Error verificando permisos (ANY):', error);
            return of(false);
        }
    }

    /**
     * Verifica si el usuario tiene todos los permisos especificados (AND)
     */
    hasAllPermissions(permissions: string[]): Observable<boolean> {
        try {
            if (!permissions || permissions.length === 0) {
                return of(true);
            }

            const currentRole = this.roleService.getCurrentRole();
            if (!currentRole) {
                return of(false);
            }

            const userPermissions = this.getPermissionsForRole(currentRole);
            const hasAccess = permissions.every(permission => userPermissions.includes(permission));
            
            console.log(`🔐 hasAllPermissions([${permissions.join(', ')}]): ${hasAccess}`);
            return of(hasAccess);
        } catch (error) {
            console.error('🚨 Error verificando permisos (ALL):', error);
            return of(false);
        }
    }

    /**
     * Verifica si el usuario tiene un rol específico
     */
    hasRole(role: UserRole): Observable<boolean> {
        try {
            // Usar el método existente del RoleService
            const hasAccess = this.roleService.hasRole(role);
            console.log(`🔐 hasRole(${role}): ${hasAccess}`);
            return of(hasAccess);
        } catch (error) {
            console.error('🚨 Error verificando rol:', error);
            return of(false);
        }
    }

    /**
     * Verifica si el usuario tiene alguno de los roles especificados (OR)
     * MÉTODO REQUERIDO POR ROLEGUARD
     */
    hasAnyRole(roles: UserRole[]): Observable<boolean> {
        try {
            if (!roles || roles.length === 0) {
                return of(false);
            }

            const currentRole = this.roleService.getCurrentRole();
            if (!currentRole) {
                return of(false);
            }

            // Verificar si el rol actual está en la lista de roles permitidos
            const hasAccess = roles.some(role => {
                try {
                    return this.roleService.hasRole(role);
                } catch (error) {
                    console.error(`🚨 Error verificando rol ${role}:`, error);
                    return false;
                }
            });
            
            console.log(`🔐 hasAnyRole([${roles.join(', ')}]): ${hasAccess} [rol actual: ${currentRole}]`);
            return of(hasAccess);
        } catch (error) {
            console.error('🚨 Error verificando roles (ANY):', error);
            return of(false);
        }
    }

    /**
     * Verifica si el usuario tiene todos los roles especificados (AND)
     */
    hasAllRoles(roles: UserRole[]): Observable<boolean> {
        try {
            if (!roles || roles.length === 0) {
                return of(true);
            }

            const hasAccess = roles.every(role => {
                try {
                    return this.roleService.hasRole(role);
                } catch (error) {
                    console.error(`🚨 Error verificando rol ${role}:`, error);
                    return false;
                }
            });
            
            console.log(`🔐 hasAllRoles([${roles.join(', ')}]): ${hasAccess}`);
            return of(hasAccess);
        } catch (error) {
            console.error('🚨 Error verificando roles (ALL):', error);
            return of(false);
        }
    }

    // ========================================
    // 🏥 MÉTODOS DE NEGOCIO ESPECÍFICOS
    // ========================================

    canManageClinics(): Observable<boolean> {
        return this.hasAnyPermission(['manage_clinics', 'admin_access']);
    }

    canViewPatients(): Observable<boolean> {
        return this.hasAnyPermission(['view_patients', 'manage_patients', 'admin_access']);
    }

    canManageStaff(): Observable<boolean> {
        return this.hasAnyPermission(['manage_staff', 'admin_access']);
    }

    canManageAppointments(): Observable<boolean> {
        return this.hasAnyPermission(['manage_appointments', 'view_appointments', 'admin_access']);
    }

    canAccessReports(): Observable<boolean> {
        return this.hasAnyPermission(['view_reports', 'admin_access']);
    }

    canManageAssets(): Observable<boolean> {
        return this.hasAnyPermission(['manage_assets', 'admin_access']);
    }

    // ========================================
    // 🛡️ VERIFICACIÓN DE RUTAS
    // ========================================

    /**
     * Verifica si el usuario puede acceder a una ruta específica
     */
    canAccessRoute(route: string): Observable<boolean> {
        const routePermissions = this.getRoutePermissions(route);
        if (routePermissions.length === 0) {
            return of(true); // Ruta sin restricciones
        }
        return this.hasAnyPermission(routePermissions);
    }

    // ========================================
    // 🔧 MÉTODOS SÍNCRONOS (PARA TEMPLATES)
    // ========================================

    /**
     * Versión síncrona para usar en templates
     */
    hasPermissionSync(permission: string): boolean {
        try {
            const currentRole = this.roleService.getCurrentRole();
            if (!currentRole) return false;

            const permissions = this.getPermissionsForRole(currentRole);
            return permissions.includes(permission);
        } catch (error) {
            console.error('🚨 Error verificando permiso (sync):', error);
            return false;
        }
    }

    /**
     * Versión síncrona para verificar roles
     */
    hasRoleSync(role: UserRole): boolean {
        try {
            return this.roleService.hasRole(role);
        } catch (error) {
            console.error('🚨 Error verificando rol (sync):', error);
            return false;
        }
    }

    // ========================================
    // 🔧 MÉTODOS AUXILIARES
    // ========================================

    /**
     * Obtiene los permisos para un rol específico
     */
    private getPermissionsForRole(role: UserRole): string[] {
        try {
            const normalizedRole = role.toLowerCase() as keyof typeof ROLE_CONFIG.ROLE_PERMISSIONS;
            const permissions = ROLE_CONFIG.ROLE_PERMISSIONS[normalizedRole];
            
            if (!permissions) {
                console.warn(`🚨 No se encontraron permisos para el rol: ${role}`);
                return [];
            }

            return permissions;
        } catch (error) {
            console.error('🚨 Error obteniendo permisos para rol:', error);
            return [];
        }
    }

    /**
     * Mapea rutas a permisos requeridos
     */
    private getRoutePermissions(route: string): string[] {
        const routeMap: { [key: string]: string[] } = {
            '/clinicas': ['manage_clinics'],
            '/pacientes': ['view_patients'],
            '/personal': ['manage_staff'],
            '/citas': ['view_appointments'],
            '/reportes': ['view_reports'],
            '/mapas': ['manage_assets'],
            '/admin': ['admin_access']
        };

        return routeMap[route] || [];
    }

    /**
     * Obtiene información detallada del sistema de permisos
     */
    getPermissionInfo(): Observable<any> {
        try {
            const currentRole = this.roleService.getCurrentRole();
            
            // Obtener roles disponibles de forma segura
            let availableRoles: UserRole[] = [];
            try {
                // Intentar obtener del observable
                this.roleService.availableRoles$.subscribe(roles => {
                    availableRoles = roles || [];
                }).unsubscribe();
            } catch (error) {
                console.warn('🚨 Error obteniendo availableRoles$, usando rol actual:', error);
                // Si falla, usar al menos el rol actual
                if (currentRole) {
                    availableRoles = [currentRole];
                }
            }

            const currentPermissions = currentRole ? this.getPermissionsForRole(currentRole) : [];
            const allPermissions = Object.values(ROLE_CONFIG.ROLE_PERMISSIONS).flat();

            const info = {
                currentRole: currentRole || null,
                availableRoles: availableRoles,
                currentPermissions: currentPermissions,
                allPermissions: [...new Set(allPermissions)] // Eliminar duplicados
            };

            console.log('🔐 Información del sistema de permisos:', info);
            return of(info);
        } catch (error) {
            console.error('🚨 Error obteniendo información de permisos:', error);
            return of({
                currentRole: null,
                availableRoles: [],
                currentPermissions: [],
                allPermissions: []
            });
        }
    }
}

