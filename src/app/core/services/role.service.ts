import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// ✅ ESTRUCTURA EXACTA QUE DEVUELVE EL BACKEND - VERIFICADA
export interface UsuarioClinicaResponse {
    id: number;                    // ~ REAL del backend
    name: string;                  // ~ REAL del backend
    description: string;           // ~ REAL del backend
    userRole: string;              // ~ REAL del backend
    groupId?: number;              // Grupo al que pertenece la clínica
    groupName?: string;            // Nombre del grupo
    userSubRole: string;           // ~ REAL del backend
    permissions: {                 // ~ REAL del backend
        canMapAssets: boolean;
        canManageSettings: boolean;
        canManageUsers: boolean;
        canViewReports: boolean;
        canManagePatients: boolean;
        canManageAppointments: boolean;
    };
};

// ✅ USUARIO COMO VIENE DEL BACKEND - VERIFICADO
export interface Usuario {
    id_usuario: number;            // ~ REAL del backend
    nombre: string;                // ~ REAL del backend
    apellidos: string;             // ~ REAL del backend
    email_usuario: string;         // ~ REAL del backend
    email_factura: string;         // ~ REAL del backend
    email_notificacion: string;    // ~ REAL del backend
    password_usuario: string;      // ~ REAL del backend
    fecha_creacion: string;        // ~ REAL del backend
    id_gestor: number;             // ~ REAL del backend
    notas_usuario: string;         // ~ REAL del backend
    telefono: string;              // ~ REAL del backend
    cargo_usuario: string;         // ~ REAL del backend
    cumpleanos: string;            // ~ REAL del backend
    isProfessional: boolean;       // ~ REAL del backend
    isAdmin?: boolean;             // ~ REAL del backend
}

export interface LoginResponse {
    success: boolean;
    token: string;
    expiresIn: number;
    user: Usuario;
}

// ✅ CONSTANTES REQUERIDAS POR OTROS ARCHIVOS
export const ROL_LEVELS: Record<string, number> = {
    'paciente': 1,
    'medico': 2,
    'propietario': 3,
    'administrador': 4
};

// ✅ DEFINICIÓN COMPLETA DE PERMISOS POR ROL
export const ROL_PERMISSIONS: Record<string, string[]> = {
    'administrador': [
        // Permisos de clínicas
        'clinics.manage',
        'clinics.create',
        'clinics.edit',
        'clinics.delete',
        'clinics.view',
        
        // Permisos de pacientes
        'patients.view',
        'patients.create',
        'patients.edit',
        'patients.delete',
        'patients.manage',
        
        // Permisos de usuarios
        'users.manage',
        'users.create',
        'users.edit',
        'users.delete',
        'users.view',
        
        // Permisos de reportes
        'reports.view',
        'reports.generate',
        'reports.export',
        
        // Permisos de configuración
        'settings.manage',
        'settings.view',
        
        // Permisos de citas
        'appointments.manage',
        'appointments.view',
        'appointments.create',
        'appointments.edit',
        'appointments.delete'
    ],
    'propietario': [
        'clinics.manage',
        'clinics.edit',
        'clinics.view',
        'patients.view',
        'patients.create',
        'patients.edit',
        'patients.manage',
        'users.manage',
        'users.create',
        'users.edit',
        'users.view',
        'reports.view',
        'reports.generate',
        'appointments.manage',
        'appointments.view',
        'appointments.create',
        'appointments.edit'
    ],
    'medico': [
        'patients.view',
        'patients.edit',
        'appointments.manage',
        'appointments.view',
        'appointments.create',
        'appointments.edit',
        'reports.view'
    ],
    'paciente': [
        'profile.view',
        'profile.edit',
        'appointments.view'
    ]
};

@Injectable({
    providedIn: 'root'
})
export class RoleService {

