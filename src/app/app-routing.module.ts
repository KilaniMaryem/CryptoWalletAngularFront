import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CreateAccountComponent } from './create-account/create-account.component';
import { RecoverAccountComponent } from './recover-account/recover-account.component';
import { WalletViewComponent } from './wallet-view/wallet-view.component';
import { AccessAccountComponent } from './access-account/access-account.component';
import { BlockExplorerComponent } from './block-explorer/block-explorer.component';
import { VoiceAuthErrorComponent } from './voice-auth-error/voice-auth-error.component';
import { TfaComponent } from './tfa/tfa.component';
import { SettingsComponent } from './settings/settings.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'access', component: AccessAccountComponent },
  { path: 'tfa', component: TfaComponent },
  { path: 'create', component: CreateAccountComponent },
  { path: 'recover', component: RecoverAccountComponent },
  { path: 'block-explorer', component: BlockExplorerComponent },
  { path: 'yourwallet/:seedPhrase/:walletAddress', component: WalletViewComponent },
  { path: 'voiceAuthError',component:VoiceAuthErrorComponent },
  { path: 'settings',component:SettingsComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

