import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  HostListener,
  OnInit
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { DialogRef } from '@ngneat/dialog';
import { take, tap } from 'rxjs/operators';
import { GivenTypeEnum } from '#common/enums/given-type.enum';
import { ResponseInfoStatusEnum } from '#common/enums/response-info-status.enum';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import type {
  ToBackendCreateGivenRequestPayload,
  ToBackendCreateGivenResponse
} from '#common/zod/to-backend/givens/to-backend-create-given';
import { SharedModule } from '#front/app/modules/shared/shared.module';
import { GivensQuery } from '#front/app/queries/givens.query';
import { MemberQuery } from '#front/app/queries/member.query';
import { ApiService } from '#front/app/services/api.service';
import { ValidationService } from '#front/app/services/validation.service';

export interface AddGivenDialogData {
  apiService: ApiService;
  projectId: string;
}

@Component({
  selector: 'm-add-given-dialog',
  templateUrl: './add-given-dialog.component.html',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, ReactiveFormsModule, SharedModule, NgSelectModule]
})
export class AddGivenDialogComponent implements OnInit {
  @HostListener('window:keyup.esc')
  onEscKeyUp() {
    this.ref.close();
  }

  dataItem: AddGivenDialogData = this.ref.data;

  addGivenForm: FormGroup;

  givenTypes = [GivenTypeEnum.Single, GivenTypeEnum.Array];
  typeSingle = GivenTypeEnum.Single;

  constructor(
    public ref: DialogRef<AddGivenDialogData>,
    private fb: FormBuilder,
    private memberQuery: MemberQuery,
    private givensQuery: GivensQuery
  ) {}

  ngOnInit() {
    this.addGivenForm = this.fb.group({
      givenId: [
        undefined,
        [
          Validators.required,
          ValidationService.givenIdWrongChars,
          Validators.maxLength(32)
        ]
      ],
      type: [GivenTypeEnum.Single, [Validators.required]],
      values: [undefined, [Validators.maxLength(10000)]]
    });

    setTimeout(() => {
      (document.activeElement as HTMLElement).blur();
    }, 0);
  }

  add() {
    this.addGivenForm.markAllAsTouched();

    if (!this.addGivenForm.valid) {
      return;
    }

    this.ref.close();

    let payload: ToBackendCreateGivenRequestPayload = {
      projectId: this.dataItem.projectId,
      givenId: this.addGivenForm.value.givenId,
      type: this.addGivenForm.value.type,
      values: this.parseValues({ values: this.addGivenForm.value.values })
    };

    let apiService: ApiService = this.dataItem.apiService;

    apiService
      .req({
        pathInfoName: ToBackendRequestInfoNameEnum.ToBackendCreateGiven,
        payload: payload,
        showSpinner: true
      })
      .pipe(
        tap((resp: ToBackendCreateGivenResponse) => {
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
}