    // ✅ SUBJECTS PARA MANEJO DE ESTADO
    private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
    private clinicasSubject = new BehaviorSubject<UsuarioClinicaResponse[]>([]);
    private selectedRoleSubject = new BehaviorSubject<string | null>(null);
    private selectedClinicaSubject = new BehaviorSubject<UsuarioClinicaResponse | null>(null);

    // ✅ OBSERVABLES PÚBLICOS
    public currentUser$ = this.currentUserSubject.asObservable();
    public clinicas$ = this.clinicasSubject.asObservable();
    public selectedRole$ = this.selectedRoleSubject.asObservable();
    public selectedClinica$ = this.selectedClinicaSubject.asObservable();

    // ✅ ALIAS PARA COMPATIBILIDAD
    public clinicasConRol$ = this.clinicas$;

    constructor(private http: HttpClient) {
        console.log('🚀 [RoleService] Servicio inicializado');
    }

    // ✅ MÉTODO PRINCIPAL PARA VERIFICAR ROLES
    hasRole(role: string | string[]): boolean {
        try {
            if (Array.isArray(role)) {
                return role.some(r => this.checkSingleRole(r));
            } else {
                return this.checkSingleRole(role);
            }
        } catch (error) {
            console.error('❌ [RoleService] Error en hasRole:', error);
            return false;
        }
    }

    private checkSingleRole(role: string): boolean {
        const currentRole = this.getCurrentRole();
        console.log(`🔍 [DEBUG] ¿Tiene rol ${role}? ${currentRole === role}`);
        return currentRole === role;
    }

    // ✅ NUEVO MÉTODO PARA VERIFICAR PERMISOS (SÍNCRONO)
    hasPermission(permission: string): boolean {
        try {
            const currentRole = this.getCurrentRole();
            if (!currentRole) {
                console.log(`🔍 [DEBUG] ¿Tiene permiso '${permission}'? false (sin rol)`);
                return false;
            }

            const rolePermissions = ROL_PERMISSIONS[currentRole] || [];
            const hasPermission = rolePermissions.includes(permission);
            
            console.log(`🔍 [DEBUG] ¿Tiene permiso '${permission}'? ${hasPermission} (rol: ${currentRole})`);
            return hasPermission;
        } catch (error) {
            console.error('❌ [RoleService] Error en hasPermission:', error);
            return false;
        }
    }

    // ✅ MÉTODO PARA VERIFICAR MÚLTIPLES PERMISOS
    hasAnyPermission(permissions: string[]): boolean {
        return permissions.some(permission => this.hasPermission(permission));
    }

    hasAllPermissions(permissions: string[]): boolean {
        return permissions.every(permission => this.hasPermission(permission));
    }

    // ✅ MÉTODO PARA OBTENER PERMISOS DEL ROL ACTUAL
    getCurrentPermissions(): string[] {
        const currentRole = this.getCurrentRole();
        if (!currentRole) return [];
        
        return ROL_PERMISSIONS[currentRole] || [];
    }

    // ✅ MÉTODO PARA VERIFICAR NIVEL DE ROL
    hasRoleLevel(minimumLevel: number): boolean {
        const currentRole = this.getCurrentRole();
        if (!currentRole) return false;
        
        const currentLevel = ROL_LEVELS[currentRole] || 0;
        return currentLevel >= minimumLevel;
    }

    getRoleLevel(role: string): number {
        return ROL_LEVELS[role] || 0;
    }

    getRoleLabel(role: string): string {
        const labels: Record<string, string> = {
            'administrador': 'Administrador',
            'propietario': 'Propietario',
            'medico': 'Médico',
            'paciente': 'Paciente'
        };
        return labels[role] || role;
    }

    getRoleColor(role: string): string {
        const colors: Record<string, string> = {
            'administrador': 'red',
            'propietario': 'blue',
            'medico': 'green',
            'paciente': 'yellow'
        };
        return colors[role] || 'gray';
    }

