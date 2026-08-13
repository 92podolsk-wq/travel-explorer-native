export type ChecklistItem = { id: string; label: string; checked: boolean };

export type PackingChecklist = {
  tripDate: string | null;
  packingItems: ChecklistItem[];
  shoppingItems: ChecklistItem[];
};
