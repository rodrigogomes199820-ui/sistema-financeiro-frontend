import { Component } from '@angular/core';
import { LoadingService } from 'src/app/core/services/loading.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-open-finance-loader',
  templateUrl: './open-finance-loader.component.html',
  styleUrls: ['./open-finance-loader.component.scss']
})
export class OpenFinanceLoaderComponent {

  loading$: Observable<boolean>;

  constructor(private loadingService: LoadingService) {
    this.loading$ = this.loadingService.loading$;
  }

}
