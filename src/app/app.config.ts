import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { LuxonDateAdapter } from '@angular/material-luxon-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { authInterceptor } from './core/auth/interceptors/auth.interceptor';

// 🔧 Importaciones de Fuse
import { provideFuse } from '@fuse/fuse.provider';
import { provideIcons } from 'app/core/icons/icons.provider'; // ✅ AGREGADO: Provider de iconos

// 🔧 Importaciones de rutas (CORREGIDO: appRoutes en lugar de routes)
import { appRoutes } from './app.routes';

// 🌐 Importaciones de internacionalización (RUTA CORREGIDA)
import { TranslocoHttpLoader } from './core/transloco/transloco.http-loader';
import { provideTransloco } from '@ngneat/transloco';

// 🛡️ Importaciones del sistema de roles (RUTAS CORREGIDAS)
import { RoleService } from 'app/core/services/role.service';
import { PermissionService } from 'app/core/services/permission.service';
import { RoleGuard } from './core/auth/guards/role.guard';
import { roleInterceptor } from './core/auth/interceptors/role.interceptor';

// 📋 Importaciones de constantes (RUTA CORREGIDA)
import { ROLE_CONFIG } from 'app/core/constants/role.constants';

/**
 * 🚀 Función de inicialización del sistema de roles - SIMPLIFICADA
 * 
 * Esta función se ejecuta durante el arranque de la aplicación para:
 * - Cargar las constantes de roles globalmente
 * - Sincronizar los servicios de roles y permisos
 * - Preparar el sistema para el uso de directivas
 * ✅ SIN registro manual de iconos (provideIcons() los maneja automáticamente)
 */
function initializeRoleSystem(
    roleService: RoleService,
    permissionService: PermissionService
): () => Promise<void> {
    return () => {
        return new Promise<void>((resolve) => {
            console.log('🔐 [RoleSystem] Inicializando sistema de roles...');
            
            try {
                // ✅ Hacer disponibles las constantes globalmente para las directivas
                (window as any).ROLE_CONFIG = ROLE_CONFIG;
                
                // ✅ Verificar que los servicios estén disponibles
                if (roleService && permissionService) {
                    console.log('✅ [RoleSystem] Servicios de roles inicializados correctamente');
                } else {
                    console.warn('⚠️ [RoleSystem] Algunos servicios de roles no están disponibles');
                }
                
                console.log('🎯 [RoleSystem] Sistema de roles listo');
                resolve();
                
            } catch (error) {
                console.error('❌ [RoleSystem] Error inicializando sistema de roles:', error);
                // No bloquear la aplicación por errores de roles
                resolve();
            }
        });
    };
}

/**
 * 📱 Configuración principal de la aplicación Angular
 */
export const appConfig: ApplicationConfig = {
    providers: [
        // 🚏 Configuración de rutas
        provideRouter(appRoutes),

        // 🎬 Animaciones
        provideAnimations(),

        // 🌐 Cliente HTTP con interceptores
        provideHttpClient(
            withInterceptors([
                authInterceptor,
                roleInterceptor  // ✅ Interceptor de roles limpio
            ])
        ),

        // 📅 Adaptador de fechas Luxon
        {
            provide: DateAdapter,
            useClass: LuxonDateAdapter,
        },
        {
            provide: MAT_DATE_FORMATS,
            useValue: {
                parse: {
                    dateInput: 'D',
                },
                display: {
                    dateInput: 'DDD',
                    monthYearLabel: 'LLL yyyy',
                    dateA11yLabel: 'DD',
                    monthYearA11yLabel: 'LLLL yyyy',
                },
            },
        },

        // 🌍 Internacionalización (CORREGIDO: usar provideTransloco)
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
                prodMode: false,
            },
            loader: TranslocoHttpLoader,
        }),

        // 🎨 Fuse Framework - ✅ CONFIGURACIÓN SIMPLE COMO DEMO
        provideFuse({
            mockApi: {
                delay: 0,
                services: [],
            },
            fuse: {
                layout: 'thin', // ✅ Layout thin con sistema de roles
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
                ],
            },
        }),

        // 🎯 ICONOS - ✅ COMO EN EL DEMO DE FUSE
        provideIcons(),

        // 🛡️ Servicios del sistema de roles
        RoleService,
        PermissionService,
        RoleGuard,

        // 🚀 Inicialización del sistema de roles
        {
            provide: APP_INITIALIZER,
            useFactory: initializeRoleSystem,
            deps: [RoleService, PermissionService],
            multi: true,
        },
    ],
};

