import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ethers } from 'ethers';

@Component({
  selector: 'app-recover-account',
  templateUrl: './recover-account.component.html',
  styleUrls: ['./recover-account.component.css']
})
export class RecoverAccountComponent {
  typedSeed: string = '';
  publicAddress: string = '';

  nonValid: boolean = false;

  constructor(private router: Router) { }
/*------------------------------------------------------------------------------------------------------------*/
  seedAdjust(event: any) {
    this.nonValid = false;
    this.typedSeed = event.target.value;
  }
 /*------------------------------------------------------------------------------------------------------------*/
  recoverWallet() {
    try {
      const recoveredWallet = ethers.Wallet.fromPhrase(this.typedSeed);
      this.publicAddress=recoveredWallet.address;
      this.router.navigate(['/yourwallet', this.typedSeed, recoveredWallet.address]);
    } catch (err) {
      this.nonValid = true;
      console.error('Error recovering wallet:', err);
      return;
    }
  }
 /*------------------------------------------------------------------------------------------------------------*/
  navigateHome() {
    this.router.navigate(['/']);
  }
}

