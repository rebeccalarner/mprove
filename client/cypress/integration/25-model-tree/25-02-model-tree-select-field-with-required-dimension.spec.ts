import * as constants from '../../../src/app/constants/_index';
import * as api from '../../../src/app/api/_index';
import * as enums from '../../../src/app/enums/_index';

const userId = '25-02-user@example.com';
const password = '123123';

const projectId = 'project_25_02';

describe('25-02 model-tree-select-field-with-required-dimension (logged in)', () => {
  it(`should be able to select-field-with-required-dimension`, () => {
    cy.deletePack({
      user_ids: [userId],
      project_ids: [projectId]
    });
    cy.seedPack({
      users: [
        {
          user_id: userId,
          password: password,
          email_verified: true
        }
      ],
      members: [
        {
          project_id: projectId,
          member_id: userId,
          is_admin: true,
          is_editor: true
        }
      ],
      projects: [
        {
          project_id: projectId,
          has_credentials: true
        }
      ]
    });
    cy.loginUser({ user_id: userId, password: password });
    cy.basicVisit(
      `${constants.PATH_PROJECT}/${projectId}/${constants.PATH_MODE}/${
        enums.LayoutModeEnum.Prod
      }/model/m1`
    );
    cy.loading();

    cy.get('[data-cy=modelTreeItemSelectButton]')
      .eq(1)
      .click({ force: true });
    cy.loading();

    cy.get('[data-cy=dialogReqDimAddedOkButton]').click();
    cy.get('[data-cy=dialogReqDimAddedOkButton]').should('not.exist');

    cy.get('[data-cy=mainTableColumnLabel]')
      .contains('Price')
      .should('exist');

    cy.get('[data-cy=mainTableColumnLabel]')
      .contains('DoublePrice')
      .should('exist');
  });
});
