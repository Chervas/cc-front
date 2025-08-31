import { AsyncPipe, DOCUMENT, I18nPluralPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { PacientesService } from 'app/modules/admin/apps/pacientes/pacientes.service';
import { Paciente } from 'app/modules/admin/apps/pacientes/pacientes.types';
import { filter, fromEvent, Observable, Subject, switchMap, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CreatePacienteDialogComponent } from 'app/modules/admin/apps/pacientes/create-paciente-dialog.component';

@Component({
  selector       : 'pacientes-list',
  templateUrl    : './list.component.html',
  encapsulation  : ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone     : true,
  imports        : [
    MatSidenavModule,
    RouterOutlet,
    NgIf,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    NgFor,
    NgClass,
    RouterLink,
    AsyncPipe,
    I18nPluralPipe
  ],
})
export class PacientesListComponent implements OnInit, OnDestroy
{
  @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;

  pacientes$: Observable<Paciente[]>;
  pacientesCount: number = 0;
  drawerMode: 'side' | 'over';
  searchInputControl: UntypedFormControl = new UntypedFormControl();
  selectedPaciente: Paciente;

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _changeDetectorRef: ChangeDetectorRef,
    private _pacientesService: PacientesService,
    @Inject(DOCUMENT) private _document: any,
    private _router: Router,
    private _fuseMediaWatcherService: FuseMediaWatcherService,
    private _dialog: MatDialog
  )
  {}

  ngOnInit(): void
  {
    // Inicializar filtro desde almacenamiento si existe
    const saved = localStorage.getItem('selectedClinicId');
    if (saved) {
      this._pacientesService.selectedClinicId$.next(saved);
    }

    // Suscribirse al filtro centralizado y cargar pacientes cuando cambie
    this._pacientesService.selectedClinicId$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((filter) => {
        this._pacientesService.getPacientes(filter).subscribe();
      });

    // Suscribirse a la lista de pacientes
    this.pacientes$ = this._pacientesService.pacientes$;
    this.pacientes$.pipe(takeUntil(this._unsubscribeAll))
      .subscribe((pacientes: Paciente[]) => {
        this.pacientesCount = pacientes.length;
        this._changeDetectorRef.markForCheck();
      });

    // Suscribirse al paciente seleccionado
    this._pacientesService.paciente$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((paciente: Paciente) => {
        this.selectedPaciente = paciente;
        this._changeDetectorRef.markForCheck();
      });

    // Configurar la búsqueda
    this.searchInputControl.valueChanges
      .pipe(
        takeUntil(this._unsubscribeAll),
        switchMap(query => this._pacientesService.searchPacientes(query))
      )
      .subscribe();

    // Cerrar el drawer si se hace click en el backdrop
    this.matDrawer.openedChange
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((opened) => {
        if (!opened) {
          this.selectedPaciente = null;
          this._changeDetectorRef.markForCheck();
        }
      });

    // Cambiar el modo del drawer según el breakpoint
    this._fuseMediaWatcherService.onMediaChange$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(({ matchingAliases }) => {
        this.drawerMode = matchingAliases.includes('lg') ? 'side' : 'over';
        this._changeDetectorRef.markForCheck();
      });

    // Atajo de teclado para crear paciente
    fromEvent(this._document, 'keydown')
      .pipe(
        takeUntil(this._unsubscribeAll),
        filter<KeyboardEvent>(event =>
          (event.ctrlKey === true || event.metaKey === true) && (event.key === '/')
        )
      )
      .subscribe(() => {
        this.openCreatePacienteDialog();
      });
  }

  ngOnDestroy(): void
  {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  onBackdropClicked(): void
  {
    // Volver a la lista
    this._router.navigate(['./'], { relativeTo: this._activatedRoute });
    this._changeDetectorRef.markForCheck();
  }

  trackByFn(index: number, item: any): any
  {
    return item.id_paciente || index;
  }

  onPacienteSelect(paciente: Paciente): void
  {
    this._router.navigate(['./', paciente.id_paciente], { relativeTo: this._activatedRoute });
    this._changeDetectorRef.markForCheck();
  }

  openCreatePacienteDialog(): void
  {
    // Obtener la lista final de clínicas filtradas
    const filteredClinics = this._pacientesService.filteredClinics$.getValue() || [];

    const dialogRef = this._dialog.open(CreatePacienteDialogComponent, {
      width: '400px',
      data: {
        clinics: filteredClinics,
        selectedClinic: null // O si quieres pasar la que consideres
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result)
      {
        this._pacientesService.createPaciente(result).subscribe({
          next: (response) => {
            console.log('Paciente creado:', response);
            if (response && response.paciente && response.paciente.id_paciente) {
              this._router.navigate(['./', response.paciente.id_paciente], { relativeTo: this._activatedRoute });
              const currentFilter = localStorage.getItem('selectedClinicId') || null;
              this._pacientesService.getPacientes(currentFilter).subscribe();
              this._changeDetectorRef.detectChanges();
            } else {
              console.error('ID del nuevo paciente no definido:', response);
            }
          },
          error: (error) => {
            console.error('Error al crear paciente:', error);
          }
        });
      }
    });
  }

  onSearch(value: string): void
  {
    console.log('Buscando pacientes:', value);
  }
}
