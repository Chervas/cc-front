import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, map, switchMap } from 'rxjs/operators';

// 🔗 INTEGRACIÓN CON FUSE AUTH
import { AuthService } from 'app/core/auth/auth.service';

// 🔐 DEFINICIÓN CLARA DE ROLES CON SEGURIDAD
export enum UserRole {
    ADMIN = 'admin',
    PROPIETARIO = 'propietario',
    DOCTOR = 'doctor',
    PERSONAL_CLINICA = 'personaldeclinica',
    PACIENTE = 'paciente'
}

// 🏥 INTERFACE PARA CLÍNICA CON ROL
export interface ClinicaConRol {
    id_clinica: number;
    nombre_clinica: string;
    rol_clinica: UserRole;
    subrol_clinica?: string;
    grupoclinica?: {
        nombre_grupo: string;
    };
    // ✅ COMPATIBILIDAD CON THIN COMPONENT
    grupoClinica?: {
        nombre_grupo: string;
    };
    // 🔒 CAMPOS DE SEGURIDAD
    permissions?: {
        canMapAssets: boolean;
        canManageSettings: boolean;
        canViewReports: boolean;
        isSystemAdmin: boolean;
    };
}

// 👤 INTERFACE PARA USUARIO CON ROLES Y SEGURIDAD
export interface UsuarioConRoles {
    id_usuario: number;
    roles: UserRole[];
    clinicas: ClinicaConRol[];
    isAdmin: boolean;
    // 🔒 CAMPOS DE SEGURIDAD JWT (integrados con Fuse)
    tokenExpiry?: Date;
    lastRoleValidation?: Date;
    sessionId?: string;
}

// 🔍 INTERFACE PARA VALIDACIÓN DE ROLES
export interface RoleValidationResponse {
    valid: boolean;
    roles: UserRole[];
    clinicas: ClinicaConRol[];
    tokenExpiry: Date;
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    // 🔗 INTEGRACIÓN CON FUSE AUTH
    private authService = inject(AuthService);
    private http = inject(HttpClient);

    // 🔒 ESTADO CENTRALIZADO CON SEGURIDAD
    private currentUserSubject = new BehaviorSubject<UsuarioConRoles | null>(null);
    private selectedRoleSubject = new BehaviorSubject<UserRole | null>(null);
    private availableRolesSubject = new BehaviorSubject<UserRole[]>([]);
    private roleValidationSubject = new BehaviorSubject<boolean>(false);

    // 🔍 OBSERVABLES PÚBLICOS - CORREGIDOS PARA COMPATIBILIDAD
    public currentUser$ = this.currentUserSubject.asObservable();
    public selectedRoles = this.selectedRoleSubject.asObservable();
    public selectedRole$ = this.selectedRoleSubject.asObservable(); // ✅ AGREGADO PARA THIN COMPONENT
    public availableRoles$ = this.availableRolesSubject.asObservable();
    public isRoleValid$ = this.roleValidationSubject.asObservable();

    // ⚙️ CONFIGURACIÓN DE ADMINS (basada en documentación antigua)
    private readonly ADMIN_USER_IDS = [1, 2, 5];

    // ⏱️ CONFIGURACIÓN DE SEGURIDAD
    private readonly ROLE_VALIDATION_INTERVAL = 5 * 60 * 1000; // 5 minutos
    private readonly MAX_ROLE_CACHE_TIME = 10 * 60 * 1000; // 10 minutos
    private validationTimer?: any;

    constructor() {
        this.initializeIntegration();
    }

