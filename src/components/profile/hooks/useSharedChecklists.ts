import { useEffect, useState } from "react";
import { getChecklistsSharedWithMe } from "@/shared/api/checklist";
import { migrateState } from "@/shared/storage/packing-checklist";
import type { SharedChecklist } from "@/entities/sharing/model/types";

// A friend's checklist can be in an older stored shape (pre-categories, or
// pre-redesign) just like our own — normalize each one through the same
// migration before it reaches checklist.categories.flatMap, which otherwise
// crashes on a friend whose checklist hasn't been touched since the redesign.
export function useSharedChecklists(userId: string | null) {
  const [shared, setShared] = useState<SharedChecklist[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    getChecklistsSharedWithMe().then((body) => {
      setShared(body.checklists.map((entry) => ({ ...entry, checklist: migrateState(entry.checklist) })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return shared;
}
