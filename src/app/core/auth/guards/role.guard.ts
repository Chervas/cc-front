import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of, map, catchError, take } from 'rxjs';
import { RoleService, UserRole } from '../services/role.service';
import { PermissionService } from '../services/permission.service';

/**
 * 🛡️ GUARD DE PROTECCIÓN POR ROLES
 * 
 * Protege rutas basándose en roles y permisos del usuario
 * Se integra con RoleService y PermissionService existentes
 * Mantiene compatibilidad total con el sistema actual
 */
@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate, CanActivateChild {

    constructor(
        private roleService: RoleService,
        private permissionService: PermissionService,
        private router: Router
    ) {}

    /**
     * Protege rutas principales
     */
    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> {
        return this.checkAccess(route, state);
    }

    /**
     * Protege rutas hijas
     */
    canActivateChild(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> {
        return this.checkAccess(route, state);
    }

    /**
     * Lógica principal de verificación de acceso
     */
    private checkAccess(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> {
        return this.roleService.currentUser$.pipe(
            take(1),
            map(currentUser => {
                // ✅ VERIFICAR SI HAY USUARIO AUTENTICADO
                if (!currentUser) {
                    console.log('🛡️ RoleGuard: Usuario no autenticado, redirigiendo a login');
                    this.router.navigate(['/sign-in'], { 
                        queryParams: { returnUrl: state.url } 
                    });
                    return false;
                }

                // ✅ OBTENER CONFIGURACIÓN DE LA RUTA
                const routeConfig = this.extractRouteConfig(route);
                
                // ✅ SI NO HAY RESTRICCIONES, PERMITIR ACCESO
                if (!routeConfig.hasRestrictions) {
                    console.log('🛡️ RoleGuard: Ruta sin restricciones, acceso permitido');
                    return true;
                }

                // ✅ VERIFICAR ROLES REQUERIDOS
                if (routeConfig.requiredRoles.length > 0) {
                    const hasRequiredRole = this.checkRequiredRoles(
                        routeConfig.requiredRoles, 
                        currentUser
                    );
                    
                    if (!hasRequiredRole) {
                        console.log('🛡️ RoleGuard: Usuario no tiene rol requerido');
                        this.handleUnauthorizedAccess(state.url);
                        return false;
                    }
                }

                // ✅ VERIFICAR PERMISOS REQUERIDOS
                if (routeConfig.requiredPermissions.length > 0) {
                    const hasRequiredPermission = this.checkRequiredPermissions(
                        routeConfig.requiredPermissions
                    );
                    
                    if (!hasRequiredPermission) {
                        console.log('🛡️ RoleGuard: Usuario no tiene permiso requerido');
                        this.handleUnauthorizedAccess(state.url);
                        return false;
                    }
                }

                // ✅ VERIFICAR NIVEL MÍNIMO DE ROL
                if (routeConfig.minimumRoleLevel) {
                    const hasMinimumLevel = this.checkMinimumRoleLevel(
                        routeConfig.minimumRoleLevel
                    );
                    
                    if (!hasMinimumLevel) {
                        console.log('🛡️ RoleGuard: Usuario no tiene nivel mínimo de rol');
                        this.handleUnauthorizedAccess(state.url);
                        return false;
                    }
                }

                console.log('🛡️ RoleGuard: Acceso autorizado para:', state.url);
                return true;
            }),
            catchError(error => {
                console.error('🛡️ RoleGuard: Error verificando acceso:', error);
                this.router.navigate(['/error']);
                return of(false);
            })
        );
    }

    /**
     * Extrae la configuración de protección de la ruta
     */
    private extractRouteConfig(route: ActivatedRouteSnapshot): RouteConfig {
        const data = route.data || {};
        
        return {
            requiredRoles: this.normalizeRoles(data['requiredRoles'] || data['roles'] || []),
            requiredPermissions: this.normalizePermissions(data['requiredPermissions'] || data['permissions'] || []),
            minimumRoleLevel: data['minimumRoleLevel'] || data['minRole'] || null,
            allowedForGuests: data['allowGuests'] || false,
            requiresAdmin: data['requiresAdmin'] || false,
            hasRestrictions: this.hasAnyRestrictions(data)
        };
    }

    /**
     * Verifica si la ruta tiene alguna restricción configurada
     */
    private hasAnyRestrictions(data: any): boolean {
        return !!(
            data['requiredRoles'] || 
            data['roles'] || 
            data['requiredPermissions'] || 
            data['permissions'] || 
            data['minimumRoleLevel'] || 
            data['minRole'] || 
            data['requiresAdmin']
        );
    }

    /**
     * Normaliza los roles a un array de UserRole
     */
    private normalizeRoles(roles: any): UserRole[] {
        if (!roles) return [];
        
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.filter(role => 
            Object.values(UserRole).includes(role as UserRole)
        ) as UserRole[];
    }

    /**
     * Normaliza los permisos a un array de strings
     */
    private normalizePermissions(permissions: any): string[] {
        if (!permissions) return [];
        
        return Array.isArray(permissions) ? permissions : [permissions];
    }

    /**
     * Verifica si el usuario tiene alguno de los roles requeridos
     */
    private checkRequiredRoles(requiredRoles: UserRole[], currentUser: any): boolean {
        const userRoles = currentUser.roles || [];
        
        // Admin siempre tiene acceso
        if (userRoles.includes(UserRole.ADMIN)) return true;
        
        // Verificar si tiene alguno de los roles requeridos
        return requiredRoles.some(role => userRoles.includes(role));
    }

    /**
     * Verifica si el usuario tiene alguno de los permisos requeridos (síncrono)
     */
    private checkRequiredPermissions(requiredPermissions: string[]): boolean {
        // Usar método síncrono si está disponible
        if (typeof (this.permissionService as any).hasPermissionSync === 'function') {
            return requiredPermissions.some(permission => 
                (this.permissionService as any).hasPermissionSync(permission)
            );
        }
        
        // Fallback: asumir que tiene permisos si no se puede verificar síncronamente
        console.warn('🛡️ RoleGuard: Verificación síncrona de permisos no disponible');
        return true;
    }

    /**
     * Verifica si el usuario tiene el nivel mínimo de rol
     */
    private checkMinimumRoleLevel(minimumRole: UserRole): boolean {
        const currentUser = this.roleService.getCurrentUserSync?.() || null;
        const selectedRole = this.roleService.getSelectedRoleSync?.() || null;
        
        if (!currentUser || !selectedRole) return false;
        
        const roleLevels: { [key in UserRole]: number } = {
            [UserRole.ADMIN]: 5,
            [UserRole.PROPIETARIO]: 4,
            [UserRole.DOCTOR]: 3,
            [UserRole.PERSONAL_CLINICA]: 2,
            [UserRole.PACIENTE]: 1
        };
        
        const currentLevel = roleLevels[selectedRole] || 0;
        const minimumLevel = roleLevels[minimumRole] || 0;
        
        return currentLevel >= minimumLevel;
    }

    /**
     * Maneja acceso no autorizado
     */
    private handleUnauthorizedAccess(attemptedUrl: string): void {
        console.log('🛡️ RoleGuard: Acceso denegado a:', attemptedUrl);
        
        // Redirigir a página de acceso denegado o dashboard según el rol
        this.roleService.selectedRole$.pipe(take(1)).subscribe(role => {
            if (role === UserRole.PACIENTE) {
                this.router.navigate(['/paciente/dashboard']);
            } else if (role === UserRole.DOCTOR) {
                this.router.navigate(['/doctor/dashboard']);
            } else if (role === UserRole.PERSONAL_CLINICA) {
                this.router.navigate(['/personal/dashboard']);
            } else if (role === UserRole.PROPIETARIO) {
                this.router.navigate(['/propietario/dashboard']);
            } else {
                this.router.navigate(['/unauthorized'], {
                    queryParams: { attemptedUrl }
                });
            }
        });
    }
}

/**
 * 🔧 INTERFACE PARA CONFIGURACIÓN DE RUTAS
 */
interface RouteConfig {
    requiredRoles: UserRole[];
    requiredPermissions: string[];
    minimumRoleLevel: UserRole | null;
    allowedForGuests: boolean;
    requiresAdmin: boolean;
    hasRestrictions: boolean;
}

/**
 * 🎯 FUNCIONES DE UTILIDAD PARA CONFIGURAR RUTAS
 */

/**
 * Configuración rápida para rutas que requieren admin
 */
export const ADMIN_ONLY = {
    requiredRoles: [UserRole.ADMIN]
};

/**
 * Configuración rápida para rutas de propietarios
 */
export const PROPIETARIO_OR_ADMIN = {
    requiredRoles: [UserRole.PROPIETARIO, UserRole.ADMIN]
};

/**
 * Configuración rápida para rutas de doctores
 */
export const DOCTOR_OR_HIGHER = {
    minimumRoleLevel: UserRole.DOCTOR
};

/**
 * Configuración rápida para rutas de personal clínico
 */
export const CLINICAL_STAFF = {
    requiredRoles: [UserRole.DOCTOR, UserRole.PERSONAL_CLINICA, UserRole.PROPIETARIO, UserRole.ADMIN]
};

/**
 * Configuración rápida para rutas de pacientes
 */
export const PACIENTE_ONLY = {
    requiredRoles: [UserRole.PACIENTE]
};

/**
 * Configuración rápida para rutas accesibles por pacientes y personal clínico
 */
export const PACIENTE_OR_CLINICAL = {
    requiredRoles: [UserRole.PACIENTE, UserRole.DOCTOR, UserRole.PERSONAL_CLINICA, UserRole.PROPIETARIO, UserRole.ADMIN]
};

/**
 * Configuración rápida para rutas de personal clínico y superiores (excluye pacientes)
 */
export const CLINICAL_STAFF_ONLY = {
    minimumRoleLevel: UserRole.PERSONAL_CLINICA
};

/**
 * Configuración rápida para rutas accesibles por todos los usuarios autenticados
 */
export const AUTHENTICATED_USERS = {
    minimumRoleLevel: UserRole.PACIENTE
};

/**
 * Configuración rápida para rutas que requieren permisos específicos
 */
export const requiresPermissions = (permissions: string[]) => ({
    requiredPermissions: permissions
});

/**
 * Configuración rápida para rutas con nivel mínimo
 */
export const minimumRole = (role: UserRole) => ({
    minimumRoleLevel: role
});

