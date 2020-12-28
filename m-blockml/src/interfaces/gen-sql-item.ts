import { Model } from './file-types/model';
import { FilterBricksDictionary } from './filter-bricks-dictionary';
import { api } from '../barrels/api';

export interface GenSqlItem {
  weekStart: api.ProjectWeekStartEnum;
  timezone: string;
  selectWithForceDims: string[];
  sorts: string;
  limit: string;
  filters: FilterBricksDictionary;
  model: Model;
  udfsDict: api.UdfsDict;
}
