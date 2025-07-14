import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, distinctUntilChanged, shareReplay } from 'rxjs/operators';

// 🔗 INTEGRACIÓN CON ROLE SERVICE
import { RoleService, UserRole } from './role.service';

// 🔐 DEFINICIÓN DE PERMISOS ESPECÍFICOS
export enum Permission {
    // Gestión de Clínicas
    MANAGE_CLINICS = 'manage_clinics',
    VIEW_CLINICS = 'view_clinics',
    
    // Gestión de Pacientes
    VIEW_PATIENTS = 'view_patients',
    MANAGE_PATIENTS = 'manage_patients',
    
    // Gestión de Personal
    MANAGE_STAFF = 'manage_staff',
    VIEW_STAFF = 'view_staff',
    
    // Gestión de Citas
    MANAGE_APPOINTMENTS = 'manage_appointments',
    VIEW_APPOINTMENTS = 'view_appointments',
    
    // Reportes y Analytics
    ACCESS_REPORTS = 'access_reports',
    VIEW_ANALYTICS = 'view_analytics',
    
    // Gestión de Activos Meta
    MANAGE_ASSETS = 'manage_assets',
    
    // Configuraciones del Sistema
    SYSTEM_CONFIG = 'system_config'
}

// 🗺️ MAPEO DE ROLES A PERMISOS
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    [UserRole.ADMIN]: [
        Permission.MANAGE_CLINICS,
        Permission.VIEW_CLINICS,
        Permission.MANAGE_PATIENTS,
        Permission.VIEW_PATIENTS,
        Permission.MANAGE_STAFF,
        Permission.VIEW_STAFF,
        Permission.MANAGE_APPOINTMENTS,
        Permission.VIEW_APPOINTMENTS,
        Permission.ACCESS_REPORTS,
        Permission.VIEW_ANALYTICS,
        Permission.MANAGE_ASSETS,
        Permission.SYSTEM_CONFIG
    ],
    [UserRole.PROPIETARIO]: [
        Permission.VIEW_CLINICS,
        Permission.MANAGE_PATIENTS,
        Permission.VIEW_PATIENTS,
        Permission.MANAGE_STAFF,
        Permission.VIEW_STAFF,
        Permission.MANAGE_APPOINTMENTS,
        Permission.VIEW_APPOINTMENTS,
        Permission.ACCESS_REPORTS,
        Permission.VIEW_ANALYTICS,
        Permission.MANAGE_ASSETS
    ],
    [UserRole.DOCTOR]: [
        Permission.VIEW_CLINICS,
        Permission.MANAGE_PATIENTS,
        Permission.VIEW_PATIENTS,
        Permission.VIEW_STAFF,
        Permission.MANAGE_APPOINTMENTS,
        Permission.VIEW_APPOINTMENTS,
        Permission.VIEW_ANALYTICS
    ],
    [UserRole.PERSONAL_CLINICA]: [
        Permission.VIEW_CLINICS,
        Permission.VIEW_PATIENTS,
        Permission.MANAGE_APPOINTMENTS,
        Permission.VIEW_APPOINTMENTS
    ],
    [UserRole.PACIENTE]: [
        Permission.VIEW_APPOINTMENTS
    ]
};

// 🗺️ MAPEO DE RUTAS A PERMISOS REQUERIDOS
const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
    '/admin': [Permission.SYSTEM_CONFIG],
    '/admin/roles': [Permission.SYSTEM_CONFIG],
    '/clinicas': [Permission.VIEW_CLINICS],
    '/clinicas/manage': [Permission.MANAGE_CLINICS],
    '/pacientes': [Permission.VIEW_PATIENTS],
    '/pacientes/manage': [Permission.MANAGE_PATIENTS],
    '/personal': [Permission.VIEW_STAFF],
    '/personal/manage': [Permission.MANAGE_STAFF],
    '/citas': [Permission.VIEW_APPOINTMENTS],
    '/citas/manage': [Permission.MANAGE_APPOINTMENTS],
    '/reportes': [Permission.ACCESS_REPORTS],
    '/assets': [Permission.MANAGE_ASSETS]
};

