import { Action } from '@ngrx/store';
import * as api from '@app/api/_index';
import * as actionTypes from '@app/store-actions/action-types';

export class CreateMconfigAction implements Action {
  readonly type = actionTypes.CREATE_MCONFIG;

  constructor(
    public payload: {
      api_payload: api.CreateMconfigRequestBody['payload'];
      navigate: any;
    }
  ) {}
}
