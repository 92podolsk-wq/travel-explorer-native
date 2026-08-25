export type ChecklistItem = { id: string; label: string; checked: boolean };

export type PackingChecklist = {
  tripName: string | null;
  tripStartDate: string | null;
  tripEndDate: string | null;
  packingItems: ChecklistItem[];
  documentItems: ChecklistItem[];
  shoppingItems: ChecklistItem[];
  departureItems: ChecklistItem[];
};
