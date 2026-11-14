import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { UsuarioService } from 'src/app/core/services/usuario/usuario.service';

@Component({
  selector: 'app-configuracao',
  templateUrl: './configuracao.component.html',
  styleUrls: ['./configuracao.component.scss']
})
export class ConfiguracaoComponent implements OnInit {
  carregandoPerfil = true;
  salvandoPerfil = false;
  alterandoSenha = false;
  excluindoConta = false;

  perfilForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    currentPassword: ['', Validators.required]
  });

  senhaForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.validarConfirmacaoSenha });

  exclusaoForm = this.fb.group({
    currentPassword: ['', Validators.required],
    confirmacao: ['', [Validators.required, Validators.pattern(/^EXCLUIR$/)]]
  });

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuarioService.getProfile().subscribe({
      next: (usuario) => {
        this.perfilForm.patchValue({ name: usuario.name, email: usuario.email });
        this.carregandoPerfil = false;
      },
      error: (error) => {
        console.error('Erro ao carregar perfil:', error);
        this.notificationService.error(error.error?.message || 'Não foi possível carregar seu perfil.');
        this.carregandoPerfil = false;
      }
    });
  }

  salvarPerfil(): void {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    this.salvandoPerfil = true;
    const dados = this.perfilForm.getRawValue();
    this.usuarioService.updateProfile({
      name: String(dados.name || '').trim(),
      email: String(dados.email || '').trim(),
      currentPassword: String(dados.currentPassword || '')
    }).subscribe({
      next: (response) => {
        this.perfilForm.patchValue({ currentPassword: '' });
        this.notificationService.success(response.message);
        this.salvandoPerfil = false;
      },
      error: (error) => {
        this.notificationService.error(error.error?.message || 'Não foi possível atualizar seu perfil.');
        this.salvandoPerfil = false;
      }
    });
  }

  alterarSenha(): void {
    if (this.senhaForm.invalid) {
      this.senhaForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.senhaForm.getRawValue();
    if (!currentPassword || !newPassword) return;

    this.alterandoSenha = true;
    this.usuarioService.changePassword({ currentPassword, newPassword }).subscribe({
      next: (response) => {
        this.notificationService.success(response.message);
        this.authService.logout();
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.notificationService.error(error.error?.message || 'Não foi possível alterar sua senha.');
        this.alterandoSenha = false;
      }
    });
  }

  excluirConta(): void {
    if (this.exclusaoForm.invalid) {
      this.exclusaoForm.markAllAsTouched();
      return;
    }

    const currentPassword = this.exclusaoForm.getRawValue().currentPassword;
    if (!currentPassword) return;

    this.excluindoConta = true;
    this.usuarioService.deleteAccount(currentPassword).subscribe({
      next: (response) => {
        this.notificationService.success(response.message);
        this.authService.logout();
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.notificationService.error(error.error?.message || 'Não foi possível excluir sua conta.');
        this.excluindoConta = false;
      }
    });
  }

  private validarConfirmacaoSenha(control: AbstractControl): ValidationErrors | null {
    const novaSenha = control.get('newPassword')?.value;
    const confirmacao = control.get('confirmPassword')?.value;
    return novaSenha && confirmacao && novaSenha !== confirmacao
      ? { senhasDiferentes: true }
      : null;
  }
}
