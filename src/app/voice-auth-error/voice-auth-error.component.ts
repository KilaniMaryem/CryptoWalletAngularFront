import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { WordsGeneratorService } from '../words-generator.service';
import { ethers } from 'ethers';

@Component({
  selector: 'app-voice-auth-error',
  templateUrl: './voice-auth-error.component.html',
  styleUrls: ['./voice-auth-error.component.css']
})
export class VoiceAuthErrorComponent implements OnInit {
  errorStatus: number | null = null;
  errorMsg: string = "";
  publicAddress: string = '';
  isRecording: boolean = false;
  mediaRecorder: MediaRecorder | null = null;
  audioBlob: Blob | null = null;
  randomWords: string = "";
  fileExistsError: string = '';
  errorMessage1: string = '';
  errorMessage2: string = '';
  nonValid: boolean = false;
  nonValid2: boolean = false;
  privateKey: string = '';
  hidePrivateKey: boolean = true;
  exceededTime: boolean = false;
  processing: boolean = false;
  uploaded: boolean = false;
  exceedTimeMessage: string = '';
  transcriptionError: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private wordGeneratorService: WordsGeneratorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(queryParams => {
      this.errorStatus = queryParams['status'] ;
      if (this.errorStatus== 401){
        this.errorMsg="Our system doesn't think you are who you claim to be. You can go back and try again."
      }else{
      this.errorMsg = "We're unable to match your voice. It seems this wallet doesn't exist OR doesn't have a user voice associated with it. Would you like to add your voice?";}
    })

  }
 /*------------------------------------------------------------------------------------------------------------*/
  async checkFileExists(): Promise<void> {
    try {
      const response = await this.http
        .get<{ exists: boolean }>(`http://localhost:5000/check-file?publicAddress=${this.publicAddress}`)
        .toPromise();
      if (response && typeof response.exists === 'boolean') {
        this.fileExistsError = response.exists
          ? "There has been an error. The wallet address you just inputted already has a voice associated with it."
          : '';
      } else {
        console.error('Unexpected response format:', response);
      }
    } catch (error) {
      console.error('Error checking file existence:', error);
    }
  }
   /*------------------------------------------------------------------------------------------------------------*/
  checkWalletExistence(): boolean {
    this.errorMessage1 = '';
    this.errorMessage2 = '';

    try {
      const wallet = new ethers.Wallet(this.privateKey);
      const derivedPublicAddress = wallet.address;

      if (this.publicAddress !== derivedPublicAddress) {
        this.errorMessage1 = 'Error: The provided credentials are wrong OR the provided wallet address does not exist!';
        this.nonValid = true;
        return false;
      }
      return true;
    } catch {
      this.errorMessage1 = 'Please check your credentials';
      this.nonValid = true;
      return false;
    }
  }
 /*------------------------------------------------------------------------------------------------------------*/
  async toggleRecording(register: boolean = false): Promise<void> {
    this.resetStates();

    if (!this.checkWalletExistence()) {
      this.nonValid2 = true;
      this.errorMessage2 = this.publicAddress && this.privateKey
        ? "The provided wallet address does not exist OR your provided credentials are wrong!"
        : "Please ensure to provide both the public address and the private key.";
      return;
    }

    if (this.isRecording) {
      this.stopRecording();
    } else {
      if (!this.publicAddress) {
        this.fileExistsError = 'Public address is required.';
        return;
      }

      await this.checkFileExists();
      if (this.fileExistsError) return;

      try {
        await this.startRecording();
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    }
  }
 /*------------------------------------------------------------------------------------------------------------*/
  private resetStates(): void {
    this.nonValid = false;
    this.errorMessage1 = '';
    this.errorMessage2 = '';
    this.exceededTime = false;
    this.exceedTimeMessage = '';
    this.transcriptionError = false;
    this.fileExistsError = '';
  }
  /*------------------------------------------------------------------------------------------------------------*/
  private async startRecording(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);
    this.setupMediaRecorder();

    this.generateRandomWords();
    this.mediaRecorder.start();
    this.isRecording = true;

    setTimeout(() => {
      if (this.isRecording) {
        this.stopRecording();
        this.exceededTime = true;
        this.exceedTimeMessage = 'Recording time exceeded 15 seconds. Please try again.';
      }
    }, 15000); 
  }
 /*------------------------------------------------------------------------------------------------------------*/
  private setupMediaRecorder(): void {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      this.audioBlob = event.data;
    };

    this.mediaRecorder.onstop = async () => {
      try {
        const transcribe = await this.transcribeAudio();
        if (!transcribe) {
          this.transcriptionError = true;
        
        } else if (!this.exceededTime) {
          this.processing = true;
          this.cdr.detectChanges();
          await this.uploadAudio();
          this.processing = false;
          this.uploaded = true;
          this.cdr.detectChanges();
        }
      } catch (error) {
        console.error(error);
      } finally {
        this.cdr.detectChanges();
      }
    };
  }
 /*------------------------------------------------------------------------------------------------------------*/
  private stopRecording(): void {
    this.mediaRecorder?.stop();
    this.isRecording = false;
  }
 /*------------------------------------------------------------------------------------------------------------*/
  onInputChange(): void {
    this.nonValid2 = false;
    this.errorMessage2 = '';
  }
 /*------------------------------------------------------------------------------------------------------------*/
  async uploadAudio(): Promise<void> {
    if (!this.audioBlob || !this.publicAddress) return;

    const file = new File([this.audioBlob], `${this.publicAddress}.webm`, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('file', file);

    try {
      await this.http.post(`http://localhost:5000/register-audio?id=${this.publicAddress}`, formData).toPromise();
    } catch (error) {
      console.error('Error uploading audio:', error);
    }
  }
 /*------------------------------------------------------------------------------------------------------------*/
  generateRandomWords(): void {
    this.wordGeneratorService.generateRandomWords().subscribe(
      words => this.randomWords = words,
      error => console.error('Error generating random words:', error)
    );
  }
 /*------------------------------------------------------------------------------------------------------------*/
  validAddress(): boolean {
    const isValid = /^0x[0-9a-zA-Z]+$/.test(this.publicAddress);
    return isValid && this.publicAddress.length > 2;
  }
 /*------------------------------------------------------------------------------------------------------------*/
  navigateBack(): void {
    this.router.navigate(['/access']);
  }
 /*------------------------------------------------------------------------------------------------------------*/
  async transcribeAudio(): Promise<boolean> {
    if (!this.audioBlob || !this.publicAddress) return false;

    const file = new File([this.audioBlob], `${this.publicAddress}.webm`, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await this.http.post<{ text: string }>('http://localhost:5000/transcribe-audio', formData).toPromise();
      const transcribedText = response?.text;
      const transcribedWords = new Set(transcribedText?.split(' '));
      const randomWordsSet = new Set(this.randomWords.split(' '));
      return [...transcribedWords].filter(word => randomWordsSet.has(word)).length >= 7;
    } catch (error) {
      console.error("Error transcribing audio:", error);
      return false;
    }
  }
}
