import { NgIf, NgFor, TitleCasePipe, KeyValuePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { FuseFullscreenComponent } from '@fuse/components/fullscreen';
import { FuseLoadingBarComponent } from '@fuse/components/loading-bar';
import { FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { Navigation } from 'app/core/navigation/navigation.types';
import { LanguagesComponent } from 'app/layout/common/languages/languages.component';
import { MessagesComponent } from 'app/layout/common/messages/messages.component';
import { NotificationsComponent } from 'app/layout/common/notifications/notifications.component';
import { QuickChatComponent } from 'app/layout/common/quick-chat/quick-chat.component';
import { SearchComponent } from 'app/layout/common/search/search.component';
import { ShortcutsComponent } from 'app/layout/common/shortcuts/shortcuts.component';
import { UserComponent } from 'app/layout/common/user/user.component';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from 'app/core/auth/auth.service';
import { ContactsService } from 'app/modules/admin/apps/contacts/contacts.service';
import { PacientesService } from 'app/modules/admin/apps/pacientes/pacientes.service';
import { ClinicSelectorComponent } from 'app/modules/admin/apps/clinicas/clinic-selector-component';
import { FuseNavigationService } from '@fuse/components/navigation';

@Component({
  selector: 'thin-layout',
  templateUrl: './thin.component.html',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    FuseLoadingBarComponent,
    FuseVerticalNavigationComponent,
    MatButtonModule,
    MatIconModule,
    LanguagesComponent,
    FuseFullscreenComponent,
    SearchComponent,
    ShortcutsComponent,
    MessagesComponent,
    NotificationsComponent,
    UserComponent,
    NgIf,
    NgFor,
    RouterOutlet,
    QuickChatComponent,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    TitleCasePipe,
    KeyValuePipe,
    ClinicSelectorComponent
  ],
})
export class ThinLayoutComponent implements OnInit, OnDestroy {
  isScreenSmall: boolean;
  navigation: Navigation;
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  // Todas las clínicas del usuario
  allClinics: any[] = [];
  // Clínicas filtradas según el rol del header
  roleFilteredClinics: any[] = [];
  // Selección actual: puede ser una clínica individual o un grupo (objeto con isGroup y clinicasIds)
  selectedClinic: any = null;
  // Roles disponibles y rol seleccionado
  roles: string[] = [];
  selectedRole: string;
  currentUser: any;
  // Clínicas agrupadas (para mostrar en el lateral)
  groupedClinics: { [group: string]: any[] } = {};

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _router: Router,
    private _navigationService: NavigationService,
    private _fuseMediaWatcherService: FuseMediaWatcherService,
    private authService: AuthService,
    private contactsService: ContactsService,
    private _pacientesService: PacientesService,
    private _fuseNavigationService: FuseNavigationService
  ) {}

  get currentYear(): number {
    return new Date().getFullYear();
  }

  ngOnInit(): void {
    // Suscribirse a la navegación
    this._navigationService.navigation$.pipe(takeUntil(this._unsubscribeAll))
      .subscribe((navigation: Navigation) => {
        this.navigation = navigation;
      });
    // Suscribirse a los cambios de medios
    this._fuseMediaWatcherService.onMediaChange$.pipe(takeUntil(this._unsubscribeAll))
      .subscribe(({ matchingAliases }) => {
        this.isScreenSmall = !matchingAliases.includes('md');
      });
    // Obtener el usuario y sus clínicas
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
      if (user && user.id_usuario) {
        this.contactsService.getClinicasByUser(user.id_usuario).subscribe((response: any) => {
          let clinicsArray = [];
          if (Array.isArray(response)) {
            clinicsArray = response;
          } else if (response.Clinicas) {
            clinicsArray = response.Clinicas;
          } else {
            clinicsArray = response.clinicas || [];
          }
          this.allClinics = clinicsArray;

          // Cargar el rol almacenado (o usar el primer rol disponible)
          const storedRole = localStorage.getItem('selectedRole');
          this.updateRolesFromClinics();
          if (storedRole && this.roles.includes(storedRole)) {
            this.selectedRole = storedRole;
          } else {
            this.selectedRole = this.roles[0] || '';
            localStorage.setItem('selectedRole', this.selectedRole);
          }

          // Filtrar clínicas según el rol
          this.filterClinicsByRole();
          this.updateGroupedClinics();

          // Recuperar la selección de clínica del localStorage
          const storedClinic = localStorage.getItem('selectedClinicId');
          if (storedClinic) {
            if (storedClinic.includes(',')) {
              this.selectedClinic = {
                isGroup: true,
                clinicasIds: storedClinic.split(',').map(id => parseInt(id, 10))
              };
            } else {
              const found = this.allClinics.find(c => String(c.id_clinica) === storedClinic);
              if (found) {
                this.selectedClinic = found;
              }
            }
          }
          // Si la selección actual no es válida para el rol, se actualizará en updateFinalClinicsAndPatients
          this.updateFinalClinicsAndPatients();
        });
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  toggleNavigation(name: string): void
  {
      // Get the navigation
      const navigation = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(name);

      if ( navigation )
      {
          // Toggle the opened status
          navigation.toggle();
      }
  }

  // Se invoca cuando se selecciona una clínica o grupo en el menú lateral
  onClinicChange(selected: any): void {
    this.selectedClinic = selected;
    if (selected.isGroup) {
      const ids = selected.clinicasIds ? selected.clinicasIds.join(',') : null;
      localStorage.setItem('selectedClinicId', ids || '');
    } else {
      localStorage.setItem('selectedClinicId', String(selected.id_clinica));
    }
    this.updateFinalClinicsAndPatients();
  }

  // Se invoca cuando se cambia el rol en el header
  onRoleChange(role: string): void {
    this.selectedRole = role;
    localStorage.setItem('selectedRole', role);
    this.filterClinicsByRole();
    this.updateGroupedClinics();
    this.updateFinalClinicsAndPatients();
  }

  // Combina el filtro por rol y la selección actual para obtener la lista final
  private updateFinalClinicsAndPatients(): void {
    let finalClinics: any[] = [];
    if (!this.selectedClinic) {
      finalClinics = [...this.roleFilteredClinics];
    } else if (this.selectedClinic.isGroup) {
      finalClinics = this.roleFilteredClinics.filter(c =>
        this.selectedClinic.clinicasIds.includes(c.id_clinica)
      );
    } else {
      finalClinics = this.roleFilteredClinics.filter(c =>
        c.id_clinica === this.selectedClinic.id_clinica
      );
    }

    // Validar la selección actual: si no está en finalClinics, se actualiza
    let isValidSelection = false;
    if (this.selectedClinic) {
      if (this.selectedClinic.isGroup) {
        isValidSelection = finalClinics.length > 0;
      } else {
        isValidSelection = finalClinics.some(c => c.id_clinica === this.selectedClinic.id_clinica);
      }
    }
    if (!isValidSelection) {
      if (finalClinics.length > 0) {
        this.selectedClinic = finalClinics[0];
        localStorage.setItem('selectedClinicId', String(this.selectedClinic.id_clinica));
      } else {
        this.selectedClinic = null;
        localStorage.removeItem('selectedClinicId');
      }
    }

    // Publicar la lista final para que el diálogo la use
    this._pacientesService.filteredClinics$.next(finalClinics);

    // Determinar el filtro a usar: si es grupo, se unen los IDs; si es individual, se usa el ID
    let clinicFilter: string | null = null;
    if (this.selectedClinic) {
      if (this.selectedClinic.isGroup) {
        clinicFilter = this.selectedClinic.clinicasIds.join(',');
      } else {
        clinicFilter = String(this.selectedClinic.id_clinica);
      }
    }
    this._pacientesService.selectedClinicId$.next(clinicFilter);
    this._pacientesService.getPacientes(clinicFilter).subscribe();
  }

  // Filtra las clínicas según el rol seleccionado
  filterClinicsByRole(): void {
    if (!this.selectedRole) {
      this.roleFilteredClinics = [...this.allClinics];
    } else {
      this.roleFilteredClinics = this.allClinics.filter(clinic => {
        const pivot = clinic.UsuarioClinica || clinic.usuarioClinica;
        if (!pivot) return false;
        const normalizedRol = this.normalizeRole(pivot.rol_clinica);
        const normalizedSubrol = this.normalizeRole(pivot.subrol_clinica);
        return normalizedRol === this.selectedRole || normalizedSubrol === this.selectedRole;
      });
    }
  }

  private normalizeRole(role: string): string {
    if (!role) return '';
    if (role === 'propietario' || role === 'paciente') return role;
    return 'personal de clínica';
  }

  updateRolesFromClinics(): void {
    let allRoles: string[] = [];
    this.allClinics.forEach(clinic => {
      const pivot = clinic.UsuarioClinica || clinic.usuarioClinica;
      if (pivot) {
        if (pivot.rol_clinica) {
          allRoles.push(this.normalizeRole(pivot.rol_clinica));
        }
        if (pivot.subrol_clinica) {
          allRoles.push(this.normalizeRole(pivot.subrol_clinica));
        }
      }
    });
    if (!this.currentUser?.isProfesional) {
      allRoles = ['paciente'];
    }
    allRoles = Array.from(new Set(allRoles));
    this.roles = allRoles;
  }

  updateGroupedClinics(): void {
    const grouped: { [group: string]: any[] } = {};
    this.roleFilteredClinics.forEach(clinic => {
      const groupName = (clinic.grupoClinica && clinic.grupoClinica.nombre_grupo)
        ? 'Grupo: ' + clinic.grupoClinica.nombre_grupo
        : 'Sin grupo';
      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(clinic);
    });
    this.groupedClinics = grouped;
  }
}
