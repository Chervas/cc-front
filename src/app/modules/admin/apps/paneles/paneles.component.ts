import { CurrencyPipe, NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
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
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
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
    data: any;
    selectedProject: string = 'ACME Corp. Backend App';
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _panelesService: PanelesService,
        private _router: Router,
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

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
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Fix the SVG fill references. This fix must be applied to all ApexCharts
     * charts in order to fix 'black color on gradient fills on certain browsers'
     * issue caused by the '<base>' tag.
     *
     * Fix based on https://gist.github.com/Keldos-Li/2f56a8c8c8f25d852a11df02c07fda17
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
                    `url(${currentURL}${attrVal.slice(attrVal.indexOf('#'))}`,
                );
            });
    }

    /**
     * Prepare the chart data
     *
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
                zoom: {
                    enabled: false,
                },
            },
            colors: ['#64748B', '#94A3B8'],
            dataLabels: {
                enabled: true,
                enabledOnSeries: [0],
                background: {
                    borderWidth: 0,
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
                zoom: {
                    enabled: false,
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

