import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { LuxonDateAdapter } from '@angular/material-luxon-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { authInterceptor } from './core/auth/interceptors/auth.interceptor';

// 🔧 Importaciones de Fuse
import { provideFuse } from '@fuse/fuse.provider';

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

// 🎨 Importaciones de iconos Material
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * 🚀 Función de inicialización del sistema de roles
 * 
 * Esta función se ejecuta durante el arranque de la aplicación para:
 * - Cargar las constantes de roles globalmente
 * - Sincronizar los servicios de roles y permisos
 * - Preparar el sistema para el uso de directivas
 * - Registrar iconos faltantes para evitar errores
 */
function initializeRoleSystem(
    roleService: RoleService,
    permissionService: PermissionService,
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer
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
                
                // 🎨 Registrar iconos faltantes para evitar errores
                try {
                    // Registrar ícono de Facebook que causa error
                    iconRegistry.addSvgIconLiteral(
                        'facebook',
                        sanitizer.bypassSecurityTrustHtml(`
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        `)
                    );
                    
                    // Registrar otros iconos comunes que podrían faltar
                    iconRegistry.addSvgIconLiteral(
                        'google',
                        sanitizer.bypassSecurityTrustHtml(`
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                        `)
                    );
                    
                    console.log('🎨 [RoleSystem] Iconos registrados correctamente');
                } catch (iconError) {
                    console.warn('⚠️ [RoleSystem] Error registrando iconos:', iconError);
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
        // 🛣️ Configuración de rutas
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
        
        // 🎨 Fuse Framework
        provideFuse({
            mockApi: {
                delay: 0,
                services: [],
            },
            fuse: {
                layout: 'thin',  // ✅ Layout thin con sistema de roles
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
        
        // 🛡️ Servicios del sistema de roles
        RoleService,
        PermissionService,
        RoleGuard,
        
        // 🚀 Inicialización del sistema de roles
        {
            provide: APP_INITIALIZER,
            useFactory: initializeRoleSystem,
            deps: [RoleService, PermissionService, MatIconRegistry, DomSanitizer],
            multi: true,
        },
    ],
};