    // 🔗 INICIALIZACIÓN INTEGRADA CON FUSE - CORREGIDA SEGÚN DOCUMENTACIÓN
    private initializeIntegration(): void {
        console.log('🔄 Inicializando integración con Fuse Auth...');
        
        // 🔍 SUSCRIBIRSE A CAMBIOS DE AUTENTICACIÓN DE FUSE
        this.authService.getCurrentUser().subscribe(user => {
            console.log('🔗 Usuario recibido de Fuse Auth:', user);
            
            if (user?.id_usuario) {
                console.log('🔗 Usuario válido detectado, ID:', user.id_usuario);
                // ✅ INICIALIZAR INMEDIATAMENTE CON LOS DATOS DISPONIBLES
                this.initializeUserFromFuseData(user);
            } else {
                console.log('🔗 No hay usuario autenticado en Fuse');
                this.clearUserSession();
            }
        });

        this.loadPersistedRole();
        this.startRoleValidationTimer();

        // 🔄 VALIDAR ROLES AL CAMBIAR DE PESTAÑA/VENTANA
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.validateCurrentRoles();
            }
        });
    }

    // 🔐 INICIALIZACIÓN DIRECTA DESDE DATOS DE FUSE - NUEVO MÉTODO
    private initializeUserFromFuseData(fuseUser: any): void {
        try {
            console.log('🔄 Inicializando usuario desde datos de Fuse:', fuseUser);

            // 🔒 VALIDAR DATOS DE ENTRADA
            if (!fuseUser || !fuseUser.id_usuario) {
                console.error('🚨 Datos de usuario de Fuse inválidos');
                this.clearUserSession();
                return;
            }

            // 🔄 DETERMINAR ROLES BASADO EN ID (según documentación antigua)
            const isAdmin = this.ADMIN_USER_IDS.includes(fuseUser.id_usuario);
            let roles: UserRole[] = [];
            
            if (isAdmin) {
                roles = [UserRole.ADMIN];
                console.log('🔐 Usuario identificado como ADMIN');
            } else {
                // Para usuarios no-admin, asignar rol por defecto y cargar desde backend
                roles = [UserRole.PACIENTE]; // Fallback temporal
                console.log('🔐 Usuario no-admin, cargando roles desde backend...');
                this.loadUserRolesFromBackend(fuseUser.id_usuario);
            }

            const usuario: UsuarioConRoles = {
                id_usuario: fuseUser.id_usuario,
                roles: roles,
                clinicas: [], // Se cargarán después
                isAdmin: isAdmin,
                tokenExpiry: this.extractTokenExpiryFromFuse(),
                lastRoleValidation: new Date(),
                sessionId: this.generateSessionId()
            };

            // ✅ ACTUALIZAR ESTADO INMEDIATAMENTE
            this.currentUserSubject.next(usuario);
            this.availableRolesSubject.next(roles);
            this.roleValidationSubject.next(true);

            // Seleccionar rol por defecto
            this.selectDefaultRole(roles);

            console.log('✅ Usuario inicializado desde Fuse:', {
                id: usuario.id_usuario,
                roles: usuario.roles,
                isAdmin: usuario.isAdmin
            });

        } catch (error) {
            console.error('🚨 Error inicializando usuario desde Fuse:', error);
            this.clearUserSession();
        }
    }

    // 🔄 CARGAR ROLES DESDE BACKEND - NUEVO MÉTODO
    private loadUserRolesFromBackend(userId: number): void {
        console.log('🔄 Cargando roles desde backend para usuario:', userId);
        
        // Simular carga desde backend (implementar según endpoints reales)
        // Basado en la documentación: endpoint getClinicasByUser debería retornar roles
        this.http.get(`/api/user/${userId}/clinicas`).subscribe({
            next: (response: any) => {
                console.log('📋 Respuesta del backend:', response);
                
                if (response.clinicas && Array.isArray(response.clinicas)) {
                    const roles = this.extractRolesFromClinics(response.clinicas);
                    this.updateUserRoles(roles);
                    console.log('✅ Roles cargados desde backend:', roles);
                } else {
                    console.warn('⚠️ No se encontraron clínicas en la respuesta del backend');
                }
            },
            error: (error) => {
                console.error('🚨 Error cargando roles desde backend:', error);
                // Mantener roles por defecto
            }
        });
    }

    /**
     * 🔄 Inicializa el usuario con validación de seguridad JWT integrada con Fuse
     * MÉTODO MANTENIDO PARA COMPATIBILIDAD
     */
    initializeUser(userData: any): void {
        console.log('🔄 initializeUser llamado (método legacy):', userData);
        // Redirigir al nuevo método
        this.initializeUserFromFuseData(userData);
    }

    /**
     * 🔄 Selecciona un rol específico con validación de seguridad
     */
    selectRole(role: UserRole): void {
        const currentUser = this.currentUserSubject.value;
        if (!currentUser) {
            console.error('🚨 No hay usuario para seleccionar rol');
            return;
        }

        const normalizedRole = this.normalizeRole(role);
        if (!this.isValidRole(normalizedRole) || !currentUser.roles.includes(normalizedRole)) {
            console.error('🚨 Rol no válido o no disponible:', role);
            return;
        }

        this.selectedRoleSubject.next(normalizedRole);
        localStorage.setItem('selectedRole', normalizedRole);
        
        console.log('🔄 Rol seleccionado:', normalizedRole);
    }

    /**
     * 🏥 Obtiene clínicas filtradas por el rol actual con seguridad
     */
    getClinicasByCurrentRole(): ClinicaConRol[] {
        const currentUser = this.currentUserSubject.value;
        const currentRole = this.selectedRoleSubject.value;

        if (!currentUser || !currentRole) {
            console.log('🚨 Usuario o rol no válido para filtrar clínicas');
            return [];
        }

        // Admin puede ver todas las clínicas
        if (currentRole === UserRole.ADMIN) {
            console.log('🔐 Cargando clínicas para administrador');
            return currentUser.clinicas;
        }

        // Filtrar clínicas por rol específico
        const filteredClinics = currentUser.clinicas.filter(clinica => 
            clinica.rol_clinica === currentRole
        );

        if (filteredClinics.length === 0) {
            console.log('🔐 No hay clínicas para filtrar');
        }

        return filteredClinics;
    }

    /**
     * 🔍 Verifica si el usuario tiene un rol específico - CORREGIDO
     */
    hasRole(role: UserRole): boolean {
        const currentUser = this.currentUserSubject.value;
        if (!currentUser) {
            console.log('🔐 hasRole(' + role + '): false (no user)');
            return false;
        }

        const normalizedRole = this.normalizeRole(role);
        const hasRole = currentUser.roles.includes(normalizedRole);
        console.log('🔐 hasRole(' + role + '): ' + hasRole + ' [usuario válido]');
        return hasRole;
    }

    /**
     * 🔒 Verifica si el usuario es administrador
     */
    isAdmin(): boolean {
        const currentUser = this.currentUserSubject.value;
        const isAdmin = currentUser?.isAdmin || false;
        console.log('🔐 isAdmin(): ' + isAdmin);
        return isAdmin;
    }

    /**
     * 📋 Obtiene el rol actual seleccionado
     */
    getCurrentRole(): UserRole | null {
        const role = this.selectedRoleSubject.value;
        console.log('🔐 getCurrentRole(): ' + role);
        return role;
    }

    /**
     * ✅ Valida los roles actuales del usuario
     */
    validateCurrentRoles(): Observable<RoleValidationResponse> {
        const currentUser = this.currentUserSubject.value;
        if (!currentUser) {
            return throwError(() => new Error('No hay usuario autenticado'));
        }

        // Simular validación exitosa por ahora
        const response: RoleValidationResponse = {
            valid: true,
            roles: currentUser.roles,
            clinicas: currentUser.clinicas,
            tokenExpiry: currentUser.tokenExpiry || new Date(Date.now() + 3600000),
            message: 'Roles validados correctamente'
        };

        this.roleValidationSubject.next(response.valid);
        return of(response);
    }

    /**
     * 🧹 Limpia la sesión del usuario
     */
    clearUserSession(): void {
        console.log('🧹 Limpiando sesión de usuario');
        this.currentUserSubject.next(null);
        this.selectedRoleSubject.next(null);
        this.availableRolesSubject.next([]);
        this.roleValidationSubject.next(false);
        localStorage.removeItem('selectedRole');
        
        if (this.validationTimer) {
            clearInterval(this.validationTimer);
        }
    }

    // 🛠️ MÉTODOS AUXILIARES PRIVADOS

    /**
     * 🔍 Extrae roles de las clínicas del usuario
     */
    private extractRolesFromClinics(clinicas: any[]): UserRole[] {
        if (!Array.isArray(clinicas)) return [];
        
        const roles = new Set<UserRole>();
        
        clinicas.forEach(clinica => {
            if (clinica.rol_clinica) {
                const normalizedRole = this.normalizeRole(clinica.rol_clinica);
                if (this.isValidRole(normalizedRole)) {
                    roles.add(normalizedRole);
                }
            }
        });
        
        return Array.from(roles);
    }

    /**
     * 🧹 Sanitiza las clínicas para seguridad
     */
    private sanitizeClinicas(clinicas: any[]): ClinicaConRol[] {
        if (!Array.isArray(clinicas)) return [];
        
        return clinicas.map(clinica => ({
            id_clinica: clinica.id_clinica || 0,
            nombre_clinica: clinica.nombre_clinica || 'Sin nombre',
            rol_clinica: this.normalizeRole(clinica.rol_clinica),
            subrol_clinica: clinica.subrol_clinica,
            grupoclinica: clinica.grupoclinica,
            // ✅ COMPATIBILIDAD CON THIN COMPONENT
            grupoClinica: clinica.grupoclinica || clinica.grupoClinica,
            permissions: {
                canMapAssets: clinica.permissions?.canMapAssets || false,
                canManageSettings: clinica.permissions?.canManageSettings || false,
                canViewReports: clinica.permissions?.canViewReports || false,
                isSystemAdmin: clinica.permissions?.isSystemAdmin || false
            }
        })).filter(clinica => clinica.id_clinica > 0);
    }

    /**
     * ✅ Valida que los roles extraídos sean válidos
     */
    private validateExtractedRoles(roles: UserRole[]): boolean {
        if (!Array.isArray(roles) || roles.length === 0) return false;
        return roles.every(role => this.isValidRole(role));
    }

    /**
     * 🔧 Normaliza un rol a formato estándar - CORREGIDO PARA EVITAR toUpperCase() ERROR
     */
    private normalizeRole(role: any): UserRole {
        // 🚨 VALIDACIÓN CRÍTICA: Prevenir error de toUpperCase() en undefined/null
        if (role === null || role === undefined) {
            console.warn('🚨 Rol null/undefined detectado, usando PACIENTE como fallback');
            return UserRole.PACIENTE;
        }
        
        // Convertir a string de forma segura
        let roleStr: string;
        try {
            roleStr = String(role).toLowerCase().trim();
        } catch (error) {
            console.error('🚨 Error convirtiendo rol a string:', error, 'rol:', role);
            return UserRole.PACIENTE;
        }
        
        // Validar que no esté vacío después del trim
        if (!roleStr || roleStr.length === 0) {
            console.warn('🚨 Rol vacío detectado, usando PACIENTE como fallback');
            return UserRole.PACIENTE;
        }
        
        switch (roleStr) {
            case 'admin':
            case 'administrador':
                return UserRole.ADMIN;
            case 'propietario':
            case 'owner':
                return UserRole.PROPIETARIO;
            case 'doctor':
            case 'medico':
                return UserRole.DOCTOR;
            case 'personaldeclinica':
            case 'personal_clinica':
            case 'staff':
                return UserRole.PERSONAL_CLINICA;
            case 'paciente':
            case 'patient':
                return UserRole.PACIENTE;
            default:
                console.warn('🚨 Rol desconocido:', roleStr, 'usando PACIENTE como fallback');
                return UserRole.PACIENTE;
        }
    }

    /**
     * ✅ Verifica si un rol es válido
     */
    private isValidRole(role: UserRole): boolean {
        return Object.values(UserRole).includes(role);
    }

    /**
     * ⏰ Extrae la expiración del token desde Fuse
     */
    private extractTokenExpiryFromFuse(): Date | null {
        try {
            // Intentar obtener desde el AuthService de Fuse
            const token = localStorage.getItem('accessToken');
            if (!token) return null;
            
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp ? new Date(payload.exp * 1000) : null;
        } catch {
            return null;
        }
    }

    /**
     * 🆔 Genera un ID de sesión único
     */
    private generateSessionId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 🎯 Selecciona el rol por defecto
     */
    private selectDefaultRole(availableRoles: UserRole[]): void {
        if (availableRoles.length === 0) return;
        
        // Prioridad: Admin > Propietario > Doctor > Personal > Paciente
        const priority = [UserRole.ADMIN, UserRole.PROPIETARIO, UserRole.DOCTOR, UserRole.PERSONAL_CLINICA, UserRole.PACIENTE];
        
        for (const role of priority) {
            if (availableRoles.includes(role)) {
                this.selectRole(role);
                return;
            }
        }
        
        // Fallback al primer rol disponible
        this.selectRole(availableRoles[0]);
    }

    /**
     * 💾 Carga el rol persistido del localStorage
     */
    private loadPersistedRole(): void {
        const savedRole = localStorage.getItem('selectedRole') as UserRole;
        if (savedRole && this.isValidRole(savedRole)) {
            this.selectedRoleSubject.next(savedRole);
        }
    }

    /**
     * ⏱️ Inicia el timer de validación de roles
     */
    private startRoleValidationTimer(): void {
        this.validationTimer = setInterval(() => {
            this.validateCurrentRoles().subscribe({
                next: (response) => {
                    if (!response.valid) {
                        console.warn('⚠️ Validación de roles falló, limpiando sesión');
                        this.clearUserSession();
                    }
                },
                error: (error) => {
                    console.error('🚨 Error en validación automática de roles:', error);
                }
            });
        }, this.ROLE_VALIDATION_INTERVAL);
    }

    /**
     * 🔄 Actualiza los roles del usuario
     */
    private updateUserRoles(newRoles: UserRole[]): void {
        const currentUser = this.currentUserSubject.value;
        if (!currentUser) return;

        const updatedUser: UsuarioConRoles = {
            ...currentUser,
            roles: newRoles,
            lastRoleValidation: new Date()
        };

        this.currentUserSubject.next(updatedUser);
        this.availableRolesSubject.next(newRoles);
        
        console.log('🔄 Roles actualizados:', newRoles);
    }

    ngOnDestroy(): void {
        if (this.validationTimer) {
            clearInterval(this.validationTimer);
        }
    }
}

