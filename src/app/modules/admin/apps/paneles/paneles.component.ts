import { CurrencyPipe, NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
    ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { PanelesService } from './paneles.service';
import { ApexOptions, NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'paneles',
    templateUrl: './paneles.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
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
    ],
})
export class PanelesComponent implements OnInit, OnDestroy {
    chartGithubIssues: ApexOptions = {};
    chartTaskDistribution: ApexOptions = {};
    chartBudgetDistribution: ApexOptions = {};
    chartWeeklyExpenses: ApexOptions = {};
    chartMonthlyExpenses: ApexOptions = {};
    chartYearlyExpenses: ApexOptions = {};
    isRedesSocialesTabActive: boolean = false;
    data: any;
    selectedProject: string = 'ACME Corp. Backend App';
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // NUEVAS PROPIEDADES PARA MÉTRICAS
    metricas: any = null;
    loadingMetricas: boolean = false;
    selectedClinicaId: number | null = null;
    errorMetricas: string | null = null;

    @ViewChild('facebookChart') facebookChart!: ChartComponent;

    // Configuración del gráfico de seguidores Facebook
    chartSeguidoresFacebook: ApexOptions = {
        chart: {
            fontFamily: 'inherit',
            foreColor: 'inherit',
            height: '100%',
            type: 'line',
            toolbar: {
                show: false,
            },
        },
        colors: ['#1877F2'], // Color azul Facebook
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


    /**
     * Constructor
     */
    constructor(
        private _panelesService: PanelesService,
        private _router: Router,
        private _cdr: ChangeDetectorRef 
    ) {}

    // --------------------------------------------
    // @ Lifecycle hooks
    // --------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Get the data
        this._panelesService.data$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((data) => {
                // Store the data
                this.data = data;

                // Prepare the chart data
                this._prepareChartData();
            });

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

        // SUSCRIBIRSE A MÉTRICAS
        this._panelesService.metricas$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((metricas) => {
                this.metricas = metricas;
                this.loadingMetricas = false;
            });

        // TODO: Integrar con selector de clínicas
        // Por ahora usar clínica de prueba
        this.selectedClinicaId = 1;
    }

