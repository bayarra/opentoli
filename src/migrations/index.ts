import * as migration_20260621_010549_initial from './20260621_010549_initial';

export const migrations = [
  {
    up: migration_20260621_010549_initial.up,
    down: migration_20260621_010549_initial.down,
    name: '20260621_010549_initial'
  },
];
