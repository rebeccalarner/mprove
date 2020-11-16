import { FileBasic } from '../file/file-basic';
import { FieldAny } from '../field/field-any';
import { api } from '../../barrels/api';

export interface View extends FileBasic {
  view: string;
  view_line_num: number;

  label: string;
  label_line_num: number;

  description: string;
  description_line_num: number;

  access_users: string[];
  access_users_line_num: number;

  table: string;
  table_line_num: number;

  derived_table: string;
  derived_table_line_num: number;

  udfs: string[];
  udfs_line_num: number;

  fields: FieldAny[];
  fields_line_num: number;

  //

  connection: api.ProjectConnection;

  filters: {
    [s: string]: string[];
  };

  derivedTableStart: string;

  derivedTableNew: string;

  parts: {
    [viewPartName: string]: {
      content: string;
      contentPrepared: string;
      parentViewName: string;
      deps: { [depName: string]: number };
    };
  };

  fieldsDeps: {
    [field: string]: {
      [dep: string]: number;
    };
  };

  fieldsDepsAfterSingles: {
    [field: string]: {
      [dep: string]: number;
    };
  };

  asDeps: {
    [as: string]: {
      viewName: string;
      fields: { [field: string]: number };
    };
  };

  viewDeps: string[];

  // permanent: string; // boolean
  // permanent_line_num: number;

  // pdt_trigger_time: string;
  // pdt_trigger_time_line_num: number;

  // pdt_trigger_sql: string;
  // pdt_trigger_sql_line_num: number;

  // pdtViewDeps: {
  //   [view: string]: number;
  // };

  // pdtViewDepsAll: {
  //   [view: string]: number;
  // };

  // isPdt: boolean;
}
