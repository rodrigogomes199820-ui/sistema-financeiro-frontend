import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { NotificationService } from 'src/app/core/services/notification.service';
import { DespesasService, IDespesa } from '../despesas/despesas.service';
import { ReceitasService } from '../receitas/receitas.service';

type TipoMovimentacao = 'receita' | 'despesa';

interface ItemHistorico {
  id: string;
  titulo: string;
  descricao: string;
  data: Date | string;
  valor: number;
  tipo: TipoMovimentacao;
  datasRelacionadas?: (Date | string)[];
  periodo?: string;
  parcelas?: { numero: number; data: Date | string; valor: number }[];
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
  detalheAbertoId: string | null = null;
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
        const itensDespesas = this.agruparDespesas(despesas.despesas);

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
      const datas = item.datasRelacionadas || [item.data];
      const correspondeMes = this.mesFiltro === null || datas.some((data) =>
        new Date(String(data)).getUTCMonth() + 1 === this.mesFiltro
      );
      const correspondeAno = this.anoFiltro === null || datas.some((data) =>
        new Date(String(data)).getUTCFullYear() === this.anoFiltro
      );

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

  alternarDetalhes(id: string): void {
    this.detalheAbertoId = this.detalheAbertoId === id ? null : id;
  }

  private agruparDespesas(despesas: IDespesa[]): ItemHistorico[] {
    const parcelasPorCompra = new Map<string, IDespesa[]>();
    const despesasAvulsas: ItemHistorico[] = [];

    despesas.forEach((despesa, index) => {
      if (!despesa.compraParceladaId || !despesa.totalParcelas || despesa.totalParcelas < 2) {
        despesasAvulsas.push({
          id: despesa._id || `despesa-${index}`,
          titulo: despesa.nome,
          descricao: 'Despesa',
          data: despesa.data,
          valor: Number(despesa.valor),
          tipo: 'despesa'
        });
        return;
      }

      const parcelas = parcelasPorCompra.get(despesa.compraParceladaId) || [];
      parcelas.push(despesa);
      parcelasPorCompra.set(despesa.compraParceladaId, parcelas);
    });

    const comprasParceladas = Array.from(parcelasPorCompra.entries()).flatMap(([compraId, parcelas]) => {
      const ordenadas = [...parcelas].sort((a, b) => (a.parcelaAtual || 0) - (b.parcelaAtual || 0));
      const primeiraParcela = ordenadas[0];
      if (!primeiraParcela) return [];

      const datas = ordenadas.map((parcela) => parcela.data);
      const formatarMesAno = (data: Date | string) => new Intl.DateTimeFormat('pt-BR', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
      }).format(new Date(String(data))).replace('.', '');
      const periodo = datas.length > 1
        ? `${formatarMesAno(datas[0] as Date | string)} – ${formatarMesAno(datas[datas.length - 1] as Date | string)}`
        : formatarMesAno(datas[0] as Date | string);
      const valorTotal = ordenadas.reduce(
        (total, parcela) => total + Math.round(Number(parcela.valor) * 100),
        0
      ) / 100;

      return [{
        id: compraId,
        titulo: primeiraParcela.nome.replace(/\s+\(\d+\/\d+\)$/, ''),
        descricao: `Despesa parcelada · ${primeiraParcela.totalParcelas} parcelas`,
        data: primeiraParcela.data,
        datasRelacionadas: datas,
        periodo,
        parcelas: ordenadas.map((parcela) => ({
          numero: parcela.parcelaAtual || 0,
          data: parcela.data,
          valor: Number(parcela.valor)
        })),
        valor: valorTotal,
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
