import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  showSeed: boolean=false
  showPrivateKey: boolean=false
  SeedPhrase: string= "";
  publicAddress: string = "";
  publicKey: string = "";
  privateKey: string= "";
  activeCard: string="";
  tfaEnabled: boolean=false
  isEditing: boolean = false;
  email: string ="" 
  newEmail: string = ''; 
  blockedAddresses: { publicAddress: string; note: string }[] = [];
  isAddingBlockedAddress: boolean = false;
  newBlockedAddress: string = '';
  newNote: string = '';
  
  constructor(private route: ActivatedRoute, private http: HttpClient,private router: Router) {}
/*------------------------------------------------------------------------------------------------------------*/
  ngOnInit(): void {
    this.publicAddress = this.route.snapshot.queryParams['publicAddress'];
    this.fetchUserInfo();
    this.fetchBlockedAddresses();
  }
/*------------------------------------------------------------------------------------------------------------*/
  fetchBlockedAddresses() {
    this.blockedAddresses=[]
    this.http.get<{ [key: string]: string }>(`http://localhost:3000/user/get-blocked-addresses/${this.publicAddress}`)
      .subscribe((response) => {
        this.blockedAddresses = Object.entries(response).map(([publicAddress, note]) => ({ publicAddress, note }));
      });
  }
/*------------------------------------------------------------------------------------------------------------*/
  toggleAddBlockedAddress(): void {
    this.isAddingBlockedAddress = !this.isAddingBlockedAddress;
    if (!this.isAddingBlockedAddress) {
      this.newBlockedAddress = '';
      this.newNote = '';
    }
  }
/*------------------------------------------------------------------------------------------------------------*/
  addBlockedAddress(): void {
    if (this.newBlockedAddress) {
      this.http.put(`http://localhost:3000/user/update-blocked-address/${this.publicAddress}`, {
        addressToBlock: this.newBlockedAddress,
        note: this.newNote
      }).subscribe(
        () => {
          this.fetchBlockedAddresses(); 
          this.newBlockedAddress = ''; 
          this.newNote = '';
          this.isAddingBlockedAddress = false; 
        },
        (error) => {
          console.error('Failed to add blocked address:', error);
        }
      );
    }
  }
/*------------------------------------------------------------------------------------------------------------*/
  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.newEmail = this.email; 
    }
  }
/*------------------------------------------------------------------------------------------------------------*/
  updateEmail(): void {
    if (this.newEmail) {
      this.http.put(`http://localhost:3000/user/update-email/${this.publicAddress}`, { emailAddress: this.newEmail }).subscribe(
        () => {
          this.email = this.newEmail; 
          this.newEmail = ''; 
          this.isEditing = false; 
        },
        (error) => {
          console.error('Failed to update email:', error);
        }
      );
    }
  }
/*------------------------------------------------------------------------------------------------------------*/
  fetchUserInfo(): void {
    this.http.get<any>(`http://localhost:3000/user/get/${this.publicAddress}`).subscribe(
      (user) => {
        this.SeedPhrase = user.SeedPhrase;
        this.privateKey = user.privateKey;
        this.publicKey = user.publicKey;
        this.tfaEnabled=user.tfaEnabled;
        this.blockedAddresses = user.blockedAddresses ;
        this.email = user.emailAddress;
      },
      (error) => {
        console.error('Failed to fetch user info:', error);
      }
    );
  }
/*------------------------------------------------------------------------------------------------------------*/
  toggleSeedVisibility(): void {
    this.showSeed = !this.showSeed;
  }
/*------------------------------------------------------------------------------------------------------------*/
  togglePrivateKeyVisibility(): void {
    this.showPrivateKey = !this.showPrivateKey;
  }
/*------------------------------------------------------------------------------------------------------------*/
  toggleCard(param:string){
    this.activeCard=param;
  }
/*------------------------------------------------------------------------------------------------------------*/
  toggleTfa(): void {
    this.tfaEnabled = !this.tfaEnabled;
    this.http.put(`http://localhost:3000/user/update-tfa-enabled/${this.publicAddress}`, { tfaEnabled: this.tfaEnabled }).subscribe(
      () => {
        console.log('TFA status updated successfully');
      },
      (error) => {
        console.error('Failed to update TFA status:', error);
        // If there's an error, revert the TFA toggle in the UI
        this.tfaEnabled = !this.tfaEnabled;
      }
    );
  }
/*------------------------------------------------------------------------------------------------------------*/
  logout() {
    localStorage.removeItem('storedSeedPhrase');
    localStorage.removeItem('storedWallet');
   
    this.router.navigate(['/']);
  }
/*------------------------------------------------------------------------------------------------------------*/
  unblockAddress(addressToUnblock: string){
    const url = `http://localhost:3000/user/${this.publicAddress}/${addressToUnblock}`;
     this.http.delete<void>(url).subscribe(
      () => {
        this.fetchBlockedAddresses()
      },
      (error) => {
        console.error('Failed to delete @:', error);
  })
}
}
