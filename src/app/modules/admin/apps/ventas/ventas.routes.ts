import { Routes } from '@angular/router';
import { ServiciosListComponent } from 'app/modules/admin/apps/ventas/servicios/list/servicios.component';
import { ServiciosAsignadosListComponent } from 'app/modules/admin/apps/ventas/servicios_asignados/list/servicios_asignados.component';
import { HistorialDeServiciosListComponent } from './historial_de_servicios/list/historial_de_servicios_list.component';
import { inject } from '@angular/core';
import { ServiciosService } from 'app/modules/admin/apps/ventas/servicios/servicios.service';
import { ServiciosAsignadosService } from 'app/modules/admin/apps/ventas/servicios_asignados/servicios_asignados.service';
import { HistorialDeServiciosService } from './historial_de_servicios/historial_de_servicios.service';
import { ServiciosAsignadosFormComponent } from 'app/modules/admin/apps/ventas/servicios_asignados/form/servicios-asignados-form.component';

export default [
    {
      path: '',
      pathMatch: 'full',
      redirectTo: 'servicios',
    },
    {
      path: 'servicios',
      component: ServiciosListComponent,
      resolve: {
        products: () => inject(ServiciosService).getProducts(),
      },
    },
    {
      path: 'servicios_asignados',
      component: ServiciosAsignadosListComponent,
      resolve: {
        products: () => inject(ServiciosAsignadosService).getProducts(),
      },
    },
    {
      path: 'servicios_asignados/nuevo',
      component: ServiciosAsignadosFormComponent
    },
    {
      path: 'historial_de_servicios',
      component: HistorialDeServiciosListComponent,
      resolve: {
        products: () => inject(HistorialDeServiciosService).getProducts(),
      },
    },
    {
      path: 'historial_de_servicios/nuevo',
      component: ServiciosAsignadosFormComponent
    }
  ] as Routes;
  
