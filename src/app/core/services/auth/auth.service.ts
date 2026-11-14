
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface ForgotPasswordData {
  email: string;
}

interface ApiResponse {
  message: string;
}

interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface ResetPasswordData {
  token: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = `${environment.apiUrl}/users`;

  private readonly TOKEN_KEY = 'token';

  constructor(private http: HttpClient) {}

  register(userData: RegisterData): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      this.apiUrl,
      userData
    );
  }

  login(credentials: LoginData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      credentials
    ).pipe(
      tap(response => {
        this.setToken(response.token);
      })
    );
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(
      `${this.apiUrl}/profile`
    );
  }

  forgotPassword(data: ForgotPasswordData): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.apiUrl}/forgot-password`,
      data
    );
  }

resetPassword(data: ResetPasswordData): Observable<ApiResponse> {
  return this.http.post<ApiResponse>(
    `${this.apiUrl}/reset-password`,
    data
  );
}

  setToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }
}
