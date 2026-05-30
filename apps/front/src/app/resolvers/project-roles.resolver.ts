import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Resolve,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import type { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { ResponseInfoStatusEnum } from '#common/enums/response-info-status.enum';
import { ToBackendRequestInfoNameEnum } from '#common/enums/to/to-backend-request-info-name.enum';
import type {
  ToBackendGetRolesRequestPayload,
  ToBackendGetRolesResponse
} from '#common/zod/to-backend/roles/to-backend-get-roles';
import { checkNavOrgProject } from '../functions/check-nav-org-project';
import { GivensQuery } from '../queries/givens.query';
import { MemberQuery } from '../queries/member.query';
import { NavQuery, type NavState } from '../queries/nav.query';
import { RolesQuery } from '../queries/roles.query';
import { ApiService } from '../services/api.service';

@Injectable({ providedIn: 'root' })
export class ProjectRolesResolver implements Resolve<Observable<boolean>> {
  constructor(
    private navQuery: NavQuery,
    private router: Router,
    private apiService: ApiService,
    private memberQuery: MemberQuery,
    private givensQuery: GivensQuery,
    private rolesQuery: RolesQuery
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    routerStateSnapshot: RouterStateSnapshot
  ): Observable<boolean> {
    let nav: NavState;
    this.navQuery
      .select()
      .pipe(
        tap(x => {
          nav = x;
        }),
        take(1)
      )
      .subscribe();

    checkNavOrgProject({
      router: this.router,
      route: route,
      nav: nav
    });

    let projectId;

    this.navQuery.projectId$.pipe(take(1)).subscribe(x => {
      projectId = x;
    });

    let getRolesPayload: ToBackendGetRolesRequestPayload = {
      projectId: projectId
    };

    return this.apiService
      .req({
        pathInfoName: ToBackendRequestInfoNameEnum.ToBackendGetRoles,
        payload: getRolesPayload
      })
      .pipe(
        map((resp: ToBackendGetRolesResponse) => {
          if (resp.info?.status === ResponseInfoStatusEnum.Ok) {
            this.memberQuery.update(resp.payload.userMember);

            let newSortedRoles = resp.payload.roles.sort((a, b) =>
              a.roleId > b.roleId ? 1 : b.roleId > a.roleId ? -1 : 0
            );

            let newSortedGivens = resp.payload.givens.sort((a, b) =>
              a.givenId > b.givenId ? 1 : b.givenId > a.givenId ? -1 : 0
            );

            this.rolesQuery.update({
              roles: newSortedRoles
            });

            this.givensQuery.update({
              givens: newSortedGivens
            });

            return true;
          } else {
            return false;
          }
        })
      );
  }
}
