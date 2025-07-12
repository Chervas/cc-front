// ARCHIVO DEFINITIVAMENTE CORREGIDO: src/app/modules/admin/pages/settings/shared/asset-mapping.component.ts
// ✅ ELIMINADO: loadExistingMappings() que causaba error 404
// ✅ AÑADIDO: onStepChange() para detectar paso 3

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
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
    pageAccessToken?: string; // ✅ AÑADIDO: Para páginas de Facebook
}

// ✅ INTERFACE ACTUALIZADA: Clínica con avatar y contact
export interface Clinic {
    id: number;
    name: string;
    description?: string;
    location?: string;
    isActive: boolean;
    avatar?: string;
    contact?: {
        address?: string;
        city?: string;
    };
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
    clinicName: string; // ✅ AÑADIDO: Propiedad clinicName
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

// ✅ NUEVAS INTERFACES PARA PASO 3
export interface MappingSummary {
    totalAssets: number;
    totalClinics: number;
    totalMappings: number;
    assetsByType: {
        facebook_pages: number;
        instagram_business: number;
        ad_accounts: number;
    };
    selectedAssets: MetaAsset[];
    selectedClinics: Clinic[];
}

export interface SubmissionData {
    clinicaId: number;
    selectedAssets: {
        id: string;
        name: string;
        type: string;
        assetAvatarUrl?: string;
        pageAccessToken?: string;
        additionalData?: any;
    }[];
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

    @Input() set existingMappings(mappings: any[]) {
        if (mappings && mappings.length > 0) {
            // Convertir metaMappings al formato ExistingMapping
            this._existingMappings = [];
            
            mappings.forEach(mapping => {
                // Procesar cada tipo de activo
                const clinicId = mapping.clinica?.id || mapping.clinica?.id_clinica;
                const clinicName = mapping.clinica?.nombre || mapping.clinica?.nombre_clinica || 'Clínica desconocida';
                
                // Facebook Pages
                if (mapping.assets?.facebook_pages) {
                    mapping.assets.facebook_pages.forEach(asset => {
                        this._existingMappings.push({
                            assetId: asset.metaAssetId,
                            assetName: asset.metaAssetName,
                            clinicId: clinicId,
                            clinicName: clinicName,
                            assetType: 'facebook_page'
                        });
                    });
                }
                
                // Instagram Business
                if (mapping.assets?.instagram_business) {
                    mapping.assets.instagram_business.forEach(asset => {
                        this._existingMappings.push({
                            assetId: asset.metaAssetId,
                            assetName: asset.metaAssetName,
                            clinicId: clinicId,
                            clinicName: clinicName,
                            assetType: 'instagram_business'
                        });
                    });
                }
                
                // Ad Accounts
                if (mapping.assets?.ad_accounts) {
                    mapping.assets.ad_accounts.forEach(asset => {
                        this._existingMappings.push({
                            assetId: asset.metaAssetId,
                            assetName: asset.metaAssetName,
                            clinicId: clinicId,
                            clinicName: clinicName,
                            assetType: 'ad_account'
                        });
                    });
                }
            });
            
            console.log('🔍 DEBUG - Converted existingMappings:', this._existingMappings);
        } else {
            this._existingMappings = [];
        }
    }

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
    private _existingMappings: ExistingMapping[] = [];

    // Getter para acceder a los mapeos existentes
    get existingMappings(): ExistingMapping[] {
        return this._existingMappings;
    }

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

    // ✅ NUEVAS PROPIEDADES PARA PASO 3
    mappingSummary: MappingSummary | null = null;
    submissionProgress = 0;
    submissionErrors: string[] = [];

