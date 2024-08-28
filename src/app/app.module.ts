import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './home/home.component';
import { CreateAccountComponent } from './create-account/create-account.component';
import { RecoverAccountComponent } from './recover-account/recover-account.component';
import { WalletViewComponent } from './wallet-view/wallet-view.component';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { AccessAccountComponent } from './access-account/access-account.component';
import { HttpClientModule } from '@angular/common/http';
import { MatExpansionModule } from '@angular/material/expansion';
import { ServiceWorkerModule } from '@angular/service-worker';
import { BlockExplorerComponent } from './block-explorer/block-explorer.component';
import { VoiceAuthErrorComponent } from './voice-auth-error/voice-auth-error.component';
import { TfaComponent } from './tfa/tfa.component';
import { SettingsComponent } from './settings/settings.component';




@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    CreateAccountComponent,
    RecoverAccountComponent,
    WalletViewComponent,
    AccessAccountComponent,
    BlockExplorerComponent,
    VoiceAuthErrorComponent,
    TfaComponent,

    SettingsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    BrowserAnimationsModule,
    MatIconModule,
    MatCardModule,

    MatTabsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,

    MatTooltipModule,

    HttpClientModule,

    MatExpansionModule,


    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    




  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

