import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private emailApiUrl = 'http://localhost:3000/email/send'; // Adjust the URL based on your backend

  constructor(private http: HttpClient) {}

  sendEmail(to: string, subject: string, html: string): Observable<any> {
    console.log("sending mail(front srv)")
    const emailData = { to, subject, html };
    return this.http.post(this.emailApiUrl, emailData);
  }
}
