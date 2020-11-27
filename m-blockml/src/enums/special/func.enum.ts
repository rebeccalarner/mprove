export enum FuncEnum {
  CollectFiles = '1-yaml/1-collect-files',
  RemoveWrongExt = '1-yaml/2-remove-wrong-ext',
  DeduplicateFileNames = '1-yaml/3-deduplicate-file-names',
  YamlToObjects = '1-yaml/4-yaml-to-objects',
  MakeLineNumbers = '1-yaml/5-make-line-numbers',
  CheckTopUnknownParameters = '1-yaml/6-check-top-unknown-parameters',
  CheckTopValues = '1-yaml/7-check-top-values',
  CheckConnections = '1-yaml/8-check-connections',
  CheckSupportUdfs = '1-yaml/9-check-support-udfs',
  SplitFiles = '1-yaml/10-split-files',

  CheckFieldsExist = '2-field/1-check-fields-exist',
  CheckFieldIsObject = '2-field/2-check-field-is-object',
  CheckFieldDeclaration = '2-field/3-check-field-declaration',
  CheckSqlExist = '2-field/4-check-sql-exist',
  CheckFieldNameDuplicates = '2-field/5-check-field-name-duplicates',
  CheckFieldUnknownParameters = '2-field/6-check-field-unknown-parameters',
  SetImplicitLabel = '2-field/7-set-implicit-label',
  CheckDimensions = '2-field/8-check-dimensions',
  TransformYesNoDimensions = '2-field/9-transform-yesno-dimensions',
  CheckMeasures = '2-field/10-check-measures',
  CheckCalculations = '2-field/11-check-calculations',
  CheckAndSetImplicitResult = '2-field/12-check-and-set-implicit-result',
  CheckAndSetImplicitFormatNumber = '2-field/13-check-and-set-implicit-format-number',
  TransformTimes = '2-field/14-transform-times',
  MakeFieldsDeps = '2-field/15-make-fields-deps',
  CheckFieldsDeps = '2-field/16-check-fields-deps',
  CheckCycles = '2-field/17-check-cycles',
  SubstituteSingleRefs = '2-field/18-substitute-single-refs',

  MakeUdfsDict = '3-udf/1-make-udfs-dict',

  CheckTable = '4-view/1-check-table',
  CheckViewUdfs = '4-view/2-check-view-udfs',
  CheckViewFilterDefaults = '4-view/3-check-view-filter-defaults',
  CheckDerivedTableApplyFilter = '4-view/4-check-derived-table-apply-filter',
  MakeViewAsDeps = '4-view/5-make-view-as-deps',
  CheckViewCycles = '4-view/6-check-view-cycles',
  CheckViewAsDeps = '4-view/7-check-view-as-deps',
  PickUdfsFromAsDeps = '4-view/8-pick-udfs-from-as-deps',
  ProcessViewRefs = '4-view/9-process-view-refs',

  CheckModelAccessUsers = '5-model/1-check-model-access-users',
  CheckModelUdfs = '5-model/2-check-model-udfs',
  CheckJoinsExist = '5-model/3-check-joins-exist',
  CheckJoinsFromView = '5-model/4-check-joins-from-view',
  CheckAliases = '5-model/5-check-aliases',
  MakeJoins = '5-model/6-make-joins',
  UpgradeModelCalculationsForceDims = '5-model/7-upgrade-model-calculations-force-dims',
  MakeFieldsDoubleDeps = '5-model/8-make-fields-double-deps',
  CheckFieldsDoubleDeps = '5-model/9-check-fields-double-deps',
  MakeFieldsDoubleDepsAfterSingles = '5-model/10-make-fields-double-deps-after-singles',
  CheckModelFilterDefaults = '5-model/11-check-model-filter-defaults',

  CheckJoinUnknownParameters = '6-join/1-check-join-unknown-parameters',
  CheckJoinType = '6-join/2-check-join-type',
  UpgradeJoinCalculationsForceDims = '6-join/3-upgrade-join-calculations-force-dims',
  CheckSqlOnExist = '6-join/4-check-sql-on-exist',
  CheckCharsInSqlOnRefs = '6-join/5-check-chars-in-sql-on-refs',
  MakeJoinsDoubleDeps = '6-join/6-make-joins-double-deps',
  CheckJoinsDoubleDeps = '6-join/7-check-joins-double-deps',
  CheckSqlOnSingleRefs = '6-join/8-check-sql-on-single-refs',
  SubstituteSqlOnSingleRefs = '6-join/9-substitute-sql-on-single-refs',
  MakeJoinsDoubleDepsAfterSingles = '6-join/10-make-joins-double-deps-after-singles',

  JswCheckCharsInRefs = '7-join-sql-where/1-jsw-check-chars-in-refs',

  CheckVMDFilterDefaults = 'shared/check-vmd-filter-defaults',

  LogStruct = 'struct/log-struct'
}
