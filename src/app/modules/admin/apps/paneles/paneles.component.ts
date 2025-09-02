import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    AfterViewInit,
    ViewEncapsulation,
    ViewChild,
} from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { PanelesService } from './paneles.service';
import { ApexOptions, NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import { Subject, takeUntil } from 'rxjs';
import { ClinicFilterService } from 'app/core/services/clinic-filter-service';
import { RoleService, UsuarioClinicaResponse } from 'app/core/services/role.service';
import { RedesSocialesMetricas } from './paneles.types';
import { CommonModule } from '@angular/common';


@Component({
    selector: 'paneles',
    templateUrl: './paneles.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: true,
    imports: [
        TranslocoModule,
        MatIconModule,
        MatButtonModule,
        MatRippleModule,
        MatMenuModule,
        MatTabsModule,
        MatButtonToggleModule,
        NgApexchartsModule,
        MatTableModule,
        NgClass,
        CurrencyPipe,
        CommonModule,
        MatDialogModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatInputModule,
        MatSnackBarModule
    ],
})
export class PanelesComponent implements OnInit, AfterViewInit, OnDestroy {
    chartGithubIssues: ApexOptions = {};
    chartTaskDistribution: ApexOptions = {};
    chartBudgetDistribution: ApexOptions = {};
    chartWeeklyExpenses: ApexOptions = {};
    chartMonthlyExpenses: ApexOptions = {};
    chartYearlyExpenses: ApexOptions = {};
    isRedesSocialesTabActive: boolean = false;
    currentTabIndex: number = 0;
    data: any;
    selectedProject: string = 'ACME Corp. Backend App';
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // NUEVAS PROPIEDADES PARA MÉTRICAS
    metricas: Partial<RedesSocialesMetricas> | null = null;
    loadingMetricas: boolean = false;
    selectedClinicaId: number | null = null;
    selectedClinicaFilter: string | number | null = null;
    selectedClinicaDisplay: string = 'Todas';
    errorMetricas: string | null = null;

    // Métricas procesadas por plataforma
    facebookMetrics: RedesSocialesMetricas['facebook'] | null = null;
    instagramMetrics: RedesSocialesMetricas['instagram'] | null = null;
    tiktokMetrics: RedesSocialesMetricas['tiktok'] | null = null;
    linkedinMetrics: RedesSocialesMetricas['linkedin'] | null = null;
    hasMetricasData: boolean = false;
    datosCargados: boolean = false;
    vinculaciones = { instagram: false, facebook: false, tiktok: false, google: false };
    // ---- Analytics (Orgánico vs Pago) ----
    analyticsPlatform: 'instagram'|'facebook'|'tiktok' = 'instagram';
    analyticsStart: Date = new Date(new Date().setDate(new Date().getDate() - 30));
    analyticsEnd: Date = new Date();
    chartOrganicPaid: ApexOptions = {
        chart: { type: 'area', height: 320, animations: { enabled: false }, toolbar: { show: false }, fontFamily: 'inherit', foreColor: 'inherit' },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: { type: 'datetime' },
        yaxis: { labels: { formatter: (v: number) => this.formatNumber(v) } },
        grid: { borderColor: 'var(--fuse-border)' },
        colors: ['#64748b','#22c55e','#3b82f6'],
        series: []
    };
    postsListado: any[] = [];
    postsTotal: number = 0;

        @ViewChild('facebookChart') facebookChart!: ChartComponent;
    
    // ViewChild para las 3 gráficas superiores
    @ViewChild('instagramOverviewChart') instagramOverviewChart!: ChartComponent;
    @ViewChild('tiktokOverviewChart') tiktokOverviewChart!: ChartComponent;
    @ViewChild('facebookOverviewChart') facebookOverviewChart!: ChartComponent;

    // Configuración del gráfico de seguidores Facebook (existente)
    chartSeguidoresFacebook: ApexOptions = {};
    
    // Configuraciones para las 3 gráficas superiores
   // 🎨 CONFIGURACIÓN EXACTA BASADA EN EL CÓDIGO FUENTE DE FUSE ANALYTICS
// Copiada directamente del repositorio oficial de Fuse

// 📱 INSTAGRAM - Configuración exacta de Fuse Visitors
chartInstagramOverview: ApexOptions = {
    chart: {
        animations: {
            speed: 400,
            animateGradually: {
                enabled: false,
            },
        },
        fontFamily: 'inherit',
        foreColor: 'inherit',
        width: '100%',
        height: '100%',
        type: 'area',
        toolbar: {
            show: false,
        },
        zoom: {
            enabled: false,
        },
        locales: [{
    name: 'es',
    options: {
        months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
        shortMonths: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        shortDays: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    }
}],
defaultLocale: 'es',
    },
    colors: ['#818CF8'], // Color exacto de Fuse
    dataLabels: {
        enabled: false,
    },
    fill: {
        colors: ['#312E81'], // ✅ CLAVE: Solo color, sin type: 'gradient'
    },
    grid: {
        show: true,
        borderColor: '#334155', // Color exacto de Fuse
        padding: {
            top: 10,
            bottom: -40, // ✅ CLAVE: Padding negativo para que llegue al borde
            left: 0,
            right: 0,
        },
        position: 'back',
        xaxis: {
            lines: {
                show: true,
            },
        },
    },
    series: [{
        name: 'Seguidores Instagram',
        data: []
    }],
    stroke: {
        width: 2, 
        curve: 'smooth'
    },
    tooltip: {
        followCursor: true,
        theme: 'dark',
        x: {
            format: 'MMM dd, yyyy', // ✅ Formato exacto de Fuse
        },
        y: {
            formatter: (value: number): string => `${value}`,
        },
    },
    xaxis: {
        axisBorder: {
            show: false,
        },
        axisTicks: {
            show: false,
        },
        crosshairs: {
            stroke: {
                color: '#475569',
                dashArray: 0,
                width: 2,
            },
        },
        labels: {
            offsetY: -20, 
            style: {
                colors: '#CBD5E1', // ✅ Color exacto de Fuse
            },
        },
        tickAmount: 20, 
        tooltip: {
            enabled: false,
        },
        type: 'datetime',
    },
    yaxis: {
        axisTicks: {
            show: false,
        },
        axisBorder: {
            show: false,
        },
        min: (min): number => min - 750,
        max: (max): number => max + 250,
        tickAmount: 5,
        show: false,
    },
};

// 🎵 TIKTOK - Configuración exacta de Fuse Visitors
chartTiktokOverview: ApexOptions = {
    chart: {
        animations: {
            speed: 400,
            animateGradually: {
                enabled: false,
            },
        },
        fontFamily: 'inherit',
        foreColor: 'inherit',
        width: '100%',
        height: '100%',
        type: 'area',
        toolbar: {
            show: false,
        },
        zoom: {
            enabled: false,
        },
        locales: [{
    name: 'es',
    options: {
        months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
        shortMonths: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        shortDays: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    }
}],
defaultLocale: 'es',
    },
    colors: ['#818CF8'], // Color exacto de Fuse
    dataLabels: {
        enabled: false,
    },
    fill: {
        colors: ['#312E81'], // ✅ CLAVE: Solo color, sin type: 'gradient'
    },
    grid: {
        show: true,
        borderColor: '#334155', // Color exacto de Fuse
        padding: {
            top: 10,
            bottom: -40, // ✅ CLAVE: Padding negativo para que llegue al borde
            left: 0,
            right: 0,
        },
        position: 'back',
        xaxis: {
            lines: {
                show: true,
            },
        },
    },
    series: [{
        name: 'Seguidores TikTok',
        data: []
    }],
    stroke: {
        width: 2, 
        curve: 'smooth'
    },
    tooltip: {
        followCursor: true,
        theme: 'dark',
        x: {
            format: 'MMM dd, yyyy', // ✅ Formato exacto de Fuse
        },
        y: {
            formatter: (value: number): string => `${value}`,
        },
    },
    xaxis: {
        axisBorder: {
            show: false,
        },
        axisTicks: {
            show: false,
        },
        crosshairs: {
            stroke: {
                color: '#475569',
                dashArray: 0,
                width: 2,
            },
        },
        labels: {
            offsetY: -20, // ✅ CLAVE: Offset exacto de Fuse
            style: {
                colors: '#CBD5E1', // ✅ Color exacto de Fuse
            },
        },
        tickAmount: 20, // ✅ CLAVE: Cantidad exacta de Fuse
        tooltip: {
            enabled: false,
        },
        type: 'datetime',
    },
    yaxis: {
        axisTicks: {
            show: false,
        },
        axisBorder: {
            show: false,
        },
        min: (min): number => min - 750,
        max: (max): number => max + 250,
        tickAmount: 5,
        show: false,
    },
};

// 📘 FACEBOOK - Configuración exacta de Fuse Visitors
chartFacebookOverview: ApexOptions = {
    chart: {
        animations: {
            speed: 400,
            animateGradually: {
                enabled: false,
            },
        },
        fontFamily: 'inherit',
        foreColor: 'inherit',
        width: '100%',
        height: '100%',
        type: 'area',
        toolbar: {
            show: false,
        },
        zoom: {
            enabled: false,
        },
        locales: [{
    name: 'es',
    options: {
        months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
        shortMonths: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        shortDays: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    }
}],
defaultLocale: 'es',
    },
    colors: ['#818CF8'], // Color exacto de Fuse
    dataLabels: {
        enabled: false,
    },
    fill: {
        colors: ['#312E81'], // ✅ CLAVE: Solo color, sin type: 'gradient'
    },
    grid: {
        show: true,
        borderColor: '#334155', // Color exacto de Fuse
        padding: {
            top: 10,
            bottom: -40, // ✅ CLAVE: Padding negativo para que llegue al borde
            left: 0,
            right: 0,
        },
        position: 'back',
        xaxis: {
            lines: {
                show: true,
            },
        },
    },
    series: [{
        name: 'Seguidores Facebook',
        data: []
    }],
    stroke: {
        width: 2, 
        curve: 'smooth'
    },
    tooltip: {
        followCursor: true,
        theme: 'dark',
        x: {
            format: 'MMM dd, yyyy', // ✅ Formato exacto de Fuse
        },
        y: {
            formatter: (value: number): string => `${value}`,
        },
    },
    xaxis: {
        axisBorder: {
            show: false,
        },
        axisTicks: {
            show: false,
        },
        crosshairs: {
            stroke: {
                color: '#475569',
                dashArray: 0,
                width: 2,
            },
        },
        labels: {
            offsetY: -20, // ✅ CLAVE: Offset exacto de Fuse
            style: {
                colors: '#CBD5E1', // ✅ Color exacto de Fuse
            },
        },
        tickAmount: 20, // ✅ CLAVE: Cantidad exacta de Fuse
        tooltip: {
            enabled: false,
        },
        type: 'datetime',
    },
    yaxis: {
        axisTicks: {
            show: false,
        },
        axisBorder: {
            show: false,
        },
        min: (min): number => min - 750,
        max: (max): number => max + 250,
        tickAmount: 5,
        show: false,
    },
};





    
    // Selector de tiempo para las gráficas superiores
    selectedTimeRange: string = 'this-year';
    
    // Datos mock para porcentajes de crecimiento
    growthPercentages = {
        instagram: 20,
        tiktok: 25,
        facebook: 15
    };



    /**
     * Constructor
     */
    constructor(
        private _panelesService: PanelesService,
        private _router: Router,
        private _cdr: ChangeDetectorRef,
        private _clinicFilter: ClinicFilterService,
        private _roleService: RoleService,
        private _dialog: MatDialog,
        private _snackBar: MatSnackBar,
    ) {}

    // --------------------------------------------
    // @ Lifecycle hooks
    // --------------------------------------------

    /**
     * On init
     */
ngOnInit(): void {
        // Restaurar pestaña si está guardada
        try {
            const savedIndex = localStorage.getItem('paneles_tab_index');
            if (savedIndex !== null) {
                const idx = parseInt(savedIndex, 10);
                if (!isNaN(idx)) {
                    this.currentTabIndex = idx;
                    this.isRedesSocialesTabActive = (idx === 1);
                }
            }
        } catch {}
        // Get the data
        this._panelesService.data$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((data) => {
                // Store the data
                this.data = data;

                // Prepare the chart data
                this._prepareChartData();

                // Inicializar configuración del gráfico de Facebook
                this.chartSeguidoresFacebook = {
                    chart: {
                        fontFamily: 'inherit',
                        foreColor: 'inherit',
                        height: '100%',
                        type: 'line',
                        toolbar: {
                            show: false,
                        },
                    },
                    colors: ['#1877F2'],
                    dataLabels: {
                        enabled: false,
                    },
                    grid: {
                        borderColor: 'var(--fuse-border)',
                        strokeDashArray: 3,
                    },
                    series: [
                        {
                            name: 'Seguidores',
                            data: []
                        }
                    ],
                    stroke: {
                        width: 2,
                        curve: 'smooth',
                    },
                    tooltip: {
                        theme: 'dark',
                        y: {
                            formatter: (value) => {
                                return this.formatNumber(value) + ' seguidores';
                            },
                        },
                    },
                    xaxis: {
                        type: 'datetime',
                        categories: [],
                        axisBorder: {
                            show: false,
                        },
                        axisTicks: {
                            show: false,
                        },
                    },
                    yaxis: {
                        labels: {
                            formatter: (value) => {
                                return this.formatNumber(value);
                            },
                        },
                    },
                    noData: {
                        text: 'Sin datos'
                    },
                };
                // Attach SVG fill fixer to all ApexCharts
                window['Apex'] = {
                    chart: {
                        events: {
                            mounted: (chart: any, options?: any): void => {
                                this._fixSvgFill(chart.el);
                            },
                            updated: (chart: any, options?: any): void => {
                                this._fixSvgFill(chart.el);
                            },
                        },
                    },
                };

            });

       
        

        // SUSCRIBIRSE A MÉTRICAS
        this._panelesService.metricas$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((metricas) => {
                this.metricas = metricas;
                this.loadingMetricas = false;
                this._computeMetricas();
                this._cdr.markForCheck();
            });

        // Integración con selector de clínicas (Classy):
        // 1) Mostrar nombre de clínica seleccionada si aplica
        // Mantener lista de clínicas para mapear IDs -> nombre
        let allClinicas: UsuarioClinicaResponse[] = [];
        this._roleService.clinicas$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((cs) => {
                allClinicas = cs || [];
                // Recalcular el display cuando llegan/actualizan las clínicas
                const currentFilter = this._clinicFilter.getCurrentClinicFilter();
                if (!currentFilter || currentFilter === 'all') {
                    this.selectedClinicaDisplay = 'Todas';
                } else if (currentFilter.includes(',')) {
                    const count = currentFilter.split(',').length;
                    const groupName = this._clinicFilter.getCurrentSelectedGroupName();
                    this.selectedClinicaDisplay = groupName ? `${groupName} (Grupo • ${count})` : `Grupo de clínicas (${count})`;
                } else {
                    const id = parseInt(currentFilter, 10);
                    const c = allClinicas.find(x => x.id === id);
                    this.selectedClinicaDisplay = c?.name || 'Clínica';
                }

                // Sincronizar selector global (RoleService) con el filtro guardado
                const cf = currentFilter;
                if (cf && !cf.includes(',') && cf !== 'all') {
                    const id = parseInt(cf, 10);
                    const selected = this._roleService.getSelectedClinica();
                    if (!isNaN(id) && (!selected || selected.id !== id)) {
                        const match = allClinicas.find(x => x.id === id);
                        if (match) {
                            this._roleService.setClinica(match);
                        }
                    }
                }
                this._cdr.markForCheck();
            });

        // Determinar el display en base al filtro global (más robusto que selectedClinica$)
        this._clinicFilter.selectedClinicId$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((filter) => {
                if (!filter || filter === 'all') {
                    this.selectedClinicaDisplay = 'Todas';
                } else if (filter.includes(',')) {
                    const count = filter.split(',').length;
                    const groupName = this._clinicFilter.getCurrentSelectedGroupName();
                    this.selectedClinicaDisplay = groupName ? `${groupName} (Grupo • ${count})` : `Grupo de clínicas (${count})`;
                } else {
                    const id = parseInt(filter, 10);
                    const c = allClinicas.find(x => x.id === id);
                    this.selectedClinicaDisplay = c?.name || 'Clínica';
                }
                this._cdr.markForCheck();
            });

        // 2) Cargar métricas al cambiar el filtro
        this._clinicFilter.selectedClinicId$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((filter) => {
                if (!filter) {
                    this.selectedClinicaId = null;
                    this.selectedClinicaFilter = null;
                    this.clearCharts();
                    return;
                }
                if (filter === 'all') {
                    // Agregar todas las clínicas accesibles
                    const ids = allClinicas.map(c => c.id).filter(Boolean);
                    if (ids.length > 0) {
                        this.selectedClinicaFilter = ids.join(',');
                        this.selectedClinicaId = ids[0];
                        this.loadMetricas();
                        this.loadSeries();
                        this.loadVinculaciones();
                        this.loadAnalyticsBlock();
                    } else {
                        this.clearCharts();
                    }
                } else {
                    // Tomar la primera clínica si se selecciona grupo (IDs CSV) o única clínica
                    const firstId = parseInt(filter.split(',')[0], 10);
                    if (!isNaN(firstId)) {
                        this.selectedClinicaId = firstId;
                        this.selectedClinicaFilter = filter;
                        this.loadMetricas();
                        this.loadSeries();
                        this.loadVinculaciones();

                        // Sincronizar RoleService con el filtro emitido
                        const selected = this._roleService.getSelectedClinica();
                        if (!selected || selected.id !== firstId) {
                            const match = allClinicas.find(x => x.id === firstId);
                            if (match) {
                                this._roleService.setClinica(match);
                            }
                        }
                    }
                }
            });

        // Inicializar desde el estado actual (si existe)
        const initFilter = this._clinicFilter.getCurrentClinicFilter();
        if (initFilter) {
            const firstId = parseInt(initFilter.split(',')[0], 10);
            if (!isNaN(firstId)) {
                this.selectedClinicaId = firstId;
                this.loadMetricas();
                this.loadSeries();
                this.loadVinculaciones();
                this.loadAnalyticsBlock();

                // Alinear RoleService con el initFilter
                const selected = this._roleService.getSelectedClinica();
                if (!selected || selected.id !== firstId) {
                    const match = allClinicas.find(x => x.id === firstId);
                    if (match) {
                        this._roleService.setClinica(match);
                    }
                }
            }
        }
        // No forzar selectedClinicaId aquí; se determina por el filtro actual

        // Inicializar gráfico con datos mock como Fuse
this.chartSeguidoresFacebook = {
    chart: {
        fontFamily: 'inherit',
        foreColor: 'inherit',
        height: '100%',
        type: 'line',
        toolbar: {
            show: false,
        },
    },
    colors: ['#1877F2'],
    dataLabels: {
        enabled: false,
    },
    grid: {
        borderColor: 'var(--fuse-border)',
        strokeDashArray: 3,
    },
    series: [
        {
            name: 'Seguidores',
            data: [2800, 2820, 2790, 2850, 2880, 2900, 2920, 2940, 2960, 2980, 3000, 3020, 3040, 3060, 3080, 3100, 3120, 3140, 3160, 3180, 3200, 3220, 3240, 3260, 3280, 3300, 3320, 3340, 3360, 3380]
        }
    ],
    stroke: {
        width: 2,
        curve: 'smooth',
    },
    tooltip: {
        theme: 'dark',
        y: {
            formatter: (value) => {
                return this.formatNumber(value) + ' seguidores';
            },
        },
    },
    xaxis: {
        type: 'datetime',
        categories: this._generateLast30Days(),
        axisBorder: {
            show: false,
        },
        axisTicks: {
            show: false,
        },
    },
    yaxis: {
        labels: {
            formatter: (value) => {
                return this.formatNumber(value);
            },
        },
    },
    noData: {
        text: 'Sin datos'
    },
};
    }


    /**
     * After view init
     */
    ngAfterViewInit(): void {
        // No ejecutar inmediatamente porque las pestañas usan lazy loading
        console.log('🔄 ngAfterViewInit - ViewChild será inicializado cuando se active la pestaña');
    }


    /**
     * Maneja el cambio de pestañas
     */
onTabChange(index: number): void {
    console.log('📊 Cambio de pestaña:', index);
    this.isRedesSocialesTabActive = (index === 1);
    this.currentTabIndex = index;
    try { localStorage.setItem('paneles_tab_index', String(index)); } catch {}
    
    if (this.isRedesSocialesTabActive) {
        // Usar Promise para ejecutar después del ciclo actual
        Promise.resolve().then(() => {
            console.log('📊 Tab materializado, cargando métricas...');
            if (!this.metricas) {
                this.loadMetricas();
            } else {
                console.log('📊 Métricas ya disponibles, actualizando gráficos...');
                this._updateChartsWithMetricas();
            }
        });
    }
}


    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // --------------------------------------------
    // NUEVOS MÉTODOS PARA MÉTRICAS
    // --------------------------------------------
 /**
     * Fix the SVG fill references. This fix must be applied to all ApexCharts
     * charts in order to fix 'black color on gradient fills on certain browsers'
     * issue caused by the '<base>' tag.
     *
     * Fix based on https://gist.github.com/Kamshak/c84cdc175209d1a30f711abd6a81d472
     *
     * @param element
     * @private
     */
    private _fixSvgFill(element: Element): void {
        // Current URL
        const currentURL = this._router.url;

        // 1. Find all elements with 'fill' attribute within the element
        // 2. Filter out the ones that doesn't have cross reference so we only left with the ones that use the 'url(#id)' syntax
        // 3. Insert the 'currentURL' at the front of the 'fill' attribute value
        Array.from(element.querySelectorAll('*[fill]'))
            .filter((el) => el.getAttribute('fill').indexOf('url(') !== -1)
            .forEach((el) => {
                const attrVal = el.getAttribute('fill');
                el.setAttribute(
                    'fill',
                    `url(${currentURL}${attrVal.slice(attrVal.indexOf('#'))}`
                );
            });
    }

    // =====================
    // Analytics (orgánico vs pago)
    // =====================
    kpiReachTotal: number = 0;
    kpiEngagementTotal: number = 0;
    kpiNewFollowers: number = 0;
    chartKpiReach: ApexOptions = { chart: { type: 'area', height: 64, sparkline: { enabled: true }, animations: { enabled: false }, toolbar: { show: false }, fontFamily: 'inherit', foreColor: 'inherit' }, stroke: { curve: 'smooth', width: 2 }, colors: ['#3b82f6'], series: [] };
    chartKpiEngagement: ApexOptions = { chart: { type: 'area', height: 64, sparkline: { enabled: true }, animations: { enabled: false }, toolbar: { show: false }, fontFamily: 'inherit', foreColor: 'inherit' }, stroke: { curve: 'smooth', width: 2 }, colors: ['#22c55e'], series: [] };
    chartKpiFollowers: ApexOptions = { chart: { type: 'area', height: 64, sparkline: { enabled: true }, animations: { enabled: false }, toolbar: { show: false }, fontFamily: 'inherit', foreColor: 'inherit' }, stroke: { curve: 'smooth', width: 2 }, colors: ['#64748b'], series: [] };

    private getSelectedAssetType(): 'instagram_business'|'facebook_page'|null {
        if (this.analyticsPlatform === 'instagram') return 'instagram_business';
        if (this.analyticsPlatform === 'facebook') return 'facebook_page';
        return null; // TikTok aún no implementado
    }

    onAnalyticsPlatformChange(p: 'instagram'|'facebook'|'tiktok'): void {
        this.analyticsPlatform = p;
        this.loadAnalyticsBlock();
    }

    setQuickRange(range: 'yesterday'|'last7'|'last30'|'thisYear'|'lastYear'|'all'): void {
        const now = new Date();
        switch (range) {
            case 'yesterday':
                this.analyticsStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                this.analyticsEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                break;
            case 'last7':
                this.analyticsEnd = now;
                this.analyticsStart = new Date(now.getTime() - 7*24*60*60*1000);
                break;
            case 'last30':
                this.analyticsEnd = now;
                this.analyticsStart = new Date(now.getTime() - 30*24*60*60*1000);
                break;
            case 'thisYear':
                this.analyticsStart = new Date(now.getFullYear(), 0, 1);
                this.analyticsEnd = now;
                break;
            case 'lastYear':
                this.analyticsStart = new Date(now.getFullYear()-1, 0, 1);
                this.analyticsEnd = new Date(now.getFullYear()-1, 11, 31);
                break;
            case 'all':
                this.analyticsStart = new Date(2000,0,1);
                this.analyticsEnd = now;
                break;
        }
        this.loadAnalyticsBlock();
        this.reloadFollowersSeries();
    }

    private loadAnalyticsBlock(): void {
        const clinicaId = this.selectedClinicaId;
        if (!clinicaId) return;
        const aType = this.getSelectedAssetType();
        const start = this.analyticsStart.toISOString().split('T')[0];
        const end = this.analyticsEnd.toISOString().split('T')[0];

        // Serie orgánico/pago
        this._panelesService.getOrganicVsPaidByDay(clinicaId, aType, start, end)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((resp: any) => {
                const points = resp?.series || [];
                const total = points.map((p: any) => ({ x: new Date(p.date).getTime(), y: p.total }));
                const organic = points.map((p: any) => ({ x: new Date(p.date).getTime(), y: p.organic }));
                const paid = points.map((p: any) => ({ x: new Date(p.date).getTime(), y: p.paid }));
                this.chartOrganicPaid = { ...this.chartOrganicPaid, series: [
                    { name: 'Total', data: total },
                    { name: 'Orgánicos', data: organic },
                    { name: 'De pago', data: paid }
                ] };
                this._cdr.markForCheck();
            });

        // KPIs: usar SocialStatsDaily (serie diaria) para sumar y obtener tendencia
        this._panelesService.getClinicaStats(clinicaId, aType, start, end)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((resp: any) => {
                const rows = Array.isArray(resp) ? resp : (resp?.stats || []);
                const sum = (key: string) => rows.reduce((s: number, r: any) => s + (r[key] || 0), 0);
                this.kpiReachTotal = sum('reach');
                this.kpiEngagementTotal = sum('engagement');
                this.kpiNewFollowers = sum('followers_day');

                // Sparklines
                const toSeries = (key: string) => [{ name: key, data: rows.map((r: any) => ({ x: new Date(r.date).getTime(), y: r[key] || 0 })) }];
                this.chartKpiReach = { ...this.chartKpiReach, series: toSeries('reach') };
                this.chartKpiEngagement = { ...this.chartKpiEngagement, series: toSeries('engagement') };
                this.chartKpiFollowers = { ...this.chartKpiFollowers, series: toSeries('followers_day') };
                this._cdr.markForCheck();
            });

        // Tabla publicaciones (últimas 10)
        this._panelesService.getClinicaPosts(clinicaId, aType, start, end, 10, 0)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {
                this.postsListado = res?.posts || [];
                this.postsTotal = res?.total || 0;
                this._cdr.markForCheck();
            });
    }

    // Reusar el rango para series de seguidores IG/FB
    private reloadFollowersSeries(): void {
        const filter = this.selectedClinicaFilter ?? this.selectedClinicaId;
        if (!filter) return;
        const start = this.analyticsStart.toISOString().split('T')[0];
        const end = this.analyticsEnd.toISOString().split('T')[0];
        this._panelesService.getSeriesSeguidores(filter, 'all-time', start, end)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(series => {
                try {
                    const ig = (series?.instagram || []).map((p: any) => ({ x: new Date(p.date).getTime(), y: p.followers }));
                    const fb = (series?.facebook || []).map((p: any) => ({ x: new Date(p.date).getTime(), y: p.followers }));
                    this.chartInstagramOverview.series = [{ name: 'Seguidores Instagram', data: ig }];
                    this.chartFacebookOverview.series = [{ name: 'Seguidores Facebook', data: fb }];
                    this._cdr.markForCheck();
                } catch {}
            });
    }


    /**
 * Genera datos mock para las gráficas superiores
 */
private _generateMockData(timeRange: string, baseValue: number): { dates: number[], followers: number[] } {
    const now = new Date();
    const dates: number[] = [];
    const followers: number[] = [];
    
    let days: number;
    let startDate: Date;
    
    // Determinar el rango de días según el selector
    switch (timeRange) {
        case 'last-year':
            days = 365;
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
        case 'this-year':
            days = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        case 'all-time':
            days = 730; // 2 años
            startDate = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
            break;
        default:
            days = 30;
            startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    }
    
    // Generar datos con tendencia de crecimiento realista
    const growthRate = 0.001; // 0.1% de crecimiento promedio por día
    const volatility = 0.05; // 5% de volatilidad
    
    for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
        
        // Usar timestamp para ApexCharts (evita errores NaN)
        dates.push(date.getTime());
        
        // Calcular valor con tendencia y volatilidad
        const trend = baseValue * (1 + (growthRate * i));
        const randomVariation = (Math.random() - 0.5) * volatility * trend;
        const value = Math.round(trend + randomVariation);
        
        followers.push(Math.max(0, value)); // Evitar valores negativos
    }
    
    return { dates, followers };
}

    /**
     * Cargar métricas de la clínica seleccionada
     */
    loadMetricas(): void {
        if (!this.selectedClinicaId) {
            return;
        }

        this.loadingMetricas = true;
        this.errorMetricas = null;
        this.datosCargados = false;


        this._panelesService.getMetricasByClinica(this.selectedClinicaFilter ?? this.selectedClinicaId!)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // The service normalizes the response and also pushes the
                    // metrics through its own observable, but we assign the
                    // normalized data here as well to avoid any race
                    // conditions.
                    this.loadingMetricas = false;
                    this.metricas = response;
                    this._computeMetricas();
                    this._cdr.markForCheck();
                    console.log('🔍 DIAGNÓSTICO - response completo:', response);
                    console.log('🔍 DIAGNÓSTICO - this.metricas:', this.metricas);
                    console.log('🔍 DIAGNÓSTICO - métricas procesadas:', {
                        facebook: this.facebookMetrics,
                        instagram: this.instagramMetrics,
                        tiktok: this.tiktokMetrics,
                        linkedin: this.linkedinMetrics,
                    });
                    console.log('🔍 DIAGNÓSTICO - hasMetricasData:', this.hasMetricasData);
                    console.log('🔍 DIAGNÓSTICO - loadingMetricas:', this.loadingMetricas);
                    console.log('🔍 DIAGNÓSTICO - errorMetricas:', this.errorMetricas);

                    // Forzar detección de cambios después de cargar métricas
this._cdr.detectChanges();
console.log('🔄 Change detection forzada después de cargar métricas');

// Ejecutar siempre, no depender del ViewChild
this._updateChartsWithMetricas();
this.datosCargados = true;

// También intentar después de un delay para el ViewChild
setTimeout(() => {
    if (this.facebookChart) {
        console.log('🔄 Reintentando actualización con ViewChild disponible');
        this.updateFacebookChart();
    }
}, 200);

                },
                error: (error) => {
                    this.loadingMetricas = false;
                    this.errorMetricas = 'Error de conexión al cargar métricas';
                    console.error('Error cargando métricas:', error);
                }
            });
    }
    
    /**
     * Refrescar métricas manualmente
     */
    refreshMetricas(): void {
        this.loadMetricas();
        this.loadSeries();
        this.loadVinculaciones();
    }

    /**
     * Limpiar charts/datos cuando no hay clínica seleccionada
     */
    clearCharts(): void {
        this.metricas = null;
        this.facebookMetrics = null;
        this.instagramMetrics = null;
        this.tiktokMetrics = null;
        this.linkedinMetrics = null;
        this.hasMetricasData = false;
        this.datosCargados = false;
        this._cdr.markForCheck();
    }

    /** Cargar series reales de seguidores (IG/FB) */
    private loadSeries(): void {
        const filter = this.selectedClinicaFilter ?? this.selectedClinicaId;
        if (!filter) return;
        const period = (this.selectedTimeRange as any) || 'this-year';
        this._panelesService.getSeriesSeguidores(filter, period)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(series => {
                try {
                    const ig = (series?.instagram || []).map((p: any) => ({ x: new Date(p.date).getTime(), y: p.followers }));
                    const fb = (series?.facebook || []).map((p: any) => ({ x: new Date(p.date).getTime(), y: p.followers }));
                    this.chartInstagramOverview.series = [{ name: 'Seguidores Instagram', data: ig }];
                    this.chartFacebookOverview.series = [{ name: 'Seguidores Facebook', data: fb }];
                    this._cdr.markForCheck();
                } catch {}
            });
    }

    /** Cargar estado de vinculaciones para mostrar mensajes/CTAs */
    private loadVinculaciones(): void {
        const filter = this.selectedClinicaFilter ?? this.selectedClinicaId;
        if (!filter) return;
        this._panelesService.getVinculaciones(filter)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(v => { this.vinculaciones = v || this.vinculaciones; this._cdr.markForCheck(); });
    }

    /**
     * Abrir mapeo de activos en un diálogo (standalone)
     */
    openAssetMappingDialog(): void {
        // Carga diferida del componente standalone
        import('app/modules/admin/pages/settings/shared/asset-mapping.component').then(module => {
            // Guardar pestaña actual para restaurar tras OAuth/mapeo
            try { localStorage.setItem('paneles_tab_index', String(this.currentTabIndex)); } catch {}
            const ref = this._dialog.open(module.AssetMappingComponent, {
                width: '1024px',
                maxWidth: '95vw',
                data: { preselectedClinicId: this.selectedClinicaId },
                panelClass: 'cc-dialog-asset-mapping'
            });
            ref.afterClosed().subscribe((result) => {
                // Al cerrar, refrescar vinculaciones por si se conectó/mapeó
                this.loadVinculaciones();
                this.loadSeries();
                if (result === true) {
                    this._snackBar.open('Se están sincronizando los datos. Esta operación puede tardar unos minutos, vuelve después.', 'Cerrar', { duration: 6000 });
                }
            });
        });
    }

    /**
     * Cuando cambia la clínica seleccionada
     */
    onClinicaChanged(clinicaId: number): void {
        this.selectedClinicaId = clinicaId;
        this.loadMetricas();
    }

    /**
     * Procesa las métricas recibidas y actualiza banderas de visualización
     */
    private _computeMetricas(): void {
    // FORZAR Facebook como disponible para testing
    
// Usar solo datos mock para testing
this.facebookMetrics = {
    seguidores: 3380, 
    alcance_mes: 15000,
    interacciones: 450,
    crecimiento_seguidores: 25,
    posts_mes: 12,
    engagement_rate: 3.8 
};
    
    const ig = this.metricas?.instagram;
    this.instagramMetrics = this._hasAnyMetric(ig, ['seguidores', 'impresiones', 'engagement', 'visualizaciones', 'alcance']) ? ig! : null;

    this.tiktokMetrics = this.metricas?.tiktok ?? null;
    this.linkedinMetrics = this.metricas?.linkedin ?? null;

    // FORZAR hasMetricasData como true para testing
    this.hasMetricasData = true;
}

    /* MÉTODO HELPER PARA GENERAR FECHAS:*/

