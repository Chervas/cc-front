import { ChangeDetectionStrategy, Component, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ClinicasService } from './clinicas.service';
import { ClinicFilterService } from 'app/core/services/clinic-filter-service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector       : 'clinicas',
    templateUrl    : './clinicas.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [RouterOutlet],
})
export class ClinicasComponent implements OnInit, OnDestroy {
    private _unsubscribeAll = new Subject<void>();

    constructor(
        private _clinicasService: ClinicasService,
        private _clinicFilter: ClinicFilterService
    ) {}

    ngOnInit(): void {
        // Cargar según filtro de clínica
        this._clinicFilter.selectedClinicId$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((filter) => {
                this._clinicasService.getClinicas(filter || undefined).subscribe();
            });
        // Inicial
        const init = this._clinicFilter.getCurrentClinicFilter();
        this._clinicasService.getClinicas(init || undefined).subscribe();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
}
