import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDrawer } from '@angular/material/sidenav';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { Subject, takeUntil } from 'rxjs';
import { MarketingService } from './marketing.service';
import { ClinicasService } from '../clinicas/clinicas.service';

@Component({
    selector       : 'marketing',
    templateUrl    : './marketing.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketingComponent implements OnInit, OnDestroy
{
    @ViewChild('connectCampaignsDrawer') connectCampaignsDrawer: TemplateRef<any>;
    
    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean = false;
    isScreenSmall: boolean;
    
    // Stepper form groups
    facebookFormGroup: FormGroup;
    adAccountFormGroup: FormGroup;
    campaignFormGroup: FormGroup;
    
    // Data
    facebookConnected: boolean = false;
    adAccounts: any[] = [];
    campaigns: any[] = [];
    clinicas: any[] = [];
    campaignAssignments: any[] = [];
    
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    private _drawer: MatDrawer;

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: FormBuilder,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _marketingService: MarketingService,
        private _clinicaService: ClinicasService
    )
    {
        // Initialize form groups
        this.facebookFormGroup = this._formBuilder.group({
            facebookConnected: [false, Validators.requiredTrue]
        });
        
        this.adAccountFormGroup = this._formBuilder.group({
            adAccountId: ['', Validators.required]
        });
        
        this.campaignFormGroup = this._formBuilder.group({});
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) => {
                // Check if the screen is small
                this.isScreenSmall = !matchingAliases.includes('md');
                
                // Update drawer mode
                this.drawerMode = this.isScreenSmall ? 'over' : 'side';
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
            
        // Load clínicas
        this._clinicaService.getClinicas()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((clinicas) => {
                this.clinicas = clinicas;
                this._changeDetectorRef.markForCheck();
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
     * Open connect campaigns drawer
     */
    openConnectCampaignsDrawer(): void
    {
        this.drawerOpened = true;
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Close connect campaigns drawer
     */
    closeConnectCampaignsDrawer(): void
    {
        this.drawerOpened = false;
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Connect with Facebook
     */
    connectWithFacebook(): void
    {
        // En una implementación real, aquí se abriría el popup de Facebook Login
        // Para esta demo, simularemos una conexión exitosa
        
        // Simular conexión exitosa después de 1 segundo
        setTimeout(() => {
            this.facebookConnected = true;
            this.facebookFormGroup.patchValue({
                facebookConnected: true
            });
            
            // Cargar cuentas publicitarias
            this._marketingService.getAdAccounts()
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe((response) => {
                    this.adAccounts = response.data;
                    this._changeDetectorRef.markForCheck();
                });
                
            this._changeDetectorRef.markForCheck();
        }, 1000);
    }

    /**
     * Load campaigns when ad account is selected
     */
    loadCampaigns(): void
    {
        const adAccountId = this.adAccountFormGroup.get('adAccountId').value;
        
        if (!adAccountId) {
            return;
        }
        
        this._marketingService.getCampaigns(adAccountId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {
                this.campaigns = response.data;
                
                // Reset campaign form group
                this.campaignFormGroup = this._formBuilder.group({});
                
                // Add form controls for each campaign
                this.campaigns.forEach((campaign, index) => {
                    this.campaignFormGroup.addControl(
                        'campaign_' + index,
                        this._formBuilder.control('', Validators.required)
                    );
                });
                
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * Prepare campaign assignments for confirmation
     */
    prepareCampaignAssignments(): void
    {
        this.campaignAssignments = [];
        
        this.campaigns.forEach((campaign, index) => {
            const clinicaId = this.campaignFormGroup.get('campaign_' + index).value;
            const clinica = this.clinicas.find(c => c.id === clinicaId);
            
            if (clinica) {
                this.campaignAssignments.push({
                    campaignId: campaign.id,
                    campaignName: campaign.name,
                    clinicaId: clinica.id,
                    clinicaName: clinica.nombre
                });
            }
        });
    }

    /**
     * Save campaign assignments
     */
    saveCampaignAssignments(): void
    {
        // Prepare data for saving
        const campaignsToSave = this.campaignAssignments.map(assignment => {
            const campaign = this.campaigns.find(c => c.id === assignment.campaignId);
            
            return {
                nombre: campaign.name,
                campaign_id: campaign.id,
                estado: campaign.status,
                gastoTotal: parseFloat(campaign.spend) || 0,
                leads: campaign.results || 0,
                precioPorLead: campaign.results ? parseFloat(campaign.spend) / campaign.results : 0,
                clinica_id: assignment.clinicaId
            };
        });
        
        // Save campaigns
        this._marketingService.saveCampaigns(campaignsToSave)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                // Close drawer
                this.closeConnectCampaignsDrawer();
                
                // Reset forms
                this.facebookFormGroup.reset();
                this.adAccountFormGroup.reset();
                this.campaignFormGroup.reset();
                this.facebookConnected = false;
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }
}
