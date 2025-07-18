import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// ✅ ESTRUCTURA EXACTA QUE DEVUELVE EL BACKEND - VERIFICADA
export interface UsuarioClinicaResponse {
    id: number;                    // ← REAL del backend
    name: string;                  // ← REAL del backend
    description: string;           // ← REAL del backend
    avatar: string | null;         // ← REAL del backend
    website: string | null;        // ← REAL del backend
    contact: {                     // ← REAL del backend
        email: string | null;
        phone: string | null;
        address: string | null;
        city: string | null;
    };
    userRole: string;              // ← REAL del backend
    userSubRole: string;           // ← REAL del backend
    permissions: {                 // ← REAL del backend
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
    id_usuario: number;
    nombre: string;
    apellidos: string;
    email_usuario: string;
    email_factura: string;
    email_notificacion: string;
    password_usuario: string;
    fecha_creacion: string;
    id_gestor: number;
    notas_usuario: string;
    telefono: string;
    cargo_usuario: string;
    cumpleanos: string;
    isProfesional: boolean;
    isAdmin?: boolean;
}

export interface LoginResponse {
    token: string;
    expiresIn: number;
    user: Usuario;
}

// ✅ TIPOS PARA COMPATIBILIDAD - EXPORTADOS
export type RolClinica = string;  // ← SIMPLIFICADO para compatibilidad

// ✅ ALIAS PARA COMPATIBILIDAD CON CÓDIGO EXISTENTE
export type ClinicaConRol = UsuarioClinicaResponse;

// ✅ CONSTANTES EXPORTADAS - VERIFICADAS
export const ROL_LEVELS = {
    'administrador': 4,
    'propietario': 4,
    'doctor': 3,
    'personal': 2,
    'paciente': 1
} as const;

export const ROL_PERMISSIONS = {
    'administrador': [
        'clinic.manage',
        'users.manage', 
        'patients.manage',
        'patients.view',
        'patients.edit',
        'appointments.manage',
        'appointments.view',
        'appointments.create',
        'reports.view',
        'settings.modify'
    ],
    'propietario': [
        'clinic.manage',
        'users.manage', 
        'patients.manage',
        'patients.view',
        'patients.edit',
        'appointments.manage',
        'appointments.view',
        'appointments.create',
        'reports.view',
        'settings.modify'
    ],
    'doctor': [
        'patients.view',
        'patients.edit',
        'appointments.view',
        'appointments.create'
    ],
    'personal': [
        'patients.view',
        'appointments.view'
    ],
    'paciente': [
        'appointments.view.own',
        'profile.edit.own'
    ]
} as const;

export const ROL_LABELS = {
    'administrador': 'Administrador',
    'propietario': 'Propietario',
    'doctor': 'Doctor',
    'personal': 'Personal',
    'paciente': 'Paciente'
} as const;

export const ROL_COLORS = {
    'administrador': '#f59e0b',
    'propietario': '#f59e0b',
    'doctor': '#8b5cf6',
    'personal': '#3b82f6',
    'paciente': '#10b981'
} as const;

export const ROL_ICONS = {
    'administrador': 'business',
    'propietario': 'business',
    'doctor': 'medical_services',
    'personal': 'work',
    'paciente': 'person'
} as const;

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    
    private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
    private clinicasSubject = new BehaviorSubject<UsuarioClinicaResponse[]>([]);
    private selectedRoleSubject = new BehaviorSubject<string | null>(null);
    private selectedClinicaSubject = new BehaviorSubject<UsuarioClinicaResponse | null>(null);

    // Observables públicos
    currentUser$ = this.currentUserSubject.asObservable();
    clinicasConRol$ = this.clinicasSubject.asObservable();
    selectedRole$ = this.selectedRoleSubject.asObservable();
    selectedClinica$ = this.selectedClinicaSubject.asObservable();

    // ✅ ALIAS PARA COMPATIBILIDAD
    availableRoles$ = this.clinicasSubject.asObservable();

    constructor(private http: HttpClient) {
    console.log('🔐 [RoleService] Inicializando...');
    
    // ✅ CAMBIO: No cargar datos en constructor, solo inicializar
    // this.loadUserFromToken(); // ❌ REMOVER ESTA LÍNEA
    
    // ✅ Solo cargar si ya hay token (para casos de refresh)
    const token = localStorage.getItem('accessToken');
    if (token) {
        console.log('🎫 [RoleService] Token encontrado, cargando datos...');
        this.loadUserFromToken();
    } else {
        console.log('⏳ [RoleService] Sin token, esperando login...');
    }
}

