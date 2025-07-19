import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// ✅ ESTRUCTURA EXACTA QUE DEVUELVE EL BACKEND - VERIFICADA
export interface UsuarioClinicaResponse {
    id: number;                      // ← REAL del backend
    name: string;                    // ← REAL del backend
    description: string;             // ← REAL del backend
    userRole: string;                // ← REAL del backend
    userSubRole: string;             // ← REAL del backend
    permissions: {                   // ← REAL del backend
        canMapAssets: boolean;
        canManageSettings: boolean;
        canManageUsers: boolean;
        canViewReports: boolean;
        canManagePatients: boolean;
        canManageAppointments: boolean;
    };
}

// ✅ USUARIO COMO VIENE DEL BACKEND - VERIFICADO
export interface Usuario {
    id_usuario: number;              // ← REAL del backend
    nombre: string;                  // ← REAL del backend
    apellidos: string;               // ← REAL del backend
    email_usuario: string;           // ← REAL del backend
    email_factura: string;           // ← REAL del backend
    email_notificacion: string;      // ← REAL del backend
    password_usuario: string;        // ← REAL del backend
    fecha_creacion: string;          // ← REAL del backend
    id_gestor: number;               // ← REAL del backend
    notas_usuario: string;           // ← REAL del backend
    telefono: string;                // ← REAL del backend
    cargo_usuario: string;           // ← REAL del backend
    cumpleanos: string;              // ← REAL del backend
    isProfesional: boolean;          // ← REAL del backend
    isAdmin?: boolean;               // ← REAL del backend
}

export interface LoginResponse {
    success: boolean;
    token: string;
    expiresIn: number;
    user: Usuario;
}

// ✅ CONSTANTES REQUERIDAS POR OTROS ARCHIVOS
export const ROL_LEVELS: Record<string, number> = {
    'administrador': 4,
    'propietario': 3,
    'personaldeclinica': 2,
    'paciente': 1
};

export const ROL_PERMISSIONS: Record<string, string[]> = {
    'administrador': [
        'admin.access',
        'users.manage',
        'clinics.manage',
        'reports.view',
        'settings.manage',
        'oauth.manage',
        'all.permissions'
    ],
    'propietario': [
        'clinic.manage',
        'users.manage',
        'reports.view',
        'patients.manage',
        'appointments.manage',
        'settings.view'
    ],
    'personaldeclinica': [
        'patients.view',
        'appointments.manage',
        'reports.view',
        'clinic.view'
    ],
    'paciente': [
        'profile.view',
        'appointments.view'
    ]
};

