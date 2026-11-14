
import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

import { MaterialModule } from './shared/material/material.module';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './pages/login/login.component';
import { CadastroComponent } from './pages/cadastro/cadastro.component';
import { InicioComponent } from './pages/inicio/inicio.component';
import { LayoutComponent } from './layout/layout.component';
import { RecuperarSenhaComponent } from './pages/recuperar-senha/recuperar-senha.component';
import { RedefinirSenhaComponent } from './pages/redefinir-senha/redefinir-senha.component';
import { OpenFinanceLoaderComponent } from './shared/components/open-finance-loader/open-finance-loader.component';
import { ReceitasComponent } from './pages/receitas/receitas.component';
import { HistoricoComponent } from './pages/historico/historico.component';
import { ConfiguracaoComponent } from './pages/configuracao/configuracao.component';
import { DialogReceitaComponent } from './pages/receitas/dialog-receita/dialog-receita.component';
import { DespesasComponent } from './pages/despesas/despesas.component';
import { DialogDespesaComponent } from './pages/despesas/dialog-despesa/dialog-despesa.component';

registerLocaleData(localePt, 'pt-BR');

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    CadastroComponent,
    InicioComponent,
    LayoutComponent,
    RecuperarSenhaComponent,
    RedefinirSenhaComponent,
    OpenFinanceLoaderComponent,
    ReceitasComponent,
    HistoricoComponent,
    ConfiguracaoComponent,
    DialogReceitaComponent,
    DespesasComponent,
    DialogDespesaComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatSnackBarModule
  ],
  providers: [
    {
      provide: LOCALE_ID,
      useValue: 'pt-BR'
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
