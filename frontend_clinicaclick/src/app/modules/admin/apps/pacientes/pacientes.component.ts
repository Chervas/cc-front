import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'pacientes',
  templateUrl: './pacientes.component.html',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [RouterOutlet]
})
export class PacientesComponent {}