// ✅ CONFIGURACIÓN DE ROLES PARA UI
export const ROL_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    'administrador': {
        label: 'Administrador',
        color: 'red',
        icon: 'heroicons_outline:shield-check'
    },
    'propietario': {
        label: 'Propietario',
        color: 'blue',
        icon: 'heroicons_outline:building-office'
    },
    'personaldeclinica': {
        label: 'Personal de Clínica',
        color: 'green',
        icon: 'heroicons_outline:user-group'
    },
    'paciente': {
        label: 'Paciente',
        color: 'gray',
        icon: 'heroicons_outline:user'
    }
};

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
    private clinicasSubject = new BehaviorSubject<UsuarioClinicaResponse[]>([]);
    private selectedRoleSubject = new BehaviorSubject<string | null>(null);
    private selectedClinicaSubject = new BehaviorSubject<UsuarioClinicaResponse | null>(null);

    public currentUser$ = this.currentUserSubject.asObservable();
    public availableRoles$ = this.clinicasSubject.asObservable();
    public selectedRole$ = this.selectedRoleSubject.asObservable();
    public selectedClinica$ = this.selectedClinicaSubject.asObservable();

    // ✅ ALIAS REQUERIDO POR OTROS ARCHIVOS
    public clinicasConRol$ = this.clinicasSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadUserFromToken();
    }

    /**
     * ✅ MÉTODO HASROLE CORREGIDO - FASE 1 CRÍTICA
     * Reconoce correctamente el rol 'administrador' sin mapeos incorrectos
     */
    hasRole(role: string | string[]): boolean {
        try {
            const currentRole = this.getCurrentRole();
            
            if (!currentRole) {
                console.warn('[RoleService] No hay rol actual disponible');
                return false;
            }

            // Manejar array de roles
            if (Array.isArray(role)) {
                return role.some(r => this.checkSingleRole(r, currentRole));
            }

            // Manejar rol único
            return this.checkSingleRole(role, currentRole);
        } catch (error) {
            console.error('[RoleService] Error en hasRole:', error);
            return false;
        }
    }

    /**
     * ✅ VERIFICACIÓN DE ROL INDIVIDUAL CON MAPEO CORRECTO
     */
    private checkSingleRole(roleToCheck: string, currentRole: string): boolean {
        // Mapeo de compatibilidad - CORREGIDO
        const roleMapping: Record<string, string[]> = {
            // 'admin' es alias de 'administrador' - NO de 'propietario'
            'admin': ['administrador', 'admin'],
            'administrador': ['administrador', 'admin'],
            'propietario': ['propietario'],
            'personaldeclinica': ['personaldeclinica', 'personal'],
            'personal': ['personaldeclinica', 'personal'],
            'paciente': ['paciente']
        };

        const validRoles = roleMapping[roleToCheck] || [roleToCheck];
        const isValid = validRoles.includes(currentRole);
        
        console.log(`🔍 [RoleService] Verificando rol: ${roleToCheck} vs ${currentRole} = ${isValid}`);
        return isValid;
    }

    /**
     * ✅ MÉTODOS REQUERIDOS POR ROLE-TEST-COMPONENT
     */
    getRoleLevel(role: string): number {
        return ROL_LEVELS[role] || 0;
    }

    getRoleLabel(role: string): string {
        return ROL_CONFIG[role]?.label || role;
    }

    getRoleColor(role: string): string {
        return ROL_CONFIG[role]?.color || 'gray';
    }

    getRoleIcon(role: string): string {
        return ROL_CONFIG[role]?.icon || 'heroicons_outline:user';
    }

    /**
     * ✅ VERIFICAR SI ES ADMINISTRADOR
     */
    isAdmin(): boolean {
        const currentRole = this.getCurrentRole();
        return currentRole === 'administrador';
    }

    /**
     * ✅ OBTENER ROL ACTUAL
     */
    getCurrentRole(): string | null {
        return this.selectedRoleSubject.value;
    }

    /**
     * ✅ OBTENER USUARIO ACTUAL
     */
    getCurrentUser(): Usuario | null {
        return this.currentUserSubject.value;
    }

    /**
     * ✅ CARGAR DATOS DEL USUARIO DESDE TOKEN
     */
    private loadUserFromToken(): void {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.log('🔐 [RoleService] No hay token, usuario no autenticado');
            return;
        }

        console.log('🔄 [RoleService] Cargando datos del usuario...');
        this.loadUserData();
    }

    /**
     * ✅ RECARGAR DATOS DEL USUARIO (LLAMADO DESDE AUTHSERVICE)
     */
    reloadUserData(): void {
        console.log('🔄 [RoleService] Recargando datos del usuario...');
        this.loadUserData();
    }

    /**
     * ✅ CARGAR DATOS DEL USUARIO
     */
    private loadUserData(): void {
        const userId = this.getUserIdFromToken();
        if (!userId) {
            console.warn('⚠️ [RoleService] No se pudo obtener userId del token');
            return;
        }

        console.log(`🔍 [RoleService] Cargando datos para usuario ${userId}`);

        // Cargar clínicas del usuario
        this.http.get<any>(`/api/userclinicas/user/${userId}`).pipe(
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

                // Establecer rol inicial
                if (response.userRole) {
                    this.selectedRoleSubject.next(response.userRole);
                    console.log(`🎭 [RoleService] Rol inicial establecido: ${response.userRole}`);
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
            }
        });
    }

    /**
     * ✅ ADAPTAR RESPUESTA DE CLÍNICAS DEL BACKEND
     */
    private adaptClinicasResponse(clinicas: any[], userRole: string): UsuarioClinicaResponse[] {
        if (!Array.isArray(clinicas)) {
            console.warn('⚠️ [RoleService] Clínicas no es un array, adaptando...');
            return [];
        }

        return clinicas.map(clinica => ({
            id: clinica.id_clinica || clinica.id,
            name: clinica.nombre_clinica || clinica.name || 'Clínica sin nombre',
            description: clinica.descripcion || clinica.description || clinica.ciudad || '',
            userRole: clinica.rol || userRole || 'paciente',
            userSubRole: clinica.subrol || clinica.userSubRole || '',
            permissions: {
                canMapAssets: userRole === 'administrador' || userRole === 'propietario',
                canManageSettings: userRole === 'administrador' || userRole === 'propietario',
                canManageUsers: userRole === 'administrador' || userRole === 'propietario',
                canViewReports: userRole !== 'paciente',
                canManagePatients: userRole !== 'paciente',
                canManageAppointments: userRole !== 'paciente'
            }
        }));
    }

    /**
     * ✅ OBTENER USER ID DEL TOKEN
     */
    private getUserIdFromToken(): number | null {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return null;

            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.userId || payload.id || null;
        } catch (error) {
            console.error('❌ [RoleService] Error decodificando token:', error);
            return null;
        }
    }

    /**
     * ✅ SELECCIONAR ROL
     */
    selectRole(role: string): void {
        console.log(`🎭 [RoleService] Seleccionando rol: ${role}`);
        this.selectedRoleSubject.next(role);
        
        // Filtrar clínicas por rol seleccionado
        this.updateClinicasByRole(role);
    }

    /**
     * ✅ SELECCIONAR CLÍNICA
     */
    selectClinica(clinica: UsuarioClinicaResponse): void {
        console.log(`🏥 [RoleService] Seleccionando clínica: ${clinica.name}`);
        this.selectedClinicaSubject.next(clinica);
        this.selectedRoleSubject.next(clinica.userRole);
    }

    /**
     * ✅ ACTUALIZAR CLÍNICAS POR ROL
     */
    private updateClinicasByRole(role: string): void {
        const todasLasClinicas = this.clinicasSubject.value;
        
        if (role === 'administrador') {
            // Admin ve todas las clínicas
            return;
        }

        // Otros roles ven solo sus clínicas asignadas
        const clinicasFiltradas = todasLasClinicas.filter(clinica => 
            clinica.userRole === role
        );

        // Seleccionar primera clínica del rol si hay alguna
        if (clinicasFiltradas.length > 0) {
            this.selectedClinicaSubject.next(clinicasFiltradas[0]);
        }
    }

    /**
     * ✅ OBTENER CLÍNICAS POR ROL
     */
    getClinicasByRole(role: string): UsuarioClinicaResponse[] {
        const clinicas = this.clinicasSubject.value;
        
        if (role === 'administrador') {
            return clinicas; // Admin ve todas
        }
        
        return clinicas.filter(clinica => clinica.userRole === role);
    }

    /**
     * ✅ OBTENER CLÍNICA SELECCIONADA
     */
    getSelectedClinica(): UsuarioClinicaResponse | null {
        return this.selectedClinicaSubject.value;
    }

    /**
     * ✅ OBTENER PERMISOS ACTUALES
     */
    getCurrentPermissions(): string[] {
        const currentRole = this.getCurrentRole();
        const selectedClinica = this.getSelectedClinica();

        if (!currentRole) return [];

        const basePermissions = ROL_PERMISSIONS[currentRole] || [];

        // Permisos específicos de clínica
        if (selectedClinica) {
            const additionalPermissions: string[] = [];
            
            if (selectedClinica.permissions.canMapAssets) {
                additionalPermissions.push('assets.map');
            }
            if (selectedClinica.permissions.canManageSettings) {
                additionalPermissions.push('clinic.settings');
            }
            
            return [...basePermissions, ...additionalPermissions];
        }

        return basePermissions;
    }

    /**
     * ✅ VERIFICAR PERMISO ESPECÍFICO
     */
    hasPermission(permission: string): boolean {
        const permissions = this.getCurrentPermissions();
        return permissions.includes(permission);
    }

    /**
     * ✅ OBTENER ROLES DISPONIBLES
     */
    getAvailableRoles(): string[] {
        const clinicas = this.clinicasSubject.value;
        const roles = clinicas.map(c => c.userRole);
        return [...new Set(roles)]; // Eliminar duplicados
    }

    /**
     * ✅ LIMPIAR DATOS
     */
    clearData(): void {
        console.log('🧹 [RoleService] Limpiando datos...');
        this.currentUserSubject.next(null);
        this.clinicasSubject.next([]);
        this.selectedRoleSubject.next(null);
        this.selectedClinicaSubject.next(null);
    }

    /**
     * ✅ VERIFICAR SI TIENE ROL EN CLÍNICA ESPECÍFICA
     */
    hasRoleInClinic(role: string, clinicaId: number): boolean {
        const clinicas = this.clinicasSubject.value;
        return clinicas.some(c => c.id === clinicaId && c.userRole === role);
    }

    /**
     * ✅ OBTENER ROL EN CLÍNICA ESPECÍFICA
     */
    getRoleInClinic(clinicaId: number): string | null {
        const clinicas = this.clinicasSubject.value;
        const clinica = clinicas.find(c => c.id === clinicaId);
        return clinica ? clinica.userRole : null;
    }

    /**
     * ✅ AGRUPAR CLÍNICAS POR ROL
     */
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
}

