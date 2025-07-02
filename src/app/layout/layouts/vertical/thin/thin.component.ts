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
import { ClinicFilterService } from 'app/core/services/clinic-filter-service';

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

  // ✅ CONFIGURACIÓN DE ADMINISTRADORES
  // 📋 INSTRUCCIONES: Para agregar/quitar administradores, modifica este array con los IDs de usuario
  // Ejemplo: [1, 5, 10] - Los usuarios con ID 1, 5 y 10 serán administradores
  private readonly ADMIN_USER_IDS: number[] = [1]; // 👈 MODIFICAR AQUÍ PARA AGREGAR MÁS ADMINS

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
    private _fuseNavigationService: FuseNavigationService,
    private _clinicFilterService: ClinicFilterService
  ) {}

  get currentYear(): number {
    return new Date().getFullYear();
  }

  // ✅ MÉTODO PARA DETECTAR ADMINISTRADORES
  // 📋 Este método verifica si el usuario actual es administrador basándose en su ID
  // Los IDs de administradores se configuran en el array ADMIN_USER_IDS arriba
  private isAdmin(): boolean {
    if (!this.currentUser?.id_usuario) {
      return false;
    }
    return this.ADMIN_USER_IDS.includes(this.currentUser.id_usuario);
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
        // ✅ LÓGICA DE ADMINISTRADOR
        // Si el usuario es administrador (ID está en ADMIN_USER_IDS), obtener todas las clínicas
        // Si es usuario normal, obtener solo sus clínicas asignadas
        if (this.isAdmin()) {
          console.log('🔑 Usuario administrador detectado (ID:', user.id_usuario, ')');
          // Para el admin, obtener todas las clínicas del sistema
          this.contactsService.getClinicas().subscribe((allClinics: any[]) => {
            this.allClinics = allClinics;
            console.log('📋 Admin: Cargadas', allClinics.length, 'clínicas del sistema');
            this.setupUserInterface();
          });
        } else {
          console.log('👤 Usuario normal detectado (ID:', user.id_usuario, ')');
          // Para usuarios normales, obtener solo sus clínicas asignadas
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
            console.log('📋 Usuario: Cargadas', clinicsArray.length, 'clínicas asignadas');
            this.setupUserInterface();
          });
        }
      }
    });
  }

  // ✅ MÉTODO PARA CONFIGURAR LA INTERFAZ
  private setupUserInterface(): void {
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
    
    if (selected === null) {
      // "Sin grupo" seleccionado - mostrar todas las clínicas del rol
      localStorage.removeItem('selectedClinicId');
    } else if (selected.isGroup) {
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

  // ✅ MÉTODO CORREGIDO: Combina el filtro por rol y la selección actual para obtener la lista final
  private updateFinalClinicsAndPatients(): void {
    let finalClinics: any[] = [];
    
    // ✅ LÓGICA DE ADMINISTRADOR CORREGIDA
    // Si es admin con rol "admin", mostrar todas las clínicas sin filtros
    if (this.isAdmin() && this.selectedRole === 'admin') {
      finalClinics = [...this.allClinics];
      console.log('🔑 Admin: Mostrando todas las clínicas (', finalClinics.length, ')');
      
      // ✅ CORRECCIÓN: Para admin, siempre publicar todas las clínicas
      this._clinicFilterService.setFilteredClinics(finalClinics);
      
      // ✅ CORRECCIÓN: Para admin, determinar filtro basado en selección lateral
      let clinicFilter: string | null = null;
      
      if (this.selectedClinic) {
        if (this.selectedClinic.isGroup) {
          // Si seleccionó un grupo, filtrar por esas clínicas
          clinicFilter = this.selectedClinic.clinicasIds.join(',');
          console.log('🔑 Admin: Filtrando por grupo con IDs:', clinicFilter);
        } else {
          // Si seleccionó una clínica específica, filtrar por esa clínica
          clinicFilter = String(this.selectedClinic.id_clinica);
          console.log('🔑 Admin: Filtrando por clínica ID:', clinicFilter);
        }
      } else {
        // Si no seleccionó nada específico, mostrar todos los pacientes
        clinicFilter = null;
        console.log('🔑 Admin: Sin filtro (todos los pacientes)');
      }
      
      this._clinicFilterService.setSelectedClinicId(clinicFilter);
      this._pacientesService.getPacientes(clinicFilter).subscribe();
      return; // ✅ IMPORTANTE: Salir aquí para evitar la lógica normal
    }

    // ✅ LÓGICA CORREGIDA PARA USUARIOS NO-ADMIN
    // Siempre publicar todas las clínicas filtradas por rol para el desplegable
    this._clinicFilterService.setFilteredClinics([...this.roleFilteredClinics]);
    
    // Determinar el filtro de pacientes basado en la selección lateral
    let clinicFilter: string | null = null;
    
    if (!this.selectedClinic) {
      // ✅ CORRECCIÓN PRINCIPAL: Si no hay selección específica (ej: "Sin grupo"), 
      // mostrar pacientes de TODAS las clínicas del rol actual
      const allClinicIds = this.roleFilteredClinics.map(c => c.id_clinica);
      clinicFilter = allClinicIds.length > 0 ? allClinicIds.join(',') : null;
      console.log('👤 Usuario: Sin selección específica - mostrando pacientes de todas las clínicas del rol:', clinicFilter);
    } else if (this.selectedClinic.isGroup) {
      // Si seleccionó un grupo específico, filtrar por esas clínicas
      const validClinicIds = this.selectedClinic.clinicasIds.filter(id => 
        this.roleFilteredClinics.some(c => c.id_clinica === id)
      );
      clinicFilter = validClinicIds.length > 0 ? validClinicIds.join(',') : null;
      console.log('👤 Usuario: Filtrando por grupo con IDs:', clinicFilter);
    } else {
      // Si seleccionó una clínica específica, verificar que esté en las clínicas del rol
      const isValidClinic = this.roleFilteredClinics.some(c => c.id_clinica === this.selectedClinic.id_clinica);
      if (isValidClinic) {
        clinicFilter = String(this.selectedClinic.id_clinica);
        console.log('👤 Usuario: Filtrando por clínica ID:', clinicFilter);
      } else {
        // Si la clínica seleccionada no es válida para el rol actual, mostrar todas
        const allClinicIds = this.roleFilteredClinics.map(c => c.id_clinica);
        clinicFilter = allClinicIds.length > 0 ? allClinicIds.join(',') : null;
        console.log('👤 Usuario: Clínica seleccionada no válida para el rol - mostrando todas:', clinicFilter);
        // Resetear la selección
        this.selectedClinic = null;
        localStorage.removeItem('selectedClinicId');
      }
    }
    
    this._clinicFilterService.setSelectedClinicId(clinicFilter);
    this._pacientesService.getPacientes(clinicFilter).subscribe();
  }

  // ✅ MÉTODO CORREGIDO: Filtra las clínicas según el rol seleccionado
  filterClinicsByRole(): void {
    // ✅ LÓGICA DE ADMINISTRADOR CORREGIDA
    // Si es admin y tiene rol admin seleccionado, mostrar todas las clínicas
    if (this.isAdmin() && this.selectedRole === 'admin') {
      this.roleFilteredClinics = [...this.allClinics];
      console.log('🔑 Admin: Mostrando todas las clínicas en selector (', this.allClinics.length, ')');
      return;
    }

    // Lógica normal para usuarios no-admin o admin con otros roles
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

  // ✅ ACTUALIZAR ROLES INCLUYENDO ADMIN
  updateRolesFromClinics(): void {
    let allRoles: string[] = [];
    
    // ✅ LÓGICA DE ADMINISTRADOR
    // Si el usuario es administrador, agregar el rol "admin"
    if (this.isAdmin()) {
      allRoles.push('admin');
      console.log('🔑 Rol "admin" agregado para usuario ID:', this.currentUser.id_usuario);
    }
    
    // Agregar roles normales basados en clínicas
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
    
    // Si no es profesional y no es admin, solo rol paciente
    if (!this.currentUser?.isProfesional && !this.isAdmin()) {
      allRoles = ['paciente'];
    }
    
    allRoles = Array.from(new Set(allRoles));
    this.roles = allRoles;
    console.log('📋 Roles disponibles:', allRoles);
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

