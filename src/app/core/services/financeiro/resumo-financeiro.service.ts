import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface IResumoMensal {
  ano: number;
  mes: number;
  rotulo: string;
  receitas: number;
  despesas: number;
  saldo: number;
  projetado: boolean;
  fechado: boolean;
}

export interface IResumoFinanceiro {
  periodo: { ano: number; mes: number };
  salarioMensal: number;
  salarioConsideradoAutomaticamente: boolean;
  totalReceitas: number;
  totalDespesas: number;
  saldoDisponivel: number;
  historicoMensal: IResumoMensal[];
}

@Injectable({ providedIn: 'root' })
export class ResumoFinanceiroService {
  private readonly apiUrl = `${environment.apiUrl}/financeiro`;

  constructor(private http: HttpClient) {}

  getResumoMensal(): Observable<{ message: string; resumo: IResumoFinanceiro }> {
    return this.http.get<{ message: string; resumo: IResumoFinanceiro }>(`${this.apiUrl}/mensal`);
  }
}
