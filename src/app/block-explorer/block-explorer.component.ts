import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ethers } from 'ethers';
import { environment } from 'src/environment';

@Component({
  selector: 'app-block-explorer',
  templateUrl: './block-explorer.component.html',
  styleUrls: ['./block-explorer.component.css']
})
export class BlockExplorerComponent implements OnInit {
  inboundTransactions: any[] = [];
  outboundTransactions: any[] = [];
  fetching: boolean = true;
  userAddress: string = '';
  chain: string = '';
  seedPhrase: string=""; 
  

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {

      this.userAddress = params['userAddress'];
      this.chain = params['chain'];
      this.seedPhrase = params['seedPhrase']; 


      if (this.userAddress && this.chain) {
        this.getWalletTransactions();
      }
    });
  }
  /*------------------------------------------------------------------------------------------------------------*/
  logout() {
    localStorage.removeItem('storedSeedPhrase');
    localStorage.removeItem('storedWallet');
   
    this.router.navigate(['/']);
  }
  /*------------------------------------------------------------------------------------------------------------*/
  weiToEth(wei: string): string {
    const weiNumber = parseFloat(wei);
    if (!isNaN(weiNumber)) {
      const ethValue = weiNumber / 10**18;
      return ethValue.toFixed(5); 
    }
    return '0'; 
  }
 /*------------------------------------------------------------------------------------------------------------*/
    async getWalletTransactions() {
      this.fetching=false
      try {
        const etherscan = require('etherscan-api').init(environment.ETHERSCAN_API_KEY,'sepolia');
        const transactionsData = await etherscan.account.txlist(this.userAddress, 1, 'latest', 1, 100, 'asc');
        const transactions = transactionsData.result;
    
        if (!transactions || transactions.length === 0) {
          return;
        }
        this.inboundTransactions = this.extractTransactionDetails(transactions.filter((tx :any)=> tx.to && tx.to.toLowerCase() === this.userAddress.toLowerCase()));
        this.outboundTransactions = this.extractTransactionDetails(transactions.filter((tx :any) => tx.from && tx.from.toLowerCase() === this.userAddress.toLowerCase()));
    
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    }
/*------------------------------------------------------------------------------------------------------------*/
    extractTransactionDetails(transactions: any[]): any[] {
      return transactions.map(tx => ({
        from: tx.from,
        to: tx.to,
        value: tx.value,
        blockNumber: tx.blockNumber,
        hash: tx.hash,
        chain: this.chain, 
        blockTimestamp: tx.timeStamp
      }));
    }
  
}


