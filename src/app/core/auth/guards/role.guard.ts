import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take, switchMap } from 'rxjs/operators';
import { RoleService, UserRole } from '../../services/role.service';
import { PermissionService } from '../../services/permission.service';

/**
 * 🛡️ ROLE GUARD
 * Guard para proteger rutas basado en roles y permisos
 * ADAPTADO AL ROLESERVICE REAL (usa observables y métodos síncronos existentes)
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

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.checkAccess(route, state);
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.checkAccess(route, state);
    }

    private checkAccess(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        const routeData = route.data;

        // Si no hay restricciones, permitir acceso
        if (!routeData || (!routeData['requiredRoles'] && !routeData['requiredPermissions'] && !routeData['minimumRoleLevel'])) {
            return of(true);
        }

        // Verificar autenticación primero usando observable currentUser$
        return this.roleService.currentUser$.pipe(
            take(1),
            switchMap(currentUser => {
                if (!currentUser) {
                    console.log('🛡️ RoleGuard: Usuario no autenticado');
                    this.router.navigate(['/sign-in']);
                    return of(false);
                }

                // Verificar roles requeridos
                if (routeData['requiredRoles']) {
                    return this.checkRequiredRoles(routeData['requiredRoles'], state.url);
                }

                // Verificar permisos requeridos
                if (routeData['requiredPermissions']) {
                    return this.checkRequiredPermissions(routeData['requiredPermissions'], state.url);
                }

                // Verificar nivel mínimo de rol
                if (routeData['minimumRoleLevel']) {
                    return this.checkMinimumRoleLevel(routeData['minimumRoleLevel'], state.url);
                }

                return of(true);
            })
        );
    }

    private checkRequiredRoles(requiredRoles: UserRole[], targetUrl: string): Observable<boolean> {
        return this.permissionService.hasAnyRole(requiredRoles).pipe(
            take(1),
            map(hasRole => {
                if (!hasRole) {
                    console.log('🛡️ RoleGuard: Acceso denegado - Roles requeridos:', requiredRoles);
                    this.redirectBasedOnRole(targetUrl);
                    return false;
                }
                console.log('🛡️ RoleGuard: Acceso permitido - Roles:', requiredRoles);
                return true;
            })
        );
    }

    private checkRequiredPermissions(requiredPermissions: string[], targetUrl: string): Observable<boolean> {
        return this.permissionService.hasAnyPermission(requiredPermissions).pipe(
            take(1),
            map(hasPermission => {
                if (!hasPermission) {
                    console.log('🛡️ RoleGuard: Acceso denegado - Permisos requeridos:', requiredPermissions);
                    this.redirectBasedOnRole(targetUrl);
                    return false;
                }
                console.log('🛡️ RoleGuard: Acceso permitido - Permisos:', requiredPermissions);
                return true;
            })
        );
    }

    private checkMinimumRoleLevel(minimumLevel: number, targetUrl: string): Observable<boolean> {
        // Usar método síncrono getCurrentRole() que SÍ existe
        const currentRole = this.roleService.getCurrentRole() as UserRole;
        
        const roleHierarchy: { [key in UserRole]: number } = {
            'paciente': 1,
            'personaldeclinica': 2,
            'doctor': 3,
            'propietario': 4,
            'admin': 5
        };

        const currentLevel = currentRole ? roleHierarchy[currentRole] : 0;
        
        if (currentLevel < minimumLevel) {
            console.log('🛡️ RoleGuard: Acceso denegado - Nivel insuficiente:', currentLevel, '<', minimumLevel);
            this.redirectBasedOnRole(targetUrl);
            return of(false);
        }
        
        console.log('🛡️ RoleGuard: Acceso permitido - Nivel:', currentLevel, '>=', minimumLevel);
        return of(true);
    }

    private redirectBasedOnRole(originalUrl: string): void {
        // Usar método síncrono getCurrentRole() que SÍ existe
        const currentRole = this.roleService.getCurrentRole() as UserRole;
        let redirectUrl = '/example'; // URL por defecto

        switch (currentRole) {
            case 'admin':
                redirectUrl = '/admin/dashboard';
                break;
            case 'propietario':
                redirectUrl = '/clinicas';
                break;
            case 'doctor':
                redirectUrl = '/pacientes';
                break;
            case 'personaldeclinica':
                redirectUrl = '/citas';
                break;
            case 'paciente':
                redirectUrl = '/paciente/dashboard';
                break;
            default:
                redirectUrl = '/example';
        }

        // Preservar URL original para redirección posterior
        this.router.navigate([redirectUrl], { 
            queryParams: { returnUrl: originalUrl } 
        });
    }
}

/**
 * 🎯 CONFIGURACIONES PREDEFINIDAS PARA RUTAS
 */

// Solo administradores
export const ADMIN_ONLY = {
    requiredRoles: ['admin' as UserRole]
};

// Propietarios y administradores
export const PROPIETARIO_OR_ADMIN = {
    requiredRoles: ['propietario' as UserRole, 'admin' as UserRole]
};

// Personal médico (doctor o superior)
export const DOCTOR_OR_HIGHER = {
    minimumRoleLevel: 3
};

// Personal clínico (excluye pacientes)
export const CLINICAL_STAFF_ONLY = {
    requiredRoles: ['doctor' as UserRole, 'personaldeclinica' as UserRole, 'propietario' as UserRole, 'admin' as UserRole]
};

// Solo pacientes
export const PACIENTE_ONLY = {
    requiredRoles: ['paciente' as UserRole]
};

// Pacientes y personal clínico
export const PACIENTE_OR_CLINICAL = {
    requiredRoles: ['paciente' as UserRole, 'doctor' as UserRole, 'personaldeclinica' as UserRole, 'propietario' as UserRole, 'admin' as UserRole]
};

// Personal clínico (excluye pacientes)
export const CLINICAL_STAFF = {
    requiredRoles: ['doctor' as UserRole, 'personaldeclinica' as UserRole, 'propietario' as UserRole, 'admin' as UserRole]
};

// Todos los usuarios autenticados
export const AUTHENTICATED_USERS = {
    // Sin restricciones específicas, solo requiere autenticación
};

// Configuraciones específicas para pacientes
export const PATIENT_OWN_DATA = {
    requiredRoles: ['paciente' as UserRole],
    requiredPermissions: ['patients.view.own']
};

export const PATIENT_EDIT_OWN = {
    requiredRoles: ['paciente' as UserRole],
    requiredPermissions: ['patients.edit.own']
};

export const PATIENT_APPOINTMENTS = {
    requiredRoles: ['paciente' as UserRole],
    requiredPermissions: ['appointments.view.own', 'appointments.manage.own']
};

export const PATIENT_COMMUNICATION = {
    requiredRoles: ['paciente' as UserRole],
    requiredPermissions: ['communication.patient']
};

/**
 * 🎯 FUNCIONES DE UTILIDAD
 */

/**
 * Crea configuración para permisos específicos
 */
export function requiresPermissions(permissions: string[]) {
    return { requiredPermissions: permissions };
}

/**
 * Crea configuración para nivel mínimo de rol
 */
export function minimumRole(level: number) {
    return { minimumRoleLevel: level };
}

/**
 * Crea configuración para roles específicos
 */
export function requiresRoles(roles: UserRole[]) {
    return { requiredRoles: roles };
}

