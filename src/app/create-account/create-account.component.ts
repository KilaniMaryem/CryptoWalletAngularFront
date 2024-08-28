import { Component, Output, EventEmitter, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ethers } from 'ethers';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as fs from 'fs';
import { WordsGeneratorService } from '../words-generator.service';

@Component({
  selector: 'app-create-account',
  templateUrl: './create-account.component.html',
  styleUrls: ['./create-account.component.css'],
})
export class CreateAccountComponent {
  newSeedPhrase: string= "";
  isTranscribing:boolean = false;
  publicAddress: string = "";
  publicKey: string = "";
  privateKey: string= "";
  showPrivateKey: boolean = false;
  showSeed: boolean = false;

  isRecording: boolean = false;
  mediaRecorder: any;
  audioBlob: Blob | null = null;
  randomWords: string = "";
  recordingTimeout: any;
  exceedTimeMessage: string | null = null;
  transcriptionError: boolean = false;
  emailAddress: string= "";
  @ViewChild('audioPlayer') audioPlayer: ElementRef<HTMLAudioElement> | undefined;
  
  @Output() walletCreated = new EventEmitter<{ seedPhrase: string, walletAddress: string ,emailAddress:string}>();

  constructor(private router: Router, 
    private http: HttpClient, 
    private wordGeneratorService: WordsGeneratorService,
    private cdr: ChangeDetectorRef) { }

  generateWallet(): void {
    try {
      const wallet = ethers.Wallet.createRandom();

      if (wallet.mnemonic) {
        this.newSeedPhrase = wallet.mnemonic.phrase;
        this.publicAddress = wallet.address;
        this.publicKey = wallet.publicKey;
        this.privateKey = wallet.signingKey.privateKey;
      } else {
        console.error("wallet.mnemonic is null!")
      }
    } catch (error) {
      console.error("Failed to create wallet: ", error);
    }
  }
 /*------------------------------------------------------------------------------------------------------------*/
  setWalletAndMnemonic(): void {
    if (this.newSeedPhrase && this.publicAddress) {
      this.walletCreated.emit({ seedPhrase: this.newSeedPhrase, walletAddress: this.publicAddress , emailAddress:this.emailAddress });
      this.router.navigate(['/yourwallet', this.newSeedPhrase, this.publicAddress]);
    }
  }
 /*------------------------------------------------------------------------------------------------------------*/
  navigateHome(): void {
    this.router.navigate(['/']);
  }
 /*------------------------------------------------------------------------------------------------------------*/
  togglePrivateKeyVisibility(): void {
    this.showPrivateKey = !this.showPrivateKey;
  }
 /*------------------------------------------------------------------------------------------------------------*/
  toggleSeedVisibility(): void {
    this.showSeed = !this.showSeed;
  }
 /*------------------------------------------------------------------------------------------------------------*/
  async toggleRecording() {
    this.transcriptionError = false;
    if (this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      clearTimeout(this.recordingTimeout);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);

        this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
          this.audioBlob = event.data;
          const url = URL.createObjectURL(this.audioBlob);
          if (this.audioPlayer) {
            this.audioPlayer.nativeElement.src = url;
          }
        };

        this.mediaRecorder.onstop = async () => {
          try {
            this.isTranscribing = true;
            console.log("started transcribing")
            this.cdr.detectChanges();
            const transcribe = await this.transcribeAudio();
            this.isTranscribing = false; 
            console.log("done transcribing")
            this.cdr.detectChanges();
            if (!transcribe) {
              this.transcriptionError = true;
              this.cdr.detectChanges();
              console.log("Transcription failed or exceeded time limit");
            } else if (!this.exceedTimeMessage){
              await this.uploadAudio();
            }
          } catch (error) {
            this.isTranscribing = false; 
            this.transcriptionError = true;
            this.cdr.detectChanges();
            console.error("Error during transcription or uploading audio:", error);
          }
        };
        

        this.generateRandomWords();
        console.log("Random Words:", this.randomWords);

        this.mediaRecorder.start();
        this.isRecording = true;
        this.exceedTimeMessage = null;


        this.recordingTimeout = setTimeout(() => {
          if (this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.exceedTimeMessage = 'Recording time exceeded 15 seconds. Please try again.';
          }
        }, 15000);
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    }
  }
 /*------------------------------------------------------------------------------------------------------------*/
  async uploadAudio() {
    if (this.audioBlob && this.publicAddress) {
      const file = new File([this.audioBlob], `${this.publicAddress}.webm`, { type: 'audio/webm' });

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await this.http.post(`http://localhost:5000/register-audio?id=${this.publicAddress}`, formData)
          .toPromise();
       
      } catch (error) {
        console.error('Error uploading audio and embeddings file :( :', error);
      }
    }
  }
 /*------------------------------------------------------------------------------------------------------------*/
  generateRandomWords() {
    return this.wordGeneratorService.generateRandomWords().subscribe(
      words => this.randomWords = words,
      error => console.error('Error generating random words: ', error)
    );
  }
  /*------------------------------------------------------------------------------------------------------------*/
  async transcribeAudio(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.audioBlob && this.publicAddress) {
        const file = new File([this.audioBlob], `${this.publicAddress}.webm`, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', file);
  
        this.http.post<{ text: string }>('http://localhost:5000/transcribe-audio', formData)
          .subscribe(
            response => {
              const transcribedText = response.text;
              const transcribedWords = new Set(transcribedText.split(' '));
              const randomWordsSet = new Set(this.randomWords.split(' '));
  
              const commonWords = [...transcribedWords].filter(word => randomWordsSet.has(word));
              const result = commonWords.length >= 7;
            
             
              resolve(result);
            },
            error => {
              console.error("Error transcribing audio:", error);
              reject(false);
            }
          );
      } else {
        resolve(false);
      }
    });
  }
 /*------------------------------------------------------------------------------------------------------------*/
  confirmUserCreation(): void {
    const email = this.emailAddress.trim() || null;
  
    if (this.newSeedPhrase && this.publicAddress) {
      this.http.post('http://localhost:3000/user/add', {
        publicAddress: this.publicAddress,
        emailAddress: email,
        SeedPhrase: this.newSeedPhrase,
        tfaSecret: '', 
        publicKey:this.publicKey,
        privateKey:this.privateKey,
        blockedAddresses: {}  
      }).subscribe(
        () => {
          this.http.post<{ qrCodeUrl: string, secret: string }>(
            'http://localhost:3000/tfa/setup',
            { publicAddress: this.publicAddress }
          ).subscribe(
            response => {
              console.log("TFA setup completed:", response);
             
              this.router.navigate(['/tfa'], {
                queryParams: {
                  publicAddress: this.publicAddress,
                  qrCodeUrl: response.qrCodeUrl,
                  tfaEnabled: true ,
                  setupMode: "create"
                }
              });
            },
            error => {
              console.error('Error setting up TFA:', error);
            }
          );
        },
        error => {
          console.error('Error creating user:', error);
        }
      );
    }
  }
  

}