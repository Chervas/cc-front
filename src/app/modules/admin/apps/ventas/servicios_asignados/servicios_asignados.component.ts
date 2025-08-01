import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector       : 'servicios_asignados',
    templateUrl    : './servicios_asignados.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [RouterOutlet],
})
export class Servicios_asignadosComponent
{
    /**
     * Constructor
     */
    constructor()
    {
    }
}
