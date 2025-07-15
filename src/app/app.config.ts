import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom, inject } from '@angular/core';
import { LuxonDateAdapter } from '@angular/material-luxon-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { PreloadAllModules, provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';
import { provideFuse } from '@fuse';
import { provideTransloco } from '@ngneat/transloco';
import { firstValueFrom } from 'rxjs';
import { appRoutes } from 'app/app.routes';
import { provideAuth } from 'app/core/auth/auth.provider';
import { provideIcons } from 'app/core/icons/icons.provider';
import { TranslocoHttpLoader } from 'app/core/transloco/transloco.http-loader';
import { mockApiServices } from 'app/mock-api';

// 🎯 IMPORTACIONES DEL SISTEMA DE ROLES (ESTRUCTURA FUSE)
import { RoleService } from 'app/core/services/role.service';
import { PermissionService } from 'app/core/services/permission.service';
import { RoleGuard } from 'app/core/auth/guards/role.guard';
import { roleInterceptor } from 'app/core/auth/interceptors/role.interceptor';
import { ROLE_CONFIG } from 'app/core/constants/role.constants';

/**
 * 🎯 CONFIGURACIÓN DE LA APLICACIÓN CON SISTEMA DE ROLES INTEGRADO
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
                roleInterceptor
            ])
        ),

        // 🚦 Router con configuración existente
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

        // 🌍 Internacionalización (usando loader existente)
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
                prodMode: true,
            },
            loader: TranslocoHttpLoader,
        }),

        // 🎯 Fuse (configuración existente)
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

        // 🎯 SISTEMA DE ROLES - SERVICIOS PRINCIPALES
        RoleService,
        PermissionService,
        RoleGuard,

        // 🎯 INICIALIZACIÓN DEL SISTEMA DE ROLES
        {
            provide: 'ROLE_SYSTEM_INITIALIZER',
            useFactory: () => {
                const roleService = inject(RoleService);
                const permissionService = inject(PermissionService);
                
                return () => {
                    console.log('🎯 Sistema de roles inicializado correctamente');
                    console.log('🎯 RoleService:', roleService);
                    console.log('🎯 PermissionService:', permissionService);
                    console.log('🎯 Constantes de roles cargadas:', ROLE_CONFIG);
                };
            },
            deps: [],
            multi: true
        },

        // 🎯 CONSTANTES GLOBALES PARA DIRECTIVAS
        {
            provide: 'ROLE_CONSTANTS',
            useValue: ROLE_CONFIG
        }
    ],
};

