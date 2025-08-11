// Tipos para la vista de Paneles

export interface PanelData {
    id_clinica: number;
    nombre_clinica: string;
    periodo: string;
    fecha_inicio: string;
    fecha_fin: string;
}


export interface ResumenMetricas {
    total_pacientes: number;
    citas_mes: number;
    ingresos_mes: number;
    satisfaccion_promedio: number;
    crecimiento_pacientes: number;
    crecimiento_ingresos: number;
}

export interface RedesSocialesMetricas {
    facebook: {
        seguidores: number;
        alcance_mes: number;
        interacciones: number;
        crecimiento_seguidores: number;
        posts_mes: number;
        engagement_rate: number;
    };
    instagram: {
        seguidores: number;
        alcance_mes: number;
        interacciones: number;
        crecimiento_seguidores: number;
        posts_mes: number;
        engagement_rate: number;
    };
    tiktok: {
        seguidores: number;
        visualizaciones: number;
        likes: number;
        crecimiento_seguidores: number;
        videos_mes: number;
        engagement_rate: number;
    };
    linkedin: {
        seguidores: number;
        impresiones: number;
        interacciones: number;
        crecimiento_seguidores: number;
        posts_mes: number;
        engagement_rate: number;
    };
    doctoralia: {
        valoracion: number;
        resenas_mes: number;
        visitas_perfil: number;
        citas_generadas: number;
        posicion_ranking: number;
    };
}

export interface WebMetricas {
    visitas_mes: number;
    usuarios_unicos: number;
    tiempo_promedio_sesion: number;
    tasa_rebote: number;
    paginas_por_sesion: number;
    conversiones: number;
    tasa_conversion: number;
    fuentes_trafico: {
        organico: number;
        directo: number;
        redes_sociales: number;
        referidos: number;
        pago: number;
    };
    dispositivos: {
        desktop: number;
        mobile: number;
        tablet: number;
    };
}

export interface PublicidadMetricas {
    google_ads: {
        impresiones: number;
        clics: number;
        ctr: number;
        cpc_promedio: number;
        gasto_total: number;
        conversiones: number;
        costo_conversion: number;
        quality_score: number;
    };
    meta_ads: {
        impresiones: number;
        clics: number;
        ctr: number;
        cpc_promedio: number;
        gasto_total: number;
        conversiones: number;
        costo_conversion: number;
        alcance: number;
    };
    presupuesto_total: number;
    roi: number;
    citas_generadas: number;
    costo_por_cita: number;
}

export interface NotificacionesTareas {
    notificaciones: {
        total: number;
        sin_leer: number;
        tipos: {
            citas: number;
            pagos: number;
            marketing: number;
            sistema: number;
        };
    };
    tareas: {
        total: number;
        pendientes: number;
        vencidas: number;
        completadas_hoy: number;
        tipos: {
            seguimiento_pacientes: number;
            marketing: number;
            administrativas: number;
            medicas: number;
        };
    };
}

export interface DashboardData {
    panel_data: PanelData;
    resumen: ResumenMetricas;
    redes_sociales: RedesSocialesMetricas;
    web: WebMetricas;
    publicidad: PublicidadMetricas;
    notificaciones_tareas: NotificacionesTareas;
}

export interface UsuarioInfo {
    nombre: string;
    apellidos: string;
    rol: string;
    clinica_actual: {
        id_clinica: number;
        nombre_clinica: string;
    };
}

// Tipos para widgets específicos
export interface WidgetConfig {
    id: string;
    titulo: string;
    tipo: 'numero' | 'grafico' | 'lista' | 'progreso' | 'comparacion';
    datos: any;
    configuracion?: {
        color?: string;
        icono?: string;
        formato?: string;
        mostrar_tendencia?: boolean;
    };
}

export interface GraficoData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string;
        borderColor?: string;
        fill?: boolean;
    }[];
}

export interface TendenciaData {
    valor_actual: number;
    valor_anterior: number;
    porcentaje_cambio: number;
    direccion: 'up' | 'down' | 'neutral';
    periodo_comparacion: string;
}

