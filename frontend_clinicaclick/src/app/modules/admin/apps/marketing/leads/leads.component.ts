import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MarketingService } from '../marketing.service';

@Component({
    selector       : 'leads',
    templateUrl    : './leads.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeadsComponent implements OnInit, OnDestroy
{
    leads: any[] = [];
    displayedColumns: string[] = ['nombre', 'email', 'telefono', 'campana', 'clinica', 'fecha', 'estado', 'acciones'];
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
        // Load leads
        this.loadLeads();
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
     * Load leads
     */
    loadLeads(): void
    {
        this.isLoading = true;
        
        this._marketingService.getLeads()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((leads) => {
                this.leads = leads;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * Update lead status
     */
    updateLeadStatus(lead: any, status: string): void
    {
        this._marketingService.updateLead(lead.id, { ...lead, estado: status })
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                // Update lead in the array
                const index = this.leads.findIndex(l => l.id === lead.id);
                if (index !== -1) {
                    this.leads[index].estado = status;
                    this._changeDetectorRef.markForCheck();
                }
            });
    }

    /**
     * Delete lead
     */
    deleteLead(lead: any): void
    {
        this._marketingService.deleteLead(lead.id)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                // Remove lead from the array
                this.leads = this.leads.filter(l => l.id !== lead.id);
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
