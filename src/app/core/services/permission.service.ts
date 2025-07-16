import { Injectable } from '@angular/core';
import { Observable, of, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { RoleService, ROL_PERMISSIONS, ROL_LEVELS, UsuarioClinicaResponse } from './role.service';

@Injectable({
    providedIn: 'root'
})
export class PermissionService {

    constructor(private roleService: RoleService) {}

    // ✅ USAR PROPIEDADES REALES - VERIFICADO
    hasPermission(permission: string): Observable<boolean> {
        return this.roleService.selectedRole$.pipe(
            map(currentRole => {
                if (!currentRole) return false;
                
                const permissions = this.roleService.getCurrentPermissions();
                return permissions.includes(permission);
            })
        );
    }

    hasAnyPermission(permissions: string[]): Observable<boolean> {
        return this.roleService.selectedRole$.pipe(
            map(currentRole => {
                if (!currentRole) return false;
                
                const userPermissions = this.roleService.getCurrentPermissions();
                return permissions.some(permission => userPermissions.includes(permission));
            })
        );
    }

    hasAllPermissions(permissions: string[]): Observable<boolean> {
        return this.roleService.selectedRole$.pipe(
            map(currentRole => {
                if (!currentRole) return false;
                
                const userPermissions = this.roleService.getCurrentPermissions();
                return permissions.every(permission => userPermissions.includes(permission));
            })
        );
    }

    // ✅ USAR PROPIEDADES REALES - VERIFICADO
    hasRole(role: string): Observable<boolean> {
        return this.roleService.clinicasConRol$.pipe(
            map(clinicas => {
                return clinicas.some(clinica => clinica.userRole === role);  // ← PROPIEDAD REAL
            })
        );
    }

    // ✅ USAR PROPIEDADES REALES - VERIFICADO
    hasAnyRole(roles: string[]): Observable<boolean> {
        return this.roleService.clinicasConRol$.pipe(
            map(clinicas => {
                const userRoles = clinicas.map(clinica => clinica.userRole);  // ← PROPIEDAD REAL
                return roles.some(role => userRoles.includes(role));
            })
        );
    }

    hasMinimumRoleLevel(minimumLevel: number): Observable<boolean> {
        return this.roleService.selectedRole$.pipe(
            map(currentRole => {
                if (!currentRole) return false;
                
                const currentLevel = this.getRoleLevel(currentRole);
                return currentLevel >= minimumLevel;
            })
        );
    }

    // ✅ USAR CONSTANTE ÚNICA - VERIFICADO
    private getRoleLevel(role: string): number {
        return ROL_LEVELS[role as keyof typeof ROL_LEVELS] || 0;
    }

    getCurrentRole(): string | null {
        return this.roleService.getCurrentRole();
    }

    getCurrentPermissions(): string[] {
        return this.roleService.getCurrentPermissions();
    }

    isAdmin(): Observable<boolean> {
        return this.hasRole('administrador');
    }

    canManageClinic(): Observable<boolean> {
        return this.hasPermission('clinic.manage');
    }

    canManageUsers(): Observable<boolean> {
        return this.hasPermission('users.manage');
    }

    canViewReports(): Observable<boolean> {
        return this.hasPermission('reports.view');
    }

    canManagePatients(): Observable<boolean> {
        return this.hasAnyPermission(['patients.manage', 'patients.edit']);
    }

    reloadPermissions(): void {
        console.log('Permisos recargados automáticamente');
    }

    canAccessResource(resource: string, action: string): Observable<boolean> {
        const permission = `${resource}.${action}`;
        return this.hasPermission(permission);
    }

    getPermissionsByRole(role: string): string[] {
        return [...(ROL_PERMISSIONS[role as keyof typeof ROL_PERMISSIONS] || [])];
    }

    // ✅ USAR PROPIEDADES REALES - VERIFICADO
    canPerformActionInClinic(action: string, clinicId: number): Observable<boolean> {
        return combineLatest([
            this.roleService.selectedClinica$,
            this.roleService.selectedRole$
        ]).pipe(
            map(([selectedClinica, selectedRole]) => {
                if (!selectedClinica || !selectedRole) return false;
                if (selectedClinica.id !== clinicId) return false;  // ← PROPIEDAD REAL
                
                const permissions = this.roleService.getCurrentPermissions();
                return permissions.includes(action);
            })
        );
    }
}

