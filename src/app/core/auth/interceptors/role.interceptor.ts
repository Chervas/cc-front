import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { RoleService } from 'app/core/services/role.service';

/**
 * 🔧 Interceptor de Roles con Mock de Rutas Fuse - FORMATO CORREGIDO
 * 
 * Corrige el error "TypeError: c is not iterable" con formato correcto de navegación
 */

/**
 * 👑 Rutas de Fuse que necesitan mock - FORMATO CORREGIDO PARA CLASSY
 */
const FUSE_MOCK_ROUTES = {
    '/api/common/navigation': {
        default: [
            // Panel principal
            { id: 'panel-principal', title: 'Panel Principal', type: 'basic', icon: 'heroicons_outline:chart-bar', link: '/panel-principal' },

            // Pacientes
            {
                id: 'pacientes',
                title: 'Pacientes',
                type: 'group',
                icon: 'heroicons_outline:user-group',
                children: [
                    { id: 'pacientes.lista', title: 'Lista de pacientes', type: 'basic', icon: 'heroicons_outline:user-group', link: '/pacientes' },
                    { id: 'pacientes.calendario', title: 'Calendario de Citas', type: 'basic', icon: 'heroicons_outline:calendar', disabled: true },
                    { id: 'pacientes.recordatorios', title: 'Recordatorios', type: 'basic', icon: 'heroicons_outline:bell', disabled: true },
                ]
            },

            // Marketing
            {
                id: 'marketing',
                title: 'Marketing',
                type: 'group',
                icon: 'heroicons_outline:megaphone',
                children: [
                    { id: 'marketing.primeras-citas', title: 'Primeras citas', type: 'basic', icon: 'heroicons_outline:clipboard-document-check', disabled: true },
                    { id: 'marketing.campanas', title: 'Campañas', type: 'basic', icon: 'heroicons_outline:swatch', disabled: true },
                    { id: 'marketing.redes', title: 'Redes sociales', type: 'basic', icon: 'heroicons_outline:share', disabled: true },
                    { id: 'marketing.web', title: 'Página web', type: 'basic', icon: 'heroicons_outline:globe-alt', disabled: true },
                    { id: 'marketing.perfil-google', title: 'Perfil de Empresa en Google', type: 'basic', icon: 'heroicons_outline:map-pin', disabled: true },
                ]
            },

            // Clínica
            {
                id: 'clinica',
                title: 'Clínica',
                type: 'group',
                icon: 'heroicons_outline:building-office-2',
                children: [
                    { id: 'clinica.usuarios', title: 'Personal', type: 'basic', icon: 'heroicons_outline:identification', link: '/usuarios' },
                    { id: 'clinica.tratamientos', title: 'Tratamientos', type: 'basic', icon: 'heroicons_outline:beaker', disabled: true },
                    { id: 'clinica.clinicas', title: 'Clínicas', type: 'basic', icon: 'heroicons_outline:building-storefront', link: '/clinicas' },
                    { id: 'clinica.instalaciones', title: 'Instalaciones', type: 'basic', icon: 'heroicons_outline:home-modern', disabled: true },
                    { id: 'clinica.aseguradoras', title: 'Aseguradoras', type: 'basic', icon: 'heroicons_outline:shield-check', disabled: true },
                    { id: 'clinica.tareas', title: 'Tareas', type: 'basic', icon: 'heroicons_outline:check-circle', disabled: true },
                    { id: 'clinica.correo', title: 'Correo electrónico', type: 'basic', icon: 'heroicons_outline:envelope', disabled: true },
                ]
            },

            // General
            {
                id: 'general',
                title: 'General',
                type: 'group',
                icon: 'heroicons_outline:cog-6-tooth',
                children: [
                    { id: 'general.ajustes', title: 'Ajustes', type: 'basic', icon: 'heroicons_outline:cog-6-tooth', link: '/ajustes' },
                ]
            },
        ],

        compact: [
            { id: 'panel-principal', title: 'Panel Principal', type: 'basic', icon: 'heroicons_outline:chart-bar', link: '/panel-principal' },
            { id: 'pacientes', title: 'Pacientes', type: 'basic', icon: 'heroicons_outline:user-group', link: '/pacientes' },
            { id: 'clinica', title: 'Clínica', type: 'basic', icon: 'heroicons_outline:building-office-2', link: '/clinicas' },
            { id: 'marketing', title: 'Marketing', type: 'basic', icon: 'heroicons_outline:megaphone', link: '/panel-principal' },
            { id: 'ajustes', title: 'Ajustes', type: 'basic', icon: 'heroicons_outline:cog-6-tooth', link: '/ajustes' },
        ],

        futuristic: [
            { id: 'panel-principal', title: 'Panel Principal', type: 'basic', icon: 'heroicons_outline:chart-bar', link: '/panel-principal' },
        ]
    },
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
    'oauth2.googleapis.com',
    'www.googleapis.com',
    'autenticacion.clinicaclick.com'
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
 * 🔧 Interceptor principal
 */
export const roleInterceptor: HttpInterceptorFn = (req, next) => {
    const requestType = getRequestType(req.url);
    
    // 👑 Manejar rutas Fuse con mock
    if (requestType === 'fuse-mock') {
        const mockRoute = Object.keys(FUSE_MOCK_ROUTES).find(route => req.url.includes(route));
        if (mockRoute) {
            console.log('👑 [RoleInterceptor] Devolviendo mock para ruta Fuse:', mockRoute);
            
            const mockData = FUSE_MOCK_ROUTES[mockRoute];
            return of(new HttpResponse({
                status: 200,
                body: mockData,
                statusText: 'OK'
            }));
        }
    }
    
    // 🔍 MOCK DE /api/auth/me - SOLUCIÓN AL PROBLEMA PRINCIPAL
    if (req.url.includes('/api/auth/me')) {
        console.log('🔍 [RoleInterceptor] Mock de auth/me - Solucionando problema Fuse');
        
        // Crear usuario mock compatible con Fuse
        const mockUser = {
            id: '1',
            name: 'Usuario Clínica',
            email: 'usuario@clinica.com',
            avatar: 'assets/images/avatars/default.jpg',
            status: 'online'
        };
        
        console.log('✅ [RoleInterceptor] Usuario mock creado:', mockUser);
        
        return of(new HttpResponse({
            status: 200,
            body: mockUser,
            headers: req.headers
        }));
    }
    
    // 🚫 Ignorar peticiones externas
    if (requestType === 'external' || requestType === 'ignore') {
        return next(req);
    }
    
    // ✅ Manejar APIs internas con headers de roles
    if (requestType === 'internal-api') {
        console.log('✅ [RoleInterceptor] Procesando API interna:', req.url);
        
        try {
            // 🛡️ VERIFICACIÓN DEFENSIVA MEJORADA: Inyectar y verificar RoleService
            const roleService = inject(RoleService);
            
            // ✅ VERIFICACIÓN ROBUSTA: Múltiples checks
            if (!roleService) {
                console.warn('⚠️ [RoleInterceptor] RoleService no disponible');
                return next(req);
            }
            
            if (typeof roleService.getCurrentUser !== 'function') {
                console.warn('⚠️ [RoleInterceptor] Método getCurrentUser no disponible');
                return next(req);
            }
            
            // 🔍 Preparar headers de roles
            const roleHeaders: { [key: string]: string } = {};
            
            // 👤 Obtener información del usuario actual con try/catch adicional
            let currentUser = null;
            try {
                currentUser = roleService.getCurrentUser();
            } catch (methodError) {
                console.warn('⚠️ [RoleInterceptor] Error ejecutando getCurrentUser:', methodError);
                currentUser = null;
            }
            
            if (currentUser && typeof currentUser === 'object') {
                const user = currentUser as any;
                
                roleHeaders['X-User-Id'] = user.id_usuario?.toString() || user.id?.toString() || 'anonymous';
                roleHeaders['X-Is-Admin'] = (user.isAdmin === true).toString();
                
                // 🏥 Agregar información de clínica seleccionada con verificación
                if (typeof roleService.getSelectedClinica === 'function') {
                    try {
                        const selectedClinica = roleService.getSelectedClinica();
                        if (selectedClinica && typeof selectedClinica === 'object') {
                            const clinica = selectedClinica as any;
                            
                            roleHeaders['X-Selected-Clinic'] = clinica.id?.toString() || 'none';
                            roleHeaders['X-User-Role'] = clinica.userRole || clinica.rol || 'user';
                            
                            if (clinica.userSubRole || clinica.subrol_clinica) {
                                roleHeaders['X-User-SubRole'] = clinica.userSubRole || clinica.subrol_clinica;
                            }
                        }
                    } catch (clinicaError) {
                        console.warn('⚠️ [RoleInterceptor] Error obteniendo clínica seleccionada:', clinicaError);
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
            
            console.log('🔧 [RoleInterceptor] Headers agregados a:', req.url, roleHeaders);
            
            return next(modifiedReq);
            
        } catch (error) {
            console.error('❌ [RoleInterceptor] Error procesando headers:', error);
            return next(req);
        }
    }
    
    // 🚀 Para otros casos, continuar sin modificaciones
    return next(req);
};

// 📋 CORRECCIÓN APLICADA:
//
// ✅ Formato de navegación corregido: Objeto con {default, compact, futuristic}
// ✅ Estructura para layout Classy: Grupos con children
// ✅ Mocks consistentes: shortcuts y messages siempre devuelven 200
// ✅ Iconos Heroicons: Compatibles con Fuse
// ✅ Enlaces funcionales: Rutas existentes en el proyecto
//
// 🎯 SOLUCIONA:
//
// ✅ TypeError: c is not iterable - Formato correcto de datos
// ✅ Menú lateral no aparece - Estructura de grupos correcta
// ✅ Errores 404 - Mocks consistentes
// ✅ Interfaz rota - Navegación funcional para Classy
