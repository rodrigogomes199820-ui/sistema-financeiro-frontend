import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login.component';
import { CadastroComponent } from './pages/cadastro/cadastro.component';
import { LayoutComponent } from './layout/layout.component';

import { RecuperarSenhaComponent } from './pages/recuperar-senha/recuperar-senha.component';
import { RedefinirSenhaComponent } from './pages/redefinir-senha/redefinir-senha.component';

import { InicioComponent } from './pages/inicio/inicio.component';
import { ReceitasComponent } from './pages/receitas/receitas.component';
import { HistoricoComponent } from './pages/historico/historico.component';
import { ConfiguracaoComponent } from './pages/configuracao/configuracao.component';
import { DespesasComponent } from './pages/despesas/despesas.component';
import { PerfilComponent } from './pages/perfil/perfil.component';

import { authGuard } from './core/guards/auth.guard';

const routes: Routes = [

  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: 'cadastro',
    component: CadastroComponent
  },

  {
    path: 'recuperar-senha',
    component: RecuperarSenhaComponent
  },

  {
    path: 'redefinir-senha',
    component: RedefinirSenhaComponent
  },

  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [

      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
      },

      {
        path: 'inicio',
        component: InicioComponent
      },

      {
        path: 'receitas',
        component: ReceitasComponent
      },

      {
        path: 'despesas',
        component: DespesasComponent
      },


      {
        path: 'historico',
        component: HistoricoComponent
      },

      {
        path: 'configuracao',
        component: ConfiguracaoComponent
      },

      {
        path: 'perfil',
        component: PerfilComponent
      }

    ]
  },

  {
    path: '**',
    redirectTo: 'login'
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
