import { useEffect, useState } from "react";
import { getServerChecklist } from "@/shared/api/checklist";
import {
  getChecklistState,
  migrateState,
  syncServerChecklistReminder,
  type PackingChecklistState
} from "@/shared/storage/packing-checklist";

// The server checklist is stored as raw JSON and can still be in an older
// shape (pre-categories, or pre-redesign) for accounts that haven't touched
// it since — route it through the same migration the local storage path
// already applies before it reaches state.categories anywhere (that shape
// crashes the screen on categories.flatMap/reduce otherwise). Falls back to
// the local on-device checklist if the server fetch itself fails.
export function useChecklistState(userId: string | null) {
  const [state, setState] = useState<PackingChecklistState | null>(null);

  useEffect(() => {
    if (userId) {
      getServerChecklist()
        .then(({ checklist }) => {
          const migrated = migrateState(checklist);
          setState(migrated);
          void syncServerChecklistReminder(migrated);
        })
        .catch(() => {
          getChecklistState().then(setState);
        });
    } else {
      getChecklistState().then(setState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return [state, setState] as const;
}
