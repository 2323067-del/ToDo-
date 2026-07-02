export enum Priority {
  High = "High",
  Medium = "Medium",
  Low = "Low"
}

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Todo {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
  priority: Priority;
  category: string;
  dueDate?: string;
  createdAt: string;
  subtasks: SubTask[];
}

export const CATEGORIES = [
  { id: "all", label: "すべて", color: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300" },
  { id: "work", label: "仕事", color: "bg-blue-50 text-blue-700 border border-blue-100" },
  { id: "personal", label: "プライベート", color: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
  { id: "shopping", label: "買い物", color: "bg-amber-50 text-amber-700 border border-amber-100" },
  { id: "study", label: "勉強", color: "bg-indigo-50 text-indigo-700 border border-indigo-100" },
  { id: "other", label: "その他", color: "bg-zinc-50 text-zinc-700 border border-zinc-100" }
];
