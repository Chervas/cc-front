import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { AppComponent } from 'app/app.component';
import { appConfig } from 'app/app.config';

// Registrar datos de localización en español para pipes de fecha/número
registerLocaleData(localeEs);

bootstrapApplication(AppComponent, appConfig)
    .catch(err => console.error(err));
