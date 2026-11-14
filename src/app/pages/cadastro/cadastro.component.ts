
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/core/services/notification.service';

import {
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
  FormGroup
} from '@angular/forms';

import { AuthService } from 'src/app/core/services/auth/auth.service';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.component.html',
  styleUrls: ['./cadastro.component.scss']
})
export class CadastroComponent implements OnInit {

  cadastroForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService

  ) {}

  ngOnInit(): void {

    this.cadastroForm = this.fb.group({

      name: ['', Validators.required],

      email: ['', [
        Validators.required,
        Validators.email
      ]],

      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]],

      confirmPassword: ['', Validators.required]

    }, {
      validators: this.passwordMatchValidator
    });

  }

  passwordMatchValidator(
    control: AbstractControl
  ): ValidationErrors | null {

    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!confirmPassword) {
      return null;
    }

    return password === confirmPassword
      ? null
      : { passwordMismatch: true };
  }

  cadastrar(): void {

    if (this.cadastroForm.invalid) {
      this.cadastroForm.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.cadastroForm.getRawValue();

    this.authService.register({
      name,
      email,
      password
    }).subscribe({

      next: (response) => {
        this.notificationService.success(response.message);
        setTimeout(()=>{
            this.router.navigate(['../login']);
        }, 3000)
      },

      error: (error) => {
         const message = error.error?.message || 'Erro ao realizar cadastro.';

      this.notificationService.error(message);
        console.error('Erro ao cadastrar usuário:', error);
      }

    });

  }

}
