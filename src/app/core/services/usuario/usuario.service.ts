import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface UsuarioResponse {
  id: string;
  name: string;
  email: string;
}

export interface AtualizarPerfilInput {
  name: string;
  email: string;
  currentPassword: string;
}

export interface AlterarSenhaInput {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(
      `${this.apiUrl}/profile`
    );
  }

  updateProfile(data: AtualizarPerfilInput): Observable<{ message: string; user: UsuarioResponse }> {
    return this.http.patch<{ message: string; user: UsuarioResponse }>(
      `${this.apiUrl}/profile`,
      data
    );
  }

  changePassword(data: AlterarSenhaInput): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/password`, data);
  }

  deleteAccount(currentPassword: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/profile`, {
      body: { currentPassword }
    });
  }
}
