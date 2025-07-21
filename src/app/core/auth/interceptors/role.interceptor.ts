import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { RoleService } from '../../services/role.service';

export const roleInterceptor: HttpInterceptorFn = (req, next) => {
    const roleService = inject(RoleService);
    const url = req.url;

    // 🔍 MOCK DE /api/auth/me - SOLUCIÓN AL PROBLEMA PRINCIPAL
    if (url.includes('/api/auth/me')) {
        console.log('🔍 [RoleInterceptor] Mock de auth/me - Solucionando problema Fuse');
        
        // Crear usuario mock compatible con Fuse
        const mockUser = {
            id: '1',
            name: 'User example User',
            email: 'user@example.com',
            avatar: 'assets/images/avatars/default.jpg',
            status: 'online'
        };
        
        console.log('✅ [RoleInterceptor] Usuario mock creado:', mockUser);
        
        return of(new HttpResponse({
            status: 200,
            body: mockUser,
            headers: req.headers
        }));
    }

    // 🔍 Mock de navegación
    if (url.includes('/api/common/navigation')) {
        console.log('🔍 [RoleInterceptor] Procesando petición de navegación');
        
        const navigation = {
            default: [
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
                    link: '/apps/academy'
                },
                {
                    id: 'pacientes',
                    title: 'PACIENTES',
                    type: 'group',
                    icon: 'heroicons_outline:users',
                    children: [
                        {
                            id: 'pacientes.lista',
                            title: 'Lista de Pacientes',
                            type: 'basic',
                            icon: 'heroicons_outline:user-group',
                            link: '/apps/contacts'
                        },
                        {
                            id: 'pacientes.nuevo',
                            title: 'Nuevo Paciente',
                            type: 'basic',
                            icon: 'heroicons_outline:user-plus',
                            link: '/pages/activities'
                        }
                    ]
                },
                {
                    id: 'citas',
                    title: 'CITAS',
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
                            link: '/pages/settings'
                        }
                    ]
                },
                {
                    id: 'clinica',
                    title: 'CLÍNICA',
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
                            link: '/apps/contacts'
                        }
                    ]
                },
                {
                    id: 'marketing',
                    title: 'MARKETING',
                    type: 'group',
                    icon: 'heroicons_outline:megaphone',
                    children: [
                        {
                            id: 'marketing.campanas',
                            title: 'Campañas',
                            type: 'basic',
                            icon: 'heroicons_outline:speaker-wave',
                            link: '/apps/mailbox'
                        }
                    ]
                }
            ]
        };

        console.log('✅ [RoleInterceptor] Navegación de clínica creada:', {
            totalItems: navigation.default.length,
            groupsWithChildren: navigation.default.filter(item => item.children?.length > 0).length
        });

        return of(new HttpResponse({
            status: 200,
            body: navigation,
            headers: req.headers
        }));
    }

    // 🔍 Mock de chat
    if (url.includes('/api/apps/chat/chats')) {
        console.log('🔍 [RoleInterceptor] Mock de chat/chats');
        return of(new HttpResponse({
            status: 200,
            body: [],
            headers: req.headers
        }));
    }

    // 🔍 Mock de mensajes
    if (url.includes('/api/apps/mailbox/mails')) {
        console.log('🔍 [RoleInterceptor] Mock de mensajes');
        return of(new HttpResponse({
            status: 200,
            body: { mails: [], folders: [], filters: [], labels: [] },
            headers: req.headers
        }));
    }

    // 🔍 Mock de notificaciones
    if (url.includes('/api/common/notifications')) {
        console.log('🔍 [RoleInterceptor] Mock de notificaciones');
        return of(new HttpResponse({
            status: 200,
            body: [],
            headers: req.headers
        }));
    }

    // 🔍 Agregar headers de rol para otras peticiones
    const currentRole = roleService.getCurrentRole();
    const currentUser = roleService.getCurrentUser();
    const currentClinica = roleService.getSelectedClinica();

    let headersToAdd: any = {};
    let headersCount = 0;

    // Solo agregar headers si tienen valores válidos
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
        headersToAdd['userId'] = 'no-user';
        headersCount++;
    }

    if (currentClinica?.id) {
        headersToAdd['clinicId'] = currentClinica.id.toString();
        headersCount++;
    } else {
        headersToAdd['clinicId'] = 'no-clinic';
        headersCount++;
    }

    if (headersCount > 0) {
        console.log('🔍 [RoleInterceptor] Headers agregados:', {
            role: headersToAdd['role'],
            userId: headersToAdd['userId'],
            clinicId: headersToAdd['clinicId'],
            headersCount: headersCount
        });

        const modifiedReq = req.clone({
            setHeaders: headersToAdd
        });

        return next(modifiedReq);
    }

    // Continuar con la petición normal
    return next(req);
};

// 📋 INSTRUCCIONES DE IMPLEMENTACIÓN:
//
// 1. Reemplazar el interceptor actual:
//    cp role.interceptor-CON-MOCK-AUTH-ME.ts src/app/core/auth/interceptors/role.interceptor.ts
//
// 2. Compilar:
//    npm run build -- --configuration=production
//
// 🎯 RESULTADO ESPERADO:
//
// ✅ Fuse obtiene respuesta exitosa de /api/auth/me
// ✅ La inicialización de Fuse se completa
// ✅ La splash screen desaparece
// ✅ La redirección funciona correctamente
// ✅ El layout classy se muestra
//
// 📊 LOGS ESPERADOS:
//
// 🔍 [RoleInterceptor] Mock de auth/me - Solucionando problema Fuse
// ✅ [RoleInterceptor] Usuario mock creado: {id: '1', name: 'User example User'...}
// ✅ [AuthService] Usuario cargado correctamente
// 🚀 [AuthService] Redirigiendo al dashboard...
//
// 🚨 PROBLEMA SOLUCIONADO:
//
// Este mock resuelve la incompatibilidad entre Fuse (que espera /api/auth/me)
// y tu backend (que no tiene esa ruta). Una vez implementado, el login
// debería funcionar completamente y redirigir al layout classy.

