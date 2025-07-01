import { Routes } from '@angular/router';
import { PanelesComponent } from './paneles.component';

export default [
    {
        path: '',
        component: PanelesComponent,
        data: {
            title: 'Paneles'
        }
    }
] as Routes;

