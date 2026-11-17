import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'src/app/core/services/notification.service';
import { DialogDespesaComponent } from './dialog-despesa/dialog-despesa.component';
import { DespesasService, IDespesa } from './despesas.service';
import { ResumoFinanceiroService } from 'src/app/core/services/financeiro/resumo-financeiro.service';

interface DespesaTabela extends IDespesa {
  parcelasCompra?: IDespesa[];
}

@Component({
  selector: 'app-despesas',
  templateUrl: './despesas.component.html',
  styleUrls: ['./despesas.component.scss']
})
export class DespesasComponent implements OnInit {
  despesas: IDespesa[] = [];
  despesasExibidas: DespesaTabela[] = [];
  compraExpandidaId: string | null = null;

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

      this.despesasService.create(resultado.dados, resultado.quantidadeParcelas).subscribe({
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

  alternarParcelas(compraId: string): void {
    this.compraExpandidaId = this.compraExpandidaId === compraId ? null : compraId;
  }

  private buscarDespesas(): void {
    this.despesasService.getAll().subscribe({
      next: (response) => {
        this.despesas = response.despesas;
        this.despesasExibidas = this.agruparComprasParceladas(response.despesas);
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

  private agruparComprasParceladas(despesas: IDespesa[]): DespesaTabela[] {
    const grupos = new Map<string, IDespesa[]>();
    const despesasAvulsas: DespesaTabela[] = [];

    despesas.forEach((despesa) => {
      if (!despesa.compraParceladaId || !despesa.totalParcelas || despesa.totalParcelas < 2) {
        despesasAvulsas.push({ ...despesa });
        return;
      }

      const grupo = grupos.get(despesa.compraParceladaId) || [];
      grupo.push(despesa);
      grupos.set(despesa.compraParceladaId, grupo);
    });

    const comprasAgrupadas = Array.from(grupos.entries()).flatMap(([compraId, parcelas]) => {
      const parcelasOrdenadas = [...parcelas].sort((a, b) => (a.parcelaAtual || 0) - (b.parcelaAtual || 0));
      const primeiraParcela = parcelasOrdenadas[0];
      if (!primeiraParcela) return [];

      const nome = primeiraParcela.nome.replace(/\s+\(\d+\/\d+\)$/, '');
      const valorTotalEmCentavos = parcelasOrdenadas.reduce(
        (total, parcela) => total + Math.round(parcela.valor * 100),
        0
      );

      return [{
        ...primeiraParcela,
        compraParceladaId: compraId,
        nome,
        valor: valorTotalEmCentavos / 100,
        parcelasCompra: parcelasOrdenadas
      }];
    });

    return [...despesasAvulsas, ...comprasAgrupadas]
      .sort((a, b) => new Date(String(b.data)).getTime() - new Date(String(a.data)).getTime());
  }
}
