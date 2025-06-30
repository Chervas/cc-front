import { AsyncPipe, DOCUMENT, NgClass, NgFor, NgIf, I18nPluralPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { ClinicasService } from 'app/modules/admin/apps/clinicas/clinicas.service';
import { Clinica } from 'app/modules/admin/apps/clinicas/clinicas.types';
import { filter, fromEvent, Observable, Subject, switchMap, takeUntil } from 'rxjs';

@Component({
    selector       : 'clinicas-list',
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
export class ClinicasListComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;

    clinicas$: Observable<Clinica[]>;
    clinicasCount: number = 0;
    drawerMode: 'side' | 'over';
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedClinica: Clinica;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _clinicasService: ClinicasService,
        @Inject(DOCUMENT) private _document: any,
        private _router: Router,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Get the clinicas
        this.clinicas$ = this._clinicasService.clinicas$;
        this.clinicas$.pipe(takeUntil(this._unsubscribeAll))
            .subscribe((clinicas: Clinica[]) => {
                this.clinicasCount = clinicas.length;
                this._changeDetectorRef.markForCheck();
            });

        // Get the clinica
        this._clinicasService.clinica$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((clinica: Clinica) => {
                this.selectedClinica = clinica;
                
                // ✅ CORRECCIÓN: Abrir drawer automáticamente cuando hay una clínica seleccionada
                if (clinica && this.matDrawer) {
                    this.matDrawer.open();
                }
                
                this._changeDetectorRef.markForCheck();
            });

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                switchMap(query => this._clinicasService.searchClinicas(query))
            )
            .subscribe();

        // ✅ CORRECCIÓN: Cerrar el drawer si se hace click en el backdrop
        this.matDrawer.openedChange
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((opened) => {
                if (!opened) {
                    this.selectedClinica = null;
                    this._changeDetectorRef.markForCheck();
                }
            });

        // ✅ CORRECCIÓN: Cambiar el modo del drawer según el breakpoint
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                this.drawerMode = matchingAliases.includes('lg') ? 'side' : 'over';
                this._changeDetectorRef.markForCheck();
            });

        // ✅ CORRECCIÓN: Atajo de teclado para crear clínica
        fromEvent(this._document, 'keydown')
            .pipe(
                takeUntil(this._unsubscribeAll),
                filter<KeyboardEvent>(event =>
                    (event.ctrlKey === true || event.metaKey === true) && (event.key === '/')
                )
            )
            .subscribe(() => {
                this.createClinica();
            });
    }

    /**
     * ✅ CORRECCIÓN: After view init - Detectar ruta inicial y abrir drawer
     */
    ngAfterViewInit(): void
    {
        // ✅ CORRECCIÓN: Suscribirse a cambios en la ruta para detectar cuando hay un ID
        this._activatedRoute.firstChild?.params
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(params => {
                if (params['id'] && this.matDrawer) {
                    // Hay un ID en la ruta, abrir el drawer
                    setTimeout(() => {
                        this.matDrawer.open();
                        this._changeDetectorRef.markForCheck();
                    }, 100);
                }
            });

        // ✅ CORRECCIÓN: También detectar cambios en la URL completa
        this._router.events
            .pipe(
                takeUntil(this._unsubscribeAll),
                filter(event => event.constructor.name === 'NavigationEnd')
            )
            .subscribe(() => {
                const hasId = this._activatedRoute.firstChild?.snapshot.params['id'];
                if (hasId && this.matDrawer && !this.matDrawer.opened) {
                    setTimeout(() => {
                        this.matDrawer.open();
                        this._changeDetectorRef.markForCheck();
                    }, 100);
                } else if (!hasId && this.matDrawer && this.matDrawer.opened) {
                    this.matDrawer.close();
                }
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * ✅ CORRECCIÓN: On backdrop clicked
     */
    onBackdropClicked(): void
    {
        // Volver a la lista
        this._router.navigate(['./'], { relativeTo: this._activatedRoute });
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Create clinica
     */
    createClinica(): void
    {
        // Create the clinica
        this._clinicasService.createClinica().subscribe((newClinica) => {
            // Go to the new clinica
            this._router.navigate(['./', newClinica.id_clinica], { relativeTo: this._activatedRoute });
            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * ✅ CORRECCIÓN: On clinica select
     */
    onClinicaSelect(clinica: Clinica): void
    {
        this._router.navigate(['./', clinica.id_clinica], { relativeTo: this._activatedRoute });
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Track by function for ngFor loops
     */
    trackByFn(index: number, item: any): any
    {
        return item.id_clinica || index;
    }

    /**
     * ✅ CORRECCIÓN: On search
     */
    onSearch(value: string): void
    {
        console.log('Buscando clínicas:', value);
    }
}

