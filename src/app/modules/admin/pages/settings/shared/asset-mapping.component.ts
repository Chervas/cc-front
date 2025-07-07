// ARCHIVO COMPLETO Y VERIFICADO: src/app/modules/admin/pages/settings/shared/asset-mapping.component.ts

import { NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { UserService } from 'app/core/user/user.service';

// Tipos TypeScript
export interface MetaAsset {
    id: string;
    name: string;
    type: 'facebook_page' | 'instagram_business' | 'ad_account';
    assetAvatarUrl?: string;
    // Facebook Pages
    category?: string;
    verification_status?: string;
    followers_count?: number;
    picture?: { data?: { url?: string } };
    // Instagram Business
    username?: string;
    profile_picture_url?: string;
    biography?: string;
    media_count?: number;
    // Ad Accounts
    currency?: string;
    account_status?: string;
    timezone_name?: string;
    business_name?: string;
    // Datos adicionales
    additionalData?: any;
}

export interface Clinic {
    id: number;
    name: string;
    description?: string;
    location?: string;
    isActive: boolean;
}

export interface AssetMapping {
    assetId: string;
    assetName: string;
    assetType: string;
    clinicId: number;
    clinicName: string;
}

export interface ExistingMapping {
    assetId: string;
    assetName: string;
    assetType: string;
    clinicId: number;
}

export interface MappingResult {
    success: boolean;
    mappings: AssetMapping[];
    message?: string;
}

export interface AssetMappingConfig {
    mode: 'full-mapping' | 'clinic-specific' | 'asset-selection';
    allowMultipleAssets: boolean;
    allowMultipleClinics: boolean;
    showAsModal: boolean;
    title: string;
    subtitle: string;
    preselectedClinicId?: number;
}

export interface AssetsByType {
    facebook_pages: MetaAsset[];
    instagram_business: MetaAsset[];
    ad_accounts: MetaAsset[];
}

export interface StepperData {
    selectedAssets: MetaAsset[];
    selectedClinicIds: number[];
    isLoading: boolean;
}

@Component({
    selector: 'app-asset-mapping',
    templateUrl: './asset-mapping.component.html',
    standalone: true,
    imports: [
        NgClass,
        NgFor,
        NgIf,
        ReactiveFormsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatExpansionModule,
        MatIconModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatStepperModule
    ]
})
export class AssetMappingComponent implements OnInit {
    @Input() config: AssetMappingConfig = {
        mode: 'asset-selection',
        allowMultipleAssets: true,
        allowMultipleClinics: true,
        showAsModal: false,
        title: 'Mapear Activos de Meta',
        subtitle: 'Selecciona y asigna tus activos a clínicas específicas'
    };

    @Output() mappingComplete = new EventEmitter<MappingResult>();
    @Output() cancelled = new EventEmitter<void>();

    // Servicios inyectados
    private _http = inject(HttpClient);
    private _userService = inject(UserService);
    private _formBuilder = inject(FormBuilder);
    private _cdr = inject(ChangeDetectorRef);
    private _snackBar = inject(MatSnackBar);

    // Estados de carga
    isLoadingAssets = false;
    isLoadingClinics = false;
    isLoadingMappings = false;
    isSubmittingMapping = false;
    loadingProgress = 0;

    // Datos
    allAssets: MetaAsset[] = [];
    assetsByType: AssetsByType = {
        facebook_pages: [],
        instagram_business: [],
        ad_accounts: []
    };
    availableClinics: Clinic[] = [];
    existingMappings: ExistingMapping[] = [];

    // Estado del stepper
    stepperData: StepperData = {
        selectedAssets: [],
        selectedClinicIds: [],
        isLoading: false
    };

    // Formularios
    assetFormGroup: FormGroup;
    clinicFormGroup: FormGroup;
    confirmFormGroup: FormGroup;

    // Estado del stepper
    currentStep = 0;
    isLinear = true;

    constructor() {
        // Inicializar formularios
        this.assetFormGroup = this._formBuilder.group({
            selectedAssets: [[], Validators.required]
        });

        this.clinicFormGroup = this._formBuilder.group({
            selectedClinics: [[], Validators.required]
        });

        this.confirmFormGroup = this._formBuilder.group({
            confirmed: [false, Validators.requiredTrue]
        });
    }

    ngOnInit(): void {
        console.log('🚀 AssetMappingComponent ngOnInit iniciado');
        console.log('📋 Config recibida:', this.config);
        
        this.initializeForms();
        this.loadInitialData();
    }

    /**
     * Inicializar formularios
     */
    private initializeForms(): void {
        console.log('📝 Inicializando formularios...');
        // Los formularios ya están inicializados en el constructor
        console.log('✅ Formularios inicializados');
        this._cdr.detectChanges();
    }

    /**
     * Cargar datos iniciales
     */
    private async loadInitialData(): Promise<void> {
        console.log('🔄 Iniciando carga de datos...');
        this.stepperData.isLoading = true;
        this._cdr.detectChanges();

        try {
            // Cargar activos de Meta
            await this.loadMetaAssets();
            
            // Cargar clínicas disponibles
            await this.loadAvailableClinics();
            
            // Cargar mapeos existentes
            await this.loadExistingMappings();

        } catch (error) {
            console.error('❌ Error cargando datos iniciales:', error);
            this._snackBar.open(
                '❌ Error cargando datos. Por favor, recarga la página.',
                'Cerrar',
                { duration: 5000, panelClass: ['snackbar-error'] }
            );
        } finally {
            this.stepperData.isLoading = false;
            console.log('🏁 Estado de loading actualizado a false');
            this._cdr.detectChanges();
            console.log('✅ Carga de datos completada');
        }
    }

    /**
     * Cargar activos de Meta
     */
    private async loadMetaAssets(): Promise<void> {
        console.log('📡 Iniciando carga de activos Meta...');
        this.isLoadingAssets = true;
        this.loadingProgress = 0;
        this._cdr.detectChanges();

        try {
            console.log('📞 Realizando llamada HTTP...');
            const response = await this._http.get<any>('https://autenticacion.clinicaclick.com/oauth/meta/assets').toPromise();

            console.log('📥 Respuesta recibida:', response);

            if (response && response.success && response.assets) {
                console.log('✅ Respuesta válida, procesando activos...');
                this.processAssets(response.assets);
                this.loadingProgress = 100;
            } else {
                throw new Error('Respuesta inválida del servidor');
            }

        } catch (error) {
            console.error('❌ Error cargando activos Meta:', error);
            this.loadingProgress = 0;
            throw error;
        } finally {
            this.isLoadingAssets = false;
            console.log('🏁 isLoadingAssets actualizado a false');
            this._cdr.detectChanges();
        }
    }

    /**
     * Cargar clínicas disponibles
     */
    private async loadAvailableClinics(): Promise<void> {
        console.log('🏥 Cargando clínicas disponibles...');
        this.isLoadingClinics = true;
        this._cdr.detectChanges();

        try {
            // TODO: Implementar endpoint real de clínicas
            // Por ahora usamos datos mock
            this.availableClinics = [
                {
                    id: 1,
                    name: 'Clínica Central',
                    description: 'Clínica principal del centro de la ciudad',
                    location: 'Madrid, España',
                    isActive: true
                },
                {
                    id: 2,
                    name: 'Clínica Norte',
                    description: 'Sucursal en la zona norte',
                    location: 'Barcelona, España',
                    isActive: true
                },
                {
                    id: 3,
                    name: 'Clínica Sur',
                    description: 'Sucursal en la zona sur',
                    location: 'Valencia, España',
                    isActive: true
                }
            ];

            console.log('✅ Clínicas cargadas:', this.availableClinics.length);

        } catch (error) {
            console.error('❌ Error cargando clínicas:', error);
            this.availableClinics = [];
            throw error;
        } finally {
            this.isLoadingClinics = false;
            this._cdr.detectChanges();
        }
    }

    /**
     * Cargar mapeos existentes
     */
    private async loadExistingMappings(): Promise<void> {
        console.log('🔗 Cargando mapeos existentes...');
        this.isLoadingMappings = true;
        this._cdr.detectChanges();

        try {
            const response = await this._http.get<any>('https://autenticacion.clinicaclick.com/oauth/meta/mappings').toPromise();
            
            if (response && response.success && response.data && response.data.mappings) {
                this.existingMappings = response.data.mappings;
                console.log('✅ Mapeos existentes cargados:', this.existingMappings.length);
            } else {
                console.log('ℹ️ No hay mapeos existentes');
                this.existingMappings = [];
            }

        } catch (error) {
            console.error('❌ Error cargando mapeos existentes:', error);
            // No es crítico, continuamos sin mapeos existentes
            this.existingMappings = [];
        } finally {
            this.isLoadingMappings = false;
            this._cdr.detectChanges();
        }
    }

    /**
     * Procesar activos de Meta
     */
    private processAssets(assets: any): void {
        console.log('🔄 Procesando activos...');
        
        this.allAssets = [];
        this.assetsByType = {
            facebook_pages: [],
            instagram_business: [],
            ad_accounts: []
        };

        // Procesar páginas de Facebook
        if (assets.facebook_pages) {
            assets.facebook_pages.forEach((page: any) => {
                const asset: MetaAsset = {
                    id: page.id,
                    name: page.name,
                    type: 'facebook_page',
                    assetAvatarUrl: page.assetAvatarUrl,
                    category: page.category,
                    verification_status: page.verification_status,
                    followers_count: page.followers_count,
                    picture: page.picture,
                    additionalData: page.additionalData
                };
                this.allAssets.push(asset);
                this.assetsByType.facebook_pages.push(asset);
            });
        }

        // ✅ CORRECCIÓN CRÍTICA: Procesar cuentas de Instagram Business
        // El backend envía 'instagram_business' (no 'instagram_business_accounts')
        if (assets.instagram_business) {
            assets.instagram_business.forEach((ig: any) => {
                const asset: MetaAsset = {
                    id: ig.id,
                    name: ig.name,
                    type: 'instagram_business',
                    assetAvatarUrl: ig.assetAvatarUrl,
                    username: ig.username,
                    profile_picture_url: ig.profile_picture_url,
                    biography: ig.biography,
                    followers_count: ig.followers_count,
                    media_count: ig.media_count,
                    additionalData: ig.additionalData
                };
                this.allAssets.push(asset);
                this.assetsByType.instagram_business.push(asset);
            });
        }

        // Procesar cuentas publicitarias
        if (assets.ad_accounts) {
            assets.ad_accounts.forEach((ad: any) => {
                const asset: MetaAsset = {
                    id: ad.id,
                    name: ad.name,
                    type: 'ad_account',
                    currency: ad.currency,
                    account_status: ad.account_status,
                    timezone_name: ad.timezone_name,
                    business_name: ad.business_name,
                    additionalData: ad.additionalData
                };
                this.allAssets.push(asset);
                this.assetsByType.ad_accounts.push(asset);
            });
        }

        console.log('📊 Activos procesados:');
        console.log('  - Facebook Pages:', this.assetsByType.facebook_pages.length);
        console.log('  - Instagram Business:', this.assetsByType.instagram_business.length);
        console.log('  - Ad Accounts:', this.assetsByType.ad_accounts.length);

        this._cdr.detectChanges();
    }

    /**
     * Verificar si un activo está seleccionado
     */
    isAssetSelected(asset: MetaAsset): boolean {
        return this.stepperData.selectedAssets.some(a => a.id === asset.id);
    }

    /**
     * Manejar cambio de selección de activos
     */
    onAssetSelectionChange(asset: MetaAsset, selected: boolean): void {
        if (selected) {
            if (!this.isAssetSelected(asset)) {
                this.stepperData.selectedAssets.push(asset);
            }
        } else {
            this.stepperData.selectedAssets = this.stepperData.selectedAssets.filter(a => a.id !== asset.id);
        }

        // Actualizar formulario
        this.assetFormGroup.patchValue({
            selectedAssets: this.stepperData.selectedAssets
        });

        console.log('📱 Activos seleccionados:', this.stepperData.selectedAssets.length);
        this._cdr.detectChanges();
    }

    /**
     * Verificar si una clínica está seleccionada
     */
    isClinicSelected(clinicId: number): boolean {
        return this.stepperData.selectedClinicIds.includes(clinicId);
    }

    /**
     * Manejar cambio de selección de clínicas
     */
    onClinicSelectionChange(clinicId: number, selected: boolean): void {
        if (selected) {
            if (!this.isClinicSelected(clinicId)) {
                this.stepperData.selectedClinicIds.push(clinicId);
            }
        } else {
            this.stepperData.selectedClinicIds = this.stepperData.selectedClinicIds.filter(id => id !== clinicId);
        }

        // Actualizar formulario
        this.clinicFormGroup.patchValue({
            selectedClinics: this.stepperData.selectedClinicIds
        });

        console.log('🏥 Clínicas seleccionadas:', this.stepperData.selectedClinicIds.length);
        this._cdr.detectChanges();
    }

    /**
     * Verificar si un activo ya está mapeado
     */
    isAssetMapped(assetId: string, clinicId?: number): boolean {
        if (clinicId) {
            return this.existingMappings.some(m => m.assetId === assetId && m.clinicId === clinicId);
        }
        return this.existingMappings.some(m => m.assetId === assetId);
    }

    /**
     * Obtener clínicas donde está mapeado un activo
     */
    getAssetMappedClinics(assetId: string): number[] {
        return this.existingMappings
            .filter(m => m.assetId === assetId)
            .map(m => m.clinicId);
    }

    /**
     * Obtener mapeos existentes para una clínica
     */
    getExistingMappingsForClinic(clinicId: number): ExistingMapping[] {
        return this.existingMappings.filter(mapping => mapping.clinicId === clinicId);
    }

    /**
     * Métodos de utilidad para el template
     */
    getTotalAssetsCount(): number {
        return this.allAssets.length;
    }

    getSelectedAssetsCount(): number {
        return this.stepperData.selectedAssets.length;
    }

    getSelectedAssets(): MetaAsset[] {
        return this.stepperData.selectedAssets;
    }

    getSelectedClinicsCount(): number {
        return this.stepperData.selectedClinicIds.length;
    }

    getTotalMappingsToCreate(): number {
        return this.getSelectedAssetsCount() * this.getSelectedClinicsCount();
    }

    /**
     * Avanzar al siguiente paso
     */
    nextStep(): void {
        if (this.currentStep < 2) {
            this.currentStep++;
            console.log('➡️ Avanzando al paso:', this.currentStep + 1);
        }
    }

    /**
     * Retroceder al paso anterior
     */
    previousStep(): void {
        if (this.currentStep > 0) {
            this.currentStep--;
            console.log('⬅️ Retrocediendo al paso:', this.currentStep + 1);
        }
    }

    /**
     * Cancelar el mapeo
     */
    cancel(): void {
        console.log('❌ Mapeo cancelado por el usuario');
        this.cancelled.emit();
    }

    /**
     * Enviar mapeo al backend
     */
    async submitMapping(): Promise<void> {
        if (this.stepperData.selectedAssets.length === 0 || this.stepperData.selectedClinicIds.length === 0) {
            this._snackBar.open(
                '⚠️ Debes seleccionar al menos un activo y una clínica',
                'Cerrar',
                { duration: 5000, panelClass: ['snackbar-warning'] }
            );
            return;
        }

        console.log('🚀 Enviando mapeo al backend...');
        this.isSubmittingMapping = true;
        this._cdr.detectChanges();

        try {
            const mappingData = {
                assets: this.stepperData.selectedAssets.map(asset => ({
                    id: asset.id,
                    name: asset.name,
                    type: asset.type
                })),
                clinicaIds: this.stepperData.selectedClinicIds
            };

            console.log('📤 Datos de mapeo:', mappingData);

            const response = await this._http.post<any>(
                'https://autenticacion.clinicaclick.com/oauth/meta/map-assets',
                mappingData
            ).toPromise();

            if (response && response.success) {
                console.log('✅ Mapeo creado exitosamente');
                
                this._snackBar.open(
                    '✅ Activos mapeados correctamente',
                    'Cerrar',
                    { duration: 5000, panelClass: ['snackbar-success'] }
                );

                // Crear resultado del mapeo
                const mappings = this.createMappingResult();

                // Emitir evento de éxito
                this.mappingComplete.emit({
                    success: true,
                    mappings: mappings,
                    message: 'Mapeo completado exitosamente'
                });

                // Recargar mapeos existentes
                await this.loadExistingMappings();

            } else {
                throw new Error(response?.message || 'Error desconocido');
            }

        } catch (error) {
            console.error('❌ Error enviando mapeo:', error);
            
            this._snackBar.open(
                '❌ Error al crear el mapeo. Inténtalo de nuevo.',
                'Cerrar',
                { duration: 5000, panelClass: ['snackbar-error'] }
            );

            this.mappingComplete.emit({
                success: false,
                mappings: [],
                message: 'Error al crear el mapeo'
            });

        } finally {
            this.isSubmittingMapping = false;
            this._cdr.detectChanges();
        }
    }

    /**
     * Crear resultado de mapeo para el evento
     */
    private createMappingResult(): AssetMapping[] {
        const mappings: AssetMapping[] = [];

        this.stepperData.selectedAssets.forEach(asset => {
            this.stepperData.selectedClinicIds.forEach(clinicId => {
                const clinic = this.availableClinics.find(c => c.id === clinicId);
                if (clinic) {
                    mappings.push({
                        assetId: asset.id,
                        assetName: asset.name,
                        assetType: asset.type,
                        clinicId: clinicId,
                        clinicName: clinic.name
                    });
                }
            });
        });

        return mappings;
    }

    /**
     * Resetear selecciones
     */
    resetSelections(): void {
        this.stepperData.selectedAssets = [];
        this.stepperData.selectedClinicIds = [];
        this.currentStep = 0;
        
        this.assetFormGroup.reset();
        this.clinicFormGroup.reset();
        this.confirmFormGroup.reset();
        
        console.log('🔄 Selecciones reseteadas');
        this._cdr.detectChanges();
    }

    /**
     * Obtener icono para tipo de activo
     */
    getAssetTypeIcon(type: string): string {
        switch (type) {
            case 'facebook_page':
                return 'heroicons_solid:share';
            case 'instagram_business':
                return 'heroicons_solid:camera';
            case 'ad_account':
                return 'heroicons_solid:currency-dollar';
            default:
                return 'heroicons_solid:question-mark-circle';
        }
    }

    /**
     * Obtener color para tipo de activo
     */
    getAssetTypeColor(type: string): string {
        switch (type) {
            case 'facebook_page':
                return 'text-blue-600';
            case 'instagram_business':
                return 'text-pink-600';
            case 'ad_account':
                return 'text-green-600';
            default:
                return 'text-gray-600';
        }
    }

    /**
     * Track by function para ngFor - activos
     */
    trackByAssetId(index: number, asset: MetaAsset): string {
        return asset.id;
    }

    /**
     * Track by function para ngFor - clínicas
     */
    trackByClinicId(index: number, clinic: Clinic): number {
        return clinic.id;
    }
}

