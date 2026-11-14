
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from 'src/app/core/services/auth/auth.service';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
  selector: 'app-recuperar-senha',
  templateUrl: './recuperar-senha.component.html',
  styleUrls: ['./recuperar-senha.component.scss']
})
export class RecuperarSenhaComponent implements OnInit {

  recuperarSenhaForm!: FormGroup;
  carregando = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.recuperarSenhaForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  recuperarSenha(): void {

    if (this.recuperarSenhaForm.invalid) {
      this.recuperarSenhaForm.markAllAsTouched();
      return;
    }

    this.carregando = true;

    const email = this.recuperarSenhaForm.get('email')?.value;

    this.authService.forgotPassword({ email }).subscribe({

      next: (response) => {
        this.notificationService.success(response.message);
        this.carregando = false;
      },

      error: (error: HttpErrorResponse) => {
        this.notificationService.error(
          error.error?.message || 'Não foi possível solicitar a recuperação de senha.'
        );

        this.carregando = false;
      }

    });
  }
}
