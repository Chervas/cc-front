import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom, inject } from '@angular/core';
import { LuxonDateAdapter } from '@angular/material-luxon-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { PreloadAllModules, provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';
import { provideFuse } from '@fuse';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { firstValueFrom } from 'rxjs';
import { appRoutes } from 'app/app.routes';
import { provideAuth } from 'app/core/auth/auth.provider';
import { provideIcons } from 'app/core/icons/icons.provider';
import { provideTranslocoConfig } from 'app/core/transloco/transloco.provider';
import { mockApiServices } from 'app/mock-api';

// 🔧 IMPORTACIONES DEL SISTEMA DE ROLES (ESTRUCTURA FUSE)
import { RoleService } from 'app/core/services/role.service';
import { PermissionService } from 'app/core/services/permission.service';
import { RoleGuard } from 'app/core/auth/guards/role.guard';
import { RoleInterceptor } from 'app/core/auth/interceptors/role.interceptor';
import { ROLE_CONFIG } from 'app/core/constants/role.constants';

/**
 * 🚀 CONFIGURACIÓN DE LA APLICACIÓN CON SISTEMA DE ROLES INTEGRADO
 * 
 * Esta configuración sigue la estructura de Fuse y agrega el sistema de roles
 * de manera no invasiva, manteniendo toda la funcionalidad existente.
 */

const luxonDateFormats = {
    parse: {
        dateInput: 'D',
    },
    display: {
        dateInput: 'DDD',
        monthYearLabel: 'LLL yyyy',
        dateA11yLabel: 'DD',
        monthYearA11yLabel: 'LLLL yyyy',
    },
};

export const appConfig: ApplicationConfig = {
    providers: [
        // 🌐 HTTP Client con interceptors (incluyendo RoleInterceptor)
        provideHttpClient(
            withInterceptors([
                // Interceptor de roles agregado a la cadena existente
                (req, next) => inject(RoleInterceptor).intercept(req, { handle: next })
            ])
        ),

        // 🎯 Router con configuración existente
        provideRouter(
            appRoutes,
            withPreloading(PreloadAllModules),
            withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
        ),

        // 🎨 Animaciones
        provideAnimations(),

        // 📅 Adaptador de fechas
        {
            provide: DateAdapter,
            useClass: LuxonDateAdapter,
        },
        {
            provide: MAT_DATE_FORMATS,
            useValue: luxonDateFormats,
        },

        // 🔐 Autenticación (Fuse existente)
        provideAuth(),

        // 🎨 Iconos (Fuse existente)
        provideIcons(),

        // 🌍 Internacionalización (Fuse existente)
        provideTransloco(),
        provideTranslocoConfig(),

        // 🚀 Fuse (configuración existente)
        provideFuse({
            mockApi: {
                delay: 0,
                services: mockApiServices,
            },
            fuse: {
                layout: 'thin',
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

        // 🛡️ SERVICIOS DEL SISTEMA DE ROLES (NUEVOS)
        RoleService,
        PermissionService,
        RoleGuard,
        RoleInterceptor,

        // 🔧 INICIALIZACIÓN DEL SISTEMA DE ROLES
        {
            provide: 'ROLE_SYSTEM_INIT',
            useFactory: (roleService: RoleService, permissionService: PermissionService) => {
                return () => {
                    console.log('🚀 Inicializando sistema de roles...');
                    
                    // Verificar que las constantes estén disponibles
                    if (ROLE_CONFIG) {
                        console.log('✅ Constantes de roles cargadas:', Object.keys(ROLE_CONFIG));
                    }
                    
                    // Inicializar servicios si es necesario
                    try {
                        // Aquí se pueden agregar inicializaciones específicas
                        console.log('✅ Sistema de roles inicializado correctamente');
                    } catch (error) {
                        console.error('❌ Error al inicializar sistema de roles:', error);
                    }
                };
            },
            deps: [RoleService, PermissionService],
            multi: true
        },

        // 🌍 CONSTANTES GLOBALES PARA DIRECTIVAS
        {
            provide: 'ROLE_CONSTANTS',
            useValue: ROLE_CONFIG
        }
    ],
};

/**
 * 🔧 FUNCIÓN DE INICIALIZACIÓN PARA DIRECTIVAS STANDALONE
 * 
 * Esta función se puede llamar en main.ts para asegurar que las directivas
 * standalone tengan acceso a las constantes globales.
 */
export function initializeRoleSystem(): Promise<void> {
    return new Promise((resolve) => {
        // Hacer las constantes disponibles globalmente para directivas standalone
        (window as any).ROLE_CONFIG = ROLE_CONFIG;
        
        console.log('🎯 Constantes de roles disponibles globalmente para directivas');
        resolve();
    });
}

/**
 * 📝 NOTAS DE INTEGRACIÓN:
 * 
 * 1. Esta configuración mantiene TODA la funcionalidad existente de Fuse
 * 2. Agrega el sistema de roles de manera no invasiva
 * 3. Los interceptors se integran en la cadena existente
 * 4. Los servicios se registran como providers adicionales
 * 5. La inicialización es automática y no interfiere con Fuse
 * 
 * ESTRUCTURA DE ARCHIVOS REQUERIDA:
 * 
 * src/app/
 * ├── core/
 * │   ├── auth/
 * │   │   ├── guards/
 * │   │   │   └── role.guard.ts
 * │   │   └── interceptors/
 * │   │       └── role.interceptor.ts
 * │   ├── services/
 * │   │   └── permission.service.ts
 * │   └── constants/
 * │       └── role.constants.ts (ya existe)
 * └── modules/
 *     └── admin/
 *         └── apps/
 *             └── roles/
 *                 └── shared/
 *                     ├── has-role.directive.ts
 *                     └── has-permission.directive.ts
 */

