import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// ✅ RUTAS CORREGIDAS SEGÚN LA ESTRUCTURA DEL PROYECTO
import { RoleService, UserRole } from '../../services/role.service';
import { PermissionService, Permission } from '../../services/permission.service';

/**
 * ✅ ROLE GUARD - PROTECCIÓN DE RUTAS BASADA EN ROLES Y PERMISOS
 * 
 * Guard que protege rutas basándose en roles y permisos específicos.
 * Corregido con rutas correctas y tipado apropiado.
 */
@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {
    
    // ✅ TIPADO EXPLÍCITO DE LOS SERVICIOS INYECTADOS
    private roleService: RoleService = inject(RoleService);
    private permissionService: PermissionService = inject(PermissionService);
    private router: Router = inject(Router);

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> {
        console.log('🔒 RoleGuard: Verificando acceso a ruta:', state.url);

        // Obtener configuración de la ruta
        const routeData = route.data;
        const requiredRoles = routeData['requiredRoles'] as UserRole[];
        const requiredPermissions = routeData['requiredPermissions'] as string[];
        const minimumRoleLevel = routeData['minimumRoleLevel'] as number;

        // Si no hay restricciones, permitir acceso
        if (!requiredRoles && !requiredPermissions && !minimumRoleLevel) {
            console.log('🔒 RoleGuard: Sin restricciones, acceso permitido');
            return of(true);
        }

        // Verificar autenticación básica
        const currentUser = (this.roleService as any)['currentUserSubject']?.value;
        if (!currentUser) {
            console.log('🔒 RoleGuard: Usuario no autenticado, redirigiendo a login');
            this.router.navigate(['/sign-in']);
            return of(false);
        }

        // Verificar roles requeridos
        if (requiredRoles && requiredRoles.length > 0) {
            return this.checkRoles(requiredRoles, state.url);
        }

        // Verificar permisos requeridos
        if (requiredPermissions && requiredPermissions.length > 0) {
            return this.checkPermissions(requiredPermissions, state.url);
        }

        // Verificar nivel mínimo de rol
        if (minimumRoleLevel) {
            return this.checkMinimumRoleLevel(minimumRoleLevel, state.url);
        }

        // Por defecto, denegar acceso
        console.log('🔒 RoleGuard: Configuración no válida, acceso denegado');
        return of(false);
    }

    /**
     * Verifica si el usuario tiene alguno de los roles requeridos
     */
    private checkRoles(requiredRoles: UserRole[], url: string): Observable<boolean> {
        console.log('🔒 RoleGuard: Verificando roles requeridos:', requiredRoles);

        // ✅ VERIFICAR SI EL MÉTODO EXISTE ANTES DE USARLO
        if (typeof this.permissionService.hasAnyRole === 'function') {
            return this.permissionService.hasAnyRole(requiredRoles).pipe(
                map(hasRole => {
                    if (hasRole) {
                        console.log('✅ RoleGuard: Acceso permitido por rol');
                        return true;
                    } else {
                        console.log('❌ RoleGuard: Acceso denegado por rol');
                        this.handleAccessDenied(url);
                        return false;
                    }
                }),
                catchError(error => {
                    console.error('🚨 RoleGuard: Error verificando roles:', error);
                    this.handleAccessDenied(url);
                    return of(false);
                })
            );
        } else {
            // Fallback usando RoleService directamente
            const currentRole = this.roleService.getCurrentRole();
            const hasRole = currentRole && requiredRoles.includes(currentRole);
            
            if (hasRole) {
                console.log('✅ RoleGuard: Acceso permitido por rol (fallback)');
                return of(true);
            } else {
                console.log('❌ RoleGuard: Acceso denegado por rol (fallback)');
                this.handleAccessDenied(url);
                return of(false);
            }
        }
    }

    /**
     * Verifica si el usuario tiene alguno de los permisos requeridos
     * CORREGIDO: Convierte strings a enum Permission
     */
    private checkPermissions(requiredPermissions: string[], url: string): Observable<boolean> {
        console.log('🔒 RoleGuard: Verificando permisos requeridos:', requiredPermissions);

        // ✅ CONVERTIR STRINGS A ENUM PERMISSION
        const permissionEnums: Permission[] = requiredPermissions
            .map(permStr => this.stringToPermission(permStr))
            .filter(perm => perm !== null) as Permission[];

        if (permissionEnums.length === 0) {
            console.log('⚠️ RoleGuard: No se pudieron convertir los permisos, acceso denegado');
            this.handleAccessDenied(url);
            return of(false);
        }

        // ✅ VERIFICAR SI EL MÉTODO EXISTE ANTES DE USARLO
        if (typeof this.permissionService.hasAnyPermission === 'function') {
            return this.permissionService.hasAnyPermission(permissionEnums).pipe(
                map(hasPermission => {
                    if (hasPermission) {
                        console.log('✅ RoleGuard: Acceso permitido por permiso');
                        return true;
                    } else {
                        console.log('❌ RoleGuard: Acceso denegado por permiso');
                        this.handleAccessDenied(url);
                        return false;
                    }
                }),
                catchError(error => {
                    console.error('🚨 RoleGuard: Error verificando permisos:', error);
                    this.handleAccessDenied(url);
                    return of(false);
                })
            );
        } else {
            // Fallback: Si es admin, permitir acceso
            const isAdmin = this.roleService.isAdmin();
            if (isAdmin) {
                console.log('✅ RoleGuard: Acceso permitido por admin (fallback)');
                return of(true);
            } else {
                console.log('❌ RoleGuard: Acceso denegado (fallback)');
                this.handleAccessDenied(url);
                return of(false);
            }
        }
    }

    /**
     * Verifica si el usuario tiene el nivel mínimo de rol requerido
     */
    private checkMinimumRoleLevel(minimumLevel: number, url: string): Observable<boolean> {
        console.log('🔒 RoleGuard: Verificando nivel mínimo de rol:', minimumLevel);

        // ✅ VERIFICAR SI EL MÉTODO EXISTE ANTES DE USARLO
        if (typeof this.permissionService.hasMinimumRoleLevel === 'function') {
            return this.permissionService.hasMinimumRoleLevel(minimumLevel).pipe(
                map(hasLevel => {
                    if (hasLevel) {
                        console.log('✅ RoleGuard: Acceso permitido por nivel de rol');
                        return true;
                    } else {
                        console.log('❌ RoleGuard: Acceso denegado por nivel de rol');
                        this.handleAccessDenied(url);
                        return false;
                    }
                }),
                catchError(error => {
                    console.error('🚨 RoleGuard: Error verificando nivel de rol:', error);
                    this.handleAccessDenied(url);
                    return of(false);
                })
            );
        } else {
            // Fallback usando lógica simple
            const currentRole = this.roleService.getCurrentRole();
            const currentLevel = this.getRoleLevelFallback(currentRole);
            const hasLevel = currentLevel >= minimumLevel;
            
            if (hasLevel) {
                console.log('✅ RoleGuard: Acceso permitido por nivel de rol (fallback)');
                return of(true);
            } else {
                console.log('❌ RoleGuard: Acceso denegado por nivel de rol (fallback)');
                this.handleAccessDenied(url);
                return of(false);
            }
        }
    }

    /**
     * Convierte un string a enum Permission
     */
    private stringToPermission(permissionStr: string): Permission | null {
        // Mapeo de strings a enum Permission
        const permissionMap: Record<string, Permission> = {
            'manage_clinics': Permission.MANAGE_CLINICS,
            'view_clinics': Permission.VIEW_CLINICS,
            'view_patients': Permission.VIEW_PATIENTS,
            'manage_patients': Permission.MANAGE_PATIENTS,
            'manage_staff': Permission.MANAGE_STAFF,
            'view_staff': Permission.VIEW_STAFF,
            'manage_appointments': Permission.MANAGE_APPOINTMENTS,
            'view_appointments': Permission.VIEW_APPOINTMENTS,
            'access_reports': Permission.ACCESS_REPORTS,
            'view_analytics': Permission.VIEW_ANALYTICS,
            'manage_assets': Permission.MANAGE_ASSETS,
            'system_config': Permission.SYSTEM_CONFIG
        };

        return permissionMap[permissionStr] || null;
    }

    /**
     * Obtiene el nivel de rol (fallback cuando PermissionService no está disponible)
     */
    private getRoleLevelFallback(role: UserRole | null): number {
        if (!role) return 0;
        
        const levels = {
            [UserRole.ADMIN]: 5,
            [UserRole.PROPIETARIO]: 4,
            [UserRole.DOCTOR]: 3,
            [UserRole.PERSONAL_CLINICA]: 2,
            [UserRole.PACIENTE]: 1
        };
        
        return levels[role] || 0;
    }

    /**
     * Maneja el acceso denegado
     */
    private handleAccessDenied(url: string): void {
        console.log('🔒 RoleGuard: Manejando acceso denegado para:', url);

        // Determinar a dónde redirigir según el rol del usuario
        const currentRole = this.roleService.getCurrentRole();
        
        if (!currentRole) {
            this.router.navigate(['/sign-in']);
            return;
        }

        // Redirigir según el rol
        switch (currentRole) {
            case UserRole.ADMIN:
                this.router.navigate(['/admin']);
                break;
            case UserRole.PROPIETARIO:
                this.router.navigate(['/clinicas']);
                break;
            case UserRole.DOCTOR:
                this.router.navigate(['/pacientes']);
                break;
            case UserRole.PERSONAL_CLINICA:
                this.router.navigate(['/citas']);
                break;
            case UserRole.PACIENTE:
                this.router.navigate(['/mi-perfil']);
                break;
            default:
                this.router.navigate(['/']);
                break;
        }
    }
}

