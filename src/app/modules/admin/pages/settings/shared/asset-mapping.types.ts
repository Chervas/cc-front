// cc-front/src/app/modules/admin/pages/settings/shared/components/asset-mapping/asset-mapping.types.ts

export interface MetaAsset {
    id: string;
    name: string;
    type: 'facebook_page' | 'instagram_business' | 'ad_account';
    
    // Campos de imagen/avatar
    assetAvatarUrl?: string;
    picture?: {
        data?: {
            url: string;
        };
    };
    profile_picture_url?: string;
    
    // Campos específicos de Facebook Pages
    category?: string;
    verification_status?: 'verified' | 'unverified' | 'pending';
    followers_count?: number;
    page_access_token?: string;
    
    // Campos específicos de Instagram Business
    username?: string;
    biography?: string;
    media_count?: number;
    linked_facebook_page?: string;
    
    // Campos específicos de Ad Accounts
    account_status?: 'ACTIVE' | 'PENDING' | 'DISABLED' | 'UNSETTLED';
    currency?: string;
    timezone_name?: string;
    business_name?: string;
    
    // Datos adicionales
    additionalData?: {
        [key: string]: any;
    };
}

export interface Clinic {
    id: number;
    nombre: string;
    descripcion?: string;
    activa: boolean;
}

export interface AssetMapping {
    assetId: string;
    assetName: string;
    assetType: MetaAsset['type'];
    clinicIds: number[];
}

export interface MappingResult {
    success: boolean;
    message: string;
    mappedAssets: number;
    errors?: string[];
}

export interface AssetsByType {
    facebook_pages: MetaAsset[];
    instagram_business: MetaAsset[];
    ad_accounts: MetaAsset[];
}

export interface StepperData {
    selectedAssets: MetaAsset[];
    mappings: AssetMapping[];
    availableClinics: Clinic[];
    isLoading: boolean;
    currentStep: number;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

// Tipos para configuración del componente
export type AssetMappingMode = 'full-mapping' | 'clinic-specific' | 'asset-selection';

export interface AssetMappingConfig {
    mode: AssetMappingMode;
    allowMultipleAssets: boolean;
    allowMultipleClinics: boolean;
    showAsModal: boolean;
    preselectedClinicId?: number;
    title: string;
    subtitle: string;
}

// Tipos para diferentes contextos de uso
export interface FullMappingConfig extends AssetMappingConfig {
    mode: 'full-mapping';
    allowMultipleAssets: true;
    allowMultipleClinics: true;
}

export interface ClinicSpecificConfig extends AssetMappingConfig {
    mode: 'clinic-specific';
    preselectedClinicId: number;
    allowMultipleClinics: false;
}

export interface AssetSelectionConfig extends AssetMappingConfig {
    mode: 'asset-selection';
    allowMultipleClinics: false;
}