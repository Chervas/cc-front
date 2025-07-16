import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { RoleService } from 'app/core/services/role.service';
import { catchError, of, switchMap, take } from 'rxjs';

/**
 * 🔐 Interceptor de Roles con Configuración OAuth Segura
 * 
 * Este interceptor agrega automáticamente headers con información de roles
 * a las peticiones HTTP, pero EXCLUYE dominios externos como Meta/Facebook
 * para evitar interferencias con OAuth y otros servicios externos.
 */

/**
 * 🌐 Configuración de URLs que NO deben incluir headers de roles
 */
const EXCLUDED_DOMAINS = [
    // Meta/Facebook OAuth
    'graph.facebook.com',
    'www.facebook.com',
    'facebook.com',
    'connect.facebook.net',
    
    // Google OAuth (por si se usa en el futuro)
    'accounts.google.com',
    'oauth2.googleapis.com',
    'www.googleapis.com',
    
    // Microsoft OAuth (por si se usa en el futuro)
    'login.microsoftonline.com',
    'graph.microsoft.com',
    
    // Otros servicios comunes
    'api.twitter.com',
    'linkedin.com',
    'api.linkedin.com',
    
    // CDNs y servicios de assets
    'cdn.jsdelivr.net',
    'unpkg.com',
    'cdnjs.cloudflare.com',
    
    // Servicios de analytics (opcional)
    'www.google-analytics.com',
    'analytics.google.com'
];

/**
 * 🎯 URLs internas que SÍ deben incluir headers de roles
 */
const INTERNAL_API_PATTERNS = [
    '/api/',           // API principal
    '/backend/',       // Backend alternativo
    '/services/',      // Servicios internos
    '/auth/',          // Autenticación interna (no OAuth externo)
    '/roles/',         // Endpoints específicos de roles
    '/permissions/',   // Endpoints de permisos
    '/clinicas/',      // Endpoints de clínicas
    '/usuarios/',      // Endpoints de usuarios
    '/pacientes/',     // Endpoints de pacientes
    '/citas/',         // Endpoints de citas
    '/reportes/'       // Endpoints de reportes
];

/**
 * 🔍 Función para determinar si una petición debe incluir headers de roles
 */
function shouldInterceptRequest(url: string): boolean {
    try {
        // Crear objeto URL para análisis más preciso
        const urlObj = new URL(url, window.location.origin);
        const hostname = urlObj.hostname.toLowerCase();
        const pathname = urlObj.pathname.toLowerCase();
        
        // 🚫 EXCLUIR: Dominios externos específicos
        const isExcludedDomain = EXCLUDED_DOMAINS.some(domain => 
            hostname === domain || hostname.endsWith('.' + domain)
        );
        
        if (isExcludedDomain) {
            console.log(`🚫 [RoleInterceptor] Excluyendo dominio externo: ${hostname}`);
            return false;
        }
        
        // 🚫 EXCLUIR: URLs que contienen parámetros OAuth
        const hasOAuthParams = url.includes('oauth') || 
                              url.includes('access_token') || 
                              url.includes('client_id') ||
                              url.includes('redirect_uri') ||
                              url.includes('response_type=code');
        
        if (hasOAuthParams) {
            console.log(`🚫 [RoleInterceptor] Excluyendo URL con parámetros OAuth: ${url}`);
            return false;
        }
        
        // 🚫 EXCLUIR: Assets estáticos
        const isStaticAsset = pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
        if (isStaticAsset) {
            return false;
        }
        
        // ✅ INCLUIR: URLs de API interna
        const isInternalAPI = INTERNAL_API_PATTERNS.some(pattern => 
            pathname.includes(pattern.toLowerCase())
        );
        
        if (isInternalAPI) {
            console.log(`✅ [RoleInterceptor] Incluyendo API interna: ${pathname}`);
            return true;
        }
        
        // ✅ INCLUIR: URLs relativas (mismo dominio)
        const isSameDomain = hostname === window.location.hostname || 
                           hostname === 'localhost' || 
                           hostname === '127.0.0.1';
        
        if (isSameDomain) {
            console.log(`✅ [RoleInterceptor] Incluyendo mismo dominio: ${hostname}`);
            return true;
        }
        
        // 🚫 Por defecto, excluir URLs externas no especificadas
        console.log(`🚫 [RoleInterceptor] Excluyendo URL externa por defecto: ${url}`);
        return false;
        
    } catch (error) {
        // Si hay error parseando la URL, ser conservador y excluir
        console.warn(`⚠️ [RoleInterceptor] Error parseando URL, excluyendo: ${url}`, error);
        return false;
    }
}

/**
 * 🔐 Interceptor principal de roles (CORREGIDO - Tipo de retorno correcto)
 */
