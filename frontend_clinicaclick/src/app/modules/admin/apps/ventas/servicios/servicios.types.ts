export interface ServiciosProduct {
    id_servicio: number;
    nombre_servicio: string;
    descripcion_servicio: string;
    precio_servicio: number;
    iva_servicio: number;
    categoria_servicio: 'SEO' | 'Redes Sociales' | 'Gestión publicitaria' | 'Inversión publicitaria' | 'Desarrollo web' | 'Diseño gráfico y cartelería' | 'Mentoría';
    empresa_servicio: 'La voz medios digitales SL' | 'Parallel Campaign OU';
}

export interface ServiciosPagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}
