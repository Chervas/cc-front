import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { RoleService, UserRole } from './role.service';
import { ROLE_CONFIG } from '../constants/role.constants';

/**
 * 🔐 SERVICIO DE PERMISOS GRANULARES
 * 
 * Proporciona verificación detallada de permisos basada en roles
 * Se integra con RoleService existente sin modificar funcionalidad
 * Utiliza los permisos definidos en ROLE_CONFIG.ROLE_PERMISSIONS
 */
@Injectable({
    providedIn: 'root'
})
export class PermissionService {

    constructor(private roleService: RoleService) {}

    // 🎯 **VERIFICACIÓN DE PERMISOS PRINCIPALES**

    /**
     * Verifica si el usuario actual tiene un permiso específico
     * @param permission - Permiso a verificar (ej: 'clinic.manage', 'clinic.view_patients')
     * @returns Observable<boolean> - true si tiene el permiso
     */
    hasPermission(permission: string): Observable<boolean> {
        return this.roleService.selectedRole$.pipe(
            map(currentRole => {
                if (!currentRole) return false;
                
                const rolePermissions = ROLE_CONFIG.ROLE_PERMISSIONS[currentRole] || [];
                
                // Admin tiene todos los permisos
                if (rolePermissions.includes('*')) return true;
                
                // Verificar permiso específico
                return rolePermissions.includes(permission);
            })
        );
    }

    /**
     * Verifica si el usuario tiene cualquiera de los permisos especificados
     * @param permissions - Array de permisos a verificar
     * @returns Observable<boolean> - true si tiene al menos uno
     */
    hasAnyPermission(permissions: string[]): Observable<boolean> {
        return this.roleService.selectedRole$.pipe(
            map(currentRole => {
                if (!currentRole) return false;
                
                const rolePermissions = ROLE_CONFIG.ROLE_PERMISSIONS[currentRole] || [];
                
                // Admin tiene todos los permisos
                if (rolePermissions.includes('*')) return true;
                
                // Verificar si tiene alguno de los permisos
                return permissions.some(permission => rolePermissions.includes(permission));
            })
        );
    }

    /**
     * Verifica si el usuario tiene todos los permisos especificados
     * @param permissions - Array de permisos a verificar
     * @returns Observable<boolean> - true si tiene todos
     */
    hasAllPermissions(permissions: string[]): Observable<boolean> {
        return this.roleService.selectedRole$.pipe(
            map(currentRole => {
                if (!currentRole) return false;
                
                const rolePermissions = ROLE_CONFIG.ROLE_PERMISSIONS[currentRole] || [];
                
                // Admin tiene todos los permisos
                if (rolePermissions.includes('*')) return true;
                
                // Verificar si tiene todos los permisos
                return permissions.every(permission => rolePermissions.includes(permission));
            })
        );
    }

    // 🎯 **VERIFICACIÓN DE ROLES**

    /**
     * Verifica si el usuario tiene un rol específico
     * @param role - Rol a verificar
     * @returns Observable<boolean> - true si tiene el rol
     */
    hasRole(role: UserRole): Observable<boolean> {
        return this.roleService.availableRoles$.pipe(
            map(availableRoles => availableRoles.includes(role))
        );
    }

    /**
     * Verifica si el usuario tiene cualquiera de los roles especificados
     * @param roles - Array de roles a verificar
     * @returns Observable<boolean> - true si tiene al menos uno
     */
    hasAnyRole(roles: UserRole[]): Observable<boolean> {
        return this.roleService.availableRoles$.pipe(
            map(availableRoles => 
                roles.some(role => availableRoles.includes(role))
            )
        );
    }

    /**
     * Verifica si el usuario es administrador
     * @returns Observable<boolean> - true si es admin
     */
    isAdmin(): Observable<boolean> {
        return this.roleService.currentUser$.pipe(
            map(user => user?.isAdmin || false)
        );
    }

    // 🎯 **VERIFICACIONES ESPECÍFICAS DEL NEGOCIO (BASADAS EN PERMISOS REALES)**

    /**
     * Verifica si el usuario puede gestionar clínicas
     * @returns Observable<boolean>
     */
    canManageClinics(): Observable<boolean> {
        return this.hasAnyPermission(['clinic.manage', '*']);
    }

