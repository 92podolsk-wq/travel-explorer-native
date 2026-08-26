export type ChecklistItem = { id: string; label: string; checked: boolean };

export type ChecklistCategory = { id: string; title: string; emoji: string; items: ChecklistItem[] };

export type PackingChecklist = {
  tripName: string | null;
  tripStartDate: string | null;
  tripEndDate: string | null;
  categories: ChecklistCategory[];
};
