import * as migration_20260621_010549_initial from './20260621_010549_initial';
import * as migration_20260621_012620_editorial_core from './20260621_012620_editorial_core';

export const migrations = [
  {
    up: migration_20260621_010549_initial.up,
    down: migration_20260621_010549_initial.down,
    name: '20260621_010549_initial',
  },
  {
    up: migration_20260621_012620_editorial_core.up,
    down: migration_20260621_012620_editorial_core.down,
    name: '20260621_012620_editorial_core'
  },
];
