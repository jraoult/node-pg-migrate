import type { MigrationOptions } from '../../types';
import { formatLines } from '../../utils';
import type { DropOptions, Name, Reversible } from '../generalTypes';
import { dropConstraint } from './dropConstraint';
import type { ConstraintOptions } from './shared';
import { parseConstraints } from './shared';

export type CreateConstraintFn = (
  tableName: Name,
  constraintName: string | null,
  expression: string | (ConstraintOptions & DropOptions)
) => string | string[];

export type CreateConstraint = Reversible<CreateConstraintFn>;

export function addConstraint(mOptions: MigrationOptions): CreateConstraint {
  const _add: CreateConstraint = (tableName, constraintName, expression) => {
    const { constraints, comments } =
      typeof expression === 'string'
        ? {
            constraints: [
              `${constraintName ? `CONSTRAINT ${mOptions.literal(constraintName)} ` : ''}${expression}`,
            ],
            comments: [],
          }
        : parseConstraints(
            tableName,
            expression,
            constraintName,
            mOptions.literal
          );

    const constraintStr = formatLines(constraints, '  ADD ');

    return [
      `ALTER TABLE ${mOptions.literal(tableName)}\n${constraintStr};`,
      ...comments,
    ].join('\n');
  };

  _add.reverse = (tableName, constraintName, options) => {
    if (constraintName === null) {
      throw new Error(
        'Impossible to automatically infer down migration for addConstraint without naming constraint'
      );
    }

    if (typeof options === 'string') {
      throw new Error(
        'Impossible to automatically infer down migration for addConstraint with raw SQL expression'
      );
    }

    return dropConstraint(mOptions)(tableName, constraintName, options);
  };

  return _add;
}
