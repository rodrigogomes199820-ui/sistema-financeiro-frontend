import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';

export interface AppNotification {
  id: number;
  titulo: string;
  mensagem: string;
  data: Date;
  tipo: 'success' | 'error' | 'warning';
  lida: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly notificationSubject = new BehaviorSubject<AppNotification[]>([]);
  private readonly avisosFinanceirosEmitidos = new Set<string>();
  readonly notifications$ = this.notificationSubject.asObservable();

  constructor(private snackBar: MatSnackBar) {}

  get notifications(): AppNotification[] {
    return this.notificationSubject.value;
  }

  get unreadCount(): number {
    return this.notifications.filter((notification) => !notification.lida).length;
  }

success(message: string): void {
  this.addNotification('success', message);
  this.snackBar.open(message, 'Fechar', {
    duration: 3000,
    horizontalPosition: 'end',
    verticalPosition: 'bottom',
    panelClass: ['notification-success']
  });
}

error(message: string): void {
  this.addNotification('error', message);
  this.snackBar.open(message, 'Fechar', {
    duration: 4000,
    horizontalPosition: 'end',
    verticalPosition: 'bottom',
    panelClass: ['notification-error']
  });
}

  warnIfMonthlyExpensesAreHigh(
    totalDespesas: number,
    totalReceitas: number,
    ano: number,
    mes: number
  ): void {
    const limiteAlto = 0.8;
    if (totalReceitas <= 0 || totalDespesas / totalReceitas < limiteAlto) {
      return;
    }

    const chave = `${ano}-${mes}`;
    if (this.avisosFinanceirosEmitidos.has(chave)) {
      return;
    }

    this.avisosFinanceirosEmitidos.add(chave);
    const percentual = Math.round((totalDespesas / totalReceitas) * 100);
    const mensagem = `Seus gastos deste mês chegaram a ${percentual}% das receitas do período.`;
    this.addNotification('warning', mensagem);
    this.snackBar.open(mensagem, 'Fechar', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: ['notification-warning']
    });
  }

  markAsRead(id: number): void {
    this.notificationSubject.next(this.notifications.map((notification) =>
      notification.id === id ? { ...notification, lida: true } : notification
    ));
  }

  markAllAsRead(): void {
    this.notificationSubject.next(this.notifications.map((notification) => ({
      ...notification,
      lida: true
    })));
  }

  clear(): void {
    this.notificationSubject.next([]);
  }

  private addNotification(tipo: AppNotification['tipo'], mensagem: string): void {
    const notification: AppNotification = {
      id: Date.now() + Math.random(),
      titulo: tipo === 'success'
        ? 'Operação concluída'
        : tipo === 'warning'
          ? 'Gastos elevados'
          : 'Atenção',
      mensagem,
      data: new Date(),
      tipo,
      lida: false
    };

    this.notificationSubject.next([notification, ...this.notifications].slice(0, 30));
  }
}