// =========================================
// 🔧 CONFIGURACIONES PREDEFINIDAS
// =========================================

/**
 * Configuración para rutas que requieren rol de administrador
 */
export const ADMIN_ROUTE_CONFIG = {
    requiredRoles: [UserRole.ADMIN]
};

/**
 * Configuración para rutas que requieren ser propietario o admin
 */
export const OWNER_ROUTE_CONFIG = {
    requiredRoles: [UserRole.ADMIN, UserRole.PROPIETARIO]
};

/**
 * Configuración para rutas que requieren ser personal médico
 */
export const MEDICAL_STAFF_ROUTE_CONFIG = {
    requiredRoles: [UserRole.ADMIN, UserRole.PROPIETARIO, UserRole.DOCTOR, UserRole.PERSONAL_CLINICA]
};

/**
 * Configuración para rutas que requieren gestión de clínicas
 */
export const CLINIC_MANAGEMENT_ROUTE_CONFIG = {
    requiredPermissions: ['manage_clinics']
};

/**
 * Configuración para rutas que requieren acceso a reportes
 */
export const REPORTS_ROUTE_CONFIG = {
    requiredPermissions: ['access_reports']
};

/**
 * Configuración para rutas que requieren nivel mínimo de propietario
 */
export const OWNER_LEVEL_ROUTE_CONFIG = {
    minimumRoleLevel: 4 // Nivel de propietario
};

