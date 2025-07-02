import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () => import('./paneles.component').then(m => m.PanelesComponent),
        data: {
            title: 'Paneles'
        }
    }
] as Routes;

