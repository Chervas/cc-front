import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root'
})
export class MarketingService {
    private baseUrl = environment.apiUrl;

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient
    ) { }

    // -----------------------------------------------------------------------------------------------------
    // @ Campañas methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all campaigns
     */
    getCampanas(): Observable<any[]> {
        return this._httpClient.get<any[]>(`${this.baseUrl}/campanas`);
    }

    /**
     * Get campaign by id
     */
    getCampana(id: string): Observable<any> {
        return this._httpClient.get<any>(`${this.baseUrl}/campanas/${id}`);
    }

    /**
     * Create campaign
     */
    createCampana(campana: any): Observable<any> {
        return this._httpClient.post<any>(`${this.baseUrl}/campanas`, campana);
    }

    /**
     * Update campaign
     */
    updateCampana(id: string, campana: any): Observable<any> {
        return this._httpClient.put<any>(`${this.baseUrl}/campanas/${id}`, campana);
    }

    /**
     * Delete campaign
     */
    deleteCampana(id: string): Observable<any> {
        return this._httpClient.delete<any>(`${this.baseUrl}/campanas/${id}`);
    }

    /**
     * Save multiple campaigns
     */
    saveCampaigns(campaigns: any[]): Observable<any> {
        // Create multiple campaigns in sequence
        return of(campaigns).pipe(
            map(campaigns => {
                campaigns.forEach(campaign => {
                    this.createCampana(campaign).subscribe();
                });
                return true;
            })
        );
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Leads methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all leads
     */
    getLeads(): Observable<any[]> {
        return this._httpClient.get<any[]>(`${this.baseUrl}/leads`);
    }

    /**
     * Get lead by id
     */
    getLead(id: string): Observable<any> {
        return this._httpClient.get<any>(`${this.baseUrl}/leads/${id}`);
    }

    /**
     * Create lead
     */
    createLead(lead: any): Observable<any> {
        return this._httpClient.post<any>(`${this.baseUrl}/leads`, lead);
    }

    /**
     * Update lead
     */
    updateLead(id: string, lead: any): Observable<any> {
        return this._httpClient.put<any>(`${this.baseUrl}/leads/${id}`, lead);
    }

    /**
     * Delete lead
     */
    deleteLead(id: string): Observable<any> {
        return this._httpClient.delete<any>(`${this.baseUrl}/leads/${id}`);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Facebook methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Verify Facebook token
     */
    verifyFacebookToken(accessToken: string): Observable<any> {
        return this._httpClient.post<any>(`${this.baseUrl}/facebook/verify-token`, { accessToken });
    }

    /**
     * Get ad accounts
     */
    getAdAccounts(accessToken: string = 'demo-token'): Observable<any> {
        return this._httpClient.post<any>(`${this.baseUrl}/facebook/ad-accounts`, { accessToken });
    }

    /**
     * Get campaigns
     */
    getCampaigns(adAccountId: string, accessToken: string = 'demo-token'): Observable<any> {
        return this._httpClient.post<any>(`${this.baseUrl}/facebook/campaigns`, { accessToken, adAccountId });
    }
}
