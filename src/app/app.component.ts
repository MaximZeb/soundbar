// app.component.ts — обновлено: удалены поля mp3/cover, добавление id вручную

import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

interface Song {
  id: number;
  title: string;
  cover: string;
  mp3: string;
}

interface PlaylistResponse {
  current_song: Song;
  queue: Song[];
  all_songs: Song[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiUrl: string = 'https://soundbar.pff.su/api';

  public showFormAuth: boolean = false;
  public currentSong?: Song;
  public queue: Song[] = [];
  public allSongs: Song[] = [];
  public filteredSongs: Song[] = [];
  public readonly searchControl: FormControl<string> = new FormControl<string>('', { nonNullable: true });
  public loadingSongId: number | null = null;
  public isAuthorized: boolean = false;
  public token: string | null = null;

  public loginForm: FormGroup = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)
  });

  public addSongForm: FormGroup = new FormGroup({
    title: new FormControl('', Validators.required)
  });

  private searchSubscription: any;

  public ngOnInit(): void {
    // this.deleteSong();
    const stored = localStorage.getItem('token');
    if (stored) {
      this.token = stored;
      this.isAuthorized = true;
    }
    this.loadPlaylist();
    this.searchSubscription = this.searchControl.valueChanges.subscribe((value: string): void => {
      if (value.length === 0) {
        this.filteredSongs = [];
        return;
      }

      this.filteredSongs = this.filterSongs(value);
    });
  }

  public ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    localStorage.removeItem('token');
  }

  public show(): void {
    this.showFormAuth = !this.showFormAuth;
  }

  private loadPlaylist(): void {
    this.http.get<PlaylistResponse>(`${this.apiUrl}/playlist`).subscribe((data: PlaylistResponse): void => {
      this.currentSong = data.current_song;
      this.queue = data.queue.map((a: Song) => {
        const song = data.all_songs.find((s: Song) => s.id === a.id);
        return song ? { ...a, ...song } : a;
      });
      this.allSongs = data.all_songs;
    });
  }

  public addToQueue(songId: Song): void {
    // this.loadingSongId = songId.id;
    // this.http.put(`${this.apiUrl}/queue`, { id: songId }).subscribe({
    //   next: (): void => {
    //     console.log(this.queue);
    //     this.queue.push(songId);
    //     console.log(this.queue);
    //     this.loadPlaylist();
    //     this.loadingSongId = null;
    //   },
    //   error: (): void => {
    //     this.loadingSongId = null;
    //   }
    // });
    console.log(this.queue);
    this.queue.push(songId);
    console.log(this.queue);
  }

  public onSearchClick(): void {
    const value: string = this.searchControl.value;
    this.filteredSongs = this.filterSongs(value);
  }

  private filterSongs(value: string): Song[] {
    if(value.length === 0) {
      return [];
    }

    return this.allSongs.filter((song: Song): boolean =>
      song.title.toLowerCase().includes(value.toLowerCase())
    );
  }

  public login(): void {
    if (this.loginForm.invalid) return;
    this.http.post<{ token: string }>(`${this.apiUrl}/auth`, this.loginForm.value).subscribe({
      next: (res): void => {
        this.token = res.token;
        localStorage.setItem('token', this.token);
        this.isAuthorized = true;
      },
      error: (): void => {
        alert('Неверный логин или пароль');
      }
    });
  }

  public addSong(): void {
    if (!this.token || this.addSongForm.invalid) return;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` });

    const lastId = this.allSongs.length > 0 ? Math.max(...this.allSongs.map(s => s.id)) : 0;
    const newSong: Song = {
      id: lastId + 1,
      title: this.addSongForm.value.title,
      cover: 'empty',
      mp3: 'empty'
    };

    this.http.put(`${this.apiUrl}/playlist`, newSong, { headers }).subscribe({
      next: (): void => {
        this.loadPlaylist();
        this.addSongForm.reset();
      },
      error: (): void => {
        alert('Ошибка при добавлении песни');
      }
    });
  }

  // public deleteSong(): void {
  //   const newSong = {
  //     id: 1
  //   };
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json', Authorization: `Bearer f2R2H51GYqnmW0Ecbg3D0kzSJpp34mA421uKG7rgTjucz51HNBMTUBrS5WF0`, body: JSON.stringify() });

  //   this.http.delete(`${this.apiUrl}/playlist`, { headers }).subscribe({
  //     next: (): void => {
  //     },
  //     error: (): void => {
  //       alert('Ошибка при добавлении песни');
  //     }
  //   });
  // }
}