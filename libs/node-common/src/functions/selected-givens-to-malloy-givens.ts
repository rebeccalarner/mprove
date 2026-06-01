import type { GivenValue } from '@malloydata/malloy';
import { givenValuesToMalloyValues } from '#common/functions/given-type';
import type { SelectedGiven } from '#common/zod/backend/selected-given';

export function selectedGivensToMalloyGivens(item: {
  selectedGivens: SelectedGiven[];
}) {
  let { selectedGivens } = item;

  let malloyGivens: Record<string, GivenValue> = {};

  selectedGivens.forEach(selectedGiven => {
    malloyGivens[selectedGiven.givenId] = givenValuesToMalloyValues({
      type: selectedGiven.type,
      isMultiple: selectedGiven.isMultiple,
      values: selectedGiven.values
    });
  });

  return malloyGivens;
}
