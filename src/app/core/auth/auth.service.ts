import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { RoleService } from 'app/core/services/role.service'; // ✅ NUEVO IMPORT

/**
 * 🔐 AuthService COMPLETO con Adaptador Fuse + RoleService
 * 
 * Incluye TODOS los métodos que esperan los componentes de autenticación
 * + Integración con RoleService para recargar datos después del login
 */

// 📋 Tipos del Backend (Reales)
export interface Usuario {
    id_usuario: number;
    nombre: string;
    apellidos: string;
    email_usuario: string;
    isProfesional: boolean;
    url_avatar?: string;
    telefono?: string;
    direccion?: string;
}

export interface LoginResponse {
    token: string;
    expiresIn: number;
    user: Usuario;
}

// 📋 Tipos de Fuse (Esperados)
export interface FuseUser {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    status?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private _authenticated: boolean = false;
    private _user: BehaviorSubject<FuseUser | null> = new BehaviorSubject<FuseUser | null>(null);

    constructor(
        private _httpClient: HttpClient,
        private _roleService: RoleService // ✅ NUEVO: Inyección de RoleService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for access token
     */
    set accessToken(token: string) {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string {
        return localStorage.getItem('accessToken') ?? '';
    }

    /**
     * Getter for user
     */
    get user$(): Observable<FuseUser | null> {
        return this._user.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * 🔐 Sign in - MODIFICADO con RoleService
     */
    signIn(credentials: { email: string; password: string }): Observable<any> {
        // Return if the user is already logged in
        if (this._authenticated) {
            return of(true);
        }

        return this._httpClient.post<LoginResponse>('/api/auth/sign-in', credentials).pipe(
            tap((response) => {
                console.log('Response from signIn:', response);
                
                // ✅ Guardar token
                this.accessToken = response.token;
                
                // 🔄 ADAPTADOR: Usuario Backend → FuseUser
                const fuseUser = this.adaptUsuarioToFuseUser(response.user);

                // ✅ Guardar usuario para futuros inicios automáticos
                localStorage.setItem('userInfo', JSON.stringify(fuseUser));
                
                // ✅ Actualizar estado
                this._authenticated = true;
                this._user.next(fuseUser);
                
                console.log('✅ [AuthService] Usuario adaptado para Fuse:', fuseUser);
                
                // 🚀 NUEVO: Recargar datos en RoleService después del login
                try {
                    this._roleService.reloadUserData();
                    console.log('🔄 [AuthService] RoleService recargado después del login');
                } catch (error) {
                    console.warn('⚠️ [AuthService] Error recargando RoleService:', error);
                }
            }),
            catchError((error) => {
                console.error('❌ [AuthService] Error en login:', error);
                throw error;
            })
        );
    }

    /**
     * 📝 Sign up
     */
    signUp(userData: any): Observable<any> {
        return this._httpClient.post('/api/auth/sign-up', userData).pipe(
            tap((response: any) => {
                console.log('✅ [AuthService] Usuario registrado:', response);
            }),
            catchError((error) => {
                console.error('❌ [AuthService] Error en registro:', error);
                return throwError(error);
            })
        );
    }

    /**
     * 🚪 Sign out - MODIFICADO con RoleService
     */
    signOut(): Observable<any> {
      // Remove the access token and stored user from the local storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userInfo');

        // Set the authenticated flag to false
        this._authenticated = false;

        // Set the user to null
        this._user.next(null);

        // 🚀 NUEVO: Limpiar datos de RoleService al cerrar sesión
        try {
            this._roleService.clearData();
            console.log('🧹 [AuthService] RoleService limpiado después del logout');
        } catch (error) {
            console.warn('⚠️ [AuthService] Error limpiando RoleService:', error);
        }

        // Return the observable
        return of(true);
    }

    /**
     * 🔒 Forgot password
     */
    forgotPassword(email: string): Observable<any> {
        return this._httpClient.post('/api/auth/forgot-password', { email }).pipe(
            tap((response) => {
                console.log('✅ [AuthService] Email de recuperación enviado:', response);
            }),
            catchError((error) => {
                console.error('❌ [AuthService] Error en forgot password:', error);
                return throwError(error);
            })
        );
    }

    /**
     * 🔑 Reset password
     */
    resetPassword(email: string, password: string, token?: string): Observable<any> {
        const payload = { email, password, token };
        
        return this._httpClient.post('/api/auth/reset-password', payload).pipe(
            tap((response) => {
                console.log('✅ [AuthService] Contraseña restablecida:', response);
            }),
            catchError((error) => {
                console.error('❌ [AuthService] Error en reset password:', error);
                return throwError(error);
            })
        );
    }

    /**
     * 🔓 Unlock session
     */
    unlockSession(credentials: { email: string; password: string }): Observable<any> {
        return this._httpClient.post('/api/auth/unlock-session', credentials).pipe(
            tap((response: any) => {
                console.log('✅ [AuthService] Sesión desbloqueada:', response);
                
                // Si devuelve un usuario, actualizarlo
                if (response.user) {
                    const fuseUser = this.adaptUsuarioToFuseUser(response.user);
                    this._user.next(fuseUser);
                }
            }),
            catchError((error) => {
                console.error('❌ [AuthService] Error en unlock session:', error);
                return throwError(error);
            })
        );
    }

    /**
     * 👤 Get current user (MÉTODO REQUERIDO)
     */
    getCurrentUser(): Observable<FuseUser | null> {
        return this._user.asObservable();
    }

    /**
     * 🔍 Check the authentication status
     */
    check(): Observable<boolean> {
        // Check if the user is logged in
        if (this._authenticated) {
            return of(true);
        }

        // Check the access token availability
        if (!this.accessToken) {
            return of(false);
        }

        // Check the access token expire date
        if (this._isTokenExpired()) {
            return of(false);
        }

        // If the access token exists and it didn't expire, sign in using it
        return this.signInUsingToken();
    }

     /**
     * 🎫 Sign in using the access token - MODIFICADO con RoleService
     * 🎫 Sign in using the access token - MODIFICADO para usar datos locales
     *
     * El backend no implementa `GET /api/auth/me`, por lo que recuperamos la
     * información de usuario almacenada en `localStorage` durante el login.
     */
    signInUsingToken(): Observable<any> {
       
        const stored = localStorage.getItem('userInfo');

        if (stored) {
            try {
                const fuseUser: FuseUser = JSON.parse(stored);

                this._authenticated = true;
                this._user.next(fuseUser);

                // 🚀 Recargar RoleService también en signInUsingToken
                try {
                    this._roleService.reloadUserData();
                    console.log('🔄 [AuthService] RoleService recargado en signInUsingToken');
                } catch (error) {
                    console.warn('⚠️ [AuthService] Error recargando RoleService en signInUsingToken:', error);
                }
                
                return of(true);
            
            } catch {
                console.warn('⚠️ [AuthService] Error al leer userInfo de localStorage');
                localStorage.removeItem('userInfo');
            }
        }

        return of(false);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * 🔄 Adaptador: Usuario Backend → FuseUser
     */
    private adaptUsuarioToFuseUser(usuario: Usuario): FuseUser {
        return {
            id: usuario.id_usuario.toString(),
            name: `${usuario.nombre} ${usuario.apellidos}`.trim(),
            email: usuario.email_usuario,
            avatar: usuario.url_avatar || 'assets/images/avatars/default.jpg',
            status: usuario.isProfesional ? 'online' : 'away'
        };
    }

    /**
     * 🕐 Check if token is expired
     */
    private _isTokenExpired(): boolean {
        try {
            const token = this.accessToken;
            if (!token) return true;

            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            
            return payload.exp < currentTime;
        } catch (error) {
            return true;
        }
    }
}

/**
 * 🎭 Mock Data Service para Fuse
 * 
 * Proporciona datos mock para las rutas que Fuse espera
 */
@Injectable({
    providedIn: 'root'
})
export class FuseMockDataService {
    
    /**
     * 📋 Datos mock para navegación
     */
    getNavigation(): Observable<any[]> {
        const mockNavigation = [
            {
                id: 'dashboard',
                title: 'Dashboard',
                type: 'basic',
                icon: 'heroicons_outline:home',
                link: '/dashboard'
            },
            {
                id: 'pacientes',
                title: 'Pacientes',
                type: 'basic',
                icon: 'heroicons_outline:users',
                link: '/apps/pacientes'
            },
            {
                id: 'clinicas',
                title: 'Clínicas',
                type: 'basic',
                icon: 'heroicons_outline:building-office',
                link: '/apps/clinicas'
            }
        ];
        
        return of(mockNavigation);
    }

    /**
     * 📨 Datos mock para mensajes
     */
    getMessages(): Observable<any[]> {
        return of([]);
    }

    /**
     * 🔔 Datos mock para notificaciones
     */
    getNotifications(): Observable<any[]> {
        return of([]);
    }

    /**
     * 💬 Datos mock para chats
     */
    getChats(): Observable<any[]> {
        return of([]);
    }

    /**
     * ⌨️ Datos mock para shortcuts
     */
    getShortcuts(): Observable<any[]> {
        return of([]);
    }
}

