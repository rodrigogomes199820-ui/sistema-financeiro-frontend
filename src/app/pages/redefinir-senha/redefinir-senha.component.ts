
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { AuthService } from 'src/app/core/services/auth/auth.service';
import { NotificationService } from 'src/app/core/services/notification.service';

function senhasCoincidem(
  control: AbstractControl
): ValidationErrors | null {

  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword
    ? null
    : { passwordMismatch: true };
}

@Component({
  selector: 'app-redefinir-senha',
  templateUrl: './redefinir-senha.component.html',
  styleUrls: ['./redefinir-senha.component.scss']
})
export class RedefinirSenhaComponent implements OnInit {

  redefinirSenhaForm!: FormGroup;

  token: string | null = null;
  carregando = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {

    this.token = this.route.snapshot.queryParamMap.get('token');

    this.redefinirSenhaForm = this.fb.group({

      password: ['', [
        Validators.required,
        Validators.minLength(8)
      ]],

      confirmPassword: ['', Validators.required]

    }, {
      validators: senhasCoincidem
    });

    if (!this.token) {
      this.notificationService.error(
        'Link de recuperação inválido ou sem token.'
      );

      this.router.navigate(['/recuperar-senha']);
    }

  this.router.navigate([], {
    relativeTo: this.route,
    queryParams: {},
    replaceUrl: true
  });
  }

  redefinirSenha(): void {

    if (this.redefinirSenhaForm.invalid) {
      this.redefinirSenhaForm.markAllAsTouched();
      return;
    }

    if (!this.token) {
      this.notificationService.error('Token de recuperação não encontrado.');
      return;
    }

    const password = this.redefinirSenhaForm.get('password')?.value;

    this.carregando = true;

    this.authService.resetPassword({
      token: this.token,
      password
    })
    .pipe(
      finalize(() => {
        this.carregando = false;
      })
    )
    .subscribe({

      next: (response) => {

        this.notificationService.success(response.message);

        this.redefinirSenhaForm.reset();

        this.router.navigate(['/login']);

      },

      error: (error: HttpErrorResponse) => {

        this.notificationService.error(
          error.error?.message ||
          'Não foi possível redefinir sua senha.'
        );

      }

    });
  }
}
