import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { FuseCardComponent } from '@fuse/components/card';
import { MarketingRoutingModule } from './marketing-routing.module';
import { MarketingComponent } from './marketing.component';
import { LeadsComponent } from './leads/leads.component';
import { CampanasComponent } from './campanas/campanas.component';
import { PlantillasComponent } from './plantillas/plantillas.component';

@NgModule({
    declarations: [
        MarketingComponent,
        LeadsComponent,
        CampanasComponent,
        PlantillasComponent
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MarketingRoutingModule,
        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatSidenavModule,
        MatStepperModule,
        MatTableModule,
        FuseCardComponent
    ]
})
export class MarketingModule { }
