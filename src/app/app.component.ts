import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiUrl: string = 'https://soundbar.pff.su/api';

  public currentSong?: Song;
  public queue: Song[] = [];
  public allSongs: Song[] = [];
  public filteredSongs: Song[] = [];
  public readonly searchControl: FormControl<string> = new FormControl<string>('', { nonNullable: true });
  public loadingSongId: number | null = null;

  public ngOnInit(): void {
    this.loadPlaylist();

    this.searchControl.valueChanges.subscribe((value: string): void => {
      this.filteredSongs = this.filterSongs(value);
    });
  }

  private loadPlaylist(): void {
    this.http.get<PlaylistResponse>(`${this.apiUrl}/playlist`).subscribe((data: PlaylistResponse): void => {
      this.currentSong = data.current_song;
      this.queue = data.queue;
      this.allSongs = data.all_songs;
      this.filteredSongs = [...this.allSongs];
    });
  }

  public addToQueue(songId: number): void {
    this.loadingSongId = songId;
    this.http.put(`${this.apiUrl}/queue`, { id: songId }).subscribe({
      next: (): void => {
        this.loadPlaylist();
        this.loadingSongId = null;
      },
      error: (): void => {
        this.loadingSongId = null;
      }
    });
  }

  public onSearchClick(): void {
    const value: string = this.searchControl.value;
    this.filteredSongs = this.filterSongs(value);
  }

  private filterSongs(value: string): Song[] {
    return this.allSongs.filter((song: Song): boolean =>
      song.title.toLowerCase().includes(value.toLowerCase())
    );
  }
}
