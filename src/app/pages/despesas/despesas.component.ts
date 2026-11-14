import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'src/app/core/services/notification.service';
import { DialogDespesaComponent } from './dialog-despesa/dialog-despesa.component';
import { DespesasService, IDespesa } from './despesas.service';
import { ResumoFinanceiroService } from 'src/app/core/services/financeiro/resumo-financeiro.service';

@Component({
  selector: 'app-despesas',
  templateUrl: './despesas.component.html',
  styleUrls: ['./despesas.component.scss']
})
export class DespesasComponent implements OnInit {
  despesas: IDespesa[] = [];

  constructor(
    private despesasService: DespesasService,
    private resumoFinanceiroService: ResumoFinanceiroService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.buscarDespesas();
  }

  adicionarDespesa(): void {
    const dialogRef = this.dialog.open(DialogDespesaComponent, {
      width: '500px',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100dvh - 24px)',
      data: { modo: 'criar' }
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (!resultado || resultado.acao !== 'criar') {
        return;
      }

      this.despesasService.create(resultado.dados).subscribe({
        next: (response) => {
          this.notificationService.success(response.message);
          this.buscarDespesas();
        },
        error: (error) => {
          console.error('Erro ao cadastrar despesa:', error);
          this.notificationService.error(error.error?.message || 'Erro ao cadastrar despesa.');
        }
      });
    });
  }

  editarDespesa(item: IDespesa): void {
    const dialogRef = this.dialog.open(DialogDespesaComponent, {
      width: '500px',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100dvh - 24px)',
      data: { modo: 'editar', despesa: item }
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (!resultado || resultado.acao !== 'editar' || !resultado.despesaId) {
        return;
      }

      this.despesasService.update(resultado.despesaId, resultado.dados).subscribe({
        next: (response) => {
          this.notificationService.success(response.message);
          this.buscarDespesas();
        },
        error: (error) => {
          console.error('Erro ao editar despesa:', error);
          this.notificationService.error(error.error?.message || 'Erro ao editar despesa.');
        }
      });
    });
  }

  excluirDespesa(item: IDespesa): void {
    const dialogRef = this.dialog.open(DialogDespesaComponent, {
      width: '500px',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100dvh - 24px)',
      data: { modo: 'excluir', despesa: item }
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (!resultado || resultado.acao !== 'excluir' || !resultado.despesaId) {
        return;
      }

      this.despesasService.delete(resultado.despesaId).subscribe({
        next: (response) => {
          this.notificationService.success(response.message);
          this.buscarDespesas();
        },
        error: (error) => {
          console.error('Erro ao excluir despesa:', error);
          this.notificationService.error(error.error?.message || 'Erro ao excluir despesa.');
        }
      });
    });
  }

  private buscarDespesas(): void {
    this.despesasService.getAll().subscribe({
      next: (response) => {
        this.despesas = response.despesas;
      },
      error: (error) => {
        console.error('Erro ao buscar despesas:', error);
        this.notificationService.error(error.error?.message || 'Erro ao buscar despesas.');
      }
    });

    this.resumoFinanceiroService.getResumoMensal().subscribe({
      next: ({ resumo }) => this.notificationService.warnIfMonthlyExpensesAreHigh(
        resumo.totalDespesas,
        resumo.totalReceitas,
        resumo.periodo.ano,
        resumo.periodo.mes
      ),
      error: (error) => console.error('Erro ao verificar o total mensal de despesas:', error)
    });
  }
}
