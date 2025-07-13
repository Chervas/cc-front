import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, map, switchMap } from 'rxjs/operators';

// 🔗 INTEGRACIÓN CON FUSE AUTH
import { AuthService } from 'app/core/auth/auth.service';

// 🎯 DEFINICIÓN CLARA DE ROLES CON SEGURIDAD
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
    grupoClinica?: {
        nombre_grupo: string;
    };
    // 🔐 CAMPOS DE SEGURIDAD
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
    // 🔐 CAMPOS DE SEGURIDAD JWT (integrados con Fuse)
    tokenExpiry?: Date;
    lastRoleValidation?: Date;
    sessionId?: string;
}

// 🔐 INTERFACE PARA VALIDACIÓN DE ROLES
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

    // 📊 ESTADO CENTRALIZADO CON SEGURIDAD
    private currentUserSubject = new BehaviorSubject<UsuarioConRoles | null>(null);
    private selectedRoleSubject = new BehaviorSubject<UserRole | null>(null);
    private availableRolesSubject = new BehaviorSubject<UserRole[]>([]);
    private roleValidationSubject = new BehaviorSubject<boolean>(false);

    // 🔍 OBSERVABLES PÚBLICOS
    public currentUser$ = this.currentUserSubject.asObservable();
    public selectedRole$ = this.selectedRoleSubject.asObservable();
    public availableRoles$ = this.availableRolesSubject.asObservable();
    public isRoleValid$ = this.roleValidationSubject.asObservable();

    // 👑 CONFIGURACIÓN DE ADMINS (centralizada y segura)
    private readonly ADMIN_USER_IDS = [1];
    
    // 🔐 CONFIGURACIÓN DE SEGURIDAD
    private readonly ROLE_VALIDATION_INTERVAL = 5 * 60 * 1000; // 5 minutos
    private readonly MAX_ROLE_CACHE_TIME = 10 * 60 * 1000; // 10 minutos
    private validationTimer?: any;

    constructor() {
        this.initializeIntegration();
    }

    // 🔗 INICIALIZACIÓN INTEGRADA CON FUSE
    private initializeIntegration(): void {
        // 🔗 SUSCRIBIRSE A CAMBIOS DE AUTENTICACIÓN DE FUSE
        this.authService.getCurrentUser().subscribe(user => {
            if (user?.id_usuario) {
                console.log('🔗 Usuario obtenido de Fuse Auth:', user.id_usuario);
                // No inicializar aquí, esperar a que se carguen las clínicas
            } else {
                console.log('🔗 No hay usuario autenticado en Fuse');
                this.clearUserSession();
            }
        });

        this.loadPersistedRole();
        this.startRoleValidationTimer();
        
        // 🔐 VALIDAR ROLES AL CAMBIAR DE PESTAÑA/VENTANA
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.validateCurrentRoles();
            }
        });
    }

    // 🎯 MÉTODOS PRINCIPALES CON SEGURIDAD E INTEGRACIÓN FUSE

    /**
     * 🔐 Inicializa el usuario con validación de seguridad JWT integrada con Fuse
     */
    initializeUser(userData: any): void {
        try {
            // 🔗 VALIDAR CON FUSE AUTH PRIMERO
            this.authService.check().subscribe(isAuthenticated => {
                if (!isAuthenticated) {
                    console.error('🚨 Usuario no autenticado según Fuse Auth');
                    this.clearUserSession();
                    return;
                }

                // 🔐 VALIDAR DATOS DE ENTRADA
                if (!userData || !userData.id_usuario) {
                    console.error('🚨 Datos de usuario inválidos');
                    this.clearUserSession();
                    return;
                }

                // 🔐 VALIDAR TOKEN EXPIRY USANDO FUSE
                const tokenExpiry = this.extractTokenExpiryFromFuse();
                if (tokenExpiry && tokenExpiry < new Date()) {
                    console.error('🚨 Token JWT expirado según Fuse');
                    this.clearUserSession();
                    return;
                }

                const usuario: UsuarioConRoles = {
                    id_usuario: userData.id_usuario,
                    roles: this.extractRolesFromClinics(userData.clinicas || []),
                    clinicas: this.sanitizeClinicas(userData.clinicas || []),
                    isAdmin: this.ADMIN_USER_IDS.includes(userData.id_usuario),
                    tokenExpiry: tokenExpiry,
                    lastRoleValidation: new Date(),
                    sessionId: this.generateSessionId()
                };

                // 🔐 VALIDAR ROLES EXTRAÍDOS
                if (!this.validateExtractedRoles(usuario.roles)) {
                    console.error('🚨 Roles extraídos inválidos');
                    this.clearUserSession();
                    return;
                }

                // Agregar rol admin si corresponde
                if (usuario.isAdmin && !usuario.roles.includes(UserRole.ADMIN)) {
                    usuario.roles.unshift(UserRole.ADMIN);
                }

                this.currentUserSubject.next(usuario);
                this.availableRolesSubject.next(usuario.roles);
                this.roleValidationSubject.next(true);
                
                // Seleccionar rol por defecto
                this.selectDefaultRole(usuario.roles);
                
                console.log('✅ Usuario inicializado con seguridad (integrado con Fuse):', {
                    id: usuario.id_usuario,
                    roles: usuario.roles,
                    isAdmin: usuario.isAdmin,
                    tokenExpiry: usuario.tokenExpiry
                });
            });

        } catch (error) {
            console.error('🚨 Error inicializando usuario:', error);
            this.clearUserSession();
        }
    }

    /**
     * 🔐 Cambia el rol seleccionado con validación de seguridad integrada con Fuse
     */
    selectRole(role: UserRole): void {
        try {
            // 🔗 VALIDAR CON FUSE AUTH PRIMERO
            this.authService.check().subscribe(isAuthenticated => {
                if (!isAuthenticated) {
                    console.error('🚨 No autenticado según Fuse Auth');
                    this.clearUserSession();
                    return;
                }

                const currentUser = this.currentUserSubject.value;
                
                // 🔐 VALIDACIONES DE SEGURIDAD
                if (!currentUser) {
                    console.error('🚨 No hay usuario autenticado');
                    return;
                }

                if (!this.isValidRole(role)) {
                    console.error('🚨 Rol inválido:', role);
                    return;
                }

                if (!currentUser.roles.includes(role)) {
                    console.error('🚨 Usuario no tiene acceso al rol:', role);
                    return;
                }

                // 🔐 VALIDAR TOKEN NO EXPIRADO USANDO FUSE
                const tokenExpiry = this.extractTokenExpiryFromFuse();
                if (tokenExpiry && tokenExpiry < new Date()) {
                    console.error('🚨 Token expirado según Fuse, no se puede cambiar rol');
                    this.clearUserSession();
                    return;
                }

                this.selectedRoleSubject.next(role);
                localStorage.setItem('selectedRole', role);
                
                // 🔐 LOG DE SEGURIDAD
                console.log('🔐 Cambio de rol autorizado (validado con Fuse):', {
                    userId: currentUser.id_usuario,
                    newRole: role,
                    timestamp: new Date().toISOString(),
                    sessionId: currentUser.sessionId
                });
            });

        } catch (error) {
            console.error('🚨 Error cambiando rol:', error);
        }
    }

    /**
     * 🔐 Obtiene clínicas filtradas por rol actual con validación integrada con Fuse
     */
    getClinicasByCurrentRole(): ClinicaConRol[] {
        try {
            const currentUser = this.currentUserSubject.value;
            const selectedRole = this.selectedRoleSubject.value;
            
            // 🔐 VALIDACIONES DE SEGURIDAD
            if (!currentUser || !selectedRole) {
                console.warn('🚨 Usuario o rol no válido');
                return [];
            }

            if (!this.roleValidationSubject.value) {
                console.warn('🚨 Roles no validados');
                return [];
            }

            // Admin ve todas las clínicas
            if (selectedRole === UserRole.ADMIN && currentUser.isAdmin) {
                return currentUser.clinicas;
            }
            
            // Filtrar por rol específico con validación
            const filteredClinics = currentUser.clinicas.filter(clinica => {
                const hasRole = clinica.rol_clinica === selectedRole;
                const hasPermissions = clinica.permissions && 
                    Object.values(clinica.permissions).some(permission => permission === true);
                
                return hasRole && hasPermissions;
            });

            console.log('🔐 Clínicas filtradas por rol (validado con Fuse):', {
                role: selectedRole,
                count: filteredClinics.length,
                userId: currentUser.id_usuario
            });

            return filteredClinics;

        } catch (error) {
            console.error('🚨 Error obteniendo clínicas por rol:', error);
            return [];
        }
    }

    /**
     * 🔐 Verifica si el usuario tiene un rol específico
     */
    hasRole(role: UserRole): boolean {
        try {
            const currentUser = this.currentUserSubject.value;
            
            if (!currentUser || !this.roleValidationSubject.value) {
                return false;
            }

            return currentUser.roles.includes(role);
        } catch (error) {
            console.error('🚨 Error verificando rol:', error);
            return false;
        }
    }

    /**
     * 🔐 Verifica si el usuario es admin con validación adicional integrada con Fuse
     */
    isAdmin(): boolean {
        try {
            const currentUser = this.currentUserSubject.value;
            
            if (!currentUser || !this.roleValidationSubject.value) {
                return false;
            }

            // 🔐 DOBLE VALIDACIÓN: ID en lista Y rol admin
            const isInAdminList = this.ADMIN_USER_IDS.includes(currentUser.id_usuario);
            const hasAdminRole = currentUser.roles.includes(UserRole.ADMIN);
            
            return isInAdminList && hasAdminRole;
        } catch (error) {
            console.error('🚨 Error verificando admin:', error);
            return false;
        }
    }

    /**
     * 🔐 Obtiene el rol actualmente seleccionado
     */
    getCurrentRole(): UserRole | null {
        return this.selectedRoleSubject.value;
    }

    /**
     * 🔐 Valida roles contra el servidor integrado con Fuse Auth
     */
    validateCurrentRoles(): Observable<boolean> {
        // 🔗 USAR VALIDACIÓN DE FUSE PRIMERO
        return this.authService.check().pipe(
            switchMap(isAuthenticated => {
                if (!isAuthenticated) {
                    console.error('🚨 No autenticado según Fuse Auth');
                    this.clearUserSession();
                    return of(false);
                }

                const currentUser = this.currentUserSubject.value;
                
                if (!currentUser) {
                    return throwError('No hay usuario autenticado');
                }

                // Luego validar roles específicos contra servidor
                return this.http.get<RoleValidationResponse>(`/api/user/${currentUser.id_usuario}/validate-roles`)
                    .pipe(
                        map(response => {
                            if (response.valid) {
                                // Actualizar roles si han cambiado
                                if (JSON.stringify(response.roles) !== JSON.stringify(currentUser.roles)) {
                                    console.log('🔄 Roles actualizados desde servidor');
                                    this.updateUserRoles(response.roles, response.clinicas);
                                }
                                
                                this.roleValidationSubject.next(true);
                                return true;
                            } else {
                                console.error('🚨 Validación de roles falló:', response.message);
                                this.clearUserSession();
                                return false;
                            }
                        }),
                        catchError(error => {
                            console.error('🚨 Error validando roles:', error);
                            this.roleValidationSubject.next(false);
                            return throwError(error);
                        })
                    );
            })
        );
    }

    /**
     * 🔐 Limpia la sesión del usuario (integrado con Fuse)
     */
    clearUserSession(): void {
        this.currentUserSubject.next(null);
        this.selectedRoleSubject.next(null);
        this.availableRolesSubject.next([]);
        this.roleValidationSubject.next(false);
        
        localStorage.removeItem('selectedRole');
        localStorage.removeItem('selectedClinicId');
        
        if (this.validationTimer) {
            clearInterval(this.validationTimer);
        }
        
        console.log('🔐 Sesión de usuario limpiada (integrado con Fuse)');
        
        // 🔗 OPCIONAL: También limpiar sesión de Fuse si es necesario
        // this.authService.signOut();
    }

    // 🔧 MÉTODOS PRIVADOS DE SEGURIDAD E INTEGRACIÓN

    private extractRolesFromClinics(clinicas: any[]): UserRole[] {
        try {
            const roles = new Set<UserRole>();
            
            clinicas.forEach(clinica => {
                const pivot = clinica.UsuarioClinica || clinica.usuarioClinica;
                if (pivot?.rol_clinica) {
                    const normalizedRole = this.normalizeRole(pivot.rol_clinica);
                    if (this.isValidRole(normalizedRole)) {
                        roles.add(normalizedRole as UserRole);
                    }
                }
            });
            
            return Array.from(roles);
        } catch (error) {
            console.error('🚨 Error extrayendo roles:', error);
            return [];
        }
    }

    private sanitizeClinicas(clinicas: any[]): ClinicaConRol[] {
        try {
            return clinicas.map(clinica => ({
                id_clinica: clinica.id_clinica || clinica.id,
                nombre_clinica: clinica.nombre_clinica || clinica.name,
                rol_clinica: this.normalizeRole(clinica.UsuarioClinica?.rol_clinica || clinica.userRole) as UserRole,
                subrol_clinica: clinica.UsuarioClinica?.subrol_clinica || clinica.userSubRole,
                grupoClinica: clinica.grupoClinica,
                permissions: clinica.permissions || {
                    canMapAssets: false,
                    canManageSettings: false,
                    canViewReports: false,
                    isSystemAdmin: false
                }
            }));
        } catch (error) {
            console.error('🚨 Error sanitizando clínicas:', error);
            return [];
        }
    }

    private validateExtractedRoles(roles: UserRole[]): boolean {
        return roles.every(role => this.isValidRole(role));
    }

    private normalizeRole(role: string): string {
        if (!role) return '';
        return role.toLowerCase().trim();
    }

    private isValidRole(role: string): boolean {
        return Object.values(UserRole).includes(role as UserRole);
    }

    // 🔗 INTEGRACIÓN CON FUSE: Extraer expiry del token usando Fuse
    private extractTokenExpiryFromFuse(): Date | null {
        try {
            const token = this.authService.accessToken;
            if (!token) return null;

            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp ? new Date(payload.exp * 1000) : null;
        } catch (error) {
            console.error('🚨 Error extrayendo expiry del token de Fuse:', error);
            return null;
        }
    }

    private generateSessionId(): string {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    private selectDefaultRole(roles: UserRole[]): void {
        const storedRole = localStorage.getItem('selectedRole') as UserRole;
        
        if (storedRole && roles.includes(storedRole) && this.isValidRole(storedRole)) {
            this.selectedRoleSubject.next(storedRole);
        } else if (roles.length > 0) {
            this.selectedRoleSubject.next(roles[0]);
            localStorage.setItem('selectedRole', roles[0]);
        }
    }

    private loadPersistedRole(): void {
        const storedRole = localStorage.getItem('selectedRole') as UserRole;
        if (storedRole && this.isValidRole(storedRole)) {
            this.selectedRoleSubject.next(storedRole);
        }
    }

    private startRoleValidationTimer(): void {
        this.validationTimer = setInterval(() => {
            const currentUser = this.currentUserSubject.value;
            if (currentUser) {
                this.validateCurrentRoles().subscribe();
            }
        }, this.ROLE_VALIDATION_INTERVAL);
    }

    private updateUserRoles(newRoles: UserRole[], newClinicas: ClinicaConRol[]): void {
        const currentUser = this.currentUserSubject.value;
        if (currentUser) {
            const updatedUser = {
                ...currentUser,
                roles: newRoles,
                clinicas: newClinicas,
                lastRoleValidation: new Date()
            };
            
            this.currentUserSubject.next(updatedUser);
            this.availableRolesSubject.next(newRoles);
        }
    }

    // 🔐 MÉTODO PARA CLEANUP AL DESTRUIR EL SERVICIO
    ngOnDestroy(): void {
        if (this.validationTimer) {
            clearInterval(this.validationTimer);
        }
    }
}

