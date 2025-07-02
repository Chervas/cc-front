import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector       : 'plantillas',
    templateUrl    : './plantillas.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlantillasComponent
{
    /**
     * Constructor
     */
    constructor()
    {
    }
}
