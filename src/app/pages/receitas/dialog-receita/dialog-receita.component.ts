import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IReceita } from '../receitas.service';

interface DialogReceitaData {
  modo: 'criar' | 'editar' | 'excluir';
  receita?: IReceita;
}

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
    dataRecebimento: ['', Validators.required],
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
        dataRecebimento: String(data.receita.dataRecebimento).slice(0, 10),
        categoria: data.receita.categoria,
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

    if (!Number.isFinite(valor) || valor <= 0 || !formValue.dataRecebimento) {
      return;
    }

    const dados: IReceita = {
      valor,
      dataRecebimento: new Date(formValue.dataRecebimento),
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
}
