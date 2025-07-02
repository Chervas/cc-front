import { provideHttpClient } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, inject } from '@angular/core';
import { LuxonDateAdapter } from '@angular/material-luxon-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { PreloadAllModules, provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';
import { provideFuse } from '@fuse';
import { provideTransloco, TranslocoService } from '@ngneat/transloco';
import { firstValueFrom } from 'rxjs';
import { appRoutes } from 'app/app.routes';
import { provideAuth } from 'app/core/auth/auth.provider';
import { provideIcons } from 'app/core/icons/icons.provider';
import { mockApiServices } from 'app/mock-api';
import { TranslocoHttpLoader } from './core/transloco/transloco.http-loader';
import { VentasModule } from './modules/admin/apps/ventas/ventas.module'; // Importar VentasModule

export const appConfig: ApplicationConfig = {
    providers: [
        provideAnimations(),
        provideHttpClient(),
        provideRouter(appRoutes,
            withPreloading(PreloadAllModules),
            withInMemoryScrolling({scrollPositionRestoration: 'enabled'}),
        ),
        // Configuración de localización y formato de fecha
        {
            provide: MAT_DATE_LOCALE,
            useValue: 'es-ES', // Establecer el idioma en español
        },
        {
            provide: DateAdapter,
            useClass: LuxonDateAdapter,
            deps: [MAT_DATE_LOCALE],
            useFactory: (locale: string) => {
                const adapter = new LuxonDateAdapter(locale);
                adapter.setLocale('es-ES'); // Establece la localización en español
                adapter.getFirstDayOfWeek = () => 1; // Comienza la semana en lunes (1)
                return adapter;
            }
        },
        {
            provide: MAT_DATE_FORMATS,
            useValue: {
                parse: {
                    dateInput: 'dd/MM/yyyy', // Formato de entrada de fecha
                },
                display: {
                    dateInput: 'dd/MM/yyyy', // Formato de visualización de fecha
                    monthYearLabel: 'MMMM yyyy', // Formato de etiqueta de mes y año
                    dateA11yLabel: 'DD', // Formato accesible para la fecha
                    monthYearA11yLabel: 'MMMM yyyy', // Formato accesible para mes y año
                },
            },
        },
        // Transloco Config
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
        {
            // Preload the default language before the app starts to prevent empty/jumping content
            provide: APP_INITIALIZER,
            useFactory: () => {
                const translocoService = inject(TranslocoService);
                const defaultLang = translocoService.getDefaultLang();
                translocoService.setActiveLang(defaultLang);

                return () => firstValueFrom(translocoService.load(defaultLang));
            },
            multi: true,
        },
        // Fuse
        provideAuth(),
        provideIcons(),
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
                theme: 'theme-brand',
                themes: [
                    {
                        id: 'theme-brand',
                        name: 'Brand',
                    },
                ],
            },
        }),
        VentasModule, // Asegúrate de agregar esta línea para incluir VentasModule
    ],
};
