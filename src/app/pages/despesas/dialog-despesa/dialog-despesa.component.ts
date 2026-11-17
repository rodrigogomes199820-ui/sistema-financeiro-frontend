import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IDespesa } from '../despesas.service';

interface DialogDespesaData {
  modo: 'criar' | 'editar' | 'excluir';
  despesa?: IDespesa;
}

@Component({
  selector: 'app-dialog-despesa',
  templateUrl: './dialog-despesa.component.html',
  styleUrls: ['./dialog-despesa.component.scss']
})
export class DialogDespesaComponent {
  despesaForm = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    valor: ['', [
      Validators.required,
      Validators.pattern(/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/)
    ]],
    quantidadeParcelas: [1, [Validators.required, Validators.min(1), Validators.max(80)]]
  });

  readonly opcoesParcelas = Array.from({ length: 80 }, (_, indice) => indice + 1);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<DialogDespesaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogDespesaData
  ) {
    if (data.modo === 'editar' && data.despesa) {
      this.despesaForm.patchValue({
        nome: data.despesa.nome,
        valor: data.despesa.valor.toFixed(2).replace('.', ',')
      });
    }
  }

  get valorTotalPreview(): number | null {
    const valor = Number(String(this.despesaForm.controls.valor.value || '')
      .trim().replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(valor) && valor > 0 ? valor : null;
  }

  get valorParcelaPreview(): number | null {
    const quantidade = Number(this.despesaForm.controls.quantidadeParcelas.value);
    if (this.valorTotalPreview === null || quantidade < 1) return null;
    return Math.round(this.valorTotalPreview / quantidade * 100) / 100;
  }

  salvar(): void {
    if (this.despesaForm.invalid) {
      this.despesaForm.markAllAsTouched();
      return;
    }

    const formValue = this.despesaForm.getRawValue();
    const valorDigitado = String(formValue.valor).trim();
    const valor = Number(valorDigitado.replace(/\./g, '').replace(',', '.'));

    const nome = String(formValue.nome).trim();
    if (!nome || !Number.isFinite(valor) || valor <= 0) {
      return;
    }

    const dados: IDespesa = {
      nome,
      valor,
      data: this.data.modo === 'editar' && this.data.despesa
        ? this.data.despesa.data
        : new Date()
    };

    if (this.data.modo === 'criar') {
      this.dialogRef.close({
        acao: 'criar',
        dados,
        quantidadeParcelas: Number(formValue.quantidadeParcelas)
      });
      return;
    }

    const despesaId = this.data.despesa?._id;
    if (this.data.modo === 'editar' && despesaId) {
      this.dialogRef.close({ acao: 'editar', despesaId, dados });
    }
  }

  confirmarExclusao(): void {
    if (this.data.modo === 'excluir' && this.data.despesa?._id) {
      this.dialogRef.close({ acao: 'excluir', despesaId: this.data.despesa._id });
    }
  }

  fechar(): void {
    this.dialogRef.close();
  }
}
