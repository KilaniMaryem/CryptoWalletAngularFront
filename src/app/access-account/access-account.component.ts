import { Component, Output, EventEmitter, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ethers } from 'ethers';
import { WordsGeneratorService } from '../words-generator.service';
import { EmailService } from '../email.service';

@Component({
  selector: 'app-access-account',
  templateUrl: './access-account.component.html',
  styleUrls: ['./access-account.component.css']
})
export class AccessAccountComponent {
  publicAddress: string = '';
  emailAddress: string = '';
  privateKey: string = '';
  hidePrivateKey: boolean = true;
  nonValid: boolean = false;
  errorMessage1: string = '';
  exceedTimeMessage: string = '';
  @Output() walletAccessed = new EventEmitter<{ seedPhrase: string, walletAddress: string }>();
  audioBlob: Blob | null = null;
  isRecording: boolean = false;
  exceededTime: boolean = false;
  transcriptionError: boolean = false;
  mediaRecorder: MediaRecorder | null = null;
  @ViewChild('audioPlayer') audioPlayer: ElementRef<HTMLAudioElement> | undefined;
  randomWords: string = "";

  tfaEnabled: boolean = true;

  private failedAttempts: number = 0;
  private maxAttempts: number = 3;

  constructor(private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private wordGeneratorService: WordsGeneratorService,
    private cdRef: ChangeDetectorRef,
    private emailService: EmailService) { }
/*---------------------------------------------------------------------------------------------------------------------*/
    getEmailAddress(): Promise<string> {
      return new Promise<string>((resolve, reject) => {
        if (this.publicAddress) {
         
          this.http.get<{ emailAddress: string }>(`http://localhost:3000/user/get/${this.publicAddress}`)
            .subscribe(
              response => {
                resolve(response.emailAddress); 
              },
              error => {
                console.error('Error fetching email address:', error);
                reject('Error fetching email address'); 
              }
            );
        } else {
          reject('Public address is not defined');
        }
      });
    }

  
  /*---------------------------------------------------------------------------------------------------------------------*/
  async accessWallet() {
   
    try{
      this.emailAddress=await this.getEmailAddress()
    }catch(err){
      console.error(err)
    }
    this.errorMessage1 = '';
    this.nonValid = false;

    if (this.checkWalletExistence()) {
      this.failedAttempts = 0;

      if (this.tfaEnabled) {
        this.http.post<{ qrCodeUrl: string, secret: string }>(
          'http://localhost:3000/tfa/setup',
          { publicAddress: this.publicAddress }
        ).subscribe(
          response => {
            this.router.navigate(['/tfa'], {
              queryParams: {
                publicAddress: this.publicAddress,
                qrCodeUrl: response.qrCodeUrl,
                setupMode:"access"
              }
            });
          },
          error => {
            this.errorMessage1 = 'Failed to setup TFA.';
          }
        );
      } else {

        this.walletAccessed.emit({ seedPhrase: 'none', walletAddress: this.publicAddress });
        this.router.navigate(['/yourwallet', 'none', this.publicAddress]);
      }
    } else {
      this.failedAttempts++;
    
      if (this.failedAttempts >= this.maxAttempts && this.emailAddress) {
        const htmlContent1 =
          `<p>Dear <strong>${this.publicAddress}</strong> ,<p>
        <p>There have been <strong>${this.failedAttempts}</strong> consecutive failed attempts to access your wallet.</p>
        <p>We suspect that some intruder might be attempting unauthorized access.</p>
      `;

        this.emailService.sendEmail(
          this.emailAddress,
          "CryptoWallet: Suspicious Activity Detected",
          htmlContent1
        ).subscribe(
          () => {
            this.failedAttempts = 0
          },
          error => {
            console.error("Error sending fraud alert email:", error);
          }
        );
      }
    }
  }

  /*---------------------------------------------------------------------------------------------------------------------*/
  navigateHome() {
    this.router.navigate(['/']);
    this.cdRef.detectChanges();
  }
  /*---------------------------------------------------------------------------------------------------------------------*/
  checkWalletExistence(): boolean {
    try {
      const wallet = new ethers.Wallet(this.privateKey);
      const derivedPublicAddress = wallet.address;

      if (this.publicAddress !== derivedPublicAddress) {
        this.errorMessage1 = 'Error: The provided credentials are wrong OR the provided wallet address does not exist!';
        this.nonValid = true;
        return false;
      }
      return true;
    } catch (err) {
      this.errorMessage1 = 'Please check your credentials';
      this.nonValid = true;
      return false;
    }
  }


