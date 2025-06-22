import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MarketingComponent } from './marketing.component';
import { LeadsComponent } from './leads/leads.component';
import { CampanasComponent } from './campanas/campanas.component';
import { PlantillasComponent } from './plantillas/plantillas.component';

const routes: Routes = [
    {
        path     : '',
        component: MarketingComponent,
        children : [
            {
                path     : '',
                pathMatch: 'full',
                redirectTo: 'leads'
            },
            {
                path     : 'leads',
                component: LeadsComponent
            },
            {
                path     : 'campanas',
                component: CampanasComponent
            },
            {
                path     : 'plantillas',
                component: PlantillasComponent
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MarketingRoutingModule { }
