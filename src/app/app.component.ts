import { Component } from '@angular/core';
import { Router } from '@angular/router';

declare const chrome: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  
})


export class AppComponent {
  wallet: any = null;
  seedPhrase: string | null = null;
  mode: string = 'light';

  constructor(private router: Router) {}
  
  toggleDarkMode(){
    if(this.mode=="light"){this.mode="dark"}
    else{
      this.mode="light"
    }
  }
  async ngOnInit(): Promise<void> {
    
    
    
    const storedSeedPhrase = localStorage.getItem('storedSeedPhrase');
    const storedWallet = localStorage.getItem('storedWallet');

    if (storedSeedPhrase && storedWallet) {
      this.router.navigate(['/yourwallet', storedSeedPhrase, storedWallet]);
    }
    }

  

}
  





