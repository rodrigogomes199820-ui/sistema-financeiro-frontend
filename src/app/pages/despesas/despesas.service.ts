import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface IDespesa {
  _id?: string;
  nome: string;
  valor: number;
  data: Date;
  compraParceladaId?: string;
  parcelaAtual?: number;
  totalParcelas?: number;
}

export interface IDespesasResponse {
  message: string;
  despesas: IDespesa[];
}

@Injectable({ providedIn: 'root' })
export class DespesasService {
  private readonly apiUrl = `${environment.apiUrl}/despesas`;

  constructor(private http: HttpClient) {}

  create(data: IDespesa, quantidadeParcelas = 1): Observable<{
    message: string;
    despesa?: IDespesa;
    despesas?: IDespesa[];
  }> {
    return this.http.post<{
      message: string;
      despesa?: IDespesa;
      despesas?: IDespesa[];
    }>(this.apiUrl, { ...data, quantidadeParcelas });
  }

  getAll(): Observable<IDespesasResponse> {
    return this.http.get<IDespesasResponse>(this.apiUrl);
  }

  update(id: string, data: Pick<IDespesa, 'nome' | 'valor'>): Observable<{ message: string; despesa: IDespesa }> {
    return this.http.put<{ message: string; despesa: IDespesa }>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<{ message: string; despesa: IDespesa }> {
    return this.http.delete<{ message: string; despesa: IDespesa }>(`${this.apiUrl}/${id}`);
  }
}
