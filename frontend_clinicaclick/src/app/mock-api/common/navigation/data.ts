/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';

export const defaultNavigation: FuseNavigationItem[] = [
       /* aquí van los elementos del menú de segundo nivel y desplegables */
    {
        id      : 'apps',
        title   : 'Contabilidad',
        subtitle: 'Custom made application designs',
        type    : 'group',
        icon    : 'heroicons_outline:home',
        children: [
            {
                id   : 'apps.contacts',
                title: 'Usuarioss',
                type : 'basic',
                icon : 'heroicons_outline:identification',
                link : '/apps/contacts',
            },
            {
                id   : 'apps.contacts',
                title: 'Clinicas',
                type : 'basic',
                icon : 'heroicons_outline:building-storefront',
                link : '/apps/clinicas',
            },
            
            {
                id      : 'apps.ecommerce',
                title   : 'ECommerce',
                type    : 'collapsable',
                icon    : 'heroicons_outline:shopping-cart',
                children: [
                    {
                        id   : 'apps.ecommerce.inventory',
                        title: 'Inventory',
                        type : 'basic',
                        link : '/apps/ecommerce/inventory',
                    },
                ],
            },
           
           
           
        ],
    },
    {
        id      : 'pacientes',
        title   : 'Pacientes',
        subtitle: 'Custom made application designs',
        type    : 'group',
        icon    : 'heroicons_outline:user-group',
        children: [
            {
                id      : 'pacientes',
                title   : 'Pacientes',
                type    : 'basic',
                icon    : 'heroicons_outline:user-group',
                link    : '/pacientes'
            }            
        ],
    },    
    {
        id   : 'contabilidad',
        title: 'Contabilidad',
        type : 'basic',
        icon : 'heroicons_outline:calculator',
        children : [
            {
                id   : 'apps.ventas.servicios',
                title: 'Vision general',
                type : 'basic',
                icon : 'heroicons_outline:chart-bar',
                link : '/apps/ventas/servicios',
            },
            {
            id   : 'apps.ventas.servicios',
            title: 'Servicios disponibles',
            type : 'basic',
            icon : 'heroicons_outline:archive-box',
            link : '/apps/ventas/servicios',
            },
            {
                id   : 'apps.ventas.servicios_asignados',
                title: 'Servicios Asignados',
                type : 'basic',
                icon : 'heroicons_outline:bookmark-square',
                link : '/apps/ventas/servicios_asignados',
            },
            {
                id   : 'apps.ventas.historial',
                title: 'Historial de servicios',
                type : 'basic',
                icon : 'heroicons_outline:clipboard-document-list',
                link : '/apps/ventas/historial_de_servicios',
            },
            {
                id   : 'apps.ventas.facturas',
                title: 'Facturas de ingresos',
                type : 'basic',
                icon : 'heroicons_outline:clipboard-document-check',
                link : '/apps/ventas/historial',
            },
            {
                id   : 'apps.ventas.facturas',
                title: 'Facturas de gastos',
                type : 'basic',
                icon : 'heroicons_outline:shopping-bag',
                link : '/apps/ventas/historial',
            },
            {
                id   : 'apps.ventas.facturas',
                title: 'Nominas',
                type : 'basic',
                icon : 'feather:users',
                link : '/apps/ventas/historial',
            },
            {
                id   : 'apps.ventas.banco',
                title: 'Movimientos bancarios',
                type : 'basic',
                icon : 'heroicons_outline:banknotes',
                link : '/apps/ventas/historial',
            },
            {
                id   : 'apps.ventas.remesas',
                title: 'Remesas',
                type : 'basic',
                icon : 'heroicons_outline:arrow-up-on-square-stack',
                link : '/apps/ventas/historial',
            },
        ],
    },
    
];
export const compactNavigation: FuseNavigationItem[] = [
    /* aquí van los elementos del menú de primer nivel, por ejmeplo, la bola tendría que ir a este */
    {
        id      : 'apps',
        title   : 'Miembros',
        tooltip : 'Miembros',
        type    : 'aside',
        icon    : 'heroicons_outline:user-circle',
        children: [], // This will be filled from defaultNavigation so we don't have to manage multiple sets of the same navigation
    },
    {
        id      : 'pacientes',
        title   : 'Pacientes',
        tooltip : 'Pacientes',
        type    : 'aside',
        icon    : 'heroicons_outline:user-group',
        children: [], // This will be filled from defaultNavigation so we don't have to manage multiple sets of the same navigation
    },
    {
        id      : 'contabilidad',
        title   : 'Contabilidad',
        tooltip : 'Contabilidad',
        type    : 'aside',
        icon    : 'heroicons_outline:calculator',
        children: [], // This will be filled from defaultNavigation so we don't have to manage multiple sets of the same navigation
    },
    {
        id      : 'marketing',
        title   : 'Marketing',
        type    : 'basic',
        icon    : 'heroicons_outline:chart-bar',
        link    : '/marketing',
    }
    
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
