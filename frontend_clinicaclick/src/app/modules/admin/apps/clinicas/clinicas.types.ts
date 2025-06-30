export interface Clinica {
    id_clinica: string;
    url_web: string;
    url_avatar?: string | null;
    url_fondo?: string | null;
    url_ficha_local?: string | null;
    nombre_clinica: string;
    fecha_creacion: Date;
    
    // Información de contacto
    telefono?: string;
    email?: string;
    descripcion?: string;
    
    // Dirección
    direccion?: string;
    codigo_postal?: string;
    ciudad?: string;
    provincia?: string;
    pais?: string;
    
    // Horarios y servicios
    horario_atencion?: string;
    servicios: string;
    checklist?: string;
    estado_clinica?: boolean;
    
    // Redes sociales
    redes_sociales?: {
        instagram?: string;
        facebook?: string;
        tiktok?: string;
        linkedin?: string;
        doctoralia?: string;
    };
    
    // Configuración
    configuracion?: {
        citas_online?: boolean;
        notificaciones_email?: boolean;
        notificaciones_sms?: boolean;
    };
    
    // Marketing
    id_publicidad_meta?: number;
    url_publicidad_meta?: number;
    filtro_pc_meta?: number;
    id_publicidad_google?: number;
    url_publicidad_google?: number;
    filtro_pc_google?: number;
    
    // Datos fiscales
    datos_fiscales_clinica?: {
        denominacion_social: string;
        cif_nif: string;
        direccion_facturacion: string;
    };
    
    // Asociación opcional con GrupoClinica
    grupoClinica?: GroupClinica;
}

export interface GroupClinica {
    id_grupo: string;
    nombre_grupo: string;
}

export interface CreateClinicaResponse {
    message: string;
    clinica: Clinica;
}

// ✅ NUEVO: Tipo para respuesta de actualización
export interface UpdateClinicaResponse {
    message: string;
    clinica: Clinica;
}

// ✅ CORRECCIÓN: Tipo para datos de formulario de clínica
export interface ClinicaFormData {
    nombre_clinica: string;
    telefono?: string;
    email?: string;
    url_web?: string;
    descripcion?: string;
    direccion?: string;
    codigo_postal?: string;
    ciudad?: string;
    provincia?: string;
    pais?: string;
    horario_atencion?: string;
    servicios?: string;
    estado_clinica?: boolean;
    url_avatar?: string;
    url_fondo?: string;
    url_ficha_local?: string;
    redes_sociales?: {
        instagram?: string;
        facebook?: string;
        tiktok?: string;
        linkedin?: string;
        doctoralia?: string;
    };
    configuracion?: {
        citas_online?: boolean;
        notificaciones_email?: boolean;
        notificaciones_sms?: boolean;
    };
    id_publicidad_meta?: number;
    url_publicidad_meta?: number;
    filtro_pc_meta?: number;
    id_publicidad_google?: number;
    url_publicidad_google?: number;
    filtro_pc_google?: number;
}