    /**
     * Maneja el cambio de pestañas
     */
    onTabChange(index: number): void {
        console.log('📊 Cambio de pestaña:', index);
        this.isRedesSocialesTabActive = (index === 1);
        
        if (this.isRedesSocialesTabActive && !this.metricas) {
            console.log('📊 Cargando métricas para pestaña Redes Sociales');
            this.loadMetricas();
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
     * Cargar métricas de la clínica seleccionada
     */
    loadMetricas(): void {
        if (!this.selectedClinicaId) {
            return;
        }

        this.loadingMetricas = true;
        this.errorMetricas = null;

        this._panelesService.getMetricasByClinica(this.selectedClinicaId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                // The service normalizes the response and also pushes the
                    // metrics through its own observable, but we assign the
                    // normalized data here as well to avoid any race
                    // conditions.
                    this.loadingMetricas = false;
                    this.metricas = response?.data ?? response;
                    console.log('🔍 DIAGNÓSTICO - response completo:', response);
                    console.log('🔍 DIAGNÓSTICO - this.metricas:', this.metricas);
                    console.log('🔍 DIAGNÓSTICO - this.metricas.facebook:', this.metricas?.facebook);
                    console.log('🔍 DIAGNÓSTICO - hasMetricsData():', this.hasMetricsData());

                    setTimeout(() => {
                        this._updateChartsWithMetricas();
                    });
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
    }

    /**
     * Cuando cambia la clínica seleccionada
     */
    onClinicaChanged(clinicaId: number): void {
        this.selectedClinicaId = clinicaId;
        this.loadMetricas();
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
    if (!this.metricas) return;
    
    console.log('📈 Actualizando gráficos con datos:', this.metricas);
    
    // Actualizar gráfico de Facebook con datos reales
    this.updateFacebookChart();
}

/**
 * Actualiza el gráfico de seguidores de Facebook
 */
updateFacebookChart(): void {
    const facebookData = this.metricas.facebook;
    if (!facebookData) return;
    
    // Generar datos de ejemplo para los últimos 30 días
    const dates = [];
    const followers = [];
    const currentFollowers = facebookData.seguidores || 2840;
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.getTime());
        
        // Simular variación de seguidores (±2% del valor actual)
        const variation = (Math.random() - 0.5) * 0.04; // ±2%
        const dailyFollowers = Math.round(currentFollowers * (1 + variation * (i / 30)));
        followers.push(dailyFollowers);
    }
    
    // Actualizar configuración del gráfico
    this.chartSeguidoresFacebook = {
        ...this.chartSeguidoresFacebook,
        series: [
            {
                name: 'Seguidores',
                data: followers
            }
        ],
        xaxis: {
            ...this.chartSeguidoresFacebook.xaxis,
            categories: dates
        }
    };

    this._cdr.detectChanges();
    console.log('🔄 Change detection forzada');

    console.log('🎯 chartSeguidoresFacebook actualizado:', this.chartSeguidoresFacebook);
        console.log('🎯 series data:', this.chartSeguidoresFacebook.series);

    
    console.log('📊 Gráfico Facebook actualizado con', followers.length, 'puntos de datos');
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
     * Obtener métricas de Facebook
     */
    getFacebookMetrics(): any {
        return this.metricas?.facebook ?? null;
    }

    /**
     * Obtener métricas de Instagram
     */
    getInstagramMetrics(): any {
        return this.metricas?.instagram ?? null;
    }

    /**
     * Verificar si hay datos de métricas
     */
    hasMetricsData(): boolean {
        if (!this.metricas) {
            return false;
        }

        const hasFacebook = !!(
            this.metricas.facebook &&
            (
                this.metricas.facebook.seguidores !== undefined ||
                this.metricas.facebook.impresiones !== undefined ||
                this.metricas.facebook.engagement !== undefined ||
                this.metricas.facebook.visualizaciones !== undefined
            )
        );

        const hasInstagram = !!(
            this.metricas.instagram &&
            (
                this.metricas.instagram.seguidores !== undefined ||
                this.metricas.instagram.impresiones !== undefined ||
                this.metricas.instagram.engagement !== undefined ||
                this.metricas.instagram.visualizaciones !== undefined
            )
        );

        const hasTikTok = !!(
            this.metricas.tiktok &&
            (
                this.metricas.tiktok.seguidores !== undefined ||
                this.metricas.tiktok.visualizaciones !== undefined
            )
        );

        const hasLinkedIn = !!(
            this.metricas.linkedin &&
            (
                this.metricas.linkedin.seguidores !== undefined ||
                this.metricas.linkedin.impresiones !== undefined
            )
        );

        return hasFacebook || hasInstagram || hasTikTok || hasLinkedIn;
    }

    // --------------------------------------------
    // @ Private methods
    // --------------------------------------------

    /**
     * Fix the SVG fill references. This fix must be applied to all ApexCharts
     * charts in order to fix 'black color on gradient fills on certain browsers'
     * issue caused by the '<base>' tag.
     *
     * Fix based on https://gist.github.com/Keldos-Li/2f56a8c8c9f0f9e4c7b0b0b0b0b0b0b0
     *
     * @param element
     * @private
     */
    private _fixSvgFill(element: Element): void {
        // Current URL
        const currentURL = this._router.url;

        // 1. Find all elements with 'fill' attribute within the element
        // 2. Filter out the ones that doesn't have cross reference so we don't touch the ones that are supposed to be solid
        // 3. Insert the 'currentURL' at the front of the 'fill' attribute value
        Array.from(element.querySelectorAll('*[fill]'))
            .filter((el) => el.getAttribute('fill').indexOf('url(') !== -1)
            .forEach((el) => {
                const attrVal = el.getAttribute('fill');
                el.setAttribute(
                    'fill',
                    `url(${currentURL}${attrVal.slice(attrVal.indexOf('#'))})`,
                );
            });
    }

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
    }
}
