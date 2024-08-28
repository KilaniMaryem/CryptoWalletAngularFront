import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WordsGeneratorService {

  
  private readonly wordsFP = 'assets/words.json'; 

  constructor(private http: HttpClient) { }

  getWords(): Observable<string[]> {
    return this.http.get<string[]>(this.wordsFP);
  }
  //STRAT: SHUFFLE THE DICT THEN SELECT THE FIRST 10 WORDS
  generateRandomWords(): Observable<string> {
    return new Observable<string>(observer => {
      this.getWords().subscribe(wordList => {
        if (wordList.length < 10) {
          observer.error('Word list must contain at least 10 words');
          return;
        }
        const shuffledList = this.shuffleArray(wordList);
        const uniqueWords = shuffledList.slice(0, 10);
        const sentence = uniqueWords.join(' ');
        observer.next(sentence);
        observer.complete();
      }, error => {
        observer.error('Error fetching word list: ' + error);
      });
    });
  }
  

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
}
