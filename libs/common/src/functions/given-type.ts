import { GivenTypeEnum } from '#common/enums/given-type.enum';

export let givenTypes = [
  GivenTypeEnum.String,
  GivenTypeEnum.Number,
  GivenTypeEnum.Boolean,
  GivenTypeEnum.Date,
  GivenTypeEnum.Timestamp
  // GivenTypeEnum.TimestampTz
];

export function getMalloyGivenTypeName(item: { type: GivenTypeEnum }) {
  let { type } = item;

  switch (type) {
    case GivenTypeEnum.String:
      return 'string';
    case GivenTypeEnum.Number:
      return 'number';
    case GivenTypeEnum.Boolean:
      return 'boolean';
    case GivenTypeEnum.Date:
      return 'date';
    case GivenTypeEnum.Timestamp:
      return 'timestamp';
    // case GivenTypeEnum.TimestampTz:
    //   return 'timestamptz';
  }
}

export function isGivenTypeMalloyCompatible(item: {
  givenType: GivenTypeEnum;
  isMultiple: boolean;
  malloyType: {
    type: string;
    elementTypeDef?: { type: string };
  };
}) {
  let { givenType, isMultiple, malloyType } = item;

  let expectedType = getMalloyGivenTypeName({ type: givenType });

  if (isMultiple) {
    return (
      malloyType.type === 'array' &&
      malloyType.elementTypeDef?.type === expectedType
    );
  }

  return malloyType.type === expectedType;
}

export function getGivenValueValidationError(item: {
  type: GivenTypeEnum;
  isMultiple: boolean;
  values: string[];
}) {
  let { type, isMultiple, values } = item;

  if (!isMultiple && values.length === 0) {
    return 'Non-empty value required for single-value given types';
  }

  if (!isMultiple && values.length > 1) {
    return 'Single-value given types accept only one value';
  }

  let invalidValue = values.find(
    value => isGivenScalarValueValid({ type: type, value: value }) === false
  );

  if (invalidValue !== undefined) {
    return getGivenScalarValidationMessage({ type: type, value: invalidValue });
  }

  return undefined;
}

export function isGivenScalarValueValid(item: {
  type: GivenTypeEnum;
  value: string;
}) {
  let { type, value } = item;

  switch (type) {
    case GivenTypeEnum.String:
      return true;
    case GivenTypeEnum.Number:
      return /^-?(\d+(\.\d+)?|\.\d+)([eE][+-]?\d+)?$/.test(value);
    case GivenTypeEnum.Boolean:
      return value === 'true' || value === 'false';
    case GivenTypeEnum.Date:
      return /^\d{4}-\d{2}-\d{2}$/.test(value) && isValidDate({ value: value });
    case GivenTypeEnum.Timestamp:
      return isValidTimestamp({ value: value });
    // case GivenTypeEnum.TimestampTz:
    //   return isValidTimestampTz({ value: value });
  }
}

export function getGivenScalarValidationMessage(item: {
  type: GivenTypeEnum;
  value: string;
}) {
  let { type, value } = item;

  switch (type) {
    case GivenTypeEnum.String:
      return undefined;
    case GivenTypeEnum.Number:
      return `Expected numeric value, got '${value}'`;
    case GivenTypeEnum.Boolean:
      return `Expected 'true' or 'false', got '${value}'`;
    case GivenTypeEnum.Date:
      return `Expected date as YYYY-MM-DD, got '${value}'`;
    case GivenTypeEnum.Timestamp:
      return `Expected timestamp YYYY-MM-DD HH:MM:SS, got '${value}'`;
    // case GivenTypeEnum.TimestampTz:
    //   return `Expected timestamp with timezone offset, got '${value}'`;
  }
}

export function givenValuesToMalloyValues(item: {
  type: GivenTypeEnum;
  isMultiple: boolean;
  values: string[];
}) {
  let { type, isMultiple, values } = item;

  let convertedValues = values.map(value =>
    givenValueToMalloyValue({ type: type, value: value })
  );

  return isMultiple ? convertedValues : convertedValues[0];
}

function givenValueToMalloyValue(item: { type: GivenTypeEnum; value: string }) {
  let { type, value } = item;

  if (type === GivenTypeEnum.Boolean) {
    return value === 'true';
  }

  return value;
}

function isValidDate(item: { value: string }) {
  let { value } = item;
  let date = new Date(`${value}T00:00:00.000Z`);

  return date.toISOString().slice(0, 10) === value;
}

function isValidTimestamp(item: { value: string }) {
  let { value } = item;

  let hasTimezoneOffset = /Z$|[+-]\d{2}:?\d{2}$/.test(value);
  if (hasTimezoneOffset) {
    return false;
  }

  let timestampValue = value.replace('T', ' ');
  let matches = timestampValue.match(
    /^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d+)?$/
  );

  if (matches === null) {
    return false;
  }

  let parsedMs = Date.parse(
    `${matches[1]}T${matches[2]}:${matches[3]}:${matches[4]}Z`
  );

  let isParsedMsInvalid = Number.isNaN(parsedMs);
  if (isParsedMsInvalid) {
    return false;
  }

  let parsedDate = new Date(parsedMs);

  return (
    parsedDate.toISOString().slice(0, 19) ===
    `${matches[1]}T${matches[2]}:${matches[3]}:${matches[4]}`
  );
}

function isValidTimestampTz(item: { value: string }) {
  let { value } = item;

  let hasTimezoneOffset = /(Z|[+-]\d{2}:?\d{2})$/.test(value);
  if (!hasTimezoneOffset) {
    return false;
  }

  let parsedMs = Date.parse(value);

  let isParsedMsInvalid = Number.isNaN(parsedMs);

  return !isParsedMsInvalid;
}
