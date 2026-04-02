import type { Dispatch, SetStateAction } from 'react';

export function makeUpdateHandler<T extends { id: string }>(
  setter: Dispatch<SetStateAction<T[]>>,
) {
  return (updated: T) =>
    setter((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
}