  /*---------------------------------------------------------------------------------------------------------------------*/
  async toggleRecording() {
    this.nonValid = false;
    this.exceededTime = false;
    this.transcriptionError = false;
    this.exceedTimeMessage = '';
    if (this.isRecording) {
      this.mediaRecorder?.stop();
      this.isRecording = false;

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
          if (!this.exceededTime) {
            await this.verifyWithAudio();
          }
        };

        this.generateRandomWords();
        this.mediaRecorder.start();
        this.isRecording = true;

        setTimeout(() => {
          if (this.isRecording) {
            this.mediaRecorder?.stop();
            this.isRecording = false;
            this.exceededTime = true;
            this.exceedTimeMessage = 'Recording time exceeded 15 seconds. Please try again.';
          }
        }, 15000);



      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    }
  }

  /*---------------------------------------------------------------------------------------------------------------------*/
  async verifyWithAudio() {
    if (this.audioBlob && this.publicAddress) {
      try {
        const transcriptionVerified = await this.transcribeAudio();
        if (!transcriptionVerified) {
          this.transcriptionError = true;
          console.error("Error in verifyWithAudio: Transcription verification failed");
          this.cdRef.detectChanges();
          return;
        }


        const file = new File([this.audioBlob], `${this.publicAddress}.webm`, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', file);

        this.http.post(`http://localhost:5000/verify-audio/${this.publicAddress}`, formData, { observe: 'response' })
          .subscribe(response => {
            const responseBody = response.body as any;

            if (responseBody.message === 'SUCCESS') {
              this.walletAccessed.emit({ seedPhrase: 'none', walletAddress: this.publicAddress });
              this.router.navigate(['/yourwallet', 'none', this.publicAddress]);
            } else {
              if (this.exceededTime) {
                this.router.navigate(['/voiceAuthError'], { queryParams: { status: response.status } });
                console.error("Error in verifyWithAudio: Time exceeded");
              } else {
                const htmlContent2 =
                  `<p>Dear <strong>${this.publicAddress}</strong> ,<p>
                  <p>We have detected suspicious activity and suspect that an unauthorized attempt may be occurring to access your crypto wallet through voice authentication.</p>
                   `;
                this.emailService.sendEmail(
                  "mariem.kilani@insat.ucar.tn",
                  "CryptoWallet: Suspicious Activity Detected",
                  htmlContent2
                ).subscribe(
                  () => {
                    console.log("Fraud alert email sent successfully.");
                  },
                  error => {
                    console.error("Error sending fraud alert email:", error);
                  }
                );
                this.router.navigate(['/voiceAuthError'], { queryParams: { status: response.status } });
                console.error("Error in verifyWithAudio: Verification failed");
              }
            }

            this.cdRef.detectChanges();
          }, error => {
            this.router.navigate(['/voiceAuthError'], { queryParams: { status: error.status } });
            this.cdRef.detectChanges();
            console.error("Error in verifyWithAudio:", error);
          });
      } catch (error) {
        this.router.navigate(['/voiceAuthError'], { queryParams: { status: '500' } });
        this.cdRef.detectChanges();
        console.error("Error in verifyWithAudio:", error);
      }
    }
  }


  /*---------------------------------------------------------------------------------------------------------------------*/
  validAddress(): boolean {
    if (!this.publicAddress.startsWith('0x')) {
      return false;
    }
    const remainingAddress = this.publicAddress.slice(2);
    const isValid = /^[0-9a-zA-Z]+$/.test(remainingAddress);
    return isValid && remainingAddress.length > 0;
  }
  /*---------------------------------------------------------------------------------------------------------------------*/
  async uploadAudio() {
    if (this.audioBlob && this.publicAddress) {
      const file = new File([this.audioBlob], `${this.publicAddress}.webm`, { type: 'audio/webm' });

      const formData = new FormData();
      formData.append('file', file);

      try {
        await this.http.post(`http://localhost:5000/register-audio?id=${this.publicAddress}`, formData).toPromise();
      } catch (error) {
        console.error('Error uploading audio:', error);
      }
    }
  }
  /*---------------------------------------------------------------------------------------------------------------------*/
  generateRandomWords() {
    return this.wordGeneratorService.generateRandomWords().subscribe(
      words => this.randomWords = words,
      error => console.error('Error generating random words: ', error)
    );
  }

  /*---------------------------------------------------------------------------------------------------------------------*/
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

}