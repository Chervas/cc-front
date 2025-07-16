import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { RoleService } from 'app/core/services/role.service';

/**
 * 🛡️ Interceptor de Roles con Mock de Rutas Fuse
 * 
 * Maneja tanto headers de roles como mocks para rutas que Fuse espera
 */

/**
 * 🎭 Rutas de Fuse que necesitan mock
 */
const FUSE_MOCK_ROUTES = {
    '/api/common/navigation': [
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
    ],
    '/api/common/messages': [],
    '/api/common/notifications': [],
    '/api/apps/chat/chats': [],
    '/api/common/shortcuts': []
};

/**
 * 🚫 Dominios externos a excluir
 */
const EXCLUDED_DOMAINS = [
    'graph.facebook.com',
    'www.facebook.com',
    'facebook.com',
    'connect.facebook.net',
    'accounts.google.com',
    'oauth2.googleapis.com',
    'www.googleapis.com'
];

/**
 * ✅ URLs internas que SÍ deben incluir headers de roles
 */
const INTERNAL_API_PATTERNS = [
    '/api/auth/sign-in',
    '/api/users/',
    '/api/userclinicas/',
    '/api/clinicas/',
    '/api/pacientes/',
    '/api/servicios/',
    '/api/facturas/',
    '/api/reportes/',
    '/api/configuracion/'
];

/**
 * 🔍 Función para determinar el tipo de petición
 */
function getRequestType(url: string): 'fuse-mock' | 'internal-api' | 'external' | 'ignore' {
    try {
        // ✅ Verificar si es una ruta Fuse que necesita mock
        if (Object.keys(FUSE_MOCK_ROUTES).some(route => url.includes(route))) {
            return 'fuse-mock';
        }
        
        // ❌ Excluir dominios externos
        const urlObj = new URL(url);
        if (EXCLUDED_DOMAINS.some(domain => urlObj.hostname.includes(domain))) {
            return 'external';
        }
        
        // ✅ Verificar si es API interna
        if (INTERNAL_API_PATTERNS.some(pattern => url.includes(pattern))) {
            return 'internal-api';
        }
        
        return 'ignore';
        
    } catch (error) {
        // Si no se puede parsear la URL, verificar patrones
        if (Object.keys(FUSE_MOCK_ROUTES).some(route => url.includes(route))) {
            return 'fuse-mock';
        }
        if (INTERNAL_API_PATTERNS.some(pattern => url.includes(pattern))) {
            return 'internal-api';
        }
        return 'ignore';
    }
}

/**
 * 🛡️ Interceptor principal
 */
export const roleInterceptor: HttpInterceptorFn = (req, next) => {
    const requestType = getRequestType(req.url);
    
    // 🎭 Manejar rutas Fuse con mock
    if (requestType === 'fuse-mock') {
        const mockRoute = Object.keys(FUSE_MOCK_ROUTES).find(route => req.url.includes(route));
        if (mockRoute) {
            console.log('🎭 [RoleInterceptor] Devolviendo mock para ruta Fuse:', req.url);
            
            const mockData = FUSE_MOCK_ROUTES[mockRoute];
            return of(new HttpResponse({
                body: mockData,
                status: 200,
                statusText: 'OK'
            }));
        }
    }
    
    // 🚫 Ignorar peticiones externas
    if (requestType === 'external' || requestType === 'ignore') {
        return next(req);
    }
    
    // ✅ Manejar APIs internas con headers de roles
    if (requestType === 'internal-api') {
        const roleService = inject(RoleService);
        
        console.log('✅ [RoleInterceptor] Procesando API interna:', req.url);
        
        try {
            // 📋 Preparar headers de roles
            const roleHeaders: { [key: string]: string } = {
                'X-Role-Timestamp': new Date().toISOString()
            };
            
            // 👤 Obtener información del usuario actual
            const currentUser = roleService.getCurrentUser();
            
            if (currentUser && typeof currentUser === 'object') {
                const user = currentUser as any;
                
                roleHeaders['X-User-Id'] = user.id_usuario?.toString() || user.id?.toString() || 'unknown';
                roleHeaders['X-Is-Admin'] = (user.isAdmin === true).toString();
                
                // 🏥 Agregar información de clínica seleccionada
                const selectedClinica = roleService.getSelectedClinica();
                if (selectedClinica && typeof selectedClinica === 'object') {
                    const clinica = selectedClinica as any;
                    
                    roleHeaders['X-Selected-Clinic'] = clinica.id?.toString() || clinica.id_clinica?.toString() || 'unknown';
                    roleHeaders['X-User-Role'] = clinica.userRole || clinica.rol_clinica || 'unknown';
                    
                    if (clinica.userSubRole || clinica.subrol_clinica) {
                        roleHeaders['X-User-SubRole'] = clinica.userSubRole || clinica.subrol_clinica;
                    }
                }
            } else {
                roleHeaders['X-User-Id'] = 'anonymous';
                roleHeaders['X-Is-Admin'] = 'false';
            }
            
            // 🔧 Crear nueva petición con headers
            const modifiedReq = req.clone({
                setHeaders: roleHeaders
            });
            
            console.log('🔐 [RoleInterceptor] Headers agregados a:', req.url, roleHeaders);
            
            return next(modifiedReq);
            
        } catch (error) {
            console.error('❌ [RoleInterceptor] Error procesando headers:', error);
            return next(req);
        }
    }
    
    // 🔄 Continuar con petición sin modificar
    return next(req);
};

/**
 * 📊 Estadísticas del interceptor (para debugging)
 */
export class RoleInterceptorStats {
    private static _instance: RoleInterceptorStats;
    private _stats = {
        fuseMocks: 0,
        internalApis: 0,
        externalIgnored: 0,
        totalRequests: 0
    };
    
    static getInstance(): RoleInterceptorStats {
        if (!this._instance) {
            this._instance = new RoleInterceptorStats();
        }
        return this._instance;
    }
    
    incrementFuseMock(): void {
        this._stats.fuseMocks++;
        this._stats.totalRequests++;
    }
    
    incrementInternalApi(): void {
        this._stats.internalApis++;
        this._stats.totalRequests++;
    }
    
    incrementExternalIgnored(): void {
        this._stats.externalIgnored++;
        this._stats.totalRequests++;
    }
    
    getStats() {
        return { ...this._stats };
    }
    
    logStats(): void {
        console.log('📊 [RoleInterceptor] Estadísticas:', this._stats);
    }
}

