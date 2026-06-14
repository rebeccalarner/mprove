import { Component } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { map } from 'rxjs/operators';
import { APP_SPINNER_NAME } from '#common/constants/top-front';

@Component({
  standalone: false,
  selector: 'm-select-file',
  templateUrl: './select-file.component.html'
})
export class SelectFileComponent {
  isAppSpinnerVisible$ = this.spinner
    .getSpinner(APP_SPINNER_NAME)
    .pipe(map(spinner => spinner.show));

  constructor(private spinner: NgxSpinnerService) {}
}
