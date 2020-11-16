export enum ErTitleEnum {
  WRONG_FILE_EXTENSION = 'WRONG_FILE_EXTENSION',

  DUPLICATE_FILE_NAMES = 'DUPLICATE_FILE_NAMES',

  FILE_CONTENT_IS_NOT_YAML = 'FILE_CONTENT_IS_NOT_YAML',
  PROCESSED_CONTENT_IS_NOT_YAML = 'PROCESSED_CONTENT_IS_NOT_YAML',
  TOP_LEVEL_IS_NOT_DICTIONARY = 'TOP_LEVEL_IS_NOT_DICTIONARY',

  UNDEFINED_VALUE = 'UNDEFINED_VALUE',
  ARRAY_ELEMENT_IS_NULL = 'ARRAY_ELEMENT_IS_NULL',
  DUPLICATE_PARAMETERS = 'DUPLICATE_PARAMETERS',

  UNKNOWN_UDF_PARAMETER = 'UNKNOWN_UDF_PARAMETER',
  UNKNOWN_VIEW_PARAMETER = 'UNKNOWN_VIEW_PARAMETER',
  UNKNOWN_MODEL_PARAMETER = 'UNKNOWN_MODEL_PARAMETER',
  UNKNOWN_DASHBOARD_PARAMETER = 'UNKNOWN_DASHBOARD_PARAMETER',
  UNKNOWN_VISUALIZATION_PARAMETER = 'UNKNOWN_VISUALIZATION_PARAMETER',
  UNEXPECTED_LIST = 'UNEXPECTED_LIST',
  UNEXPECTED_DICTIONARY = 'UNEXPECTED_DICTIONARY',
  PARAMETER_IS_NOT_A_LIST = 'PARAMETER_IS_NOT_A_LIST',

  WRONG_HIDDEN = 'WRONG_HIDDEN',
  WRONG_CHAR_IN_PARAMETER_VALUE = 'WRONG_CHAR_IN_PARAMETER_VALUE',

  MISSING_CONNECTION = 'MISSING_CONNECTION',
  CONNECTION_NOT_FOUND = 'CONNECTION_NOT_FOUND',

  UDFS_ARE_NOT_SUPPORTED_FOR_CONNECTION = 'UDFS_ARE_NOT_SUPPORTED_FOR_CONNECTION',

  WRONG_UDF_NAME = 'WRONG_UDF_NAME',
  WRONG_VIEW_NAME = 'WRONG_VIEW_NAME',
  WRONG_MODEL_NAME = 'WRONG_MODEL_NAME',
  WRONG_DASHBOARD_NAME = 'WRONG_DASHBOARD_NAME',
  WRONG_VISUALIZATION_NAME = 'WRONG_VISUALIZATION_NAME',

  MISSING_FIELDS = 'MISSING_FIELDS',

  FIELD_IS_NOT_A_DICTIONARY = 'FIELD_IS_NOT_A_DICTIONARY',

  MISSING_FIELD_DECLARATION = 'MISSING_FIELD_DECLARATION',
  TOO_MANY_DECLARATIONS_FOR_ONE_FIELD = 'TOO_MANY_DECLARATIONS_FOR_ONE_FIELD',
  FIELD_DECLARATION_WRONG_VALUE = 'FIELD_DECLARATION_WRONG_VALUE',

  UNEXPECTED_SQL_IN_FILTER = 'UNEXPECTED_SQL_IN_FILTER',
  MISSING_SQL = 'MISSING_SQL',

  DUPLICATE_FIELD_NAMES = 'DUPLICATE_FIELD_NAMES',

  WRONG_FIELD_HIDDEN = 'WRONG_FIELD_HIDDEN',
  UNKNOWN_DIMENSION_PARAMETER = 'UNKNOWN_DIMENSION_PARAMETER',
  UNKNOWN_TIME_PARAMETER = 'UNKNOWN_TIME_PARAMETER',
  UNKNOWN_MEASURE_PARAMETER = 'UNKNOWN_MEASURE_PARAMETER',
  UNKNOWN_CALCULATION_PARAMETER = 'UNKNOWN_CALCULATION_PARAMETER',
  UNKNOWN_FILTER_PARAMETER = 'UNKNOWN_FILTER_PARAMETER',
  UNEXPECTED_LIST_IN_FIELD_PARAMETERS = 'UNEXPECTED_LIST_IN_FIELD_PARAMETERS',
  UNEXPECTED_DICTIONARY_IN_FIELD_PARAMETERS = 'UNEXPECTED_DICTIONARY_IN_FIELD_PARAMETERS',

  WRONG_DIMENSION_TYPE = 'WRONG_DIMENSION_TYPE',
  UNNEST_IS_NOT_SUPPORTED_FOR_CONNECTION = 'UNNEST_IS_NOT_SUPPORTED_FOR_CONNECTION',

  MISSING_TYPE_FOR_MEASURE = 'MISSING_TYPE_FOR_MEASURE',
  WRONG_MEASURE_TYPE = 'WRONG_MEASURE_TYPE',
  MISSING_SQL_KEY = 'MISSING_SQL_KEY',
  MEASURE_TYPE_IS_NOT_SUPPORTED_FOR_CONNECTION = 'MEASURE_TYPE_IS_NOT_SUPPORTED_FOR_CONNECTION',
  PERCENTILE_IS_NOT_SUPPORTED_FOR_CONNECTION = 'PERCENTILE_IS_NOT_SUPPORTED_FOR_CONNECTION',
  MISSING_PERCENTILE = 'MISSING_PERCENTILE',
  WRONG_PERCENTILE = 'WRONG_PERCENTILE',
  MEASURE_SQL_MISSING_BLOCKML_REFERENCE = 'MEASURE_SQL_MISSING_BLOCKML_REFERENCE',
  MEASURE_SQL_KEY_MISSING_BLOCKML_REFERENCE = 'MEASURE_SQL_KEY_MISSING_BLOCKML_REFERENCE'
}