private _generateLast30Days(): number[] {
    const dates: number[] = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.getTime());
    }
    return dates;
}

 /**
     * Formatear números para mostrar (1.9K, 1.5M, etc.)
     */
    formatNumber(value: number): string {
        if (!value) return '0';
        
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
        }
        return value.toString();
    }

    /**
     * Formatear porcentaje de tendencia
     */
    formatTrend(trend: number): string {
        if (!trend) return '0%';
        const sign = trend > 0 ? '+' : '';
        return `${sign}${trend.toFixed(1)}%`;
    }
/**
     * Obtener clase CSS para tendencia
     */
    getTrendClass(trend: number): string {
        if (trend > 0) return 'text-green-600';
        if (trend < 0) return 'text-red-600';
        return 'text-gray-600';
    }

    /**
 * Actualiza gráficos con métricas reales
 */
_updateChartsWithMetricas(): void {
    console.log('📈 _updateChartsWithMetricas() ejecutado');
    console.log('📈 this.metricas:', this.metricas);
    console.log('📈 this.facebookMetrics:', this.facebookMetrics);
    
    // Verificar si hay datos mock o métricas reales
if (!this.metricas && !this.facebookMetrics) {
    console.log('❌ No hay métricas ni datos mock, saliendo de _updateChartsWithMetricas');
    return;
}

    
        console.log('📈 Actualizando gráficos con datos:', this.metricas);
    
    // Actualizar gráfico de Facebook con datos reales (existente)
    console.log('📈 Llamando a updateFacebookChart()');
    this.updateFacebookChart();
    console.log('📈 updateFacebookChart() completado');
    
    // Actualizar las 3 gráficas superiores con datos mock
    console.log('📈 Llamando a updateOverviewCharts()');
    this.updateOverviewCharts();
    console.log('📈 updateOverviewCharts() completado');
    this.datosCargados = true;
    this._cdr.markForCheck();
}



    /**
     * Actualiza el gráfico de seguidores de Facebook
     */
    updateFacebookChart(): void {
        console.log('📊 updateFacebookChart() ejecutado');
        console.log('📊 this.selectedClinicaId:', this.selectedClinicaId);
        console.log('📊 this.facebookMetrics:', this.facebookMetrics);
        
        if (!this.selectedClinicaId) {
            console.log('❌ No hay selectedClinicaId, saliendo');
            return;
        }

        // Usar facebookMetrics que contiene los datos mock
        if (!this.facebookMetrics) {
            console.log('❌ No hay facebookMetrics, saliendo');
            return;
        }
        
        console.log('✅ Generando gráfico con datos mock');
        const currentFollowers = this.facebookMetrics.seguidores ?? 2840;
        console.log('📊 currentFollowers:', currentFollowers);

        // Generar datos de ejemplo para los últimos 30 días
        const dates: number[] = [];
        const followers: number[] = [];
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.getTime());
            
            // Simular variación de seguidores (±2% del valor actual)
            const variation = (Math.random() - 0.5) * 0.04;
            const dailyFollowers = Math.round(currentFollowers * (1 + variation * (i / 30)));
            followers.push(Math.max(0, dailyFollowers));
        }

        console.log('📊 Datos generados - dates:', dates.length, 'followers:', followers.length);
        console.log('📊 Primeros 5 seguidores:', followers.slice(0, 5));

        // Actualizar configuración del gráfico
        this.chartSeguidoresFacebook = {
            ...this.chartSeguidoresFacebook,
            series: [{ name: 'Seguidores', data: followers }],
            xaxis: { ...this.chartSeguidoresFacebook.xaxis, categories: dates },
        };

        console.log('📊 chartSeguidoresFacebook actualizado:', this.chartSeguidoresFacebook);
        console.log('📊 this.facebookChart ViewChild:', this.facebookChart);



        this._cdr.markForCheck();
        console.log('📊 Gráfico Facebook actualizado con datos simulados');

        // Forzar detección de cambios después de actualizar gráfico
        setTimeout(() => {
            this._cdr.detectChanges();
            console.log('🔄 Change detection forzada después de actualizar gráfico');
        }, 100);
    }

    /**
     * Intenta actualizar el gráfico con reintentos hasta que el ViewChild esté disponible
     */
   


    // --------------------------------------------
    // @ Métodos para las 3 gráficas superiores
    // --------------------------------------------

    /**
     * Cambio en el selector de tiempo
     */
    onTimeRangeChange(value: string): void {
        console.log('📅 Cambio de rango de tiempo:', value);
        this.selectedTimeRange = value;
        // Cargar series reales de IG/FB y mantener TikTok vacío
        this.loadSeries();
        this.updateTiktokOverviewChart();
    }

    /**
     * Obtener porcentaje de crecimiento por plataforma
     */
    getGrowthPercentage(platform: string): string {
        const percentage = this.growthPercentages[platform] || 0;
        return percentage > 0 ? `+${percentage}` : `${percentage}`;
    }

    /**
     * Obtener etiqueta del rango de tiempo seleccionado
     */
    getTimeRangeLabel(): string {
        switch (this.selectedTimeRange) {
            case 'last-year':
                return 'El año pasado';
            case 'this-year':
                return 'Este año';
            case 'all-time':
                return 'Desde siempre';
            default:
                return 'Este año';
        }
    }

    /**
     * Actualizar las 3 gráficas superiores
     */
   updateOverviewCharts(): void {
    console.log('📈 updateOverviewCharts() ejecutado');
    // Solo actualizar TikTok (IG/FB se actualizan con datos reales en loadSeries)
    this.updateTiktokOverviewChart();
    console.log('📈 updateOverviewCharts() completado');
}


    /**
     * Actualizar gráfica superior de Instagram
     */
