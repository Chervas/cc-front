import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { RoleService } from 'app/core/services/role.service';
import { of } from 'rxjs';

export const roleInterceptor: HttpInterceptorFn = (req, next) => {
    const roleService = inject(RoleService);

    // Función para determinar el tipo de petición
    function getRequestType(url: string): 'internal_api' | 'external_domain' | 'asset' | 'fuse_mock' | 'oauth_route' {
        // Dominios externos que NO deben tener headers
        const externalDomains = [
            'facebook.com', 'google.com', 'googleapis.com', 
            'gstatic.com', 'doubleclick.net', 'analytics.google.com',
            'autenticacion.clinicaclick.com'  // Excluir dominio OAuth
        ];
        
        // Verificar si es dominio externo
        if (externalDomains.some(domain => url.includes(domain))) {
            return 'external_domain';
        }
        
        // Verificar si es asset (CSS, JS, imágenes, fuentes, iconos)
        if (url.includes('/assets/') || 
            url.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)(\?|$)/)) {
            return 'asset';
        }
        
        // Verificar si es ruta OAuth DE VERIFICACIÓN (solo Google y TikTok)
        if (url.includes('/oauth/') && url.includes('/connection-status')) {
            return 'oauth_route';
        }
        
        // Verificar si es mock de Fuse
        if (url.includes('/api/')) {
            return 'fuse_mock';
        }
        
        // Por defecto, API interna
        return 'internal_api';
    }

    const url = req.url;
    const requestType = getRequestType(url);

    // Solo procesar APIs internas, mocks de Fuse y rutas OAuth (excluyendo Meta)
    if (requestType === 'external_domain' || requestType === 'asset') {
        console.log('🚫 [RoleInterceptor] Petición excluida del procesamiento:', url);
        return next(req);
    }

    // Mocks para rutas OAuth - CORRECCIÓN CRÍTICA (Meta excluido)
    if (requestType === 'oauth_route') {
        
        // Mock para OAuth Google connection status
        if (url.includes('/oauth/google/connection-status')) {
            console.log('🎯 [RoleInterceptor] Mock response para /oauth/google/connection-status');
            const mockOAuthStatus = {
                connected: false,
                message: 'No hay conexión Google activa',
                status: 'disconnected'
            };
            return of(new HttpResponse({ status: 200, body: mockOAuthStatus }));
        }
        
        // Mock para OAuth TikTok connection status
        if (url.includes('/oauth/tiktok/connection-status')) {
            console.log('🎯 [RoleInterceptor] Mock response para /oauth/tiktok/connection-status');
            const mockOAuthStatus = {
                connected: false,
                message: 'No hay conexión TikTok activa',
                status: 'disconnected'
            };
            return of(new HttpResponse({ status: 200, body: mockOAuthStatus }));
        }
        
        // NOTA: Meta OAuth completamente excluido del interceptor - va directo al servidor
    }

    // Mocks para Fuse - TODOS los endpoints necesarios
    if (requestType === 'fuse_mock') {
        
        // Mock para /api/auth/me - CRÍTICO para Fuse
        if (url.includes('/api/auth/me')) {
            console.log('🎯 [RoleInterceptor] Mock response para /api/auth/me');
            const mockUser = {
                id: 'user-1',
                name: 'User example',
                email: 'user@example.com',
                avatar: 'assets/images/avatars/brian-hughes.jpg',
                status: 'online'
            };
            return of(new HttpResponse({ status: 200, body: mockUser }));
        }

        // Mock para /api/common/navigation - Navegación principal
        if (url.includes('/api/common/navigation')) {
            console.log('🎯 [RoleInterceptor] Mock response para /api/common/navigation');
            const mockNavigation = {
                default: [
                    {
                        id: 'panel',
                        title: 'Panel Principal',
                        type: 'basic',
                        icon: 'heroicons_outline:home',
                        link: '/pages/dashboard'
                    },
                    {
                        id: 'pacientes',
                        title: 'PACIENTES',
                        type: 'group',
                        children: [
                            {
                                id: 'lista-pacientes',
                                title: 'Lista de Pacientes',
                                type: 'basic',
                                icon: 'heroicons_outline:users',
                                link: '/pages/pacientes'
                            },
                            {
                                id: 'nuevo-paciente',
                                title: 'Nuevo Paciente',
                                type: 'basic',
                                icon: 'heroicons_outline:user-plus',
                                link: '/pages/pacientes/nuevo'
                            },
                            {
                                id: 'historial-medico',
                                title: 'Historial Médico',
                                type: 'basic',
                                icon: 'heroicons_outline:document-text',
                                link: '/pages/historial'
                            }
                        ]
                    },
                    {
                        id: 'citas',
                        title: 'CITAS',
                        type: 'group',
                        children: [
                            {
                                id: 'calendario',
                                title: 'Calendario',
                                type: 'basic',
                                icon: 'heroicons_outline:calendar',
                                link: '/pages/calendar'
                            },
                            {
                                id: 'nueva-cita',
                                title: 'Nueva Cita',
                                type: 'basic',
                                icon: 'heroicons_outline:plus-circle',
                                link: '/pages/citas/nueva'
                            },
                            {
                                id: 'lista-citas',
                                title: 'Lista de Citas',
                                type: 'basic',
                                icon: 'heroicons_outline:list-bullet',
                                link: '/pages/citas'
                            }
                        ]
                    },
                    {
                        id: 'clinica',
                        title: 'CLÍNICA',
                        type: 'group',
                        children: [
                            {
                                id: 'personal-medico',
                                title: 'Personal Médico',
                                type: 'basic',
                                icon: 'heroicons_outline:user-group',
                                link: '/pages/personal'
                            },
                            {
                                id: 'inventario',
                                title: 'Inventario',
                                type: 'basic',
                                icon: 'heroicons_outline:cube',
                                link: '/pages/inventario'
                            },
                            {
                                id: 'reportes',
                                title: 'Reportes',
                                type: 'basic',
                                icon: 'heroicons_outline:chart-bar',
                                link: '/pages/reportes'
                            },
                            {
                                id: 'configuracion',
                                title: 'Configuración',
                                type: 'basic',
                                icon: 'heroicons_outline:cog-6-tooth',
                                link: '/pages/settings'
                            }
                        ]
                    }
                ],
                compact: [
                    {
                        id: 'panel',
                        title: 'Panel',
                        type: 'basic',
                        icon: 'heroicons_outline:home',
                        link: '/pages/dashboard'
                    },
                    {
                        id: 'pacientes',
                        title: 'Pacientes',
                        type: 'basic',
                        icon: 'heroicons_outline:users',
                        link: '/pages/pacientes'
                    },
                    {
                        id: 'citas',
                        title: 'Citas',
                        type: 'basic',
                        icon: 'heroicons_outline:calendar',
                        link: '/pages/calendar'
                    },
                    {
                        id: 'configuracion',
                        title: 'Config',
                        type: 'basic',
                        icon: 'heroicons_outline:cog-6-tooth',
                        link: '/pages/settings'
                    }
                ],
                futuristic: [
                    {
                        id: 'dashboard',
                        title: 'Dashboard',
                        type: 'basic',
                        icon: 'heroicons_outline:squares-2x2',
                        link: '/pages/dashboard'
                    },
                    {
                        id: 'patients',
                        title: 'Patients',
                        type: 'basic',
                        icon: 'heroicons_outline:users',
                        link: '/pages/pacientes'
                    },
                    {
                        id: 'appointments',
                        title: 'Appointments',
                        type: 'basic',
                        icon: 'heroicons_outline:calendar-days',
                        link: '/pages/calendar'
                    },
                    {
                        id: 'settings',
                        title: 'Settings',
                        type: 'basic',
                        icon: 'heroicons_outline:adjustments-horizontal',
                        link: '/pages/settings'
                    }
                ]
            };
            return of(new HttpResponse({ status: 200, body: mockNavigation }));
        }

        // Mock para /api/common/messages
        if (url.includes('/api/common/messages')) {
            console.log('🎯 [RoleInterceptor] Mock response para /api/common/messages');
            const mockMessages = [
                {
                    id: 'msg-1',
                    image: 'assets/images/avatars/male-01.jpg',
                    title: 'Dr. García',
                    description: 'Paciente en sala 3 necesita atención',
                    time: new Date().toISOString(),
                    read: false
                }
            ];
            return of(new HttpResponse({ status: 200, body: mockMessages }));
        }

        // Mock para /api/common/shortcuts
        if (url.includes('/api/common/shortcuts')) {
            console.log('🎯 [RoleInterceptor] Mock response para /api/common/shortcuts');
            const mockShortcuts = [
                {
                    id: 'shortcut-1',
                    label: 'Nueva Cita',
                    description: 'Programar nueva cita',
                    icon: 'heroicons_outline:plus-circle',
                    link: '/pages/citas/nueva',
                    useRouter: true
                },
                {
                    id: 'shortcut-2',
                    label: 'Pacientes',
                    description: 'Ver lista de pacientes',
                    icon: 'heroicons_outline:users',
                    link: '/pages/pacientes',
                    useRouter: true
                }
            ];
            return of(new HttpResponse({ status: 200, body: mockShortcuts }));
        }

        // Mock para /api/common/notifications
        if (url.includes('/api/common/notifications')) {
            console.log('🎯 [RoleInterceptor] Mock response para /api/common/notifications');
            const mockNotifications = [
                {
                    id: 'notif-1',
                    icon: 'heroicons_outline:bell',
                    title: 'Nueva cita programada',
                    description: 'Se ha programado una nueva cita para mañana a las 10:00',
                    time: new Date().toISOString(),
                    read: false,
                    link: '/pages/calendar',
                    useRouter: true
                }
            ];
            return of(new HttpResponse({ status: 200, body: mockNotifications }));
        }

        // Mock para chat de Fuse
        if (url.includes('/api/apps/chat/chats')) {
            console.log('🎯 [RoleInterceptor] Mock response para /api/apps/chat/chats');
            const mockChats = [
                {
                    id: 'chat-1',
                    contactId: 'admin-1',
                    contact: {
                        id: 'admin-1',
                        name: 'Administrador',
                        avatar: 'assets/images/avatars/male-02.jpg',
                        status: 'online'
                    },
                    unreadCount: 2,
                    muted: false,
                    lastMessage: 'Hola, ¿necesitas ayuda?',
                    lastMessageAt: new Date().toISOString()
                }
            ];
            return of(new HttpResponse({ status: 200, body: mockChats }));
        }

        // Mock para chat específico
        if (url.includes('/api/apps/chat/chat?id=')) {
            console.log('🎯 [RoleInterceptor] Mock response para chat específico');
            const mockChatDetail = {
                id: 'chat-1',
                contactId: 'admin-1',
                contact: {
                    id: 'admin-1',
                    name: 'Administrador',
                    avatar: 'assets/images/avatars/male-02.jpg',
                    status: 'online'
                },
                messages: [
                    {
                        id: 'msg-1',
                        chatId: 'chat-1',
                        contactId: 'admin-1',
                        value: 'Hola, ¿necesitas ayuda?',
                        createdAt: new Date().toISOString(),
                        isMine: false
                    }
                ]
            };
            return of(new HttpResponse({ status: 200, body: mockChatDetail }));
        }

        // Mock para contactos del chat
        if (url.includes('/api/apps/chat/contacts')) {
            console.log('🎯 [RoleInterceptor] Mock response para /api/apps/chat/contacts');
            const mockContacts = [
                {
                    id: 'admin-1',
                    name: 'Administrador',
                    avatar: 'assets/images/avatars/male-02.jpg',
                    status: 'online',
                    details: {
                        emails: [{ email: 'admin@clinicaclick.com', label: 'Trabajo' }],
                        phoneNumbers: [{ phoneNumber: '+34 123 456 789', label: 'Móvil' }]
                    }
                }
            ];
            return of(new HttpResponse({ status: 200, body: mockContacts }));
        }

        // Mock para perfil del chat
        if (url.includes('/api/apps/chat/profile')) {
            console.log('🎯 [RoleInterceptor] Mock response para /api/apps/chat/profile');
            const mockProfile = {
                id: 'user-1',
                name: 'User example',
                email: 'user@example.com',
                avatar: 'assets/images/avatars/brian-hughes.jpg',
                status: 'online',
                about: 'Usuario del sistema ClinicaClick'
            };
            return of(new HttpResponse({ status: 200, body: mockProfile }));
        }
    }

    // Para APIs internas, agregar headers de rol (si están disponibles)
    if (requestType === 'internal_api') {
        try {
            const headers: { [key: string]: string } = {};
            
            // Obtener usuario actual (puede ser null durante carga inicial)
            const user = roleService.getCurrentUser();
            if (user && user.id_usuario) {
                headers['X-User-Id'] = user.id_usuario.toString();
                headers['X-User-Email'] = user.email_usuario || '';
                headers['X-User-Name'] = user.nombre || '';
            } else {
                console.log('⚠️ [RoleInterceptor] Usuario no disponible, continuando sin headers de usuario');
            }

            // Obtener rol actual (puede ser null durante carga inicial)
            const currentRole = roleService.getCurrentRole();
            if (currentRole) {
                headers['X-Current-Role'] = currentRole;
                
                // Verificar si es administrador
                const isAdmin = currentRole === 'administrador' || 
                               (user && user.isAdmin === true);
                headers['X-Is-Admin'] = isAdmin.toString();
            } else {
                console.log('⚠️ [RoleInterceptor] Rol no disponible, continuando sin headers de rol');
            }

            // Obtener clínica seleccionada (puede ser null durante carga inicial)
            const selectedClinica = roleService.getSelectedClinica();
            if (selectedClinica && selectedClinica.id) {
                headers['X-Selected-Clinic'] = selectedClinica.id.toString();
                headers['X-Clinic-Name'] = selectedClinica.name || '';
            } else {
                console.log('⚠️ [RoleInterceptor] Clínica no disponible, continuando sin headers de clínica');
            }

            // Solo agregar headers si hay al menos uno disponible
            if (Object.keys(headers).length > 0) {
                const modifiedReq = req.clone({
                    setHeaders: headers
                });
                console.log('🔧 [RoleInterceptor] Headers agregados para API interna:', Object.keys(headers));
                return next(modifiedReq);
            } else {
                console.log('⚠️ [RoleInterceptor] No hay headers disponibles, continuando con petición original');
                return next(req);
            }

        } catch (error) {
            console.warn('⚠️ [RoleInterceptor] Error agregando headers, continuando con petición original:', error);
            return next(req);
        }
    }

    // Continuar con la petición original
    return next(req);
};

