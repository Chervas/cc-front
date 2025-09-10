import { NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from 'app/core/auth/auth.service';

interface Clinic { id: number; nombre: string; url_avatar?: string; url_web?: string; hasWebsite?: boolean; }
interface WebsiteAsset { id: string; name: string; propertyType: 'sc-domain'|'url-prefix'; permissionLevel?: string; }

@Component({
  selector: 'app-google-asset-mapping',
  standalone: true,
  templateUrl: './google-asset-mapping.component.html',
  imports: [NgClass, NgFor, NgIf, ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatExpansionModule, MatIconModule, MatProgressBarModule, MatProgressSpinnerModule, MatStepperModule, MatTooltipModule]
})
export class GoogleAssetMappingComponent {
  @Input() title = 'Mapear propiedades de Search Console';
  @Input() subtitle = 'Selecciona sitios verificados y asígnalos a tus clínicas';
  @Output() mappingComplete = new EventEmitter<{ success: boolean; mapped: number }>();
  @Output() cancelled = new EventEmitter<void>();

  isCheckingConnection = true;
  isConnected = false;
  isLoadingAssets = false;
  isLoadingClinics = false;
  isSubmitting = false;
  progress = 0;

  assets: WebsiteAsset[] = [];
  clinics: Clinic[] = [];
  selectedAssetIds: string[] = [];
  selectedClinicIds: number[] = [];

  assetForm: FormGroup;
  clinicForm: FormGroup;

  constructor(private http: HttpClient, private fb: FormBuilder, private cdr: ChangeDetectorRef, private snack: MatSnackBar, private auth: AuthService) {
    this.assetForm = this.fb.group({ selected: [[], Validators.required] });
    this.clinicForm = this.fb.group({ selected: [[], Validators.required] });
  }

  ngOnInit(): void {
    this.checkConnection();
  }

  private checkConnection(): void {
    this.isCheckingConnection = true;
    this.http.get<any>('https://autenticacion.clinicaclick.com/oauth/google/connection-status').subscribe({
      next: (r) => {
        this.isConnected = !!r?.connected;
        this.isCheckingConnection = false;
        this.cdr.markForCheck();
        if (this.isConnected) { this.loadAssetsAndClinics(); }
      },
      error: () => { this.isConnected = false; this.isCheckingConnection = false; this.cdr.markForCheck(); }
    });
  }

  private async loadAssetsAndClinics(): Promise<void> {
    this.isLoadingAssets = true;
    this.isLoadingClinics = true;
    this.progress = 10;
    this.cdr.markForCheck();
    try {
      const assetsResp = await this.http.get<any>('https://autenticacion.clinicaclick.com/oauth/google/assets').toPromise();
      const list: WebsiteAsset[] = (assetsResp?.assets || []).map((a: any) => ({ id: a.siteUrl, name: a.siteUrl, propertyType: a.propertyType, permissionLevel: a.permissionLevel }));
      this.assets = list;
      this.progress = 60;
    } catch (e) {
      this.snack.open('❌ Error cargando propiedades de Search Console', '', { duration: 4000 });
    } finally {
      this.isLoadingAssets = false; this.cdr.markForCheck();
    }

    try {
      // Clínicas del usuario: obtener usuario actual
      // Intentar leer usuario de negocio completo desde localStorage
      let current: any = null;
      try { current = JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch {}
      if (!current) { current = await firstValueFrom(this.auth.getCurrentUser()); }
      const userId = current?.id_usuario || current?.id;
      const roleStr = (current?.rol_usuario || current?.rol || '').toString().toLowerCase();
      const isAdmin = !!(current?.isAdmin || roleStr === 'administrador' || roleStr === 'admin');
      let clinics: any[] = [];
      if (isAdmin) {
        // Admin: ver todas las clínicas
        clinics = await this.http.get<any[]>(`https://crm.clinicaclick.com/api/clinicas`).toPromise();
      } else {
        // Usuario normal: clínicas asociadas
        clinics = await this.http.get<any[]>(`https://crm.clinicaclick.com/api/users/${userId}/clinicas`).toPromise();
      }
      this.clinics = (clinics || []).map((c: any) => ({
        id: c.id_clinica || c.id,
        nombre: c.nombre_clinica || c.nombre,
        url_avatar: c.url_avatar,
        url_web: c.url_web,
        hasWebsite: !!(c.url_web && String(c.url_web).trim())
      }));
      this.progress = 100;
    } catch (e) {
      this.snack.open('❌ Error cargando clínicas', '', { duration: 4000 });
    } finally {
      this.isLoadingClinics = false; this.cdr.markForCheck();
    }
  }

  toggleAsset(id: string, checked: boolean): void {
    this.selectedAssetIds = checked ? Array.from(new Set([...this.selectedAssetIds, id])) : this.selectedAssetIds.filter(x => x !== id);
    this.assetForm.patchValue({ selected: this.selectedAssetIds });
  }

  toggleClinic(id: number, checked: boolean): void {
    this.selectedClinicIds = checked ? Array.from(new Set([...this.selectedClinicIds, id])) : this.selectedClinicIds.filter(x => x !== id);
    this.clinicForm.patchValue({ selected: this.selectedClinicIds });
  }

  async submit(): Promise<void> {
    if (this.selectedAssetIds.length === 0 || this.selectedClinicIds.length === 0) {
      this.snack.open('Selecciona al menos un sitio y una clínica', '', { duration: 3000 });
      return;
    }
    this.isSubmitting = true; this.progress = 0; this.cdr.markForCheck();
    try {
      const mappings: any[] = [];
      for (const clinicaId of this.selectedClinicIds) {
        for (const siteUrl of this.selectedAssetIds) {
          const asset = this.assets.find(a => a.id === siteUrl);
          mappings.push({ clinicaId, siteUrl, propertyType: asset?.propertyType, permissionLevel: asset?.permissionLevel });
        }
      }
      const resp = await this.http.post<any>('https://autenticacion.clinicaclick.com/oauth/google/map-assets', { mappings }).toPromise();
      const mapped = resp?.mapped || 0;
      this.snack.open(`✅ Mapeados ${mapped} elemento(s)`, '', { duration: 4000 });
      this.mappingComplete.emit({ success: true, mapped });
    } catch (e) {
      this.snack.open('❌ Error enviando mapeo', '', { duration: 4000 });
      this.mappingComplete.emit({ success: false, mapped: 0 });
    } finally {
      this.isSubmitting = false; this.cdr.markForCheck();
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }

  clinicNameById(cid: number): string {
    const c = this.clinics.find(x => x.id === cid);
    return c?.nombre || String(cid);
  }
}