updateInstagramOverviewChart(): void { /* series reales se cargan en loadSeries() */ }

updateTiktokOverviewChart(): void {
    console.log('📊 Actualizando gráfica TikTok Overview (sin datos)');
    this.chartTiktokOverview = {
        ...this.chartTiktokOverview,
        series: []
    };
}

updateFacebookOverviewChart(): void { /* series reales se cargan en loadSeries() */ }
    /**
     * Generar datos mock para las gráficas superiores
     */
    generateOverviewChartData(platform: string): { dates: string[], values: number[] } {
        const dates: string[] = [];
        const values: number[] = [];
        
        // Determinar número de puntos según el rango de tiempo
        let points = 12; // Meses para "this-year"
        let baseValue = 1000;
        
        switch (platform) {
            case 'instagram':
                baseValue = 4200;
                break;
            case 'tiktok':
                baseValue = 1800;
                break;
            case 'facebook':
                baseValue = 2840;
                break;
        }
        
        switch (this.selectedTimeRange) {
            case 'last-year':
                points = 12;
                baseValue = Math.round(baseValue * 0.8); // 20% menos el año pasado
                break;
            case 'this-year':
                points = 12;
                break;
            case 'all-time':
                points = 24; // 2 años
                baseValue = Math.round(baseValue * 0.6); // Empezar más bajo
                break;
        }
        
        for (let i = 0; i < points; i++) {
            // Generar fechas
            const date = new Date();
            if (this.selectedTimeRange === 'all-time') {
                date.setMonth(date.getMonth() - (points - i));
            } else {
                date.setMonth(date.getMonth() - (points - i - 1));
            }
            dates.push(date.toLocaleDateString('es-ES', { month: 'short' }));
            
            // Generar valores con tendencia creciente y variación
            const growth = (i / points) * (this.growthPercentages[platform] / 100);
            const variation = (Math.random() - 0.5) * 0.1; // ±5% variación
            const value = Math.round(baseValue * (1 + growth + variation));
            values.push(Math.max(0, value));
        }
        
        return { dates, values };
    }

   


      /**
     * Obtener icono para tendencia
     */
    getTrendIcon(trend: number): string {
        if (trend > 0) return 'trending_up';
        if (trend < 0) return 'trending_down';
        return 'trending_flat';
    }

    /**
     * Check if the metric object contains any meaningful data
     */
    private _hasAnyMetric(metrics: any, fields: string[]): boolean {
        if (!metrics) {
            console.log('🔍 _hasAnyMetric: metrics es null/undefined');
            return false;
        }
        const result = fields.some((f) => 
            metrics[f] !== undefined && 
            metrics[f] !== null && 
            (typeof metrics[f] === 'number' || metrics[f])
        );
        console.log('🔍 _hasAnyMetric:', { metrics, fields, result });
        return result;
    }


    


    // --------------------------------------------
    // @ Private methods
    // --------------------------------------------

    /**
     * Prepare the chart data
     * @private
     */
    private _prepareChartData(): void {
        // Github issues
        this.chartGithubIssues = {
            chart: {
                fontFamily: 'inherit',
                foreColor: 'inherit',
                height: '100%',
                type: 'line',
                toolbar: {
                    show: false,
                },
            },
            colors: ['#64748B', '#94A3B8'],
            dataLabels: {
                enabled: true,
                enabledOnSeries: [0],
                background: {
                    borderWidth: 0,
                    padding: 4,
                },
            },
            grid: {
                borderColor: 'var(--fuse-border)',
            },
            labels: this.data.githubIssues.labels,
            legend: {
                show: false,
            },
            plotOptions: {
                bar: {
                    columnWidth: '50%',
                },
            },
            series: this.data.githubIssues.series,
            states: {
                hover: {
                    filter: {
                        type: 'darken',
                        value: 0.75,
                    },
                },
            },
            stroke: {
                width: [3, 0],
            },
            tooltip: {
                followCursor: true,
                theme: 'dark',
            },
            xaxis: {
                axisBorder: {
                    show: false,
                },
                axisTicks: {
                    show: false,
                },
                labels: {
                    style: {
                        colors: 'var(--fuse-text-secondary)',
                    },
                },
                tooltip: {
                    enabled: false,
                },
            },
            yaxis: {
                labels: {
                    offsetX: -16,
                    style: {
                        colors: 'var(--fuse-text-secondary)',
                    },
                },
            },
        };

        // Task distribution
        this.chartTaskDistribution = {
            chart: {
                fontFamily: 'inherit',
                foreColor: 'inherit',
                height: '100%',
                type: 'donut',
                toolbar: {
                    show: false,
                },
            },
            colors: ['#3182CE', '#63B3ED', '#90CDF4', '#BEE3F8'],
            labels: this.data.taskDistribution.labels,
            plotOptions: {
                pie: {
                    customScale: 0.9,
                    donut: {
                        size: '70%',
                    },
                    expandOnClick: false,
                },
            },
            series: this.data.taskDistribution.series,
            states: {
                hover: {
                    filter: {
                        type: 'none',
                    },
                },
                active: {
                    filter: {
                        type: 'none',
                    },
                },
            },
            tooltip: {
                enabled: true,
                fillSeriesColor: false,
                theme: 'dark',
                custom: ({
                    seriesIndex,
                    w,
                }): string => `<div class="flex items-center h-8 min-h-8 max-h-8 px-3">
                                    <div class="w-3 h-3 rounded-full" style="background-color: ${w.config.colors[seriesIndex]};"></div>
                                    <div class="ml-2 text-md leading-none">${w.config.labels[seriesIndex]}:</div>
                                    <div class="ml-2 text-md font-bold leading-none">${w.config.series[seriesIndex]}%</div>
                                </div>`,
            },
        };

        // Budget distribution
        this.chartBudgetDistribution = {
            chart: {
                fontFamily: 'inherit',
                foreColor: 'inherit',
                height: '100%',
                type: 'radar',
                sparkline: {
                    enabled: true,
                },
            },
            colors: ['#818CF8'],
            dataLabels: {
                enabled: true,
                formatter: (val: number): string | number => `${val}%`,
                textAnchor: 'start',
                style: {
                    fontSize: '13px',
                    fontWeight: 500,
                },
                background: {
                    borderWidth: 0,
                    padding: 4,
                },
                offsetY: -15,
            },
            markers: {
                strokeColors: '#818CF8',
                strokeWidth: 4,
            },
            plotOptions: {
                radar: {
                    polygons: {
                        strokeColors: 'var(--fuse-border)',
                        connectorColors: 'var(--fuse-border)',
                    },
                },
            },
            series: this.data.budgetDistribution.series,
            stroke: {
                width: 2,
            },
            tooltip: {
                theme: 'dark',
                y: {
                    formatter: (val: number): string => `${val}%`,
                },
            },
            xaxis: {
                labels: {
                    show: true,
                    style: {
                        fontSize: '12px',
                        fontWeight: '500',
                    },
                },
                categories: this.data.budgetDistribution.categories,
            },
            yaxis: {
                max: (max: number): number => parseInt((max + 10).toFixed(0), 10),
                tickAmount: 7,
            },
        };

        // Weekly expenses
        this.chartWeeklyExpenses = {
            chart: {
                animations: {
                    enabled: false,
                },
                fontFamily: 'inherit',
                foreColor: 'inherit',
                width: '100%',
                height: '100%',
                type: 'line',
                sparkline: {
                    enabled: true,
                },
            },
            colors: ['#22D3EE'],
            series: this.data.weeklyExpenses.series,
            stroke: {
                curve: 'smooth',
            },
            tooltip: {
                theme: 'dark',
            },
            xaxis: {
                type: 'category',
                categories: this.data.weeklyExpenses.labels,
            },
            yaxis: {
                labels: {
                    formatter: (val): string => `$${val}`,
                },
            },
        };

        // Monthly expenses
        this.chartMonthlyExpenses = {
            chart: {
                animations: {
                    enabled: false,
                },
                fontFamily: 'inherit',
                foreColor: 'inherit',
                width: '100%',
                height: '100%',
                type: 'line',
                sparkline: {
                    enabled: true,
                },
            },
            colors: ['#4ADE80'],
            series: this.data.monthlyExpenses.series,
            stroke: {
                curve: 'smooth',
            },
            tooltip: {
                theme: 'dark',
            },
            xaxis: {
                type: 'category',
                categories: this.data.monthlyExpenses.labels,
            },
            yaxis: {
                labels: {
                    formatter: (val): string => `$${val}`,
                },
            },
        };

        // Yearly expenses
        this.chartYearlyExpenses = {
            chart: {
                animations: {
                    enabled: false,
                },
                fontFamily: 'inherit',
                foreColor: 'inherit',
                width: '100%',
                height: '100%',
                type: 'line',
                sparkline: {
                    enabled: true,
                },
            },
            colors: ['#FB7185'],
            series: this.data.yearlyExpenses.series,
            stroke: {
                curve: 'smooth',
            },
            tooltip: {
                theme: 'dark',
            },
            xaxis: {
                type: 'category',
                categories: this.data.yearlyExpenses.labels,
            },
            yaxis: {
                labels: {
                    formatter: (val): string => `$${val}`,
                },
            },
        };

        // 🚀 Si venimos de OAuth Meta con solicitud de abrir mapeo, abrir el diálogo automáticamente
        const openMapping = localStorage.getItem('open_asset_mapping');
        if (openMapping === '1') {
            localStorage.removeItem('open_asset_mapping');
            setTimeout(() => this.openAssetMappingDialog(), 300);
        }

        // Cargar bloque analytics (por defecto: último mes, Instagram)
        this.loadAnalyticsBlock();
    }
}