@Injectable({
    providedIn: 'root'
})
export class PermissionService {
    private roleService = inject(RoleService);

    // 🔍 OBSERVABLES PARA PERMISOS ACTUALES
    private currentPermissionsSubject = new BehaviorSubject<Permission[]>([]);
    public currentPermissions$ = this.currentPermissionsSubject.asObservable();

    // 🔄 OBSERVABLE COMBINADO PARA SINCRONIZACIÓN
    private rolePermissions$ = combineLatest([
        this.roleService.currentUser$,
        this.roleService.selectedRole$
    ]).pipe(
        map(([user, selectedRole]) => {
            console.log('🔄 PermissionService: Actualizando permisos', { user: !!user, selectedRole });
            
            if (!user || !selectedRole) {
                console.log('🔐 PermissionService: Sin usuario o rol seleccionado');
                return [];
            }
            
            const permissions = ROLE_PERMISSIONS[selectedRole] || [];
            console.log('🔐 PermissionService: Permisos para rol', selectedRole, ':', permissions);
            return permissions;
        }),
        distinctUntilChanged(),
        shareReplay(1)
    );

    constructor() {
        this.initializePermissions();
    }

    // 🔄 INICIALIZACIÓN DE PERMISOS
    private initializePermissions(): void {
        console.log('🔄 PermissionService: Inicializando...');
        
        this.rolePermissions$.subscribe(permissions => {
            console.log('🔄 PermissionService: Permisos actualizados:', permissions);
            this.currentPermissionsSubject.next(permissions);
        });
    }

    // 🔍 MÉTODOS DE VERIFICACIÓN DE PERMISOS

    /**
     * Verifica si el usuario tiene un permiso específico
     */
    hasPermission(permission: Permission): Observable<boolean> {
        return this.rolePermissions$.pipe(
            map(permissions => {
                const hasPermission = permissions.includes(permission);
                console.log('🔐 hasPermission(' + permission + '):', hasPermission);
                return hasPermission;
            })
        );
    }

    /**
     * Verifica si el usuario tiene alguno de los permisos especificados
     */
    hasAnyPermission(permissions: Permission[]): Observable<boolean> {
        return this.rolePermissions$.pipe(
            map(userPermissions => {
                const hasAny = permissions.some(permission => userPermissions.includes(permission));
                console.log('🔐 hasAnyPermission(' + permissions.join(', ') + '):', hasAny);
                return hasAny;
            })
        );
    }

    /**
     * Verifica si el usuario tiene todos los permisos especificados
     */
    hasAllPermissions(permissions: Permission[]): Observable<boolean> {
        return this.rolePermissions$.pipe(
            map(userPermissions => {
                const hasAll = permissions.every(permission => userPermissions.includes(permission));
                console.log('🔐 hasAllPermissions(' + permissions.join(', ') + '):', hasAll);
                return hasAll;
            })
        );
    }

    /**
     * Verifica si el usuario tiene alguno de los roles especificados
     */
    hasAnyRole(roles: UserRole[]): Observable<boolean> {
        return this.roleService.selectedRole$.pipe(
            map(currentRole => {
                if (!currentRole) {
                    console.log('🔐 hasAnyRole(' + roles.join(', ') + '): false (no current role)');
                    return false;
                }
                
                const hasRole = roles.includes(currentRole);
                console.log('🔐 hasAnyRole(' + roles.join(', ') + '): ' + hasRole + ' [rol actual: ' + currentRole + ']');
                return hasRole;
            })
        );
    }

    /**
     * Verifica si el usuario tiene todos los roles especificados
     */
    hasAllRoles(roles: UserRole[]): Observable<boolean> {
        return this.roleService.availableRoles$.pipe(
            map(availableRoles => {
                if (!availableRoles || availableRoles.length === 0) {
                    console.log('🔐 hasAllRoles(' + roles.join(', ') + '): false (no available roles)');
                    return false;
                }
                
                const hasAll = roles.every(role => availableRoles.includes(role));
                console.log('🔐 hasAllRoles(' + roles.join(', ') + '): ' + hasAll);
                return hasAll;
            })
        );
    }

    // 🏥 MÉTODOS DE PERMISOS ESPECÍFICOS DEL NEGOCIO

