import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { AppNotification, NotificationService } from 'src/app/core/services/notification.service';
import { UsuarioService } from 'src/app/core/services/usuario/usuario.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit, OnDestroy {
  carregandoPerfil = true;
  nome = 'Usuário';
  email = '';
  notificacoesAbertas = false;
  notificacoes: AppNotification[] = [];
  notificacoesNaoLidas = 0;
  private readonly notificationSubscription: Subscription;

  constructor(
    private usuarioService: UsuarioService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {
    this.notificationSubscription = this.notificationService.notifications$.subscribe((notificacoes) => {
      this.notificacoes = notificacoes;
      this.notificacoesNaoLidas = this.notificationService.unreadCount;
    });
  }

  ngOnInit(): void {
    this.usuarioService.getProfile().subscribe({
      next: (usuario) => {
        this.nome = usuario.name || 'Usuário';
        this.email = usuario.email;
        this.carregandoPerfil = false;
      },
      error: (error) => {
        console.error('Erro ao carregar perfil:', error);
        this.notificationService.error(error.error?.message || 'Não foi possível carregar seu perfil.');
        this.carregandoPerfil = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.notificationSubscription.unsubscribe();
  }

  alternarNotificacoes(): void {
    this.notificacoesAbertas = !this.notificacoesAbertas;
  }

  marcarNotificacaoComoLida(notificacao: AppNotification): void {
    this.notificationService.markAsRead(notificacao.id);
  }

  marcarTodasComoLidas(): void {
    this.notificationService.markAllAsRead();
  }

  limparNotificacoes(): void {
    this.notificationService.clear();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
