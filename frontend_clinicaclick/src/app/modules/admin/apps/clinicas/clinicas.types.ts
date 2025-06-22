export interface Clinica {
    id_clinica: string;
    url_web: string;
    url_avatar?: string | null;
    url_fondo?: string | null;
    url_ficha_local?: string | null;
    nombre_clinica: string;
    fecha_creacion: Date;
    id_publicidad_meta?: number;
    url_publicidad_meta?: number;
    filtro_pc_meta?: number;
    id_publicidad_google?: number;
    url_publicidad_google?: number;
    filtro_pc_google?: number;
    servicios: string;
    checklist?: string;
    estado_clinica?: boolean; 
    datos_fiscales_clinica?: {
        denominacion_social: string;
        cif_nif: string;
        direccion_facturacion: string;
    };
    grupoClinica?: GroupClinica; // Asociación opcional con GrupoClinica
}

export interface GroupClinica {
    id_grupo: string;
    nombre_grupo: string;
}

export interface CreateClinicaResponse {
    message: string;
    clinica: Clinica;
}
