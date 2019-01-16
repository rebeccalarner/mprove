import { Component, OnInit } from '@angular/core';
import * as services from 'app/services/_index';
import * as interfaces from 'app/interfaces/_index';
import * as actions from 'app/store/actions/_index';
import { Store } from '@ngrx/store';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  moduleId: module.id,
  selector: 'm-update-password',
  templateUrl: 'update-password.component.html'
})
export class UpdatePasswordComponent implements OnInit {
  token;
  updatePasswordForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public pageTitle: services.PageTitleService,
    private store: Store<interfaces.AppState>,
    private route: ActivatedRoute
  ) {
    this.pageTitle.setTitle('Set New Password | Mprove');
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');

    this.buildForm();
  }

  buildForm(): void {
    this.updatePasswordForm = this.fb.group({
      password: [
        null,
        Validators.compose([Validators.required, Validators.maxLength(255)])
      ]
    });
  }

  onSubmit(fv: any) {
    this.store.dispatch(
      new actions.UpdateUserPasswordAction({
        token: this.token,
        password: fv['password']
      })
    );
    this.store.dispatch(new actions.LogoutUserAction({ empty: true }));
  }
}
