import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { HasRoleDirective } from 'app/modules/admin/apps/roles/shared/has-role.directive';
import { JobsMonitoringService } from './jobs-monitoring.service';

// Interfaces locales basadas en las respuestas reales de la API
interface JobSystemStatus {
    systemRunning: boolean;
    systemInitialized: boolean;
    jobsCount: number;
    jobs: {
        [key: string]: {
            schedule: string;
            status: string;
            lastExecution: string | null;
            lastError: string | null;
        };
    };
    todayStats: {
        totalExecutions: number;
        successfulExecutions: number;
        failedExecutions: number;
    };
    recentLogs: JobLog[];
}

interface JobLog {
    jobType: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    recordsProcessed: number;
    errorMessage: string | null;
}

interface JobStatistics {
    summary: {
        totalExecutions: number;
        successfulExecutions: number;
        failedExecutions: number;
        successRate: string;
    };
    [key: string]: any;
}

interface JobConfiguration {
    configuration: {
        schedules: {
            [key: string]: string;
        };
        timezone: string;
        autoStart: boolean;
        dataRetention: {
            [key: string]: number;
        };
        retries: {
            maxAttempts: number;
            delayMs: number;
        };
    };
    systemStatus: {
        initialized: boolean;
        running: boolean;
        jobsCount: number;
    };
}

@Component({
    selector: 'app-jobs-monitoring',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        MatButtonModule,
        MatCardModule,
        MatChipsModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatPaginatorModule,
        MatSelectModule,
        MatTableModule,
        MatTabsModule,
        MatTooltipModule,
        HasRoleDirective
    ],
    templateUrl: './jobs-monitoring.component.html',
    styleUrls: []
})
export class JobsMonitoringComponent implements OnInit, OnDestroy {
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // Estados del componente
    isLoading = false;
    error: string | null = null;

    // Datos del sistema
    systemStatus: JobSystemStatus | null = null;
    jobsLogs: JobLog[] = [];
    jobsStatistics: JobStatistics | null = null;
    jobsConfiguration: JobConfiguration | null = null;

    // Filtros
    selectedJobType = '';
    selectedStatus = '';
    startDate: Date | null = null;
    endDate: Date | null = null;

    // Tabla de logs
    logsDisplayedColumns: string[] = ['jobType', 'status', 'startedAt', 'duration', 'recordsProcessed', 'actions'];
    filteredJobsLogs = new MatTableDataSource<JobLog>([]);

