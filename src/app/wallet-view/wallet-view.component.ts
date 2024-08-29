import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ethers } from 'ethers';
import { environment } from 'src/environment';
import { Alchemy, Network } from 'alchemy-sdk';


@Component({
  selector: 'app-wallet-view',
  templateUrl: './wallet-view.component.html',
  styleUrls: ['./wallet-view.component.css'],
})
export class WalletViewComponent implements OnInit {
  chain = '0xaa36a7';
  showFullWallet: boolean = false;
  wallet: string = "";
  seedPhrase: string = "";
  nfts: any[] | null = null;
  balance: number = 0;
  fetching: boolean = true;
  amountToSend: number = 0;
  sendToAddress: string = "";
  processing: boolean = false;
  hash: string | null = null;
  errorMessage: string | null = null;
  isWalletView: boolean = true;
  storedSeedPhrase: string | null = null;
  storedWallet: string | null = null;
  showConfirmation: boolean = false;
  balanceError: boolean = false;
  nftError: boolean = false;
  nftsTotalCount: number = 0;
  nftList: any[] = [];
  @Output() walletCreated = new EventEmitter<{ seedPhrase: string, wallet: string }>();
  blockedAddresses: any;
  showBlockedAddressWarning: boolean = false;
  tfaEnabled: boolean = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private http: HttpClient
  ) { }
  /*---------------------------------------------------------------------------------------------*/
  ngOnInit(): void {

    this.storedSeedPhrase = localStorage.getItem('storedSeedPhrase');
    this.storedWallet = localStorage.getItem('storedWallet');
    if (this.storedSeedPhrase && this.storedWallet) {
      this.seedPhrase = this.storedSeedPhrase;
      this.wallet = this.storedWallet;
      this.fetchData(this.wallet);
    }

    this.activatedRoute.params.subscribe(params => {
      const seedPhrase = params['seedPhrase'];
      const walletAddress = params['walletAddress'];


      if (seedPhrase && walletAddress) {
        this.wallet = walletAddress;
        this.seedPhrase = seedPhrase;
        this.fetchData(walletAddress);
        localStorage.setItem('storedSeedPhrase', seedPhrase);
        localStorage.setItem('storedWallet', walletAddress);
      }
    });
    this.activatedRoute.queryParams.subscribe(queryParams => {
      this.tfaEnabled = queryParams['tfaEnabled'];
    })
    this.fetchBlockedAddresses();
  }
  /*---------------------------------------------------------------------------------------------*/
  async fetchData(walletAddress: string) {
    this.fetching = true;
    this.nfts = [];
    this.balanceError = false;
    this.nftError = false;

    try {
      const etherscan = require('etherscan-api').init(environment.ETHERSCAN_API_KEY, 'sepolia');
      const balanceData = await etherscan.account.balance(walletAddress);
      const balanceInWei = balanceData.result;
      this.balance = parseFloat(balanceInWei) / Math.pow(10, 18);
    } catch (error) {
      console.error('Error fetching balance:', error);
      this.balanceError = true;
    }
    try {
      const alchemy = new Alchemy({
        apiKey: environment.rpcApiKey,
        network: Network.ETH_SEPOLIA,
      });
      const nftsResponse = await alchemy.nft.getNftsForOwner(walletAddress);
      this.nfts = nftsResponse.ownedNfts;
      this.nftsTotalCount = nftsResponse.totalCount;

    } catch (error) {
      console.error('Error fetching NFTs:', error);
      this.nftError = true;
    }

    this.fetching = false;
  }
  /*---------------------------------------------------------------------------------------------*/
  onInputChange() {
    if (this.errorMessage) {
      this.errorMessage = null;
    }
  }
  onInputChange2() {
    if (this.showBlockedAddressWarning) {
    this.showBlockedAddressWarning = false;}
  }
 
  /*---------------------------------------------------------------------------------------------*/
  showConfirmationDialog(): void {
    this.showConfirmation = true;
    
  }
  /*---------------------------------------------------------------------------------------------*/

  /*---------------------------------------------------------------------------------------------*/
  cancelSend(): void {
    this.showConfirmation = false;
  }
  /*---------------------------------------------------------------------------------------------*/
  async fetchBlockedAddresses() {
    try {

      const response = await this.http.get<string[]>(`http://localhost:3000/user/get-blocked-addresses/${this.wallet}`).toPromise();
      this.blockedAddresses = response;
    } catch (error) {
      console.error('Failed to fetch blocked addresses:', error);
    }
  }
  /*---------------------------------------------------------------------------------------------*/


  isAddressBlocked(address: string): boolean {
    for (const blockedAddress in this.blockedAddresses) {
      if (address === blockedAddress) {

        return true;
      }
    }
    return false;
  }
  /*---------------------------------------------------------------------------------------------*/
  async confirmSend() {
    if (this.isAddressBlocked(this.sendToAddress)) {
      this.showConfirmation = false
      this.showBlockedAddressWarning = true;
      return;
    }
    if (this.amountToSend === 0 || this.sendToAddress === "") {
      this.errorMessage = 'Amount to send and recipient address are required.';
      return;
    }

    if (this.amountToSend > this.balance) {
      this.showConfirmation = false
      this.errorMessage = 'Insufficient balance';
      return;
    }
    this.showBlockedAddressWarning = false;
    this.showConfirmation = false
    await this.performTransaction();
  }
  /*---------------------------------------------------------------------------------------------*/
  async performTransaction() {
    if (this.amountToSend === 0 || this.sendToAddress === "") {
      return;
    }

    const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/' + environment.rpcApiKey);


    if (this.seedPhrase) {
      const privateKey = ethers.Wallet.fromPhrase(this.seedPhrase).privateKey;
      const wallet = new ethers.Wallet(privateKey, provider);
      const tx = {
        to: this.sendToAddress,
        value: ethers.parseEther(this.amountToSend.toString()),
      };

      this.processing = true;
      this.errorMessage = null;

      try {
        const transaction = await wallet.sendTransaction(tx);
        this.hash = transaction.hash;
        const receipt = await transaction.wait();
        this.hash = null;
        this.processing = false;
        this.amountToSend = 0;
        this.sendToAddress = "";

        if (receipt?.status === 1) {
          this.fetchData(wallet.address);
        }
      } catch (err) {
        console.error('Error sending transaction:', err);
        this.hash = null;
        this.processing = false;
        this.amountToSend = 0;
        this.sendToAddress = "";
      }
    }
  }

  /*----------------------------------------------------------------------------------------*/
  logout() {
    localStorage.removeItem('storedSeedPhrase');
    localStorage.removeItem('storedWallet');
    this.wallet = "";
    this.nfts = [];
    this.balance = 0;

    this.router.navigate(['/']);
  }
  /*---------------------------------------------------------------------------------------------*/
  goToSettings() {
    this.router.navigate(['settings'], {
      queryParams: {
        publicAddress: this.wallet
      }
    });
  }
}


