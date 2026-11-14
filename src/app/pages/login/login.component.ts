import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { LoadingService } from 'src/app/core/services/loading.service';

import { FormBuilder, Validators, FormGroup } from '@angular/forms';

import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private loadingService: LoadingService,
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials = this.loginForm.getRawValue();

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.authService.setToken(response.token);

        this.loadingService.show();

        const inicioLoader = Date.now();

        this.authService
          .getProfile()
          .pipe(
            finalize(() => {
              const tempoDecorrido = Date.now() - inicioLoader;
              const tempoRestante = Math.max(0, 2000 - tempoDecorrido);

              setTimeout(() => {
                this.loadingService.hide();
              }, tempoRestante);
            }),
          )
          .subscribe({
            next: async (profile) => {


              await this.router.navigate(['/']);
            },

            error: (error) => {
              console.error('Erro ao buscar perfil:', error);

              this.notificationService.error(
                'Não foi possível carregar seu perfil.',
              );
            },
          });
      },

      error: (error) => {
        const message = error.error?.message || 'Erro ao realizar login.';

        this.notificationService.error(message);

        console.error('Erro ao realizar login:', error);
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