export const roleInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next) => {
    // 🔍 Verificar si esta petición debe incluir headers de roles
    if (!shouldInterceptRequest(req.url)) {
        // Continuar sin modificar la petición
        return next(req);
    }
    
    try {
        // 🔧 Inyectar el RoleService
        const roleService = inject(RoleService);
        
        // 📊 Obtener información actual del usuario usando observables
        // CORREGIDO: Usar switchMap para retornar Observable<HttpEvent<unknown>>
        return roleService.currentUser$.pipe(
            take(1), // Tomar solo el valor actual
            switchMap(currentUser => {
                try {
                    // 📝 Preparar headers de roles
                    const roleHeaders: { [key: string]: string } = {};
                    
                    // Obtener información básica del usuario
                    if (currentUser?.id_usuario) {
                        roleHeaders['X-User-ID'] = currentUser.id_usuario.toString();
                    }
                    
                    // CORREGIDO: Sin usar selectedClinicId que no existe en UsuarioConRoles
                    // Si necesitas clínica seleccionada, usar otro método del servicio
                    
                    // Obtener isAdmin del usuario
                    const isAdmin = currentUser?.isAdmin || false;
                    roleHeaders['X-Is-Admin'] = isAdmin.toString();
                    
                    // Obtener rol seleccionado usando observable
                    return roleService.selectedRole$.pipe(
                        take(1),
                        switchMap(selectedRole => {
                            if (selectedRole) {
                                roleHeaders['X-Current-Role'] = selectedRole;
                            }
                            
                            // Obtener roles disponibles
                            return roleService.availableRoles$.pipe(
                                take(1),
                                switchMap(availableRoles => {
                                    if (availableRoles && availableRoles.length > 0) {
                                        roleHeaders['X-Available-Roles'] = availableRoles.join(',');
                                    }
                                    
                                    roleHeaders['X-Role-Timestamp'] = new Date().toISOString();
                                    
                                    // 🔧 Crear nueva petición con headers adicionales
                                    const modifiedReq = req.clone({
                                        setHeaders: roleHeaders
                                    });
                                    
                                    console.log(`🔐 [RoleInterceptor] Headers agregados a: ${req.url}`, roleHeaders);
                                    
                                    // CORREGIDO: Retornar el resultado de next() directamente
                                    return next(modifiedReq);
                                })
                            );
                        })
                    );
                    
                } catch (error) {
                    // 🚨 Si hay error, continuar sin headers para no romper la petición
                    console.error('❌ [RoleInterceptor] Error procesando headers de roles:', error);
                    return next(req);
                }
            }),
            catchError(error => {
                // 🚨 Si hay error con observables, continuar sin headers
                console.error('❌ [RoleInterceptor] Error obteniendo datos de usuario:', error);
                return next(req);
            })
        );
        
    } catch (error) {
        // 🚨 Si hay error general, continuar sin headers para no romper la petición
        console.error('❌ [RoleInterceptor] Error general en interceptor:', error);
        return next(req);
    }
};

/**
 * 🔧 Interceptor configurable para casos especiales
 */
export class ConfigurableRoleInterceptor {
    private customExcludedDomains: string[] = [];
    private customIncludedPatterns: string[] = [];
    
    /**
     * Agregar dominios personalizados a excluir
     */
    addExcludedDomains(domains: string[]): void {
        this.customExcludedDomains.push(...domains);
    }
    
    /**
     * Agregar patrones personalizados a incluir
     */
    addIncludedPatterns(patterns: string[]): void {
        this.customIncludedPatterns.push(...patterns);
    }
    
    /**
     * Crear interceptor con configuración personalizada
     */
    createInterceptor(): HttpInterceptorFn {
        return (req: HttpRequest<any>, next) => {
            // Usar configuración personalizada junto con la configuración base
            const shouldIntercept = this.shouldInterceptWithCustomConfig(req.url);
            
            if (!shouldIntercept) {
                return next(req);
            }
            
            // Aplicar la lógica del interceptor base
            return roleInterceptor(req, next);
        };
    }
    
    private shouldInterceptWithCustomConfig(url: string): boolean {
        // Verificar exclusiones personalizadas
        const isCustomExcluded = this.customExcludedDomains.some(domain => 
            url.toLowerCase().includes(domain.toLowerCase())
        );
        
        if (isCustomExcluded) {
            return false;
        }
        
        // Verificar inclusiones personalizadas
        const isCustomIncluded = this.customIncludedPatterns.some(pattern => 
            url.toLowerCase().includes(pattern.toLowerCase())
        );
        
        if (isCustomIncluded) {
            return true;
        }
        
        // Usar lógica base
        return shouldInterceptRequest(url);
    }
}

/*
📝 CORRECCIONES REALIZADAS:

1. 🛣️ RUTAS CORREGIDAS:
   - RoleService: 'app/core/services/role.service'

2. 🔧 TIPO DE RETORNO CORREGIDO:
   - Usar switchMap en lugar de map para retornar Observable<HttpEvent<unknown>>
   - Estructura correcta de observables anidados
   - Retorno directo de next(modifiedReq)

3. 📊 PROPIEDADES CORREGIDAS:
   - Eliminado selectedClinicId que no existe en UsuarioConRoles
   - Solo usar propiedades que existen: id_usuario, isAdmin

4. 🛡️ SEGURIDAD OAUTH:
   - Mantiene exclusión de dominios externos
   - Detecta parámetros OAuth en URLs
   - Configuración flexible para casos especiales

5. 🚨 MANEJO DE ERRORES:
   - Graceful fallback si hay errores
   - No rompe peticiones si falla el interceptor
   - Logs detallados para debugging

6. 📊 OBSERVABLES CORRECTOS:
   - Uso correcto de switchMap para encadenar observables
   - take(1) para obtener valor actual
   - Manejo de errores con catchError
*/

