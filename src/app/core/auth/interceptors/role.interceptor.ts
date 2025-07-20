import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { RoleService } from '../../services/role.service';
import { Observable, of } from 'rxjs';

// Functional interceptor for Angular 17+
export const roleInterceptor: HttpInterceptorFn = (req, next) => {
    const roleService = inject(RoleService);
    
    // Obtener datos actuales del RoleService de forma segura
    const currentRole = roleService.getCurrentRole();
    const currentUser = roleService.getCurrentUser();
    const currentClinica = roleService.getSelectedClinica();

    // Preparar headers seguros
    const headersToAdd: any = {};
    let headersCount = 0;

    // Solo agregar headers con valores válidos
    if (currentRole && currentRole !== 'null' && currentRole !== 'undefined' && currentRole.trim() !== '') {
        headersToAdd['role'] = currentRole;
        headersCount++;
    } else {
        headersToAdd['role'] = 'no-role';
        headersCount++;
    }

    if (currentUser?.id_usuario) {
        headersToAdd['userId'] = currentUser.id_usuario.toString();
        headersCount++;
    } else {
        // Fallback: intentar obtener userId del token
        const userId = getUserIdFromToken();
        if (userId) {
            headersToAdd['userId'] = userId.toString();
            headersCount++;
        } else {
            headersToAdd['userId'] = 'no-user';
            headersCount++;
        }
    }

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

    // Crear nueva request con headers
    const modifiedReq = req.clone({
        setHeaders: headersToAdd
    });

    // Manejar peticiones específicas
    return handleSpecificRequests(modifiedReq, next);
};

function handleSpecificRequests(req: HttpRequest<any>, next: any): Observable<any> {
    const url = req.url;

    // Mock de navegación con rutas SEGURAS de Fuse (que existen)
    if (url.includes('/api/common/navigation')) {
        console.log('🔍 [RoleInterceptor] Procesando petición de navegación');
        const navigationData = createSafeNavigation();
        console.log('✅ [RoleInterceptor] Navegación segura creada:', {
            totalItems: navigationData.default?.length || 0,
            groupsWithChildren: navigationData.default?.filter(item => item.children?.length > 0).length || 0
        });
        return of(new HttpResponse({
            status: 200,
            body: navigationData
        }));
    }

    // Mock de mensajes
    if (url.includes('/api/common/messages')) {
        console.log('🔍 [RoleInterceptor] Mock de mensajes');
        return of(new HttpResponse({
            status: 200,
            body: []
        }));
    }

    // Mock de notificaciones
    if (url.includes('/api/common/notifications')) {
        console.log('🔍 [RoleInterceptor] Mock de notificaciones');
        return of(new HttpResponse({
            status: 200,
            body: []
        }));
    }

    // Mock de chat
    if (url.includes('/api/apps/chat/chats')) {
        console.log('🔍 [RoleInterceptor] Mock de chat/chats');
        return of(new HttpResponse({
            status: 200,
            body: []
        }));
    }

    // Mock de shortcuts
    if (url.includes('/api/common/shortcuts')) {
        console.log('🔍 [RoleInterceptor] Mock de shortcuts');
        return of(new HttpResponse({
            status: 200,
            body: []
        }));
    }

    // Continuar con la petición normal
    return next(req);
}

function createSafeNavigation(): any {
    return {
        default: [
            {
                id: 'panel',
                title: 'Panel Principal',
                type: 'basic',
                icon: 'heroicons_outline:home',
                link: '/dashboards/project'  // ✅ Ruta que existe en Fuse
            },
            {
                id: 'reportes',
                title: 'Reportes',
                type: 'basic',
                icon: 'heroicons_outline:chart-bar',
                link: '/dashboards/analytics'  // ✅ Ruta que existe en Fuse
            },
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
                        link: '/apps/academy'  // ✅ Ruta que existe en Fuse
                    },
                    {
                        id: 'pacientes.nuevo',
                        title: 'Nuevo Paciente',
                        type: 'basic',
                        icon: 'heroicons_outline:user-plus',
                        link: '/apps/contacts'  // ✅ Ruta que existe en Fuse
                    }
                ]
            },
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
                        link: '/apps/calendar'  // ✅ Ruta que existe en Fuse
                    },
                    {
                        id: 'citas.programar',
                        title: 'Programar Cita',
                        type: 'basic',
                        icon: 'heroicons_outline:plus-circle',
                        link: '/pages/activities'  // ✅ Ruta que existe en Fuse
                    }
                ]
            },
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
                        link: '/pages/settings'  // ✅ Ruta que existe en Fuse
                    },
                    {
                        id: 'clinica.personal',
                        title: 'Personal',
                        type: 'basic',
                        icon: 'heroicons_outline:user-group',
                        link: '/apps/help-center'  // ✅ Ruta que existe en Fuse
                    }
                ]
            },
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
                        link: '/apps/mailbox'  // ✅ Ruta que existe en Fuse
                    },
                    {
                        id: 'marketing.contactos',
                        title: 'Contactos',
                        type: 'basic',
                        icon: 'heroicons_outline:address-book',
                        link: '/apps/contacts'  // ✅ Ruta que existe en Fuse
                    }
                ]
            },
            {
                id: 'ventas',
                title: 'VENTAS',
                subtitle: 'Gestión comercial',
                type: 'group',
                icon: 'heroicons_outline:banknotes',
                children: [
                    {
                        id: 'ventas.dashboard',
                        title: 'Dashboard Ventas',
                        type: 'basic',
                        icon: 'heroicons_outline:chart-pie',
                        link: '/dashboards/finance'  // ✅ Ruta que existe en Fuse
                    }
                ]
            }
        ],
        compact: [],
        futuristic: [],
        horizontal: []
    };
}

function getUserIdFromToken(): number | null {
    try {
        const token = localStorage.getItem('accessToken');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.sub || payload.userId || payload.id || null;
        }
    } catch (error) {
        console.warn('⚠️ [RoleInterceptor] Error al extraer userId del token:', error);
    }
    return null;
}