    constructor(
        private jobsService: JobsMonitoringService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.loadAllData();
        this.setupAutoRefresh();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    ngAfterViewInit(): void {
        if (this.paginator) {
            this.filteredJobsLogs.paginator = this.paginator;
        }
    }

    // ===== MÉTODOS DE CARGA DE DATOS =====

    loadAllData(): void {
        this.loadSystemStatus();
        this.loadJobsLogs();
        this.loadJobsStatistics();
        this.loadJobsConfiguration();
    }

    loadSystemStatus(): void {
        this.jobsService.getSystemStatus()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (status) => {
                    this.systemStatus = status;
                    this.error = null;
                },
                error: (error) => {
                    console.error('Error loading system status:', error);
                    this.error = 'Error al cargar el estado del sistema';
                }
            });
    }

    loadJobsLogs(): void {
        this.jobsService.getJobsLogs()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response: any) => {
                    // La respuesta puede ser un array directo o un objeto con logs
                    this.jobsLogs = Array.isArray(response) ? response : (response.logs || []);
                    this.applyFilters();
                    this.error = null;
                },
                error: (error) => {
                    console.error('Error loading jobs logs:', error);
                    this.error = 'Error al cargar los logs de jobs';
                }
            });
    }

    loadJobsStatistics(): void {
        this.jobsService.getJobsStatistics('24h')
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (statistics) => {
                    this.jobsStatistics = statistics;
                    this.error = null;
                },
                error: (error) => {
                    console.error('Error loading jobs statistics:', error);
                    this.error = 'Error al cargar las estadísticas';
                }
            });
    }

    loadJobsConfiguration(): void {
        this.jobsService.getJobsConfiguration()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (configuration) => {
                    this.jobsConfiguration = configuration;
                    this.error = null;
                },
                error: (error) => {
                    console.error('Error loading jobs configuration:', error);
                    this.error = 'Error al cargar la configuración';
                }
            });
    }

    // ===== MÉTODOS DE CONTROL DEL SISTEMA =====

    initializeJobs(): void {
        this.isLoading = true;
        this.jobsService.initializeJobs()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.showSuccessMessage('Sistema de jobs inicializado correctamente');
                    this.loadSystemStatus();
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Error initializing jobs:', error);
                    this.showErrorMessage('Error al inicializar el sistema de jobs');
                    this.isLoading = false;
                }
            });
    }

    startJobs(): void {
        this.isLoading = true;
        this.jobsService.startJobs()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.showSuccessMessage('Jobs iniciados correctamente');
                    this.loadSystemStatus();
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Error starting jobs:', error);
                    this.showErrorMessage('Error al iniciar los jobs');
                    this.isLoading = false;
                }
            });
    }

    stopJobs(): void {
        this.isLoading = true;
        this.jobsService.stopJobs()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.showSuccessMessage('Jobs detenidos correctamente');
                    this.loadSystemStatus();
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Error stopping jobs:', error);
                    this.showErrorMessage('Error al detener los jobs');
                    this.isLoading = false;
                }
            });
    }

    restartJobs(): void {
        this.isLoading = true;
        this.jobsService.restartJobs()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.showSuccessMessage('Jobs reiniciados correctamente');
                    this.loadSystemStatus();
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Error restarting jobs:', error);
                    this.showErrorMessage('Error al reiniciar los jobs');
                    this.isLoading = false;
                }
            });
    }

    runJob(jobName: string): void {
        this.isLoading = true;
        this.jobsService.runJob(jobName)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.showSuccessMessage(`Job '${jobName}' ejecutado correctamente`);
                    this.loadJobsLogs();
                    this.loadSystemStatus();
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error(`Error running job ${jobName}:`, error);
                    this.showErrorMessage(`Error al ejecutar el job '${jobName}'`);
                    this.isLoading = false;
                }
            });
    }

    refreshSystemStatus(): void {
        this.loadAllData();
    }

    // ===== MÉTODOS DE FILTRADO =====

    applyFilters(): void {
        let filteredData = [...this.jobsLogs];

        // Filtro por tipo de job
        if (this.selectedJobType) {
            filteredData = filteredData.filter(log => log.jobType === this.selectedJobType);
        }

        // Filtro por estado
        if (this.selectedStatus) {
            filteredData = filteredData.filter(log => log.status === this.selectedStatus);
        }

        // Filtro por fecha de inicio
        if (this.startDate) {
            const startDateStr = this.startDate.toISOString().split('T')[0];
            filteredData = filteredData.filter(log => {
                const logDate = new Date(log.startedAt).toISOString().split('T')[0];
                return logDate >= startDateStr;
            });
        }

        // Filtro por fecha de fin
        if (this.endDate) {
            const endDateStr = this.endDate.toISOString().split('T')[0];
            filteredData = filteredData.filter(log => {
                const logDate = new Date(log.startedAt).toISOString().split('T')[0];
                return logDate <= endDateStr;
            });
        }

        this.filteredJobsLogs.data = filteredData;
        
        // Reiniciar paginación después de filtrar
        if (this.paginator) {
            this.paginator.firstPage();
        }
    }

    onJobTypeFilterChange(): void {
        this.applyFilters();
    }

    onStatusFilterChange(): void {
        this.applyFilters();
    }

    onStartDateChange(): void {
        this.applyFilters();
    }

    onEndDateChange(): void {
        this.applyFilters();
    }

    // ===== MÉTODOS DE UTILIDAD =====

    getSystemStatusSummary(): { status: string; message: string } {
        if (!this.systemStatus) {
            return { status: 'unknown', message: 'Estado desconocido' };
        }

        if (this.systemStatus.systemRunning && this.systemStatus.systemInitialized) {
            return { status: 'healthy', message: 'Sistema operativo' };
        } else if (this.systemStatus.systemInitialized) {
            return { status: 'warning', message: 'Sistema pausado' };
        } else {
            return { status: 'error', message: 'Sistema no inicializado' };
        }
    }

    getJobStatusClass(status: string): string {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'running':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    getJobTypeIcon(jobType: string): string {
        switch (jobType) {
            case 'health_check':
                return 'favorite';
            case 'automated_metrics_sync':
                return 'bar_chart';
            case 'token_validation':
                return 'vpn_key';
            case 'data_cleanup':
                return 'cleaning_services';
            default:
                return 'work';
        }
    }

    getJobTypeTooltip(jobType: string): string {
        switch (jobType) {
            case 'health_check':
                return 'Verifica el estado de salud del sistema, incluyendo conexión a base de datos, API de Meta y conexiones activas. Se ejecuta cada hora para monitorear el sistema.';
            case 'automated_metrics_sync':
                return 'Sincroniza automáticamente las métricas de redes sociales desde Facebook e Instagram. Se ejecuta diariamente a las 2:00 AM para recopilar datos de rendimiento.';
            case 'token_validation':
                return 'Valida los tokens de acceso de Meta API para asegurar que siguen siendo válidos. Se ejecuta cada 6 horas para mantener las conexiones activas.';
            case 'data_cleanup':
                return 'Limpia datos antiguos del sistema, incluyendo logs de sincronización y validaciones de tokens. Se ejecuta semanalmente los domingos a las 3:00 AM.';
            default:
                return 'Job del sistema de automatización de tareas.';
        }
    }

    getErrorTooltip(log: JobLog): string {
        if (!log.errorMessage) {
            return '';
        }

        // Si es un health_check, formatear el JSON
        if (log.jobType === 'health_check') {
            try {
                const healthData = JSON.parse(log.errorMessage);
                return `Estado del sistema:
• Base de datos: ${healthData.database ? 'Conectada' : 'Desconectada'}
• Meta API: ${healthData.metaApi ? 'Disponible' : 'No disponible'}
• Conexiones activas: ${healthData.activeConnections || 0}
• Tokens válidos: ${healthData.validTokens || 0}
• Actividad reciente: ${healthData.recentActivity ? 'Sí' : 'No'}`;
            } catch (e) {
                return log.errorMessage;
            }
        }

        // Para otros tipos de errores
        if (log.errorMessage.includes('MetaConnection is associated')) {
            return 'Error de configuración de base de datos: Problema con la asociación entre modelos MetaConnection y ClinicMetaAsset. Contacte al administrador del sistema.';
        }

        return log.errorMessage;
    }

    formatDuration(startedAt: string, completedAt: string | null): string {
        if (!completedAt) {
            return 'En progreso...';
        }

        const start = new Date(startedAt).getTime();
        const end = new Date(completedAt).getTime();
        const duration = end - start;

        if (duration < 1000) {
            return `${duration}ms`;
        } else if (duration < 60000) {
            return `${Math.round(duration / 1000)}s`;
        } else {
            return `${Math.round(duration / 60000)}m`;
        }
    }

    // Método para formatear fechas en español
    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    clearError(): void {
        this.error = null;
    }

    // ===== MÉTODOS PRIVADOS =====

    private setupAutoRefresh(): void {
        // Refrescar cada 30 segundos
        setInterval(() => {
            if (!this.isLoading) {
                this.loadSystemStatus();
                this.loadJobsLogs();
            }
        }, 30000);
    }

    private showSuccessMessage(message: string): void {
        this.snackBar.open(message, 'Cerrar', {
            duration: 5000,
            panelClass: ['success-snackbar']
        });
    }

    private showErrorMessage(message: string): void {
        this.snackBar.open(message, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
        });
    }
}

