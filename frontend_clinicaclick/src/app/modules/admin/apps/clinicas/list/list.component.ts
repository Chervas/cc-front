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
import { ClinicasService } from 'app/modules/admin/apps/clinicas/clinicas.service';
import { Clinica } from 'app/modules/admin/apps/clinicas/clinicas.types';
import { filter, fromEvent, Observable, Subject, switchMap, takeUntil } from 'rxjs';


@Component({
    selector       : 'clinicas-list',
    templateUrl    : './list.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [MatSidenavModule, RouterOutlet, NgIf, MatFormFieldModule, MatIconModule, MatInputModule, FormsModule, ReactiveFormsModule, MatButtonModule, NgFor, NgClass, RouterLink, AsyncPipe, I18nPluralPipe],
})
export class ClinicasListComponent implements OnInit, OnDestroy
{
    @ViewChild('matDrawer', {static: true}) matDrawer: MatDrawer;

    clinicas$: Observable<Clinica[]>;

    clinicasCount: number = 0;
    clinicasTableColumns: string[] = ['nombre', 'email', 'phoneNumber', 'job'];
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
            this._changeDetectorRef.markForCheck(); // Forzar la detección de cambios después de actualizar la lista
        });


        // Get the clinica
        this._clinicasService.clinica$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((clinica: Clinica) =>
            {
                // Update the selected clinica
                this.selectedClinica = clinica;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                switchMap(query =>

                    // Search
                    this._clinicasService.searchClinicas(query),
                ),
            )
            .subscribe();

        // Subscribe to MatDrawer opened change
        this.matDrawer.openedChange.subscribe((opened) =>
        {
            if ( !opened )
            {
                // Remove the selected clinica when drawer closed
                this.selectedClinica = null;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) =>
            {
                // Set the drawerMode if the given breakpoint is active
                if ( matchingAliases.includes('lg') )
                {
                    this.drawerMode = 'side';
                }
                else
                {
                    this.drawerMode = 'over';
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Listen for shortcuts
        fromEvent(this._document, 'keydown')
            .pipe(
                takeUntil(this._unsubscribeAll),
                filter<KeyboardEvent>(event =>
                    (event.ctrlKey === true || event.metaKey) // Ctrl or Cmd
                    && (event.key === '/'), // '/'
                ),
            )
            .subscribe(() =>
            {
                this.createClinica();
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * On backdrop clicked
     */
    onBackdropClicked(): void
    {
        // Go back to the list
        this._router.navigate(['./'], {relativeTo: this._activatedRoute});

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Create clinica
     */
    
    createClinica(): void {
        this._clinicasService.createClinica().subscribe({
            next: (response) => {
                console.log('Clinica creada:', response);
                if (response && response.clinica && response.clinica.id_clinica) {  // Asegúrate de usar id_clinica si ese es el nombre correcto del campo ID
                    console.log('Navigating to clinica with ID:', response.clinica.id_clinica);
                    this._router.navigate(['./', response.clinica.id_clinica], {relativeTo: this._activatedRoute});
                    this._changeDetectorRef.detectChanges(); // Asegúrate de que Angular detecte los cambios
                } else {
                    console.error('ID del nuevo clinicao no definido:', response);
                }
            },
            error: (error) => {
                console.error('Failed to create clinica:', error);
            }
        });
    }
    
    
    /** manejador de evento sdel campo search */
    onSearch(value: string): void {
        console.log('Searching for:', value);  // Esto te permitirá ver qué se está enviando desde el campo de búsqueda
    }


    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id_clinica || index;
    }
}
