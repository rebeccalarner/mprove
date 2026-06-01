import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  HostListener,
  OnInit
} from '@angular/core';
import {
  FormBuilder,
  type FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';
import { take, tap } from 'rxjs/operators';
import { ResponseInfoStatusEnum } from '#common/enums/response-info-status.enum';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import type { Given } from '#common/zod/backend/given';
import type {
  ToBackendEditGivenRequestPayload,
  ToBackendEditGivenResponse
} from '#common/zod/to-backend/givens/to-backend-edit-given';
import { SharedModule } from '#front/app/modules/shared/shared.module';
import { GivensQuery } from '#front/app/queries/givens.query';
import { MemberQuery } from '#front/app/queries/member.query';
import { ApiService } from '#front/app/services/api.service';
import { ValidationService } from '#front/app/services/validation.service';

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
        [
          Validators.maxLength(10000),
          ValidationService.givenValuesValidator({
            getType: () => this.dataItem.given.type,
            getIsMultiple: () => this.dataItem.given.isMultiple
          })
        ]
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
      values: ValidationService.parseGivenValues({
        values: this.editGivenForm.value.values
      })
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
}
