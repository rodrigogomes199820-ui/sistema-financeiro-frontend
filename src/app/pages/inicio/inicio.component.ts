import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { NotificationService } from 'src/app/core/services/notification.service';
import { UsuarioService } from 'src/app/core/services/usuario/usuario.service';
import { DialogDespesaComponent } from '../despesas/dialog-despesa/dialog-despesa.component';
import { DespesasService, IDespesa } from '../despesas/despesas.service';
import { ReceitasService } from '../receitas/receitas.service';
import { IResumoMensal, ResumoFinanceiroService } from 'src/app/core/services/financeiro/resumo-financeiro.service';

interface MovimentacaoRecente {
  titulo: string;
  detalhe: string;
  data: Date | string;
  valor: number;
  tipo: 'receita' | 'despesa';
}

interface ResumoMensalVisual extends IResumoMensal {
  receitasAltura: number;
  despesasAltura: number;
}

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss']
})
export class InicioComponent implements OnInit {
  nomeUsuario = '';
  totalReceitas = 0;
  totalDespesas = 0;
  saldoDisponivel = 0;
  salarioConsideradoAutomaticamente = false;
  periodoAtualLabel = '';
  movimentacoesRecentes: MovimentacaoRecente[] = [];
  resumoMensal: ResumoMensalVisual[] = [];
  carregando = true;

  constructor(
    private despesasService: DespesasService,
    private receitasService: ReceitasService,
    private resumoFinanceiroService: ResumoFinanceiroService,
    private notificationService: NotificationService,
    private usuarioService: UsuarioService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.carregarResumo();
    this.usuarioService.getProfile().subscribe({
      next: (usuario) => this.nomeUsuario = usuario.name,
      error: (error) => console.error('Erro ao buscar nome do usuário:', error)
    });
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

      this.despesasService.create(
        resultado.dados as IDespesa,
        resultado.quantidadeParcelas
      ).subscribe({
        next: (response) => {
          this.notificationService.success(response.message);
          this.carregarResumo();
        },
        error: (error) => {
          console.error('Erro ao cadastrar despesa:', error);
          this.notificationService.error(error.error?.message || 'Erro ao cadastrar despesa.');
        }
      });
    });
  }

  private carregarResumo(): void {
    forkJoin({
      despesas: this.despesasService.getAll(),
      receitas: this.receitasService.getAll(),
      resumoMensal: this.resumoFinanceiroService.getResumoMensal()
    }).subscribe({
      next: ({ despesas, receitas, resumoMensal }) => {
        const resumo = resumoMensal.resumo;
        this.totalDespesas = resumo.totalDespesas;
        this.totalReceitas = resumo.totalReceitas;
        this.saldoDisponivel = resumo.saldoDisponivel;
        this.notificationService.warnIfMonthlyExpensesAreHigh(
          resumo.totalDespesas,
          resumo.totalReceitas,
          resumo.periodo.ano,
          resumo.periodo.mes
        );
        this.salarioConsideradoAutomaticamente = resumo.salarioConsideradoAutomaticamente;
        this.periodoAtualLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(
          new Date(resumo.periodo.ano, resumo.periodo.mes - 1, 1)
        );
        const maiorValor = Math.max(
          ...resumo.historicoMensal.flatMap((mes) => [mes.receitas, mes.despesas]),
          0
        );
        this.resumoMensal = resumo.historicoMensal.map((mes) => ({
          ...mes,
          receitasAltura: maiorValor ? (mes.receitas / maiorValor) * 100 : 0,
          despesasAltura: maiorValor ? (mes.despesas / maiorValor) * 100 : 0
        }));
        this.movimentacoesRecentes = [
          ...receitas.receitas.map((item): MovimentacaoRecente => ({
            titulo: item.observacao?.trim() || this.formatarCategoria(item.categoria),
            detalhe: 'Receita',
            data: item.dataRecebimento,
            valor: Number(item.valor),
            tipo: 'receita'
          })),
          ...this.agruparDespesasRecentes(despesas.despesas)
        ]
          .sort((a, b) => new Date(String(b.data)).getTime() - new Date(String(a.data)).getTime())
          .slice(0, 5);
        this.carregando = false;
      },
      error: (error) => {
        this.carregando = false;
        console.error('Erro ao carregar receitas e despesas:', error);
        this.notificationService.error(error.error?.message || 'Erro ao carregar o saldo.');
      }
    });
  }

  private agruparDespesasRecentes(despesas: IDespesa[]): MovimentacaoRecente[] {
    const grupos = new Map<string, IDespesa[]>();
    const despesasAvulsas = despesas
      .filter((despesa) => !despesa.compraParceladaId || !despesa.totalParcelas || despesa.totalParcelas < 2)
      .map((despesa): MovimentacaoRecente => ({
        titulo: despesa.nome,
        detalhe: 'Despesa',
        data: despesa.data,
        valor: Number(despesa.valor),
        tipo: 'despesa'
      }));

    despesas
      .filter((despesa) => Boolean(despesa.compraParceladaId) && Boolean(despesa.totalParcelas && despesa.totalParcelas > 1))
      .forEach((despesa) => {
        const compraId = despesa.compraParceladaId as string;
        const parcelas = grupos.get(compraId) || [];
        parcelas.push(despesa);
        grupos.set(compraId, parcelas);
      });

    const comprasParceladas = Array.from(grupos.values()).flatMap((parcelas) => {
      const parcelasOrdenadas = [...parcelas].sort((a, b) => (a.parcelaAtual || 0) - (b.parcelaAtual || 0));
      const primeiraParcela = parcelasOrdenadas[0];
      if (!primeiraParcela) return [];

      const valorTotalEmCentavos = parcelasOrdenadas.reduce(
        (total, parcela) => total + Math.round(parcela.valor * 100),
        0
      );
      const nome = primeiraParcela.nome.replace(/\s+\(\d+\/\d+\)$/, '');

      return [{
        titulo: nome,
        detalhe: `Compra parcelada · ${primeiraParcela.totalParcelas}x de ${primeiraParcela.valor.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        })}`,
        data: primeiraParcela.data,
        valor: valorTotalEmCentavos / 100,
        tipo: 'despesa' as const
      }];
    });

    return [...despesasAvulsas, ...comprasParceladas];
  }

  private formatarCategoria(categoria: string): string {
    const categorias: Record<string, string> = {
      salario: 'Salário',
      freelance: 'Freelance',
      comissao: 'Comissão',
      outros: 'Outros'
    };

    return categorias[categoria] || 'Receita';
  }
}