    constructor() {
        // Inicializar formularios
        this.assetFormGroup = this._formBuilder.group({
            selectedAssets: [[], Validators.required]
        });

        this.clinicFormGroup = this._formBuilder.group({
            selectedClinics: [[], Validators.required]
        });

        this.confirmFormGroup = this._formBuilder.group({
            // ✅ CAMBIO MÍNIMO: Sin validación de checkbox
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
     * ✅ CORREGIDO: Cargar datos iniciales SIN mapeos existentes
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
            
            // ✅ ELIMINADO: Ya no cargamos mapeos existentes (causaba error 404)
            // await this.loadExistingMappings();

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
     * ✅ MÉTODO AÑADIDO: Manejar cambio de paso del stepper
     */
    onStepChange(event: any): void {
        const stepIndex = event.selectedIndex;
        console.log('📍 Cambio de paso detectado:', stepIndex);
        
        // Si llegamos al paso 3 (índice 2), generar resumen
        if (stepIndex === 2) {
            console.log('🎯 Llegando al paso 3, generando resumen...');
            this.mappingSummary = this.generateMappingSummary();
            console.log('📊 Resumen de mapeo generado:', this.mappingSummary);
            this._cdr.detectChanges();
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
                console.log('✅ Activos de Meta cargados correctamente');
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
     * ✅ MÉTODO ACTUALIZADO: Cargar clínicas reales desde el backend
     */
    private async loadAvailableClinics(): Promise<void> {
        console.log('🏥 Cargando clínicas disponibles...');
        this.isLoadingClinics = true;
        this._cdr.detectChanges();

        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('No hay token de acceso');
            }

            const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
            const response = await this._http.get<any>('https://autenticacion.clinicaclick.com/api/userclinicas/list', { headers }).toPromise();

            console.log('📥 Respuesta de clínicas recibida:', response);

            if (response && response.success) {
                this.availableClinics = response.clinicas.map((clinica: any) => ({
                    id: clinica.id,
                    name: clinica.name,
                    description: clinica.description,
                    location: clinica.contact?.address || clinica.contact?.city || '',
                    isActive: true,
                    avatar: clinica.avatar,
                    contact: clinica.contact
                }));

                console.log('✅ Clínicas procesadas:', this.availableClinics.length);
                console.log('📋 Clínicas disponibles:', this.availableClinics);
            } else {
                throw new Error('Respuesta inválida del servidor');
            }

        } catch (error) {
            console.error('❌ Error obteniendo clínicas:', error);
            this._snackBar.open('Error obteniendo clínicas', 'Cerrar', { duration: 5000 });
            this.availableClinics = [];
            throw error;
        } finally {
            this.isLoadingClinics = false;
            this._cdr.detectChanges();
        }
    }

    // ✅ ELIMINADO COMPLETAMENTE: método loadExistingMappings()

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
                    pageAccessToken: page.pageAccessToken, // ✅ AÑADIDO
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

    // ✅ MÉTODOS AÑADIDOS: Manejo de avatares de clínicas
    /**
     * Obtener iniciales del nombre de la clínica
     */
    getClinicInitials(name: string): string {
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    }

    /**
     * Verificar si la clínica tiene avatar
     */
    hasClinicAvatar(clinic: Clinic): boolean {
        return !!(clinic.avatar && clinic.avatar.trim() !== '');
    }

    /**
     * Obtener URL del avatar de la clínica
     */
    getClinicAvatarUrl(clinic: Clinic): string {
        return clinic.avatar || '';
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
        console.log('🔍 Debug getExistingMappingsForClinic:', {
            clinicId,
            existingMappings: this.existingMappings,
            filtered: this.existingMappings.filter(mapping => Number(mapping.clinicId) === Number(clinicId))
        });
        return this.existingMappings.filter(mapping => Number(mapping.clinicId) === Number(clinicId));
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

    // ✅ NUEVOS MÉTODOS PARA PASO 3

    /**
     * Generar resumen de mapeo para el paso 3
     */
    generateMappingSummary(): MappingSummary {
        const selectedClinics = this.availableClinics.filter(clinic => 
            this.stepperData.selectedClinicIds.includes(clinic.id)
        );

        const assetsByType = {
            facebook_pages: this.stepperData.selectedAssets.filter(a => a.type === 'facebook_page').length,
            instagram_business: this.stepperData.selectedAssets.filter(a => a.type === 'instagram_business').length,
            ad_accounts: this.stepperData.selectedAssets.filter(a => a.type === 'ad_account').length
        };

        return {
            totalAssets: this.stepperData.selectedAssets.length,
            totalClinics: this.stepperData.selectedClinicIds.length,
            totalMappings: this.getTotalMappingsToCreate(),
            assetsByType,
            selectedAssets: this.stepperData.selectedAssets,
            selectedClinics
        };
    }

    /**
     * Obtener clínicas seleccionadas
     */
    getSelectedClinics(): Clinic[] {
        return this.availableClinics.filter(clinic => 
            this.stepperData.selectedClinicIds.includes(clinic.id)
        );
    }

    /**
     * Obtener activos por tipo seleccionados
     */
    getSelectedAssetsByType(): AssetsByType {
        const result: AssetsByType = {
            facebook_pages: [],
            instagram_business: [],
            ad_accounts: []
        };

        this.stepperData.selectedAssets.forEach(asset => {
            if (asset.type === 'facebook_page') {
                result.facebook_pages.push(asset);
            } else if (asset.type === 'instagram_business') {
                result.instagram_business.push(asset);
            } else if (asset.type === 'ad_account') {
                result.ad_accounts.push(asset);
            }
        });

        return result;
    }

    /**
     * Validar selecciones antes del envío
     */
    validateSelections(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (this.stepperData.selectedAssets.length === 0) {
            errors.push('Debes seleccionar al menos un activo de Meta');
        }

        if (this.stepperData.selectedClinicIds.length === 0) {
            errors.push('Debes seleccionar al menos una clínica');
        }

        // Validar que las clínicas seleccionadas existan
        const invalidClinics = this.stepperData.selectedClinicIds.filter(id => 
            !this.availableClinics.some(clinic => clinic.id === id)
        );

        if (invalidClinics.length > 0) {
            errors.push(`Clínicas inválidas seleccionadas: ${invalidClinics.join(', ')}`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * ✅ MÉTODO AÑADIDO: Mapear tipo de activo para el backend
     */
    private mapAssetTypeForBackend(frontendType: string): string {
        switch (frontendType) {
            case 'facebook_page': return 'facebook_page';
            case 'instagram_business': return 'instagram_business';
            case 'ad_account': return 'ad_account';
            default: return frontendType;
        }
    }

    /**
     * Preparar datos para envío al backend
     */
    prepareSubmissionData(): SubmissionData[] {
        const submissionData: SubmissionData[] = [];

        this.stepperData.selectedClinicIds.forEach(clinicId => {
            const selectedAssets = this.stepperData.selectedAssets.map(asset => ({
                id: asset.id,
                name: asset.name,
                type: this.mapAssetTypeForBackend(asset.type), // ✅ MAPEO CORREGIDO
                assetAvatarUrl: asset.assetAvatarUrl,
                pageAccessToken: asset.pageAccessToken || null, // ✅ CORREGIDO: null en lugar de undefined
                additionalData: asset.additionalData,
                isActive: true // ✅ AÑADIDO: Campo requerido por el modelo
            }));

            submissionData.push({
                clinicaId: clinicId,
                selectedAssets
            });
        });

         console.log('📤 Datos preparados para envío:', submissionData);

        return submissionData;
    }

    /**
     * Avanzar al siguiente paso
     */
    nextStep(): void {
        if (this.currentStep < 2) {
            this.currentStep++;
            console.log('➡️ Avanzando al paso:', this.currentStep + 1);
            
            // Si llegamos al paso 3, generar resumen
            if (this.currentStep === 2) {
                this.mappingSummary = this.generateMappingSummary();
                console.log('📊 Resumen de mapeo generado:', this.mappingSummary);
            }
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
     * ✅ MÉTODO MEJORADO: Enviar mapeo al backend
     */
    async submitMapping(): Promise<void> {
        console.log('🚀 Iniciando proceso de envío de mapeo...');

        // Validar selecciones
        const validation = this.validateSelections();
        if (!validation.isValid) {
            console.error('❌ Validación fallida:', validation.errors);
            this._snackBar.open(
                `⚠️ ${validation.errors.join('. ')}`,
                'Cerrar',
                { duration: 5000, panelClass: ['snackbar-warning'] }
            );
            return;
        }

        this.isSubmittingMapping = true;
        this.submissionProgress = 0;
        this.submissionErrors = [];
        this._cdr.detectChanges();

        try {
            const submissionData = this.prepareSubmissionData();
            console.log('📤 Datos preparados para envío:', submissionData);

            let successfulSubmissions = 0;
            const totalSubmissions = submissionData.length;

            // Enviar mapeos para cada clínica
            for (let i = 0; i < submissionData.length; i++) {
                const data = submissionData[i];
                console.log(`📤 Enviando mapeo ${i + 1}/${totalSubmissions} para clínica ${data.clinicaId}...`);

                try {
                    const response = await this._http.post<any>(
                        'https://autenticacion.clinicaclick.com/oauth/meta/map-assets',
                        data
                    ).toPromise();

                    // 🔍 DEBUG: Logs para entender la respuesta
                    console.log('🔍 DEBUG - Respuesta completa:', response);
                    console.log('🔍 DEBUG - response.message:', response?.message);
                    console.log('🔍 DEBUG - response.assets:', response?.assets);
                    console.log('🔍 DEBUG - Validación response && response.message:', !!(response && response.message));
                    console.log('🔍 DEBUG - Validación response.assets:', !!response?.assets);

                    // ✅ CORREGIDO: El backend responde con message y assets, no con success
                    if (response && response.message && response.assets) {
                        successfulSubmissions++;
                        console.log(`✅ Mapeo ${i + 1} enviado exitosamente: ${response.message}`);
                    } else {
                        const error = `Error en clínica ${data.clinicaId}: ${response?.message || 'Error desconocido'}`;
                        this.submissionErrors.push(error);
                        console.error(`❌ ${error}`);
                    }
                } catch (error) {
                    const errorMsg = `Error enviando mapeo para clínica ${data.clinicaId}: ${error}`;
                    this.submissionErrors.push(errorMsg);
                    console.error(`❌ ${errorMsg}`);
                }

                // Actualizar progreso
                this.submissionProgress = Math.round(((i + 1) / totalSubmissions) * 100);
                this._cdr.detectChanges();
            }

            // Evaluar resultado final
            if (successfulSubmissions === totalSubmissions) {
                console.log('✅ Todos los mapeos enviados exitosamente');
                
                this._snackBar.open(
                    `✅ ${this.getTotalMappingsToCreate()} mapeos creados exitosamente`,
                    'Cerrar',
                    { duration: 5000, panelClass: ['snackbar-success'] }
                );

                // Crear resultado del mapeo
                const mappings = this.createMappingResult();

                // Emitir evento de éxito
                this.mappingComplete.emit({
                    success: true,
                    mappings: mappings,
                    message: `${successfulSubmissions} mapeos completados exitosamente`
                });

                // ✅ ELIMINADO: Ya no recargamos mapeos existentes
                // await this.loadExistingMappings();

            } else if (successfulSubmissions > 0) {
                console.log(`⚠️ Mapeos parcialmente exitosos: ${successfulSubmissions}/${totalSubmissions}`);
                
                this._snackBar.open(
                    `⚠️ ${successfulSubmissions}/${totalSubmissions} mapeos completados. Revisa los errores.`,
                    'Cerrar',
                    { duration: 7000, panelClass: ['snackbar-warning'] }
                );

                // Emitir evento de éxito parcial
                this.mappingComplete.emit({
                    success: false,
                    mappings: this.createMappingResult(),
                    message: `Mapeos parcialmente completados: ${this.submissionErrors.join('. ')}`
                });

            } else {
                console.error('❌ Todos los mapeos fallaron');
                
                this._snackBar.open(
                    '❌ Error al crear los mapeos. Revisa los errores e inténtalo de nuevo.',
                    'Cerrar',
                    { duration: 7000, panelClass: ['snackbar-error'] }
                );

                this.mappingComplete.emit({
                    success: false,
                    mappings: [],
                    message: `Error en todos los mapeos: ${this.submissionErrors.join('. ')}`
                });
            }

        } catch (error) {
            console.error('❌ Error general enviando mapeos:', error);
            
            this._snackBar.open(
                '❌ Error inesperado al crear los mapeos. Inténtalo de nuevo.',
                'Cerrar',
                { duration: 5000, panelClass: ['snackbar-error'] }
            );

            this.mappingComplete.emit({
                success: false,
                mappings: [],
                message: `Error inesperado: ${error}`
            });

        } finally {
            this.isSubmittingMapping = false;
            this.submissionProgress = 100;
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
        this.mappingSummary = null;
        this.submissionProgress = 0;
        this.submissionErrors = [];
        
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
     * Obtener nombre legible del tipo de activo
     */
    getAssetTypeDisplayName(type: string): string {
        switch (type) {
            case 'facebook_page':
                return 'Página de Facebook';
            case 'instagram_business':
                return 'Cuenta de Instagram Business';
            case 'ad_account':
                return 'Cuenta Publicitaria';
            default:
                return 'Activo desconocido';
        }
    }

    /**
     * Verificar si hay errores de envío
     */
    hasSubmissionErrors(): boolean {
        return this.submissionErrors.length > 0;
    }

    /**
     * Obtener errores de envío
     */
    getSubmissionErrors(): string[] {
        return this.submissionErrors;
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

    /**
     * ✅ NUEVO: Verifica si se puede enviar el mapeo (sin checkbox)
     */
    canSubmitMapping(): boolean {
        return this.stepperData.selectedAssets.length > 0 &&
               this.stepperData.selectedClinicIds.length > 0 &&
               !this.isSubmittingMapping;
    }

    /**
     * ✅ NUEVO: Obtiene una clínica por su ID
     */
    getClinicById(clinicId: number): Clinic | undefined {
        return this.availableClinics.find(clinic => clinic.id === clinicId);
    }

    /**
     * Track by function para ngFor - errores
     */
    trackByErrorIndex(index: number, error: string): number {
        return index;
    }
}

