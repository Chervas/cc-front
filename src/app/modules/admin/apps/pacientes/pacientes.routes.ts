import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { PacientesListComponent } from './list/list.component';
import { PacientesDetailsComponent } from './details/details.component';
import { PacientesService } from './pacientes.service';
import { catchError, throwError } from 'rxjs';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

const pacienteResolver = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const pacientesService = inject(PacientesService);
  const router = inject(Router);
  const id = route.paramMap.get('id');
  return pacientesService.getPacienteById(id).pipe(
    catchError((error) => {
      console.error(error);
      router.navigate(['/pacientes']);
      return throwError(error);
    })
  );
};

export const pacientesRoutes: Routes = [
  {
    path: '',
    component: PacientesListComponent,
    children: [
      {
        path: ':id',
        component: PacientesDetailsComponent,
        resolve: { paciente: pacienteResolver }
      }
    ]
  }
];
