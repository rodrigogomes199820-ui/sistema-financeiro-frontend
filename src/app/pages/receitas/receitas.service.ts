import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface IReceita {
    _id?: string;
  valor: number;
  dataRecebimento: Date;
  categoria: 'salario' | 'freelance' | 'comissao' | 'outros';
  observacao?: string;
}
export interface IReceitaResponse {
  message: string;
  receitas: IReceita[];
}
@Injectable({
  providedIn: 'root'
})
export class ReceitasService {
  private readonly apiUrl = `${environment.apiUrl}/receitas`;


  constructor(private http: HttpClient) { }

  create(data: IReceita): Observable<any>{
    return this.http.post(this.apiUrl, data)
  }


   getAll(): Observable<IReceitaResponse> {
    return this.http.get<IReceitaResponse>(this.apiUrl);
  }


 editar(receitaId: string, data: IReceita ): Observable<any>{

   return this.http.put(
    `${this.apiUrl}/${receitaId}`, data
   )

 }



excluir(receitaId: string): Observable<any> {
  return this.http.delete(`${this.apiUrl}/${receitaId}`);
}
}
