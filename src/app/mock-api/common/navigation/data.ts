/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';

export const defaultNavigation: FuseNavigationItem[] = [
    // Panel principal
    {
        id      : 'panel-principal',
        title   : 'Panel Principal',
        type    : 'basic',
        icon    : 'heroicons_outline:chart-bar',
        link    : '/panel-principal',
    },

    // Pacientes
    {
        id      : 'pacientes',
        title   : 'Pacientes',
        type    : 'group',
        icon    : 'heroicons_outline:user-group',
        children: [
            {
                id   : 'pacientes.lista',
                title: 'Lista de pacientes',
                type : 'basic',
                icon : 'heroicons_outline:user-group',
                link : '/pacientes'
            },
            {
                id      : 'pacientes.calendario',
                title   : 'Calendario de Citas',
                type    : 'basic',
                icon    : 'heroicons_outline:calendar',
                disabled: true
            },
            {
                id      : 'pacientes.recordatorios',
                title   : 'Recordatorios',
                type    : 'basic',
                icon    : 'heroicons_outline:bell',
                disabled: true
            }
        ],
    },

    // Marketing
    {
        id      : 'marketing',
        title   : 'Marketing',
        type    : 'group',
        icon    : 'heroicons_outline:megaphone',
        children: [
            { id: 'marketing.primeras-citas', title: 'Primeras citas', type: 'basic', icon: 'heroicons_outline:clipboard-document-check', disabled: true, classes: { wrapper: 'opacity-50 pointer-events-none' } },
            { id: 'marketing.campanas', title: 'Campañas', type: 'basic', icon: 'heroicons_outline:swatch', disabled: true, classes: { wrapper: 'opacity-50 pointer-events-none' } },
            { id: 'marketing.redes', title: 'Redes sociales', type: 'basic', icon: 'heroicons_outline:share', disabled: true, classes: { wrapper: 'opacity-50 pointer-events-none' } },
            { id: 'marketing.web', title: 'Página web', type: 'basic', icon: 'heroicons_outline:globe-alt', disabled: true, classes: { wrapper: 'opacity-50 pointer-events-none' } },
            { id: 'marketing.perfil-google', title: 'Perfil de Empresa en Google', type: 'basic', icon: 'heroicons_outline:map-pin', disabled: true, classes: { wrapper: 'opacity-50 pointer-events-none' } },
        ],
    },

    // Clínica
    {
        id      : 'clinica',
        title   : 'Clínica',
        type    : 'group',
        icon    : 'heroicons_outline:building-office-2',
        children: [
            { id: 'clinica.usuarios', title: 'Personal', type: 'basic', icon: 'heroicons_outline:identification', link: '/usuarios' },
            { id: 'clinica.tratamientos', title: 'Tratamientos', type: 'basic', icon: 'heroicons_outline:beaker', disabled: true, classes: { wrapper: 'opacity-50 pointer-events-none' } },
            { id: 'clinica.clinicas', title: 'Clínicas', type: 'basic', icon: 'heroicons_outline:building-storefront', link: '/clinicas' },
            { id: 'clinica.instalaciones', title: 'Instalaciones', type: 'basic', icon: 'heroicons_outline:home-modern', disabled: true, classes: { wrapper: 'opacity-50 pointer-events-none' } },
            { id: 'clinica.aseguradoras', title: 'Aseguradoras', type: 'basic', icon: 'heroicons_outline:shield-check', disabled: true, classes: { wrapper: 'opacity-50 pointer-events-none' } },
            { id: 'clinica.tareas', title: 'Tareas', type: 'basic', icon: 'heroicons_outline:check-circle', disabled: true, classes: { wrapper: 'opacity-50 pointer-events-none' } },
            { id: 'clinica.correo', title: 'Correo electrónico', type: 'basic', icon: 'heroicons_outline:envelope', disabled: true, classes: { wrapper: 'opacity-50 pointer-events-none' } },
        ],
    },

    // Gestoría
    {
        id      : 'gestoria',
        title   : 'Gestoría',
        type    : 'group',
        icon    : 'heroicons_outline:clipboard-document-list',
        children: [
            { id: 'gestoria.facturacion', title: 'Facturación', type: 'basic', icon: 'heroicons_outline:banknotes', disabled: true, classes: { wrapper: 'opacity-50 pointer-events-none' } },
            { id: 'gestoria.consentimientos', title: 'Consentimientos', type: 'basic', icon: 'heroicons_outline:document-check', disabled: true, classes: { wrapper: 'opacity-50 pointer-events-none' } },
            { id: 'gestoria.nominas', title: 'Nóminas', type: 'basic', icon: 'heroicons_outline:document-text', disabled: true, classes: { wrapper: 'opacity-50 pointer-events-none' } },
        ],
    },

    // General
    {
        id      : 'general',
        title   : 'General',
        type    : 'group',
        icon    : 'heroicons_outline:cog-6-tooth',
        children: [
            { id: 'general.ajustes', title: 'Ajustes', type: 'basic', icon: 'heroicons_outline:cog-6-tooth', link: '/ajustes' },
        ],
    },
];
export const compactNavigation: FuseNavigationItem[] = [
    /* aquí van los elementos del menú de primer nivel, por ejmeplo, la bola tendría que ir a este */
    { id: 'panel-principal', title: 'Panel Principal', tooltip: 'Panel Principal', type: 'basic', icon: 'heroicons_outline:chart-bar', link: '/panel-principal' },
    { id: 'ajustes', title: 'Ajustes', tooltip: 'Ajustes', type: 'basic', icon: 'heroicons_outline:cog-6-tooth', link: '/ajustes' },
    { id: 'pacientes', title: 'Pacientes', tooltip: 'Pacientes', type: 'aside', icon: 'heroicons_outline:user-group', children: [] },
    { id: 'marketing', title: 'Marketing', tooltip: 'Marketing', type: 'aside', icon: 'heroicons_outline:megaphone', children: [] },
    { id: 'clinica', title: 'Clínica', tooltip: 'Clínica', type: 'aside', icon: 'heroicons_outline:building-office-2', children: [] },
    { id: 'gestoria', title: 'Gestoría', tooltip: 'Gestoría', type: 'aside', icon: 'heroicons_outline:clipboard-document-list', children: [] },
    { id: 'general', title: 'General', tooltip: 'General', type: 'aside', icon: 'heroicons_outline:cog-6-tooth', children: [] },
    
];
export const futuristicNavigation: FuseNavigationItem[] = [
    /* esto no nos vale para nada de momento 
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }

    */
];
export const horizontalNavigation: FuseNavigationItem[] = [

    /* esto no nos vale para nada de momento 
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
    */
];
