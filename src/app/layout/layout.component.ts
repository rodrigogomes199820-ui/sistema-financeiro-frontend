import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { AppNotification, NotificationService } from 'src/app/core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnDestroy {
  menuButton: boolean;
  notificacoesAbertas = false;
  notificacoes: AppNotification[] = [];
  notificacoesNaoLidas = 0;
  private readonly notificationSubscription: Subscription;

  get isPerfilRoute(): boolean {
    return this.router.url.split('?')[0].split('#')[0] === '/perfil';
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.menuButton = typeof window !== 'undefined' && window.innerWidth > 800;
    this.notificationSubscription = this.notificationService.notifications$.subscribe((notificacoes) => {
      this.notificacoes = notificacoes;
      this.notificacoesNaoLidas = this.notificationService.unreadCount;
    });
  }

  ngOnDestroy(): void {
    this.notificationSubscription.unsubscribe();
  }

  toggleMenu(): void {
    this.menuButton = !this.menuButton;
  }

  fecharMenuEmTelaPequena(): void {
    if (window.innerWidth <= 800) {
      this.menuButton = false;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
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

}