    /**
     * Verifica si el usuario puede ver pacientes
     * @returns Observable<boolean>
     */
    canViewPatients(): Observable<boolean> {
        return this.hasAnyPermission(['clinic.view_patients', '*']);
    }

    /**
     * Verifica si el usuario puede gestionar personal
     * @returns Observable<boolean>
     */
    canManageStaff(): Observable<boolean> {
        return this.hasAnyPermission(['clinic.manage_staff', '*']);
    }

    /**
     * Verifica si el usuario puede gestionar citas
     * @returns Observable<boolean>
     */
    canManageAppointments(): Observable<boolean> {
        return this.hasAnyPermission(['clinic.manage_appointments', 'appointments.manage', '*']);
    }

    /**
     * Verifica si el usuario puede acceder a reportes
     * @returns Observable<boolean>
     */
    canAccessReports(): Observable<boolean> {
        return this.hasAnyPermission(['reports.view_all', 'reports.view_own', '*']);
    }

    /**
     * Verifica si el usuario puede gestionar configuración
     * @returns Observable<boolean>
     */
    canManageSettings(): Observable<boolean> {
        return this.hasAnyPermission(['clinic.manage_settings', 'settings.manage', '*']);
    }

    /**
     * Verifica si el usuario puede gestionar activos/mapas
     * @returns Observable<boolean>
     */
    canManageAssets(): Observable<boolean> {
        return this.hasAnyPermission(['assets.map', '*']);
    }

    /**
     * Verifica si el usuario puede ver registros médicos
     * @returns Observable<boolean>
     */
    canViewMedicalRecords(): Observable<boolean> {
        return this.hasAnyPermission(['clinic.view_medical_records', 'medical_records.view_own', '*']);
    }

    /**
     * Verifica si el usuario puede crear prescripciones
     * @returns Observable<boolean>
     */
    canCreatePrescriptions(): Observable<boolean> {
        return this.hasAnyPermission(['clinic.create_prescriptions', '*']);
    }

    /**
     * Verifica si el usuario puede gestionar usuarios del sistema
     * @returns Observable<boolean>
     */
    canManageUsers(): Observable<boolean> {
        return this.hasAnyPermission(['users.manage', '*']);
    }

    /**
     * Verifica si el usuario puede gestionar el sistema completo
     * @returns Observable<boolean>
     */
    canManageSystem(): Observable<boolean> {
        return this.hasAnyPermission(['system.manage', '*']);
    }

    // 🎯 **VERIFICACIONES DE ACCIONES SENSIBLES**

    /**
     * Verifica si el usuario puede eliminar clínicas
     * @returns Observable<boolean>
     */
    canDeleteClinics(): Observable<boolean> {
        return this.hasPermission('clinic.delete');
    }

    /**
     * Verifica si el usuario puede exportar datos
     * @returns Observable<boolean>
     */
    canExportData(): Observable<boolean> {
        return this.hasPermission('data.export');
    }

    /**
     * Verifica si el usuario requiere validación adicional para ciertas acciones
     * @param action - Acción a verificar
     * @returns Observable<boolean>
     */
    requiresAdditionalValidation(action: string): Observable<boolean> {
        return this.roleService.selectedRole$.pipe(
            map(currentRole => {
                if (!currentRole) return true;
                
                const sensitiveActions = ROLE_CONFIG.SENSITIVE_ACTIONS || {};
                const actionRoles = sensitiveActions[action] || [];
                
                return actionRoles.includes(currentRole);
            })
        );
    }

    // 🎯 **MÉTODOS DE UTILIDAD**

    /**
     * Obtiene todos los permisos del rol actual
     * @returns Observable<string[]> - Array de permisos
     */
    getCurrentPermissions(): Observable<string[]> {
        return this.roleService.selectedRole$.pipe(
            map(currentRole => {
                if (!currentRole) return [];
                return ROLE_CONFIG.ROLE_PERMISSIONS[currentRole] || [];
            })
        );
    }