    /**
     * Verifica si puede gestionar clínicas
     */
    canManageClinics(): Observable<boolean> {
        return this.hasPermission(Permission.MANAGE_CLINICS);
    }

    /**
     * Verifica si puede ver pacientes
     */
    canViewPatients(): Observable<boolean> {
        return this.hasPermission(Permission.VIEW_PATIENTS);
    }

    /**
     * Verifica si puede gestionar personal
     */
    canManageStaff(): Observable<boolean> {
        return this.hasPermission(Permission.MANAGE_STAFF);
    }

    /**
     * Verifica si puede gestionar citas
     */
    canManageAppointments(): Observable<boolean> {
        return this.hasPermission(Permission.MANAGE_APPOINTMENTS);
    }

    /**
     * Verifica si puede acceder a reportes
     */
    canAccessReports(): Observable<boolean> {
        return this.hasPermission(Permission.ACCESS_REPORTS);
    }

    /**
     * Verifica si puede gestionar activos
     */
    canManageAssets(): Observable<boolean> {
        return this.hasPermission(Permission.MANAGE_ASSETS);
    }

    /**
     * Verifica si puede acceder a una ruta específica
     */
    canAccessRoute(route: string): Observable<boolean> {
        const requiredPermissions = ROUTE_PERMISSIONS[route];
        
        if (!requiredPermissions || requiredPermissions.length === 0) {
            console.log('🔐 canAccessRoute(' + route + '): true (no permissions required)');
            return of(true);
        }

        return this.hasAnyPermission(requiredPermissions).pipe(
            map(canAccess => {
                console.log('🔐 canAccessRoute(' + route + '): ' + canAccess);
                return canAccess;
            })
        );
    }

    // 🔧 MÉTODOS SÍNCRONOS PARA COMPATIBILIDAD

    /**
     * Versión síncrona de hasPermission (para casos donde se necesita respuesta inmediata)
     */
    hasPermissionSync(permission: Permission): boolean {
        const currentPermissions = this.currentPermissionsSubject.value;
        const hasPermission = currentPermissions.includes(permission);
        console.log('🔐 hasPermissionSync(' + permission + '):', hasPermission);
        return hasPermission;
    }

    /**
     * Obtiene los permisos actuales de forma síncrona
     */
    getCurrentPermissions(): Permission[] {
        return this.currentPermissionsSubject.value;
    }

    /**
     * Verifica si el usuario actual es administrador
     */
    isAdmin(): boolean {
        return this.roleService.isAdmin();
    }

    /**
     * Obtiene el rol actual
     */
    getCurrentRole(): UserRole | null {
        return this.roleService.getCurrentRole();
    }

    // 🔍 MÉTODOS DE UTILIDAD

    /**
     * Obtiene todos los permisos disponibles para un rol específico
     */
    getPermissionsForRole(role: UserRole): Permission[] {
        return ROLE_PERMISSIONS[role] || [];
    }

    /**
     * Obtiene el nivel jerárquico de un rol (para comparaciones)
     */
    getRoleLevel(role: UserRole): number {
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
     * Verifica si un rol tiene nivel suficiente
     */
    hasMinimumRoleLevel(minimumLevel: number): Observable<boolean> {
        return this.roleService.selectedRole$.pipe(
            map(currentRole => {
                if (!currentRole) return false;
                const currentLevel = this.getRoleLevel(currentRole);
                const hasLevel = currentLevel >= minimumLevel;
                console.log('🔐 hasMinimumRoleLevel(' + minimumLevel + '): ' + hasLevel + ' [nivel actual: ' + currentLevel + ']');
                return hasLevel;
            })
        );
    }

    // 🧹 MÉTODOS DE LIMPIEZA

    /**
     * Limpia el estado de permisos
     */
    clearPermissions(): void {
        console.log('🧹 PermissionService: Limpiando permisos');
        this.currentPermissionsSubject.next([]);
    }

    /**
     * Recarga los permisos desde el RoleService
     */
    reloadPermissions(): void {
        console.log('🔄 PermissionService: Recargando permisos');
        // La recarga es automática gracias a los observables
        // Este método existe para compatibilidad
    }
}

