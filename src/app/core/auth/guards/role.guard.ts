import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { RoleService, ROL_LEVELS } from '../../services/role.service';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {

    constructor(
        private roleService: RoleService,
        private router: Router
    ) {}

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> | Promise<boolean> | boolean {

        // ✅ USAR TIPOS STRING - VERIFICADO
        const requiredRoles = route.data['roles'] as string[];
        const requiredPermissions = route.data['permissions'] as string[];
        const minimumLevel = route.data['minimumLevel'] as number;

        return this.checkAccess(requiredRoles, requiredPermissions, minimumLevel).pipe(
            map(hasAccess => {
                if (!hasAccess) {
                    console.warn('🚫 RoleGuard: Acceso denegado para la ruta:', state.url);
                    this.router.navigate(['/unauthorized']);
                    return false;
                }
                return true;
            }),
            catchError(error => {
                console.error('🚫 RoleGuard: Error verificando acceso:', error);
                this.router.navigate(['/error']);
                return of(false);
            })
        );
    }

    // ✅ VERIFICAR ACCESO USANDO TIPOS STRING - VERIFICADO
    private checkAccess(
        requiredRoles?: string[],
        requiredPermissions?: string[],
        minimumLevel?: number
    ): Observable<boolean> {

        return this.roleService.selectedRole$.pipe(
            map(currentRole => {
                if (!currentRole) {
                    console.warn('🚫 RoleGuard: No hay rol seleccionado');
                    return false;
                }

                // Verificar roles requeridos
                if (requiredRoles && requiredRoles.length > 0) {
                    // ✅ USAR TIPOS STRING - VERIFICADO
                    const hasRole = requiredRoles.includes(currentRole);
                    if (!hasRole) {
                        console.warn('🚫 RoleGuard: Rol insuficiente. Requerido:', requiredRoles, 'Actual:', currentRole);
                        return false;
                    }
                }

                // Verificar permisos requeridos
                if (requiredPermissions && requiredPermissions.length > 0) {
                    const currentPermissions = this.roleService.getCurrentPermissions();
                    const hasAllPermissions = requiredPermissions.every(permission => 
                        currentPermissions.includes(permission)
                    );
                    if (!hasAllPermissions) {
                        console.warn('🚫 RoleGuard: Permisos insuficientes. Requeridos:', requiredPermissions, 'Actuales:', currentPermissions);
                        return false;
                    }
                }

                // Verificar nivel mínimo
                if (minimumLevel !== undefined) {
                    // ✅ USAR CONSTANTE ÚNICA - VERIFICADO
                    const currentLevel = this.getRoleLevel(currentRole);
                    if (currentLevel < minimumLevel) {
                        console.warn('🚫 RoleGuard: Nivel insuficiente. Requerido:', minimumLevel, 'Actual:', currentLevel);
                        return false;
                    }
                }

                console.log('✅ RoleGuard: Acceso permitido para rol:', currentRole);
                return true;
            })
        );
    }

    // ✅ USAR CONSTANTE ÚNICA - VERIFICADO
    private getRoleLevel(role: string): number {
        return ROL_LEVELS[role as keyof typeof ROL_LEVELS] || 0;
    }

    // ✅ MÉTODOS DE CONVENIENCIA USANDO TIPOS STRING - VERIFICADO
    canActivateForRole(role: string): Observable<boolean> {
        return this.checkAccess([role]);
    }

    canActivateForPermission(permission: string): Observable<boolean> {
        return this.checkAccess(undefined, [permission]);
    }

    canActivateForLevel(level: number): Observable<boolean> {
        return this.checkAccess(undefined, undefined, level);
    }

    canActivateForAdmin(): Observable<boolean> {
        return this.canActivateForRole('administrador');
    }

    canActivateForStaff(): Observable<boolean> {
        return this.checkAccess(['administrador', 'propietario', 'doctor', 'personal']);
    }

    canActivateForManagement(): Observable<boolean> {
        return this.checkAccess(undefined, ['clinic.manage', 'users.manage']);
    }
}

