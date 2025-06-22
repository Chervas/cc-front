import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router';
import { ClinicasComponent } from 'app/modules/admin/apps/clinicas/clinicas.component';
import { ClinicasService } from 'app/modules/admin/apps/clinicas/clinicas.service';
import { ClinicasDetailsComponent } from 'app/modules/admin/apps/clinicas/details/details.component';
import { ClinicasListComponent } from 'app/modules/admin/apps/clinicas/list/list.component';
import { catchError, throwError } from 'rxjs';

/**
 * Clinica resolver
 *
 * @param route
 * @param state
 */
const clinicaResolver = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
{
    const clinicasService = inject(ClinicasService);
    const router = inject(Router);

    return clinicasService.getClinicaById(route.paramMap.get('id'))
        .pipe(
            // Error here means the requested clinica is not available
            catchError((error) =>
            {
                // Log the error
                console.error(error);

                // Get the parent url
                const parentUrl = state.url.split('/').slice(0, -1).join('/');

                // Navigate to there
                router.navigateByUrl(parentUrl);

                // Throw an error
                return throwError(error);
            }),
        );
};

/**
 * Can deactivate clinicas details
 *
 * @param component
 * @param currentRoute
 * @param currentState
 * @param nextState
 */
const canDeactivateClinicasDetails = (
    component: ClinicasDetailsComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState: RouterStateSnapshot) =>
{
    // Get the next route
    let nextRoute: ActivatedRouteSnapshot = nextState.root;
    while ( nextRoute.firstChild )
    {
        nextRoute = nextRoute.firstChild;
    }

    // If the next state doesn't contain '/clinicas'
    // it means we are navigating away from the
    // clinicas app
    if ( !nextState.url.includes('/clinicas') )
    {
        // Let it navigate
        return true;
    }

    // If we are navigating to another clinica...
    if ( nextRoute.paramMap.get('id') )
    {
        // Just navigate
        return true;
    }

    // Otherwise, close the drawer first, and then navigate
    return component.closeDrawer().then(() => true);
};

export default [
    {
        path     : '',
        component: ClinicasComponent,
        resolve  : {
           
        },
        children : [
            {
                path     : '',
                component: ClinicasListComponent,
                resolve  : {
                    clinicas : () => inject(ClinicasService).getClinicas(),
                  
                },
                children : [
                    {
                        path         : ':id',
                        component    : ClinicasDetailsComponent,
                        resolve      : {
                            clinica  : clinicaResolver,
                        },
                        canDeactivate: [canDeactivateClinicasDetails],
                    },
                ],
            },
        ],
    },
] as Routes;