    getRoleIcon(role: string): string {
        const icons: Record<string, string> = {
            'administrador': 'heroicons_outline:shield-check',
            'propietario': 'heroicons_outline:building-office',
            'medico': 'heroicons_outline:user',
            'paciente': 'heroicons_outline:user-group'
        };
        return icons[role] || 'heroicons_outline:user';
    }

    isAdmin(): boolean {
        return this.hasRole('administrador');
    }

    // ✅ MÉTODO CORREGIDO PARA getCurrentRole
    getCurrentRole(): string | null {
        try {
            // 1. Intentar obtener del selectedRoleSubject
            let currentRole = this.selectedRoleSubject.value;
            
            if (currentRole) {
                console.log(`🎭 [RoleService] Rol desde selectedRoleSubject: ${currentRole}`);
                return currentRole;
            }

            // 2. Si no hay rol seleccionado, obtener del usuario actual
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.isAdmin) {
                console.log('🎭 [RoleService] Usuario es admin, estableciendo rol administrador');
                this.selectedRoleSubject.next('administrador');
                return 'administrador';
            }

            // 3. Si no es admin, obtener del primer rol disponible en clínicas
            const clinicas = this.clinicasSubject.value;
            if (clinicas.length > 0) {
                const firstRole = clinicas[0].userRole;
                console.log(`🎭 [RoleService] Estableciendo primer rol disponible: ${firstRole}`);
                this.selectedRoleSubject.next(firstRole);
                return firstRole;
            }

            // 4. Fallback: intentar obtener del token o localStorage
            const roleFromStorage = this.getRoleFromStorage();
            if (roleFromStorage) {
                console.log(`🎭 [RoleService] Rol desde storage: ${roleFromStorage}`);
                this.selectedRoleSubject.next(roleFromStorage);
                return roleFromStorage;
            }

            console.warn('⚠️ [RoleService] No se pudo determinar el rol actual');
            return null;
        } catch (error) {
            console.error('❌ [RoleService] Error en getCurrentRole:', error);
            return null;
        }
    }

    getCurrentUser(): Usuario | null {
        return this.currentUserSubject.value;
    }

    // ✅ MÉTODO PARA CARGAR USUARIO DESDE TOKEN
    loadUserFromToken(): void {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                console.warn('⚠️ [RoleService] No hay token disponible');
                return;
            }

            console.log('🔍 [RoleService] Cargando usuario desde token...');
            this.loadUserData();
        } catch (error) {
            console.error('❌ [RoleService] Error cargando usuario desde token:', error);
        }
    }

    // ✅ MÉTODO PARA RECARGAR DATOS
    reloadUserData(): void {
        console.log('🔄 [RoleService] Recargando datos de usuario...');
        this.loadUserData();
    }

    // ✅ MÉTODO CORREGIDO PARA CARGAR DATOS
    private loadUserData(): void {
        const userId = this.getUserIdFromToken();
        if (!userId) {
            console.warn('⚠️ [RoleService] No se pudo obtener userId del token');
            return;
        }

        console.log(`🔍 [RoleService] Cargando datos para usuario ${userId}`);

        // Cargar clínicas del usuario
        this.http.get<any>(`/api/userclinicas/list`).pipe(
            catchError(error => {
                console.error('❌ [RoleService] Error cargando clínicas:', error);
                return of({ success: false, clinicas: [] });
            })
        ).subscribe(response => {
            if (response.success) {
                console.log('✅ [RoleService] Clínicas cargadas:', response.clinicas);
                
                // Adaptar respuesta del backend
                const clinicas = this.adaptClinicasResponse(response.clinicas, response.userRole);
                this.clinicasSubject.next(clinicas);

                // ✅ CORRECCIÓN CRÍTICA: Establecer rol inicial CORRECTAMENTE
                if (response.userRole) {
                    console.log(`🎭 [RoleService] Estableciendo rol desde backend: ${response.userRole}`);
                    this.selectedRoleSubject.next(response.userRole);
                    
                    // ✅ GUARDAR EN LOCALSTORAGE PARA PERSISTENCIA
                    localStorage.setItem('currentRole', response.userRole);
                } else if (clinicas.length > 0) {
                    const firstRole = clinicas[0].userRole;
                    console.log(`🎭 [RoleService] Estableciendo primer rol disponible: ${firstRole}`);
                    this.selectedRoleSubject.next(firstRole);
                    localStorage.setItem('currentRole', firstRole);
                }

                // Seleccionar primera clínica si hay alguna
                if (clinicas.length > 0) {
                    this.selectedClinicaSubject.next(clinicas[0]);
                    console.log(`🏥 [RoleService] Clínica inicial seleccionada: ${clinicas[0].name}`);
                }
            } else {
                console.warn('⚠️ [RoleService] Respuesta sin éxito del backend');
            }
        });

        // Cargar datos del usuario
        this.http.get<any>(`/api/users/${userId}`).pipe(
            catchError(error => {
                console.error('❌ [RoleService] Error cargando usuario:', error);
                return of(null);
            })
        ).subscribe(user => {
            if (user) {
                console.log('✅ [RoleService] Usuario cargado:', user);
                this.currentUserSubject.next(user);
                
                // ✅ CORRECCIÓN: Si es admin, establecer rol administrador
                if (user.isAdmin && !this.selectedRoleSubject.value) {
                    console.log('🎭 [RoleService] Usuario es admin, estableciendo rol administrador');
                    this.selectedRoleSubject.next('administrador');
                    localStorage.setItem('currentRole', 'administrador');
                }
            }
        });
    }

    private adaptClinicasResponse(clinicas: any[], userRole?: string): UsuarioClinicaResponse[] {
        if (!Array.isArray(clinicas)) {
            console.warn('⚠️ [RoleService] Clínicas no es un array:', clinicas);
            return [];
        }

        return clinicas.map(clinica => ({
            id: clinica.id_clinica || clinica.id,
            name: clinica.nombre || clinica.name,
            description: clinica.descripcion || clinica.description || '',
            userRole: userRole || clinica.userRole || 'paciente',
            userSubRole: clinica.userSubRole || '',
            groupId: clinica.grupoClinica?.id_grupo || clinica.id_grupo || null,
            groupName: clinica.grupoClinica?.nombre_grupo || clinica.nombre_grupo || null,
            permissions: clinica.permissions || {
                canMapAssets: false,
                canManageSettings: false,
                canManageUsers: false,
                canViewReports: false,
                canManagePatients: false,
                canManageAppointments: false
            }
        }));
    }

    private getUserIdFromToken(): number | null {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return null;

            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.userId || payload.id_usuario || payload.id || null;
        } catch (error) {
            console.error('❌ [RoleService] Error obteniendo userId del token:', error);
            return null;
        }
    }

    // ✅ MÉTODO HELPER PARA OBTENER ROL DEL STORAGE
    private getRoleFromStorage(): string | null {
        try {
            // Intentar obtener del token JWT
            const token = localStorage.getItem('accessToken');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.userRole) {
                    return payload.userRole;
                }
                
                // Si el usuario es admin según el token
                if (payload.isAdmin || payload.admin) {
                    return 'administrador';
                }
            }

            // Fallback: obtener de localStorage directo
            const storedRole = localStorage.getItem('currentRole');
            if (storedRole) {
                return storedRole;
            }

            return null;
        } catch (error) {
            console.error('❌ [RoleService] Error obteniendo rol del storage:', error);
            return null;
        }
    }

    // ✅ MÉTODOS PARA CAMBIO DE ROL Y CLÍNICA
    setRole(role: string): void {
        console.log(`🔄 [RoleService] Cambiando a rol: ${role}`);
        this.selectedRoleSubject.next(role);
        localStorage.setItem('currentRole', role);
        this.updateClinicasByRole(role);
    }

    setClinica(clinica: UsuarioClinicaResponse): void {
        console.log(`🔄 [RoleService] Cambiando a clínica: ${clinica.name}`);
        this.selectedClinicaSubject.next(clinica);
        
        // Actualizar rol si es diferente
        if (clinica.userRole !== this.selectedRoleSubject.value) {
            this.setRole(clinica.userRole);
        }
    }

    private updateClinicasByRole(role: string): void {
        const allClinicas = this.clinicasSubject.value;
        const clinicasWithRole = allClinicas.filter(c => c.userRole === role);
        
        if (clinicasWithRole.length > 0) {
            this.selectedClinicaSubject.next(clinicasWithRole[0]);
        }
    }

    // ✅ MÉTODOS DE UTILIDAD
    getClinicasByRole(role: string): UsuarioClinicaResponse[] {
        return this.clinicasSubject.value.filter(c => c.userRole === role);
    }

    getSelectedClinica(): UsuarioClinicaResponse | null {
        return this.selectedClinicaSubject.value;
    }

    getAvailableRoles(): string[] {
        const clinicas = this.clinicasSubject.value;
        const roles = [...new Set(clinicas.map(c => c.userRole))];
        
        // Agregar administrador si el usuario es admin
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.isAdmin && !roles.includes('administrador')) {
            roles.unshift('administrador');
        }
        
        return roles;
    }

    clearData(): void {
        this.currentUserSubject.next(null);
        this.clinicasSubject.next([]);
        this.selectedRoleSubject.next(null);
        this.selectedClinicaSubject.next(null);
        localStorage.removeItem('currentRole');
    }

    // ✅ MÉTODOS ADICIONALES PARA COMPATIBILIDAD
    hasRoleInClinic(role: string, clinicaId: number): boolean {
        const clinicas = this.clinicasSubject.value;
        return clinicas.some(c => c.id === clinicaId && c.userRole === role);
    }

    getRoleInClinic(clinicaId: number): string | null {
        const clinicas = this.clinicasSubject.value;
        const clinica = clinicas.find(c => c.id === clinicaId);
        return clinica ? clinica.userRole : null;
    }

    groupClinicsByRole(): Record<string, UsuarioClinicaResponse[]> {
        const clinicas = this.clinicasSubject.value;
        const grouped: Record<string, UsuarioClinicaResponse[]> = {};

        clinicas.forEach(clinica => {
            const role = clinica.userRole;
            if (!grouped[role]) {
                grouped[role] = [];
            }
            grouped[role].push(clinica);
        });

        console.log('🏥 [RoleService] Clínicas agrupadas por rol:', grouped);
        return grouped;
    }

    

      /**
     * Agrupa las clínicas por nombre de grupo
     */
    groupClinicsByGroup(): Record<string, UsuarioClinicaResponse[]> {
        const clinicas = this.clinicasSubject.value;
        const grouped: Record<string, UsuarioClinicaResponse[]> = {};

        clinicas.forEach(clinica => {
            const groupName = (clinica as any).grupoClinica?.nombre_grupo || 'Sin Grupo';
            if (!grouped[groupName]) {
                grouped[groupName] = [];
            }
            grouped[groupName].push(clinica);
        });

        if (!environment.production) {
            console.log('🏥 [RoleService] Clínicas agrupadas por grupo:', grouped);
        }

        return grouped;
    }

    // ✅ MÉTODO ADICIONAL PARA DEBUG
    debugCurrentState(): void {
        console.log('🔍 [RoleService] Estado actual del servicio:');
        console.log('  - selectedRoleSubject.value:', this.selectedRoleSubject.value);
        console.log('  - currentUserSubject.value:', this.currentUserSubject.value);
        console.log('  - clinicasSubject.value.length:', this.clinicasSubject.value.length);
        console.log('  - localStorage currentRole:', localStorage.getItem('currentRole'));
        console.log('  - getCurrentRole() result:', this.getCurrentRole());
        console.log('  - Permisos disponibles:', this.getCurrentPermissions());
    }
}

