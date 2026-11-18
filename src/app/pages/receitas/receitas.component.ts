
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { ReceitasService, IReceita } from './receitas.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { DialogReceitaComponent } from './dialog-receita/dialog-receita.component';

@Component({
  selector: 'app-receitas',
  templateUrl: './receitas.component.html',
  styleUrls: ['./receitas.component.scss']
})
export class ReceitasComponent implements OnInit {
  receitas: IReceita[] = [];
  carregandoReceitas = true;

  get salarioCadastrado(): boolean {
    return this.receitas.some(
      (receita) => receita.categoria === 'salario'
    );
  }

  constructor(
    private receitaService: ReceitasService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.buscarReceitas();
  }

  adicionarReceita(): void {
    if (this.carregandoReceitas || this.salarioCadastrado) {
      return;
    }

    const dialogRef = this.dialog.open(DialogReceitaComponent, {
      width: '500px',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100dvh - 24px)',
      data: { modo: 'criar' }
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (!resultado || resultado.acao !== 'criar') {
        return;
      }

      this.receitaService.create(resultado.dados).subscribe({
        next: (response) => {
          this.notificationService.success(response.message);
          this.buscarReceitas();
        },
        error: (error) => {
          console.error('Erro ao cadastrar receita:', error);
          this.notificationService.error(
            error.error?.message || 'Erro ao cadastrar receita.'
          );
        }
      });
    });
  }

  buscarReceitas(): void {
    this.carregandoReceitas = true;

    this.receitaService.getAll()
      .pipe(
        finalize(() => {
          this.carregandoReceitas = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.receitas = response.receitas ?? [];
        },
        error: (error) => {
          console.error('Erro ao buscar receitas:', error);
        }
      });
  }

  editarReceita(item: IReceita): void {
    const dialogRef = this.dialog.open(DialogReceitaComponent, {
      width: '500px',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100dvh - 24px)',
      data: {
        modo: 'editar',
        receita: item
      }
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (!resultado || resultado.acao !== 'editar') {
        return;
      }

      const receitaId = resultado.receitaId?.trim();

      if (!receitaId) {
        this.notificationService.error('ID da receita inválido.');
        return;
      }

      this.receitaService.editar(receitaId, resultado.dados).subscribe({
        next: (response) => {
          this.notificationService.success(response.message);
          this.buscarReceitas();
        },
        error: (error) => {
          console.error('Erro ao editar receita:', error);
          this.notificationService.error(
            error.error?.message || 'Erro ao editar receita.'
          );
        }
      });
    });
  }

  excluirReceita(item: IReceita): void {
    const dialogRef = this.dialog.open(DialogReceitaComponent, {
      width: '600px',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100dvh - 24px)',
      data: {
        modo: 'excluir',
        receita: item
      }
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (!resultado || resultado.acao !== 'excluir') {
        return;
      }

      this.receitaService.excluir(resultado.receitaId).subscribe({
        next: (response) => {
          this.notificationService.success(response.message);
          this.buscarReceitas();
        },
        error: (error) => {
          console.error('Erro ao excluir receita:', error);
          this.notificationService.error(
            error.error?.message || 'Erro ao excluir receita.'
          );
        }
      });
    });
  }
}
