export interface ServiciosAsignadosProduct {
    id_servicio_asignado: number;
    id_clinica: number;
    nombre_clinica: string;
    id_servicio: number;
    nombre_servicio: string;
    descripcion_servicio: string;
    descripcion_detallada_servicio: string;
    precio_servicio: number;
    iva_servicio: number;
    servicio_recurrente: boolean;
    fecha_cobro: Date;
    precio_especial: boolean;
    empresa_servicio: string;
    estado_servicio: 'activo' | 'pausa' | 'pausado hasta fecha';
    fecha_pausa?: Date;
    datos_fiscales_clinica: {
        denominacion_social: string;
        cif_nif: string;
        direccion_facturacion: string;
    };
    mes_cerrado: boolean; // Añadir este campo
}

export interface ServiciosAsignadosPagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}
