import { CommonModule } from '@angular/common';
import type { ElementRef } from '@angular/core';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  HostListener,
  OnInit,
  ViewChild
} from '@angular/core';
import type { FormGroup } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';
import { take, tap } from 'rxjs/operators';
import { ResponseInfoStatusEnum } from '#common/enums/response-info-status.enum';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import type {
  ToBackendCreateRoleRequestPayload,
  ToBackendCreateRoleResponse
} from '#common/zod/to-backend/roles/to-backend-create-role';
import { SharedModule } from '#front/app/modules/shared/shared.module';
import { MemberQuery } from '#front/app/queries/member.query';
import { RolesQuery } from '#front/app/queries/roles.query';
import type { ApiService } from '#front/app/services/api.service';
import { ValidationService } from '#front/app/services/validation.service';

export interface AddProjectRoleDialogData {
  apiService: ApiService;
  projectId: string;
}

@Component({
  selector: 'm-add-project-role-dialog',
  templateUrl: './add-project-role-dialog.component.html',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, ReactiveFormsModule, SharedModule]
})
export class AddProjectRoleDialogComponent implements OnInit {
  @HostListener('window:keyup.esc')
  onEscKeyUp() {
    this.ref.close();
  }

  @ViewChild('roleId') roleIdElement: ElementRef;

  dataItem: AddProjectRoleDialogData = this.ref.data;

  addProjectRoleForm: FormGroup;

  constructor(
    public ref: DialogRef<AddProjectRoleDialogData>,
    private fb: FormBuilder,
    private memberQuery: MemberQuery,
    private rolesQuery: RolesQuery
  ) {}

  ngOnInit() {
    this.addProjectRoleForm = this.fb.group({
      roleId: [
        undefined,
        [
          Validators.required,
          ValidationService.roleIdWrongChars,
          Validators.maxLength(32)
        ]
      ]
    });

    setTimeout(() => {
      this.roleIdElement.nativeElement.focus();
    }, 0);
  }

  add() {
    this.addProjectRoleForm.markAllAsTouched();

    if (!this.addProjectRoleForm.valid) {
      return;
    }

    this.ref.close();

    let payload: ToBackendCreateRoleRequestPayload = {
      projectId: this.dataItem.projectId,
      roleId: this.addProjectRoleForm.value.roleId
    };

    let apiService: ApiService = this.dataItem.apiService;

    apiService
      .req({
        pathInfoName: ToBackendRequestInfoNameEnum.ToBackendCreateRole,
        payload: payload,
        showSpinner: true
      })
      .pipe(
        tap((resp: ToBackendCreateRoleResponse) => {
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
}
