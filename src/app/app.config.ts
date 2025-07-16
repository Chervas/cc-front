import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { LuxonDateAdapter } from '@angular/material-luxon-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { provideTransloco } from '@ngneat/transloco';

// 🔧 Importaciones de Fuse
import { provideFuse } from '@fuse/fuse.provider';

// 🛣️ Importaciones de rutas (CORREGIDO: appRoutes en lugar de routes)
import { appRoutes } from './app.routes';

// 🌍 Importaciones de internacionalización (RUTA CORREGIDA)
import { TranslocoHttpLoader } from './core/transloco/transloco.http-loader';

// 🔐 Importaciones del sistema de roles (RUTAS CORREGIDAS)
import { RoleService } from 'app/core/services/role.service';
import { PermissionService } from 'app/core/services/permission.service';
import { RoleGuard } from './core/auth/guards/role.guard';
import { roleInterceptor } from './core/auth/interceptors/role.interceptor';

// 📋 Importaciones de constantes (RUTA CORREGIDA)
import { ROLE_CONFIG } from 'app/core/constants/role.constants';

/**
 * 🚀 Función de inicialización del sistema de roles
 * 
 * Esta función se ejecuta durante el arranque de la aplicación para:
 * - Cargar las constantes de roles globalmente
 * - Sincronizar los servicios de roles y permisos
 * - Preparar el sistema para el uso de directivas
 */
function initializeRoleSystem(
    roleService: RoleService,
    permissionService: PermissionService
): () => Promise<void> {
    return () => {
        return new Promise<void>((resolve) => {
            console.log('🔐 [RoleSystem] Inicializando sistema de roles...');
            
            try {
                // Hacer disponibles las constantes globalmente para las directivas
                (window as any).ROLE_CONFIG = ROLE_CONFIG;
                
                // Verificar que los servicios estén disponibles
                if (roleService && permissionService) {
                    console.log('✅ [RoleSystem] Servicios de roles inicializados correctamente');
                } else {
                    console.warn('⚠️ [RoleSystem] Algunos servicios de roles no están disponibles');
                }
                
                console.log('🎯 [RoleSystem] Sistema de roles listo');
                resolve();
                
            } catch (error) {
                console.error('❌ [RoleSystem] Error inicializando sistema de roles:', error);
                // Continuar con la inicialización aunque haya errores
                resolve();
            }
        });
    };
}

/**
 * ⚙️ Configuración principal de la aplicación Angular
 * 
 * Esta configuración incluye:
 * - Routing y animaciones básicas
 * - Cliente HTTP con interceptores (incluyendo RoleInterceptor)
 * - Internacionalización con Transloco
 * - Sistema de roles completo (servicios, guards, interceptores)
 * - Configuración de Fuse
 * - Adaptadores de fecha
 */
export const appConfig: ApplicationConfig = {
    providers: [
        // 🛣️ Configuración de routing (CORREGIDO: appRoutes)
        provideRouter(appRoutes),
        
        // 🎨 Configuración de animaciones
        provideAnimations(),
        
        // 🌐 Configuración de cliente HTTP con interceptores
        provideHttpClient(
            withInterceptors([
                roleInterceptor  // ✅ Interceptor de roles incluido
            ])
        ),
        
        // 🌍 Internacionalización (configuración que funciona)
        provideTransloco({
            config: {
                availableLangs: [
                    {
                        id: 'en',
                        label: 'English',
                    },
                    {
                        id: 'tr',
                        label: 'Turkish',
                    },
                ],
                defaultLang: 'en',
                fallbackLang: 'en',
                reRenderOnLangChange: true,
                prodMode: true,  // ✅ Configuración que resuelve el error toUpperCase
            },
            loader: TranslocoHttpLoader,
        }),
        
        // 🔐 Sistema de roles - Servicios principales
        RoleService,           // Servicio existente (extendido)
        PermissionService,     // Nuevo servicio de permisos granulares
        RoleGuard,            // Guard para protección de rutas
        
        // 🚀 Inicialización del sistema de roles
        {
            provide: APP_INITIALIZER,
            useFactory: initializeRoleSystem,
            deps: [RoleService, PermissionService],
            multi: true
        },
        
        // 🎯 Configuración de Fuse
        provideFuse({
            mockApi: {
                delay: 0,
                services: [
                    // Aquí van los servicios mock de Fuse si los hay
                ],
            },
            fuse: {
                layout: 'classy',
                scheme: 'light',
                screens: {
                    sm: '600px',
                    md: '960px',
                    lg: '1280px',
                    xl: '1440px',
                },
                theme: 'theme-default',
                themes: [
                    {
                        id: 'theme-default',
                        name: 'Default',
                    },
                    {
                        id: 'theme-brand',
                        name: 'Brand',
                    },
                    {
                        id: 'theme-teal',
                        name: 'Teal',
                    },
                    {
                        id: 'theme-rose',
                        name: 'Rose',
                    },
                    {
                        id: 'theme-purple',
                        name: 'Purple',
                    },
                    {
                        id: 'theme-amber',
                        name: 'Amber',
                    },
                ],
            },
        }),
        
        // 📅 Configuración de adaptadores de fecha (CORREGIDO - Sin MatMomentDateModule)
        {
            provide: DateAdapter,
            useClass: LuxonDateAdapter,
        },
        {
            provide: MAT_DATE_FORMATS,
            useValue: {
                parse: {
                    dateInput: 'DD/MM/YYYY',
                },
                display: {
                    dateInput: 'DD/MM/YYYY',
                    monthYearLabel: 'MMM YYYY',
                    dateA11yLabel: 'LL',
                    monthYearA11yLabel: 'MMMM YYYY',
                },
            },
        },
    ],
};

/*
📝 CORRECCIONES REALIZADAS:

1. 🛣️ RUTAS CORREGIDAS:
   - TranslocoHttpLoader: './core/transloco/transloco.http-loader'
   - RoleGuard: './core/auth/guards/role.guard'
   - PermissionService: 'app/core/services/permission.service'
   - RoleService: 'app/core/services/role.service'
   - ROLE_CONFIG: 'app/core/constants/role.constants'
   - roleInterceptor: './core/auth/interceptors/role.interceptor'

2. 📦 EXPORTS CORREGIDOS:
   - Cambiado 'routes' por 'appRoutes' en app.routes

3. 🔧 DEPENDENCIAS CORREGIDAS:
   - Removido MatMomentDateModule que causaba error
   - Removido importProvidersFrom(MatMomentDateModule)
   - Mantenido solo LuxonDateAdapter que funciona

4. 🔐 SISTEMA DE ROLES:
   - Todas las importaciones con rutas correctas
   - Interceptor incluido correctamente
   - Servicios en providers
   - APP_INITIALIZER configurado

5. 🌍 TRANSLOCO:
   - Configuración que resuelve error toUpperCase
   - Ruta corregida del loader
   - prodMode: true mantenido

6. 🎯 FUSE:
   - Configuración completa mantenida
   - Todos los temas disponibles
   - Layout y esquemas configurados
*/

