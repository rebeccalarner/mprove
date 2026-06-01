import type { GivenValue } from '@malloydata/malloy';
import { GivenTypeEnum } from '#common/enums/given-type.enum';
import type { SelectedGiven } from '#common/zod/backend/selected-given';

export function selectedGivensToMalloyGivens(item: {
  selectedGivens: SelectedGiven[];
}) {
  let { selectedGivens } = item;

  let malloyGivens: Record<string, GivenValue> = {};

  selectedGivens.forEach(selectedGiven => {
    if (selectedGiven.values.length === 0) {
      return;
    }

    malloyGivens[selectedGiven.givenId] =
      selectedGiven.type === GivenTypeEnum.Single
        ? selectedGiven.values[0]
        : selectedGiven.values;
  });

  return malloyGivens;
}