    /**
     * Verifica si el usuario puede acceder a una ruta específica
     * @param routePath - Ruta a verificar
     * @returns Observable<boolean>
     */
    canAccessRoute(routePath: string): Observable<boolean> {
        // Mapeo de rutas a permisos requeridos basado en el sistema real
        const routePermissions: { [key: string]: string[] } = {
            '/admin': ['*'],
            '/clinicas': ['clinic.manage', 'clinic.view_patients', '*'],
            '/pacientes': ['clinic.view_patients', '*'],
            '/personal': ['clinic.manage_staff', '*'],
            '/reportes': ['reports.view_all', 'reports.view_own', '*'],
            '/configuracion': ['clinic.manage_settings', 'settings.manage', '*'],
            '/activos': ['assets.map', '*'],
            '/citas': ['clinic.manage_appointments', 'appointments.manage', 'appointments.view', '*'],
            '/historiales': ['clinic.view_medical_records', 'medical_records.view_own', '*']
        };

        const requiredPermissions = routePermissions[routePath];
        if (!requiredPermissions) return this.roleService.currentUser$.pipe(map(() => true));

        return this.hasAnyPermission(requiredPermissions);
    }

    /**
     * Obtiene el nivel de jerarquía del rol actual
     * @returns Observable<number> - Nivel jerárquico (mayor = más permisos)
     */
    getCurrentRoleLevel(): Observable<number> {
        return this.roleService.selectedRole$.pipe(
            map(currentRole => {
                if (!currentRole) return 0;
                
                const roleLevels: { [key in UserRole]: number } = {
                    [UserRole.ADMIN]: 5,
                    [UserRole.PROPIETARIO]: 4,
                    [UserRole.DOCTOR]: 3,
                    [UserRole.PERSONAL_CLINICA]: 2,
                    [UserRole.PACIENTE]: 1
                };
                
                return roleLevels[currentRole] || 0;
            })
        );
    }

    /**
     * Verifica si el rol actual tiene mayor o igual jerarquía que el especificado
     * @param minimumRole - Rol mínimo requerido
     * @returns Observable<boolean>
     */
    hasMinimumRoleLevel(minimumRole: UserRole): Observable<boolean> {
        return this.getCurrentRoleLevel().pipe(
            map(currentLevel => {
                const roleLevels: { [key in UserRole]: number } = {
                    [UserRole.ADMIN]: 5,
                    [UserRole.PROPIETARIO]: 4,
                    [UserRole.DOCTOR]: 3,
                    [UserRole.PERSONAL_CLINICA]: 2,
                    [UserRole.PACIENTE]: 1
                };
                
                const minimumLevel = roleLevels[minimumRole] || 0;
                return currentLevel >= minimumLevel;
            })
        );
    }

    // 🎯 **MÉTODOS SÍNCRONOS (PARA CASOS ESPECÍFICOS)**
    // Nota: Estos métodos requieren que se agreguen los métodos síncronos al RoleService

    /**
     * Verificación síncrona de permisos (usar solo cuando sea necesario)
     * @param permission - Permiso a verificar
     * @returns boolean - true si tiene el permiso
     */
    hasPermissionSync(permission: string): boolean {
        // Verificar si el RoleService tiene métodos síncronos
        if (typeof (this.roleService as any).getSelectedRoleSync !== 'function') {
            console.warn('⚠️ Métodos síncronos no disponibles en RoleService');
            return false;
        }

        const selectedRole = (this.roleService as any).getSelectedRoleSync();
        
        if (!selectedRole) return false;
        
        const rolePermissions = ROLE_CONFIG.ROLE_PERMISSIONS[selectedRole] || [];
        
        // Admin tiene todos los permisos
        if (rolePermissions.includes('*')) return true;
        
        // Verificar permiso específico
        return rolePermissions.includes(permission);
    }

    /**
     * Verificación síncrona de rol admin
     * @returns boolean - true si es admin
     */
    isAdminSync(): boolean {
        // Verificar si el RoleService tiene métodos síncronos
        if (typeof (this.roleService as any).isAdminSync !== 'function') {
            console.warn('⚠️ Métodos síncronos no disponibles en RoleService');
            return false;
        }

        return (this.roleService as any).isAdminSync();
    }

    /**
     * Verificación síncrona de rol específico
     * @param role - Rol a verificar
     * @returns boolean - true si tiene el rol
     */
    hasRoleSync(role: UserRole): boolean {
        // Verificar si el RoleService tiene métodos síncronos
        if (typeof (this.roleService as any).hasRoleSync !== 'function') {
            console.warn('⚠️ Métodos síncronos no disponibles en RoleService');
            return false;
        }

        return (this.roleService as any).hasRoleSync(role);
    }
}

