import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-tfa',
  templateUrl: './tfa.component.html',
  styleUrls: ['./tfa.component.css']
})
export class TfaComponent implements OnInit {
  publicAddress: string = '';
  tfaCode: string = '';
  errorMessage: string = '';
 
  setupMode: string = '';
  qrCodeUrl: string | null = null;
  tfaEnabled: boolean = false;
  fetchedTfaSecret:string=""

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.publicAddress = this.route.snapshot.queryParams['publicAddress'];
    this.tfaEnabled = this.route.snapshot.queryParams['tfaEnabled'] === 'true';
    this.setupMode = this.route.snapshot.queryParams['setupMode'];
    this.qrCodeUrl = this.route.snapshot.queryParams['qrCodeUrl'] || null;

  }
/*------------------------------------------------------------------------------------------------------------*/
  verifyTfa() {
    this.errorMessage = '';
    if (!this.tfaCode) {
      this.errorMessage = 'Please enter the TFA code.';
      return;
    }
  
      this.http.get<{ tfaSecret: string }>(`http://localhost:3000/user/get/${this.publicAddress}`)
        .subscribe(
          response => {
            this.fetchedTfaSecret=response.tfaSecret;}
          )
    
    
    this.http.post<{ status: number, message: string, tfaSecret?: string }>(`http://localhost:3000/tfa/verify`, {
      publicAddress: this.publicAddress,
      token: this.tfaCode,
      setupMode:this.setupMode,
      secret: this.fetchedTfaSecret
    }).subscribe(response => {
      if (response.message === 'Two-factor Auth is enabled successfully') {
        
       
          this.http.post('http://localhost:3000/user/update-secret', {
            publicAddress: this.publicAddress,
            tfaSecret: this.tfaCode
          }).subscribe(() => {
            this.router.navigate(['/yourwallet', 'none', this.publicAddress], {
              queryParams: { tfaEnabled: true }
            });
          }, error => {
            this.errorMessage = 'Failed to update user with TFA secret.';
          });
        } 
      } 
    , error => {
      this.errorMessage = 'An error occurred during TFA verification.';
    });
  }
/*------------------------------------------------------------------------------------------------------------*/
  cancel() {
    this.router.navigate(['/']);
  }
/*------------------------------------------------------------------------------------------------------------*/
verifyFromDB() {
  this.http.get<{ tfaSecret: string }>(`http://localhost:3000/user/get/${this.publicAddress}`)
    .subscribe(
      response => {
        this.fetchedTfaSecret = response.tfaSecret;
        if (this.tfaCode === this.fetchedTfaSecret) {
          this.router.navigate(['/yourwallet', 'none', this.publicAddress]);
        } else {
          this.errorMessage = "Invalid code";  
        }
      },
      error => {
        this.errorMessage = "This code doesn't correspond to the one you created your account";  
      }
    );
}

}
