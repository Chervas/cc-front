export interface HistorialDeServiciosProduct {
    id_servicio_asignado: number;
    fecha_cobro: Date;
    id_clinica: number;
    nombre_clinica: string;
    id_servicio: number; // Añadido
    nombre_servicio: string; // Añadido
    descripcion_servicio: string; // Añadido
    descripcion_detallada_servicio: string;
    precio_servicio: number;
    iva_servicio: number;
    servicio_recurrente: boolean;
    num_factura_asociada?: string;
    empresa_servicio: string;
    incluir_en_factura: boolean;
    precio_especial: boolean;
    datos_fiscales_clinica: {
        denominacion_social: string;
        cif_nif: string;
        direccion_facturacion: string;
    };
    selected?: boolean;
}


export interface HistorialDeServiciosPagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
    products: HistorialDeServiciosProduct[];
}
