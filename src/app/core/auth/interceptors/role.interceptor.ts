import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { RoleService } from '../../services/role.service';

export const roleInterceptor: HttpInterceptorFn = (req, next) => {
    const roleService = inject(RoleService);

    // Add role headers to requests
    const currentRole = roleService.getCurrentRole();
    const currentUser = roleService.getCurrentUser();
    const currentClinica = roleService.getSelectedClinica();

    const headersToAdd: { [key: string]: string } = {};
    let headersCount = 0;

    // Add role header if available
    if (currentRole && currentRole !== 'null' && currentRole !== 'undefined' && currentRole.trim() !== '') {
        headersToAdd['role'] = currentRole;
        headersCount++;
    } else {
        headersToAdd['role'] = 'no-role';
        headersCount++;
    }

    // Add user ID header if available
    if (currentUser?.id_usuario) {
        headersToAdd['userId'] = currentUser.id_usuario.toString();
        headersCount++;
    } else {
        // Fallback: try to get userId from token
        const userId = getUserIdFromToken();
        if (userId) {
            headersToAdd['userId'] = userId.toString();
            headersCount++;
        } else {
            headersToAdd['userId'] = 'no-user';
            headersCount++;
        }
    }

    // Add clinic ID header if available
    if (currentClinica?.id) {
        headersToAdd['clinicId'] = currentClinica.id.toString();
        headersCount++;
    } else {
        headersToAdd['clinicId'] = 'no-clinic';
        headersCount++;
    }

    console.log('🔍 [RoleInterceptor] Headers agregados:', {
        role: headersToAdd['role'],
        userId: headersToAdd['userId'],
        clinicId: headersToAdd['clinicId'],
        headersCount
    });

    // Clone request and add headers
    const modifiedReq = req.clone({
        setHeaders: headersToAdd
    });

    return handleSpecificRequests(modifiedReq, next);
};

