import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { NotificationService } from 'src/app/core/services/notification.service';
import { DespesasService } from '../despesas/despesas.service';
import { ReceitasService } from '../receitas/receitas.service';

type TipoMovimentacao = 'receita' | 'despesa';

interface ItemHistorico {
  id: string;
  titulo: string;
  descricao: string;
  data: Date | string;
  valor: number;
  tipo: TipoMovimentacao;
}

@Component({
  selector: 'app-historico',
  templateUrl: './historico.component.html',
  styleUrls: ['./historico.component.scss']
})
export class HistoricoComponent implements OnInit {
  movimentacoes: ItemHistorico[] = [];
  carregando = true;
  termoBusca = '';
  tipoFiltro: 'todas' | TipoMovimentacao = 'todas';
  mesFiltro: number | null = null;
  anoFiltro: number | null = null;
  anosDisponiveis: number[] = [];
  readonly meses = [
    { valor: 1, nome: 'Janeiro' },
    { valor: 2, nome: 'Fevereiro' },
    { valor: 3, nome: 'Março' },
    { valor: 4, nome: 'Abril' },
    { valor: 5, nome: 'Maio' },
    { valor: 6, nome: 'Junho' },
    { valor: 7, nome: 'Julho' },
    { valor: 8, nome: 'Agosto' },
    { valor: 9, nome: 'Setembro' },
    { valor: 10, nome: 'Outubro' },
    { valor: 11, nome: 'Novembro' },
    { valor: 12, nome: 'Dezembro' }
  ];

  constructor(
    private receitasService: ReceitasService,
    private despesasService: DespesasService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    forkJoin({
      receitas: this.receitasService.getAll(),
      despesas: this.despesasService.getAll()
    }).subscribe({
      next: ({ receitas, despesas }) => {
        const itensReceitas = receitas.receitas.map((item, index): ItemHistorico => ({
          id: item._id || `receita-${index}`,
          titulo: item.observacao?.trim() || this.formatarCategoria(item.categoria),
          descricao: this.formatarCategoria(item.categoria),
          data: item.dataRecebimento,
          valor: Number(item.valor),
          tipo: 'receita'
        }));
        const itensDespesas = despesas.despesas.map((item, index): ItemHistorico => ({
          id: item._id || `despesa-${index}`,
          titulo: item.nome,
          descricao: 'Despesa',
          data: item.data,
          valor: Number(item.valor),
          tipo: 'despesa'
        }));

        this.movimentacoes = [...itensReceitas, ...itensDespesas]
          .sort((a, b) => new Date(String(b.data)).getTime() - new Date(String(a.data)).getTime());
        this.anosDisponiveis = Array.from(new Set(this.movimentacoes.map((item) =>
          new Date(String(item.data)).getUTCFullYear()
        ).filter((ano) => Number.isFinite(ano)))).sort((a, b) => b - a);
        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro ao carregar histórico:', error);
        this.notificationService.error(error.error?.message || 'Não foi possível carregar o histórico.');
        this.carregando = false;
      }
    });
  }

  get movimentacoesFiltradas(): ItemHistorico[] {
    const termo = this.termoBusca.trim().toLocaleLowerCase('pt-BR');

    return this.movimentacoes.filter((item) => {
      const correspondeTipo = this.tipoFiltro === 'todas' || item.tipo === this.tipoFiltro;
      const correspondeBusca = !termo ||
        item.titulo.toLocaleLowerCase('pt-BR').includes(termo) ||
        item.descricao.toLocaleLowerCase('pt-BR').includes(termo);
      const data = new Date(String(item.data));
      const correspondeMes = this.mesFiltro === null || data.getUTCMonth() + 1 === this.mesFiltro;
      const correspondeAno = this.anoFiltro === null || data.getUTCFullYear() === this.anoFiltro;

      return correspondeTipo && correspondeBusca && correspondeMes && correspondeAno;
    });
  }

  get totalReceitas(): number {
    return this.movimentacoes
      .filter((item) => item.tipo === 'receita')
      .reduce((total, item) => total + item.valor, 0);
  }

  get totalDespesas(): number {
    return this.movimentacoes
      .filter((item) => item.tipo === 'despesa')
      .reduce((total, item) => total + item.valor, 0);
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
