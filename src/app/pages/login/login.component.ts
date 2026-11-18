import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { NotificationService } from 'src/app/core/services/notification.service';

import { FormBuilder, Validators, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  mostrarSenha = false;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  login(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials = this.loginForm.getRawValue();
    this.isSubmitting = true;

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.authService.setToken(response.token);

        this.authService.getProfile().subscribe({
          next: async () => {
            try {
              await this.router.navigate(['/']);
            } finally {
              this.isSubmitting = false;
            }
          },
          error: (error) => {
            console.error('Erro ao buscar perfil:', error);
            this.isSubmitting = false;

            this.notificationService.error(
              'Não foi possível carregar seu perfil.',
            );
          },
        });
      },

      error: (error) => {
        this.isSubmitting = false;
        const message = error.error?.message || 'Erro ao realizar login.';

        this.notificationService.error(message);

        console.error('Erro ao realizar login:', error);
      },
    });
  }

}
