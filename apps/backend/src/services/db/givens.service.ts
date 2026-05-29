import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { Db } from '#backend/drizzle/drizzle.module';
import { DRIZZLE } from '#backend/drizzle/drizzle.module';
import type { GivenTab } from '#backend/drizzle/postgres/schema/_tabs';
import { givensTable } from '#backend/drizzle/postgres/schema/givens';
import { ErEnum } from '#common/enums/er.enum';
import type { GivenTypeEnum } from '#common/enums/given-type.enum';
import { isDefined } from '#common/functions/is-defined';
import { isUndefined } from '#common/functions/is-undefined';
import { ServerError } from '#common/models/server-error';
import type { Given } from '#common/zod/backend/given';
import { HashService } from '../hash.service';
import { TabService } from '../tab.service';

@Injectable()
export class GivensService {
  constructor(
    private tabService: TabService,
    private hashService: HashService,
    @Inject(DRIZZLE) private db: Db
  ) {}

  makeGiven(item: {
    projectId: string;
    givenId: string;
    type: GivenTypeEnum;
    values: string[];
  }): GivenTab {
    let { projectId, givenId, type, values } = item;

    let given: GivenTab = {
      givenFullId: this.hashService.makeGivenFullId({
        projectId: projectId,
        givenId: givenId
      }),
      projectId: projectId,
      givenId: givenId,
      type: type,
      values: values,
      keyTag: undefined,
      serverTs: undefined
    };

    return given;
  }

  tabToApi(item: { given: GivenTab }): Given {
    let { given } = item;

    let apiGiven: Given = {
      projectId: given.projectId,
      givenId: given.givenId,
      type: given.type,
      values: given.values
    };

    return apiGiven;
  }

  async checkGivenDoesNotExist(item: { projectId: string; givenId: string }) {
    let { projectId, givenId } = item;

    let given = await this.db.drizzle.query.givensTable.findFirst({
      where: and(
        eq(givensTable.projectId, projectId),
        eq(givensTable.givenId, givenId)
      )
    });

    if (isDefined(given)) {
      throw new ServerError({
        message: ErEnum.BACKEND_GIVEN_ALREADY_EXISTS
      });
    }
  }

  async getGivenCheckExists(item: { projectId: string; givenId: string }) {
    let { projectId, givenId } = item;

    let given = await this.db.drizzle.query.givensTable
      .findFirst({
        where: and(
          eq(givensTable.projectId, projectId),
          eq(givensTable.givenId, givenId)
        )
      })
      .then(x => this.tabService.givenEntToTab(x));

    if (isUndefined(given)) {
      throw new ServerError({
        message: ErEnum.BACKEND_GIVEN_DOES_NOT_EXIST
      });
    }

    return given;
  }

  async getApiGivens(item: { projectId: string }) {
    let { projectId } = item;

    let givens = await this.db.drizzle.query.givensTable
      .findMany({
        where: eq(givensTable.projectId, projectId)
      })
      .then(xs => xs.map(x => this.tabService.givenEntToTab(x)));

    let apiGivens = givens
      .map(given => this.tabToApi({ given: given }))
      .sort((a, b) =>
        a.givenId > b.givenId ? 1 : b.givenId > a.givenId ? -1 : 0
      );

    return apiGivens;
  }
}
