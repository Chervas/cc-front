import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, KeyValuePipe, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'clinic-selector',
  standalone: true,
  templateUrl: './clinic-selector.component.html',
  styleUrls: ['./clinic-selector.component.scss'],
  imports: [CommonModule, NgFor, NgIf, KeyValuePipe, TitleCasePipe, MatMenuModule, MatButtonModule]
})
export class ClinicSelectorComponent {
  @Input() selectedClinic: any;
  @Input() clinicsGrouped: { [group: string]: any[] } = {};
  @Output() clinicSelected = new EventEmitter<any>();

  getInitials(name: string, isGroup?: boolean): string {
    if (!name) return '';
    
    // Si es un grupo, quitar el prefijo "Grupo:" antes de calcular las iniciales
    let cleanName = name;
    if (isGroup && name.startsWith('Grupo: ')) {
      cleanName = name.replace('Grupo: ', '');
    }
    
    const initials = this.basicInitials(cleanName);
    return isGroup ? 'G:' + initials : initials;
  }
  
  private basicInitials(name: string): string {
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  

  /**
   * Se llama cuando se selecciona una clínica individual.
   */
  onSelect(clinic: any): void {
    clinic.isGroup = false;
    this.clinicSelected.emit(clinic);
  }

  /**
   * Se llama cuando se selecciona un grupo completo.
   * Se emite un objeto que incluye la propiedad `clinicasIds`, que es un arreglo con los IDs de las clínicas de ese grupo.
   * Para "Sin grupo", se emite null para indicar que se deben mostrar todas las clínicas del rol.
   */
  onSelectGroup(groupName: string): void {
    // Si se selecciona "Sin grupo", emitir null para mostrar todas las clínicas del rol
    if (groupName === 'Sin grupo') {
      this.clinicSelected.emit(null);
      return;
    }
    
    const clinicsInGroup = this.clinicsGrouped[groupName] || [];
    const groupObject = {
      isGroup: true,
      nombre_grupo: groupName,
      clinicasIds: clinicsInGroup.map(clinic => clinic.id_clinica)
    };
    this.clinicSelected.emit(groupObject);
  }
}

