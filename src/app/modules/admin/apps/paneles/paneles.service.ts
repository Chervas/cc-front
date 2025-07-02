import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PanelesService {
    private _data: BehaviorSubject<any> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {
        // Initialize with mock data
        this._data.next(this._getMockData());
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for data
     */
    get data$(): Observable<any> {
        return this._data.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get data
     */
    getData(): Observable<any> {
        // For now, return mock data
        // Later you can uncomment the HTTP call
        // return this._httpClient.get('api/dashboards/project').pipe(
        //     tap((response: any) => {
        //         this._data.next(response);
        //     }),
        // );
        
        this._data.next(this._getMockData());
        return this._data.asObservable();
    }

    /**
     * Get mock data
     */
    private _getMockData(): any {
        return {
            summary: {
                budget: 32000,
                spent: 18600,
                remaining: 13400,
                completed: 68
            },
            githubIssues: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
                series: [
                    {
                        name: 'New issues',
                        type: 'line',
                        data: [42, 28, 43, 34, 20, 25, 22, 28, 20]
                    },
                    {
                        name: 'Closed issues',
                        type: 'column',
                        data: [11, 10, 8, 11, 8, 10, 17, 9, 7]
                    }
                ]
            },
            taskDistribution: {
                labels: ['Frontend', 'Backend', 'API', 'Issues'],
                series: [15, 20, 38, 27]
            },
            budgetDistribution: {
                categories: ['Concept', 'Design', 'Development', 'Testing', 'Marketing', 'Maintenance'],
                series: [
                    {
                        name: 'Budget Distribution',
                        data: [83, 73, 62, 84, 67, 79]
                    }
                ]
            },
            weeklyExpenses: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                series: [
                    {
                        name: 'Expenses',
                        data: [37, 32, 39, 27, 18, 24, 20]
                    }
                ]
            },
            monthlyExpenses: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                series: [
                    {
                        name: 'Expenses',
                        data: [2100, 1800, 2800, 2200, 2600, 3000]
                    }
                ]
            },
            yearlyExpenses: {
                labels: ['2019', '2020', '2021', '2022', '2023'],
                series: [
                    {
                        name: 'Expenses',
                        data: [25000, 24000, 32000, 28000, 26000]
                    }
                ]
            }
        };
    }
}