    private loadUserFromToken(): void {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userId = payload.userId;
                if (userId) {
                    this.loadCurrentUser(userId);
                    this.loadClinicas();
                }
            } catch (error) {
                console.error('Error decodificando token:', error);
            }
        }
    }

    private loadCurrentUser(userId: number): void {
        this.http.get<Usuario>(`/api/users/${userId}`).pipe(
            catchError(error => {
                console.error('Error cargando usuario:', error);
                return of(null);
            })
        ).subscribe(user => {
            if (user) {
                user.isAdmin = this.checkIfUserIsAdmin(user);
                this.currentUserSubject.next(user);
                console.log('✅ Usuario cargado:', user.nombre, user.apellidos);
            }
        });
    }

    private checkIfUserIsAdmin(user: Usuario): boolean {
        return user.isProfesional || false;
    }

    private loadClinicas(): void {
        this.http.get<any>('/api/userclinicas/list').pipe(
            catchError(error => {
                console.error('Error cargando clínicas:', error);
                return of({ clinicas: [] }); // ✅ Devolver objeto con array vacío
            })
        ).subscribe(response => {
            // ✅ ADAPTACIÓN: Manejar tanto array directo como objeto con propiedad clinicas
            const clinicas = Array.isArray(response) 
                ? response 
                : (response?.clinicas ?? []);
                
            console.log('✅ Clínicas cargadas:', clinicas);
            console.log('🔍 Tipo de respuesta:', Array.isArray(response) ? 'Array directo' : 'Objeto con clinicas');
            
            // ✅ VERIFICACIÓN: Asegurar que siempre sea un array
            const clinicasArray = Array.isArray(clinicas) ? clinicas : [];
            
            this.clinicasSubject.next(clinicasArray);
            
            if (clinicasArray.length > 0 && !this.selectedRoleSubject.value) {
                this.selectRole(clinicasArray[0].userRole);
                this.selectClinica(clinicasArray[0]);
            }
        });
    }

    /**
     * 🔄 Recargar datos del usuario después del login
     * Este método se llama desde AuthService después de un login exitoso
     */
    public reloadUserData(): void {
        console.log('🔄 [RoleService] Recargando datos del usuario...');
        
        // Limpiar datos actuales
        this.currentUserSubject.next(null);
        this.clinicasSubject.next([]);
        this.selectedRoleSubject.next(null);
        this.selectedClinicaSubject.next(null);
        
        // Recargar desde token
        this.loadUserFromToken();
    }

    // ✅ USAR PROPIEDADES REALES - VERIFICADO
    selectRole(role: string): void {
        this.selectedRoleSubject.next(role);
        console.log('🎭 Rol seleccionado:', role);
    }

    selectClinica(clinica: UsuarioClinicaResponse): void {
        this.selectedClinicaSubject.next(clinica);
        this.selectedRoleSubject.next(clinica.userRole);  // ← PROPIEDAD REAL
        console.log('🏥 Clínica seleccionada:', clinica.name);  // ← PROPIEDAD REAL
    }

    hasRole(role: string): boolean {
        const clinicas = this.clinicasSubject.value;
        return clinicas.some(clinica => clinica.userRole === role);  // ← PROPIEDAD REAL
    }

    isAdmin(): boolean {
        return this.hasRole('administrador') || this.hasRole('propietario');
    }

    getCurrentRole(): string | null {
        return this.selectedRoleSubject.value;
    }

    getClinicasByRole(role: string): UsuarioClinicaResponse[] {
        const clinicas = this.clinicasSubject.value;
        return clinicas.filter(clinica => clinica.userRole === role);  // ← PROPIEDAD REAL
    }

    getSelectedClinica(): UsuarioClinicaResponse | null {
        return this.selectedClinicaSubject.value;
    }

    getCurrentUser(): Usuario | null {
        return this.currentUserSubject.value;
    }

    getCurrentPermissions(): string[] {
        const clinica = this.getSelectedClinica();
        
        if (!clinica) return [];

        const permissions: string[] = [];
        
        // ✅ USAR PROPIEDADES REALES - VERIFICADO
        if (clinica.permissions.canMapAssets) permissions.push('clinic.manage');
        if (clinica.permissions.canManageSettings) permissions.push('settings.modify');
        if (clinica.permissions.canManageUsers) permissions.push('users.manage');
        if (clinica.permissions.canViewReports) permissions.push('reports.view');
        if (clinica.permissions.canManagePatients) permissions.push('patients.manage');
        if (clinica.permissions.canManageAppointments) permissions.push('appointments.manage');

        return permissions;
    }

    getRoleLevel(role: string): number {
        return ROL_LEVELS[role as keyof typeof ROL_LEVELS] || 0;
    }

    getRoleLabel(role: string): string {
        return ROL_LABELS[role as keyof typeof ROL_LABELS] || role;
    }

    getRoleColor(role: string): string {
        return ROL_COLORS[role as keyof typeof ROL_COLORS] || '#6b7280';
    }

    getRoleIcon(role: string): string {
        return ROL_ICONS[role as keyof typeof ROL_ICONS] || 'person';
    }

    getAvailableRoles(): string[] {
        const clinicas = this.clinicasSubject.value;
        return clinicas.map(clinica => clinica.userRole)  // ← PROPIEDAD REAL
            .filter((role, index, array) => array.indexOf(role) === index);
    }

    clearData(): void {
        this.currentUserSubject.next(null);
        this.clinicasSubject.next([]);
        this.selectedRoleSubject.next(null);
        this.selectedClinicaSubject.next(null);
    }

    debugBackendData(): void {
        console.log('🔍 DEBUG - Datos del backend:');
        console.log('Usuario actual:', this.getCurrentUser());
        console.log('Clínicas:', this.clinicasSubject.value);
        console.log('Rol seleccionado:', this.getCurrentRole());
        console.log('Clínica seleccionada:', this.getSelectedClinica());
        console.log('Permisos actuales:', this.getCurrentPermissions());
    }
}

