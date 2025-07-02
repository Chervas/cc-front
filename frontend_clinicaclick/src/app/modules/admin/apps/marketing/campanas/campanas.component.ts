import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MarketingService } from '../marketing.service';

@Component({
    selector       : 'campanas',
    templateUrl    : './campanas.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampanasComponent implements OnInit, OnDestroy
{
    campanas: any[] = [];
    displayedColumns: string[] = ['nombre', 'estado', 'clinica', 'gastoTotal', 'leads', 'precioPorLead', 'acciones'];
    isLoading: boolean = false;
    
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _marketingService: MarketingService
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
        // Load campañas
        this.loadCampanas();
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
     * Load campañas
     */
    loadCampanas(): void
    {
        this.isLoading = true;
        
        this._marketingService.getCampanas()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((campanas) => {
                this.campanas = campanas;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * Update campaña status
     */
    updateCampanaStatus(campana: any, estado: string): void
    {
        this._marketingService.updateCampana(campana.id, { ...campana, estado })
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                // Update campaña in the array
                const index = this.campanas.findIndex(c => c.id === campana.id);
                if (index !== -1) {
                    this.campanas[index].estado = estado;
                    this._changeDetectorRef.markForCheck();
                }
            });
    }

    /**
     * Delete campaña
     */
    deleteCampana(campana: any): void
    {
        this._marketingService.deleteCampana(campana.id)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                // Remove campaña from the array
                this.campanas = this.campanas.filter(c => c.id !== campana.id);
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * Track by function for ngFor loops
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }
}
