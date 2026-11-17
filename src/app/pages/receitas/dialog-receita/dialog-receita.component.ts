import { Component, Inject } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IReceita } from '../receitas.service';

interface DialogReceitaData {
  modo: 'criar' | 'editar' | 'excluir';
  receita?: IReceita;
}

const dataBrasileiraValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor = String(control.value || '').trim();
  if (!valor) return null;

  const correspondencia = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
  if (!correspondencia) return { dataInvalida: true };

  const dia = Number(correspondencia[1]);
  const mes = Number(correspondencia[2]);
  const ano = Number(correspondencia[3]);
  const data = new Date(Date.UTC(ano, mes - 1, dia));

  return data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
    ? null
    : { dataInvalida: true };
};

@Component({
  selector: 'app-dialog-receita',
  templateUrl: './dialog-receita.component.html',
  styleUrls: ['./dialog-receita.component.scss']
})
export class DialogReceitaComponent {
  receitaForm = this.fb.group({
    valor: ['', [
      Validators.required,
      Validators.pattern(/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/)
    ]],
    dataRecebimento: ['', [Validators.required, dataBrasileiraValidator]],
    categoria: ['salario', Validators.required],
    observacao: ['']
  });

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<DialogReceitaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogReceitaData
  ) {
    if (data.modo === 'editar' && data.receita) {
      this.receitaForm.patchValue({
        valor: data.receita.valor.toFixed(2).replace('.', ','),
        dataRecebimento: this.formatarDataBrasileira(data.receita.dataRecebimento),
        categoria: 'salario',
        observacao: data.receita.observacao || ''
      });
    }
  }

  salvar(): void {
    if (this.receitaForm.invalid) {
      this.receitaForm.markAllAsTouched();
      return;
    }

    const formValue = this.receitaForm.getRawValue();
    const valorDigitado = String(formValue.valor).trim();
    const valor = Number(valorDigitado.replace(/\./g, '').replace(',', '.'));

    const dataRecebimento = this.converterDataBrasileira(String(formValue.dataRecebimento));
    if (!Number.isFinite(valor) || valor <= 0 || !dataRecebimento) {
      return;
    }

    const dados: IReceita = {
      valor,
      dataRecebimento,
      categoria: formValue.categoria as IReceita['categoria'],
      observacao: formValue.observacao?.trim() || undefined
    };

    if (this.data.modo === 'criar') {
      this.dialogRef.close({ acao: 'criar', dados });
      return;
    }

    const receitaId = this.data.receita?._id?.trim();

    if (this.data.modo !== 'editar' || !receitaId) {
      return;
    }

    this.dialogRef.close({ acao: 'editar', receitaId, dados });
  }

  confirmarExclusao(): void {
    if (this.data.modo === 'excluir' && this.data.receita?._id) {
      this.dialogRef.close({
        acao: 'excluir',
        receitaId: this.data.receita._id
      });
    }
  }

  fechar(): void {
    this.dialogRef.close();
  }

  formatarDataAoDigitar(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitosAntesDoCursor = input.value
      .slice(0, input.selectionStart ?? input.value.length)
      .replace(/\D/g, '').length;
    const digitos = input.value.replace(/\D/g, '').slice(0, 8);

    let dataFormatada = digitos;
    if (digitos.length > 2) {
      dataFormatada = `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
    }
    if (digitos.length > 4) {
      dataFormatada = `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
    }

    const posicaoCursor = this.posicaoAposDigitos(
      dataFormatada,
      Math.min(digitosAntesDoCursor, digitos.length)
    );

    this.receitaForm.get('dataRecebimento')?.setValue(dataFormatada, { emitEvent: false });
    input.value = dataFormatada;
    input.setSelectionRange(posicaoCursor, posicaoCursor);
  }

  private formatarDataBrasileira(data: Date | string): string {
    const dataRecebimento = data instanceof Date ? data : new Date(data);
    if (Number.isNaN(dataRecebimento.getTime())) return '';

    const dia = String(dataRecebimento.getUTCDate()).padStart(2, '0');
    const mes = String(dataRecebimento.getUTCMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}/${dataRecebimento.getUTCFullYear()}`;
  }

  private converterDataBrasileira(valor: string): Date | null {
    const correspondencia = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor.trim());
    if (!correspondencia) return null;

    const dia = Number(correspondencia[1]);
    const mes = Number(correspondencia[2]);
    const ano = Number(correspondencia[3]);
    const data = new Date(ano, mes - 1, dia);

    return data.getFullYear() === ano &&
      data.getMonth() === mes - 1 &&
      data.getDate() === dia
      ? data
      : null;
  }

  private posicaoAposDigitos(valor: string, quantidadeDigitos: number): number {
    if (quantidadeDigitos === 0) return 0;

    let digitosEncontrados = 0;
    for (let indice = 0; indice < valor.length; indice += 1) {
      if (/\d/.test(valor[indice])) {
        digitosEncontrados += 1;
        if (digitosEncontrados === quantidadeDigitos) return indice + 1;
      }
    }

    return valor.length;
  }
}
