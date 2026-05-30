import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  HostListener,
  OnInit
} from '@angular/core';
import type { FormGroup } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';
import { take, tap } from 'rxjs/operators';
import { GivenTypeEnum } from '#common/enums/given-type.enum';
import { ResponseInfoStatusEnum } from '#common/enums/response-info-status.enum';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import type { Given } from '#common/zod/backend/given';
import type { Gv } from '#common/zod/backend/gv';
import type { Role } from '#common/zod/backend/role';
import type {
  ToBackendEditRoleGivenRequestPayload,
  ToBackendEditRoleGivenResponse
} from '#common/zod/to-backend/roles/to-backend-edit-role-given';
import { SharedModule } from '#front/app/modules/shared/shared.module';
import { MemberQuery } from '#front/app/queries/member.query';
import { RolesQuery } from '#front/app/queries/roles.query';
import type { ApiService } from '#front/app/services/api.service';

export interface EditRoleGivenDialogData {
  apiService: ApiService;
  role: Role;
  gv: Gv;
  givens: Given[];
}

@Component({
  selector: 'm-edit-role-given-dialog',
  templateUrl: './edit-role-given-dialog.component.html',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, ReactiveFormsModule, SharedModule]
})
export class EditRoleGivenDialogComponent implements OnInit {
  @HostListener('window:keyup.esc')
  onEscKeyUp() {
    this.ref.close();
  }

  dataItem: EditRoleGivenDialogData = this.ref.data;

  editRoleGivenForm: FormGroup;

  givenType: GivenTypeEnum;
  typeSingle = GivenTypeEnum.Single;

  constructor(
    public ref: DialogRef<EditRoleGivenDialogData>,
    private fb: FormBuilder,
    private memberQuery: MemberQuery,
    private rolesQuery: RolesQuery
  ) {}

  ngOnInit() {
    let given = this.dataItem.givens.find(
      item => item.givenId === this.dataItem.gv.givenId
    );

    this.givenType = given?.type;

    this.editRoleGivenForm = this.fb.group({
      values: [this.dataItem.gv.values.join('\n')]
    });

    setTimeout(() => {
      (document.activeElement as HTMLElement).blur();
    }, 0);
  }

  edit() {
    this.editRoleGivenForm.markAllAsTouched();

    if (!this.editRoleGivenForm.valid) {
      return;
    }

    this.ref.close();

    let payload: ToBackendEditRoleGivenRequestPayload = {
      projectId: this.dataItem.role.projectId,
      roleId: this.dataItem.role.roleId,
      givenId: this.dataItem.gv.givenId,
      values: this.parseValues({ values: this.editRoleGivenForm.value.values })
    };

    let apiService: ApiService = this.dataItem.apiService;

    apiService
      .req({
        pathInfoName: ToBackendRequestInfoNameEnum.ToBackendEditRoleGiven,
        payload: payload,
        showSpinner: true
      })
      .pipe(
        tap((resp: ToBackendEditRoleGivenResponse) => {
          if (resp.info?.status === ResponseInfoStatusEnum.Ok) {
            this.memberQuery.update(resp.payload.userMember);
            this.rolesQuery.update({ roles: resp.payload.roles });
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