function handleSpecificRequests(req: any, next: any) {
    const url = req.url;

    // Handle navigation requests
    if (url.includes('/api/common/navigation')) {
        console.log('🔍 [RoleInterceptor] Procesando petición de navegación');
        
        const mockNavigation = {
            default: [
                // PANEL PRINCIPAL
                {
                    id: 'panel',
                    title: 'Panel Principal',
                    type: 'basic',
                    icon: 'heroicons_outline:home',
                    link: '/example'
                },
                {
                    id: 'reportes',
                    title: 'Reportes',
                    type: 'basic',
                    icon: 'heroicons_outline:chart-bar',
                    link: '/dashboards/analytics'
                },

                // PACIENTES
                {
                    id: 'pacientes',
                    title: 'PACIENTES',
                    subtitle: 'Gestión de pacientes',
                    type: 'group',
                    icon: 'heroicons_outline:users',
                    children: [
                        {
                            id: 'pacientes.lista',
                            title: 'Lista de Pacientes',
                            type: 'basic',
                            icon: 'heroicons_outline:user-group',
                            link: '/apps/academy'
                        },
                        {
                            id: 'pacientes.nuevo',
                            title: 'Nuevo Paciente',
                            type: 'basic',
                            icon: 'heroicons_outline:user-plus',
                            link: '/apps/contacts'
                        }
                    ]
                },

                // CITAS
                {
                    id: 'citas',
                    title: 'CITAS',
                    subtitle: 'Gestión de citas médicas',
                    type: 'group',
                    icon: 'heroicons_outline:calendar',
                    children: [
                        {
                            id: 'citas.calendario',
                            title: 'Calendario de Citas',
                            type: 'basic',
                            icon: 'heroicons_outline:calendar-days',
                            link: '/apps/calendar'
                        },
                        {
                            id: 'citas.programar',
                            title: 'Programar Cita',
                            type: 'basic',
                            icon: 'heroicons_outline:plus-circle',
                            link: '/apps/tasks'
                        }
                    ]
                },

                // CLÍNICA
                {
                    id: 'clinica',
                    title: 'CLÍNICA',
                    subtitle: 'Administración de clínica',
                    type: 'group',
                    icon: 'heroicons_outline:building-office',
                    children: [
                        {
                            id: 'clinica.configuracion',
                            title: 'Configuración',
                            type: 'basic',
                            icon: 'heroicons_outline:cog-6-tooth',
                            link: '/pages/settings'
                        },
                        {
                            id: 'clinica.personal',
                            title: 'Personal',
                            type: 'basic',
                            icon: 'heroicons_outline:user-group',
                            link: '/apps/help-center'
                        }
                    ]
                },

                // MARKETING
                {
                    id: 'marketing',
                    title: 'MARKETING',
                    subtitle: 'Campañas y herramientas',
                    type: 'group',
                    icon: 'heroicons_outline:megaphone',
                    children: [
                        {
                            id: 'marketing.campanas',
                            title: 'Campañas',
                            type: 'basic',
                            icon: 'heroicons_outline:speaker-wave',
                            link: '/apps/mailbox'
                        },
                        {
                            id: 'marketing.contactos',
                            title: 'Contactos',
                            type: 'basic',
                            icon: 'heroicons_outline:address-book',
                            link: '/apps/contacts'
                        }
                    ]
                }
            ],
            compact: [],
            futuristic: [],
            horizontal: []
        };

        console.log('✅ [RoleInterceptor] Navegación de clínica creada:', {
            totalItems: mockNavigation.default.length,
            groupsWithChildren: mockNavigation.default.filter(item => item.children?.length > 0).length
        });

        return of({
            body: mockNavigation,
            status: 200,
            statusText: 'OK',
            headers: new Headers(),
            ok: true,
            redirected: false,
            type: 'basic',
            url: req.url,
            clone: () => ({})
        } as any);
    }

    // Handle sign-in - NO INTERCEPTAR, dejar que AuthService maneje todo
    if (url.includes('/api/auth/sign-in')) {
        console.log('🔍 [RoleInterceptor] Petición de login detectada - pasando al AuthService');
        return next(req);
    }

    // Handle chat requests
    if (url.includes('/api/apps/chat/chats')) {
        console.log('🔍 [RoleInterceptor] Mock de chat/chats');
        return of({
            body: [],
            status: 200,
            statusText: 'OK',
            headers: new Headers(),
            ok: true,
            redirected: false,
            type: 'basic',
            url: req.url,
            clone: () => ({})
        } as any);
    }

    // Handle messages requests
    if (url.includes('/api/common/messages')) {
        console.log('🔍 [RoleInterceptor] Mock de mensajes');
        return of({
            body: [],
            status: 200,
            statusText: 'OK',
            headers: new Headers(),
            ok: true,
            redirected: false,
            type: 'basic',
            url: req.url,
            clone: () => ({})
        } as any);
    }

    // Handle notifications requests
    if (url.includes('/api/common/notifications')) {
        console.log('🔍 [RoleInterceptor] Mock de notificaciones');
        return of({
            body: [],
            status: 200,
            statusText: 'OK',
            headers: new Headers(),
            ok: true,
            redirected: false,
            type: 'basic',
            url: req.url,
            clone: () => ({})
        } as any);
    }

    // Handle shortcuts requests
    if (url.includes('/api/common/shortcuts')) {
        console.log('🔍 [RoleInterceptor] Mock de shortcuts');
        return of({
            body: [],
            status: 200,
            statusText: 'OK',
            headers: new Headers(),
            ok: true,
            redirected: false,
            type: 'basic',
            url: req.url,
            clone: () => ({})
        } as any);
    }

    // Continue with the modified request for all other requests
    return next(req);
}

function getUserIdFromToken(): number | null {
    try {
        const token = localStorage.getItem('accessToken');
        if (!token) return null;

        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.userId || payload.id || null;
    } catch (error) {
        console.warn('🔍 [RoleInterceptor] Error extrayendo userId del token:', error);
        return null;
    }
}

