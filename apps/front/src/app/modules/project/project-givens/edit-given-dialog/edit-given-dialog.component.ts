import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  HostListener,
  OnInit
} from '@angular/core';
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';
import { take, tap } from 'rxjs/operators';
import { ResponseInfoStatusEnum } from '#common/enums/response-info-status.enum';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import { getGivenValueValidationError } from '#common/functions/given-type';
import type { Given } from '#common/zod/backend/given';
import type {
  ToBackendEditGivenRequestPayload,
  ToBackendEditGivenResponse
} from '#common/zod/to-backend/givens/to-backend-edit-given';
import { SharedModule } from '#front/app/modules/shared/shared.module';
import { GivensQuery } from '#front/app/queries/givens.query';
import { MemberQuery } from '#front/app/queries/member.query';
import { ApiService } from '#front/app/services/api.service';

export interface EditGivenDialogData {
  apiService: ApiService;
  given: Given;
}

@Component({
  selector: 'm-edit-given-dialog',
  templateUrl: './edit-given-dialog.component.html',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, ReactiveFormsModule, SharedModule]
})
export class EditGivenDialogComponent implements OnInit {
  @HostListener('window:keyup.esc')
  onEscKeyUp() {
    this.ref.close();
  }

  dataItem: EditGivenDialogData = this.ref.data;

  editGivenForm: FormGroup;

  constructor(
    public ref: DialogRef<EditGivenDialogData>,
    private fb: FormBuilder,
    private memberQuery: MemberQuery,
    private givensQuery: GivensQuery
  ) {}

  ngOnInit() {
    this.editGivenForm = this.fb.group({
      values: [
        this.dataItem.given.values.join('\n'),
        [Validators.maxLength(10000), this.givenValuesValidator]
      ]
    });

    setTimeout(() => {
      (document.activeElement as HTMLElement).blur();
    }, 0);
  }

  edit() {
    this.editGivenForm.markAllAsTouched();

    if (!this.editGivenForm.valid) {
      return;
    }

    this.ref.close();

    let payload: ToBackendEditGivenRequestPayload = {
      projectId: this.dataItem.given.projectId,
      givenId: this.dataItem.given.givenId,
      values: this.parseValues({ values: this.editGivenForm.value.values })
    };

    let apiService: ApiService = this.dataItem.apiService;

    apiService
      .req({
        pathInfoName: ToBackendRequestInfoNameEnum.ToBackendEditGiven,
        payload: payload,
        showSpinner: true
      })
      .pipe(
        tap((resp: ToBackendEditGivenResponse) => {
          if (resp.info?.status === ResponseInfoStatusEnum.Ok) {
            this.memberQuery.update(resp.payload.userMember);
            this.givensQuery.update({ givens: resp.payload.givens });
          }
        }),
        take(1)
      )
      .subscribe();
  }

  cancel() {
    this.ref.close();
  }

  private parseValues(item: { values: string }) {
    let { values } = item;

    return (values ?? '')
      .split('\n')
      .map(x => x.trim())
      .filter(x => x !== '');
  }

  private givenValuesValidator = (
    control: AbstractControl
  ): ValidationErrors | null => {
    let values = this.parseValues({ values: control.value });
    let message = getGivenValueValidationError({
      type: this.dataItem.given.type,
      isMultiple: this.dataItem.given.isMultiple,
      values: values
    });

    return message === undefined
      ? null
      : { wrongGivenValue: { message: message } };
  };
}
