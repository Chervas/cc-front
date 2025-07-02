// src/app/app.routes.ts
import { Route } from '@angular/router';
import { initialDataResolver } from './app.resolvers';
import { AuthGuard } from './core/auth/guards/auth.guard';
import { NoAuthGuard } from './core/auth/guards/noAuth.guard';
import { LayoutComponent } from './layout/layout.component';

// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Route[] = [
    // Redirigir ruta vacía a '/example'
    { path: '', pathMatch: 'full', redirectTo: 'example' },

    // Redirigir al usuario autenticado después de iniciar sesión
    { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'example' },

    // Rutas para usuarios no autenticados
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        data: { layout: 'empty' },
        children: [
            { path: 'confirmation-required', loadChildren: () => import('./modules/auth/confirmation-required/confirmation-required.routes') },
            { path: 'forgot-password', loadChildren: () => import('./modules/auth/forgot-password/forgot-password.routes') },
            { path: 'reset-password', loadChildren: () => import('./modules/auth/reset-password/reset-password.routes') },
            { path: 'sign-in', loadChildren: () => import('./modules/auth/sign-in/sign-in.routes') },
            { path: 'sign-up', loadChildren: () => import('./modules/auth/sign-up/sign-up.routes') }
        ]
    },

    // Rutas para usuarios autenticados
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        data: { layout: 'empty' },
        children: [
            { path: 'sign-out', loadChildren: () => import('./modules/auth/sign-out/sign-out.routes') },
            { path: 'unlock-session', loadChildren: () => import('./modules/auth/unlock-session/unlock-session.routes') }
        ]
    },

    // Rutas para landing (por ejemplo, home)
    {
        path: '',
        component: LayoutComponent,
        data: { layout: 'empty' },
        children: [
            { path: 'home', loadChildren: () => import('./modules/landing/home/home.routes') }
        ]
    },

    // Rutas de administración (requiere autenticación)
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        resolve: { initialData: initialDataResolver },
        children: [
            { path: 'example', loadChildren: () => import('./modules/admin/example/example.routes') },

            // Rutas dentro del grupo "apps"
            {
                path: 'apps',
                children: [
                    { path: 'paneles', loadChildren: () => import('./modules/admin/apps/paneles/paneles.routes') },
                    { path: 'contacts', loadChildren: () => import('./modules/admin/apps/contacts/contacts.routes') },
                    { path: 'clinicas', loadChildren: () => import('./modules/admin/apps/clinicas/clinicas.routes') },
                    { path: 'ventas', loadChildren: () => import('./modules/admin/apps/ventas/ventas.routes') }
                ]
            },

            // Rutas dentro del grupo "pages"
            {
                path: 'pages',
                children: [
                    { path: 'settings', loadChildren: () => import('./modules/admin/pages/settings/settings.routes') }
                ]
            },

            // Ruta de pacientes (fuera del grupo "apps")
            {
                path: 'pacientes',
                loadChildren: () => 
                    import('./modules/admin/apps/pacientes/pacientes.routes').then(m => m.pacientesRoutes)
            },

            // NUEVA RUTA: Marketing
            {
                path: 'marketing',
                loadChildren: () => 
                    import('./modules/admin/apps/marketing/marketing.module').then(m => m.MarketingModule)
            }
        ]
    }
];

