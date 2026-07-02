/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Plus, 
  Calendar, 
  AlertCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Edit2, 
  X, 
  Check, 
  SlidersHorizontal, 
  PieChart, 
  Clock, 
  Tag,
  ArrowUpDown,
  CheckCircle,
  Inbox
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Priority, Todo, SubTask, CATEGORIES } from "./types";

const INITIAL_TODOS: Todo[] = [
  {
    id: "todo-1",
    title: "プロジェクトの提案書作成と予算見積もり",
    notes: "クライアント向けの新しい企画書を作成し、大まかな開発予算を見積もる。木曜日までに初稿を提出する予定。",
    completed: false,
    priority: Priority.High,
    category: "work",
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    subtasks: [
      { id: "sub-1-1", text: "競合サービスの価格調査を行う", completed: true },
      { id: "sub-1-2", text: "提案資料のスライド構成案を作成する", completed: true },
      { id: "sub-1-3", text: "開発スケジュールと工数見積もりを出す", completed: false },
      { id: "sub-1-4", text: "チームメンバーからフィードバックをもらう", completed: false }
    ]
  },
  {
    id: "todo-2",
    title: "週一回の食材・日用品の買い出し",
    notes: "近くのスーパーで1週間分の食材と日用品を補充する。",
    completed: false,
    priority: Priority.Low,
    category: "shopping",
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    subtasks: [
      { id: "sub-2-1", text: "牛乳とヨーグルト、卵", completed: false },
      { id: "sub-2-2", text: "トイレットペーパーとキッチンペーパー", completed: false }
    ]
  },
  {
    id: "todo-3",
    title: "ジムでパーソナルトレーニングと有酸素運動",
    notes: "背中と肩の筋力トレーニングを45分、有酸素運動を30分行う。",
    completed: true,
    priority: Priority.Medium,
    category: "personal",
    dueDate: new Date().toISOString().split('T')[0], // Today
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    subtasks: [
      { id: "sub-3-1", text: "プロテインシェイカーの準備", completed: true },
      { id: "sub-3-2", text: "ストレッチを念入りに行う", completed: true }
    ]
  }
];

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem("aistudio_todos");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved todos, falling back to initials", e);
      }
    }
    return INITIAL_TODOS;
  });

  useEffect(() => {
    localStorage.setItem("aistudio_todos", JSON.stringify(todos));
  }, [todos]);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>(Priority.Medium);
  const [newCategory, setNewCategory] = useState("work");
  const [newDueDate, setNewDueDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [showDetailedForm, setShowDetailedForm] = useState(false);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "createdAt">("priority");

  // Expanded and Editing States
  const [expandedTodoId, setExpandedTodoId] = useState<string | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);

  // Edit Temp States
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState<Priority>(Priority.Medium);
  const [editCategory, setEditCategory] = useState("work");
  const [editDueDate, setEditDueDate] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [newSubtaskTexts, setNewSubtaskTexts] = useState<{ [todoId: string]: string }>({});

  const formattedToday = useMemo(() => {
    const date = new Date();
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 (${days[date.getDay()]})`;
  }, []);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const highPriorityCount = todos.filter(t => t.priority === Priority.High && !t.completed).length;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const overdueCount = todos.filter(t => {
      if (t.completed || !t.dueDate) return false;
      return t.dueDate < todayStr;
    }).length;

    return { total, completed, pending, percentage, highPriorityCount, overdueCount };
  }, [todos]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: { [catId: string]: number } = {};
    CATEGORIES.forEach(c => {
      counts[c.id] = todos.filter(t => t.category === c.id && !t.completed).length;
    });
    return counts;
  }, [todos]);

  const filteredAndSortedTodos = useMemo(() => {
    return todos
      .filter(todo => {
        const matchesSearch = 
          todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (todo.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = selectedCategory === "all" || todo.category === selectedCategory;
        
        const matchesStatus = 
          statusFilter === "all" ? true :
          statusFilter === "active" ? !todo.completed :
          todo.completed;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "dueDate") {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        }
        
        if (sortBy === "priority") {
          const priorityWeight = { [Priority.High]: 3, [Priority.Medium]: 2, [Priority.Low]: 1 };
          return priorityWeight[b.priority] - priorityWeight[a.priority];
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [todos, searchQuery, selectedCategory, statusFilter, sortBy]);

  // Handlers
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      title: newTitle.trim(),
      notes: newNotes.trim() || undefined,
      completed: false,
      priority: newPriority,
      category: newCategory,
      dueDate: newDueDate || undefined,
      createdAt: new Date().toISOString(),
      subtasks: []
    };

    setTodos(prev => [newTodo, ...prev]);
    setNewTitle("");
    setNewNotes("");
    setNewDueDate("");
    setNewPriority(Priority.Medium);
    setNewCategory("work");
    setShowDetailedForm(false);
  };

  const handleToggleComplete = (id: string) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === id) {
        return { ...todo, completed: !todo.completed };
      }
      return todo;
    }));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
    if (expandedTodoId === id) setExpandedTodoId(null);
    if (editingTodoId === id) setEditingTodoId(null);
  };

  const startEditing = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditTitle(todo.title);
    setEditPriority(todo.priority);
    setEditCategory(todo.category);
    setEditDueDate(todo.dueDate || "");
    setEditNotes(todo.notes || "");
  };

  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim()) return;

    setTodos(prev => prev.map(todo => {
      if (todo.id === id) {
        return {
          ...todo,
          title: editTitle.trim(),
          priority: editPriority,
          category: editCategory,
          dueDate: editDueDate || undefined,
          notes: editNotes.trim() || undefined
        };
      }
      return todo;
    }));

    setEditingTodoId(null);
  };

  const handleCancelEdit = () => {
    setEditingTodoId(null);
  };

  const handleToggleSubtask = (todoId: string, subtaskId: string) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === todoId) {
        const updatedSubtasks = todo.subtasks.map(st => {
          if (st.id === subtaskId) return { ...st, completed: !st.completed };
          return st;
        });
        return { ...todo, subtasks: updatedSubtasks };
      }
      return todo;
    }));
  };

  const handleAddSubtask = (todoId: string) => {
    const text = newSubtaskTexts[todoId] || "";
    if (!text.trim()) return;

    const newSub: SubTask = {
      id: `sub-${Date.now()}`,
      text: text.trim(),
      completed: false
    };

    setTodos(prev => prev.map(todo => {
      if (todo.id === todoId) {
        return {
          ...todo,
          subtasks: [...todo.subtasks, newSub]
        };
      }
      return todo;
    }));

    setNewSubtaskTexts(prev => ({ ...prev, [todoId]: "" }));
  };

  const handleDeleteSubtask = (todoId: string, subtaskId: string) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === todoId) {
        return {
          ...todo,
          subtasks: todo.subtasks.filter(st => st.id !== subtaskId)
        };
      }
      return todo;
    }));
  };

  const handleClearCompleted = () => {
    if (window.confirm("完了したタスクを一括削除しますか？")) {
      setTodos(prev => prev.filter(t => !t.completed));
    }
  };

  const getRelativeDateLabel = (dateStr?: string) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: "今日", type: "today" };
    if (diffDays === 1) return { label: "明日", type: "tomorrow" };
    if (diffDays === -1) return { label: "昨日 (期限切れ)", type: "overdue" };
    if (diffDays < 0) return { label: `${Math.abs(diffDays)}日前 (期限切れ)`, type: "overdue" };
    return { label: `${target.getMonth() + 1}/${target.getDate()}`, type: "future" };
  };

  const getPriorityDotColor = (priority: Priority) => {
    switch (priority) {
      case Priority.High: return "bg-red-500";
      case Priority.Medium: return "bg-orange-400";
      case Priority.Low: return "bg-gray-400";
    }
  };

  const getCategoryLabel = (catId: string) => {
    const match = CATEGORIES.find(c => c.id === catId);
    return match ? match.label : "その他";
  };

  const getActiveFilterTitle = () => {
    if (selectedCategory !== "all") {
      return getCategoryLabel(selectedCategory);
    }
    if (statusFilter === "active") return "未完了のタスク";
    if (statusFilter === "completed") return "完了済みのタスク";
    return "すべてのタスク";
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#F9FAFB] flex flex-col md:flex-row font-sans text-[#111827] selection:bg-blue-100 selection:text-blue-900">
      
      {/* Sidebar Section */}
      <aside id="app-sidebar" className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col p-6 md:p-8 flex-shrink-0">
        
        {/* Logo and Brand */}
        <div className="mb-8 flex items-center justify-between md:block">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-blue-600 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>TASUKU</span>
            </h1>
            <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-widest font-mono font-medium">Task Manager</p>
          </div>
          
          {/* Mobile display of progress ratio */}
          <div className="md:hidden text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium font-mono">
            {stats.completed}/{stats.total} 完了
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 space-y-6">
          
          {/* Main Navigation Status */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Main</p>
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setSelectedCategory("all");
                  }}
                  className={`w-full flex items-center justify-between text-sm font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === "all" && selectedCategory === "all"
                      ? "text-blue-600 bg-blue-50/70"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-gray-400" />
                    <span>すべてのタスク</span>
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{todos.length}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("active");
                    setSelectedCategory("all");
                  }}
                  className={`w-full flex items-center justify-between text-sm font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === "active" && selectedCategory === "all"
                      ? "text-blue-600 bg-blue-50/70"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Circle className="w-4 h-4 text-gray-400" />
                    <span>未完了タスク</span>
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{stats.pending}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("completed");
                    setSelectedCategory("all");
                  }}
                  className={`w-full flex items-center justify-between text-sm font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === "completed" && selectedCategory === "all"
                      ? "text-blue-600 bg-blue-50/70"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    <span>完了済み</span>
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{stats.completed}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Categories Navigation List */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Lists</p>
            <ul className="space-y-1">
              {CATEGORIES.filter(c => c.id !== "all").map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const count = categoryCounts[cat.id] || 0;
                return (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setStatusFilter("all"); // Reset status filter to see all in list
                      }}
                      className={`w-full flex items-center justify-between text-sm font-medium px-3 py-2 rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? "text-blue-600 bg-blue-50/70"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-gray-400" />
                        <span>{cat.label}</span>
                      </span>
                      {count > 0 && (
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                          {count}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Sidebar Footer Circular Progress */}
        <div className="hidden md:block pt-6 border-t border-gray-100 mt-auto">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-3">
            <div className="relative w-9 h-9 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15" className="stroke-gray-200 fill-none" strokeWidth="2.5" />
                <motion.circle 
                  cx="18" 
                  cy="18" 
                  r="15" 
                  className="stroke-blue-600 fill-none" 
                  strokeWidth="2.5"
                  strokeDasharray={`${2 * Math.PI * 15}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 15 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 15 * (1 - stats.percentage / 100) }}
                  transition={{ duration: 0.5 }}
                />
              </svg>
              <span className="absolute text-[9px] font-bold font-mono text-gray-700">{stats.percentage}%</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Overall Progress</p>
              <p className="text-xs font-semibold text-gray-700 truncate">{stats.completed} / {stats.total} Done</p>
            </div>
          </div>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Header Topbar */}
        <header id="app-topbar" className="h-24 px-6 md:px-12 flex items-center justify-between flex-shrink-0 bg-white border-b border-gray-200/50 md:bg-transparent md:border-b-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">{getActiveFilterTitle()}</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">{formattedToday}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Minimalist Search Box */}
            <div className="relative hidden sm:block">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-gray-400" />
              </span>
              <input
                id="search-input"
                type="text"
                placeholder="タスク、メモを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-100 border-none text-xs rounded-full py-2 px-4 pl-9 pr-8 w-44 md:w-56 focus:bg-white focus:ring-1 focus:ring-blue-100 outline-none transition-all text-gray-800"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Micro Stats or Indicator */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-mono font-bold text-gray-500">TASKS ACTIVE</span>
            </div>
          </div>
        </header>

        {/* Scrollable Container */}
        <section className="flex-1 px-6 md:px-12 py-4 overflow-y-auto w-full max-w-4xl mx-auto">
          
          {/* Mobile Search - Visible only on small screens */}
          <div className="relative mb-4 sm:hidden">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="タスク、メモを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 text-xs rounded-full py-2.5 px-4 pl-9 pr-8 focus:ring-1 focus:ring-blue-100 outline-none text-gray-800"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Micro Stats Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white border border-gray-200/80 p-3.5 rounded-xl shadow-xs">
            <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
              <span className="flex items-center gap-1">
                <Inbox className="w-3.5 h-3.5 text-blue-500" />
                <span>未完了: <strong>{stats.pending}</strong></span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                <span>高優先: <strong>{stats.highPriorityCount}</strong></span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                <span>期限切れ: <strong>{stats.overdueCount}</strong></span>
              </span>
            </div>

            {/* Sorting control inline */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/60 px-2.5 py-1 rounded-lg">
              <ArrowUpDown className="w-3 h-3 text-gray-400" />
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none text-[10px] font-bold text-gray-600 focus:outline-hidden cursor-pointer"
              >
                <option value="priority">優先度順</option>
                <option value="dueDate">期限順</option>
                <option value="createdAt">作成日順</option>
              </select>
            </div>
          </div>

          {/* Create Task Form (Clean Minimalism Input Box) */}
          <section id="add-task-container" className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 mb-6 shadow-sm focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50/40 transition-all">
            <form onSubmit={handleAddTodo}>
              <div className="flex flex-col gap-3.5">
                <div className="flex gap-2">
                  <input
                    id="task-title-input"
                    type="text"
                    placeholder="＋ 新しいタスクを追加"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="flex-1 bg-transparent border-none py-1 focus:outline-hidden text-sm font-semibold text-gray-800 placeholder-gray-400"
                  />
                  <button
                    id="quick-submit-button"
                    type="submit"
                    disabled={!newTitle.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>追加</span>
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <button
                    id="toggle-details-form-button"
                    type="button"
                    onClick={() => setShowDetailedForm(!showDetailedForm)}
                    className="text-[10px] text-gray-400 hover:text-blue-600 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>Options</span>
                    {showDetailedForm ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {newTitle.trim() && !showDetailedForm && (
                    <span className="text-[10px] text-gray-400 animate-pulse font-medium">
                      期限やメモ、サブタスクも追加できます
                    </span>
                  )}
                </div>

                <AnimatePresence>
                  {showDetailedForm && (
                    <motion.div
                      id="detailed-form-panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-gray-100 pt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        
                        {/* Priority Selector */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">優先度</label>
                          <div className="grid grid-cols-3 gap-1">
                            {(Object.keys(Priority) as Array<keyof typeof Priority>).map((key) => {
                              const val = Priority[key];
                              const isActive = newPriority === val;
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setNewPriority(val)}
                                  className={`py-1.5 text-xs font-semibold border rounded-lg transition-all cursor-pointer ${
                                    isActive
                                      ? "bg-blue-50 text-blue-600 border-blue-200"
                                      : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                                  }`}
                                >
                                  {val === Priority.High ? "高" : val === Priority.Medium ? "中" : "低"}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Category Selector */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">カテゴリ</label>
                          <select
                            id="category-select"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 outline-hidden focus:border-blue-300"
                          >
                            {CATEGORIES.filter(c => c.id !== "all").map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Due Date Selector */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>期限日</span>
                          </label>
                          <input
                            id="due-date-picker"
                            type="date"
                            value={newDueDate}
                            onChange={(e) => setNewDueDate(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 outline-hidden focus:border-blue-300"
                          />
                        </div>

                        {/* Notes */}
                        <div className="sm:col-span-3 flex flex-col gap-1 mt-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">詳細メモ</label>
                          <textarea
                            id="task-notes-input"
                            placeholder="補足情報やURLなどを書き留められます..."
                            rows={2}
                            value={newNotes}
                            onChange={(e) => setNewNotes(e.target.value)}
                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-hidden focus:border-blue-300"
                          />
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </section>

          {/* Task Listing */}
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {filteredAndSortedTodos.length} Tasks Found
            </p>
            {todos.some(t => t.completed) && (
              <button
                id="clear-completed-button"
                type="button"
                onClick={handleClearCompleted}
                className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer transition-colors"
              >
                完了したタスクをクリア
              </button>
            )}
          </div>

          <section id="todo-list-container" className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedTodos.length === 0 ? (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-xs"
                >
                  <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3.5 border border-gray-100">
                    <Check className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    タスクがありません
                  </h3>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    新しいタスクを追加するか、別のフィルター条件を選択してください。
                  </p>
                </motion.div>
              ) : (
                filteredAndSortedTodos.map((todo) => {
                  const isExpanded = expandedTodoId === todo.id;
                  const isEditing = editingTodoId === todo.id;
                  const relDate = getRelativeDateLabel(todo.dueDate);
                  
                  const totalSubs = todo.subtasks.length;
                  const completedSubs = todo.subtasks.filter(s => s.completed).length;
                  const subPct = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;

                  return (
                    <motion.div
                      key={todo.id}
                      id={`todo-card-${todo.id}`}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.18 }}
                      className={`bg-white rounded-xl border transition-all relative overflow-hidden shadow-xs hover:shadow-sm ${
                        todo.completed 
                          ? "border-gray-100 bg-gray-50/50" 
                          : "border-gray-200/60"
                      }`}
                    >
                      {/* Priority Dot Accent in edge */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getPriorityDotColor(todo.priority)}`} />

                      {/* View Card */}
                      {!isEditing ? (
                        <div className="p-4 flex items-start gap-4">
                          
                          {/* Checkbox button */}
                          <button
                            type="button"
                            onClick={() => handleToggleComplete(todo.id)}
                            className="mt-0.5 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0 cursor-pointer"
                          >
                            {todo.completed ? (
                              <div className="w-5 h-5 border-2 border-blue-500 bg-blue-500 rounded-md flex items-center justify-center text-white">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-200 rounded-md hover:border-blue-500 transition-colors" />
                            )}
                          </button>

                          {/* Detail core */}
                          <div 
                            className="flex-1 min-w-0 cursor-pointer select-none"
                            onClick={() => setExpandedTodoId(isExpanded ? null : todo.id)}
                          >
                            
                            {/* Title text */}
                            <h4 className={`text-sm font-semibold leading-snug break-words pr-2 ${
                              todo.completed 
                                ? "text-gray-400 line-through decoration-gray-300" 
                                : "text-gray-900"
                            }`}>
                              {todo.title}
                            </h4>

                            {/* Brief Notes preview */}
                            {todo.notes && !isExpanded && (
                              <p className="text-xs text-gray-400 line-clamp-1 mt-1">
                                {todo.notes}
                              </p>
                            )}

                            {/* Tags meta list */}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {/* Category Badge */}
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-sm bg-gray-100 text-gray-500">
                                {getCategoryLabel(todo.category)}
                              </span>

                              {/* Priority dot indicator text */}
                              <span className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                                <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDotColor(todo.priority)}`}></span>
                                <span>{todo.priority === Priority.High ? "HIGH" : todo.priority === Priority.Medium ? "MID" : "LOW"}</span>
                              </span>

                              {/* Due Date Badge */}
                              {relDate && (
                                <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-sm flex items-center gap-1 ${
                                  relDate.type === "overdue" 
                                    ? "bg-red-50 text-red-600 border border-red-100" 
                                    : relDate.type === "today"
                                      ? "bg-amber-50 text-amber-600 border border-amber-100"
                                      : "bg-gray-100 text-gray-500"
                                }`}>
                                  <Calendar className="w-2.5 h-2.5" />
                                  <span>{relDate.label}</span>
                                </span>
                              )}

                              {/* Subtask count metric badge */}
                              {totalSubs > 0 && !isExpanded && (
                                <span className="text-[9px] font-bold text-gray-400 font-mono">
                                  [{completedSubs}/{totalSubs} subtasks]
                                </span>
                              )}
                            </div>

                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => startEditing(todo)}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                              title="編集"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                              title="削除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedTodoId(isExpanded ? null : todo.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>

                        </div>
                      ) : (
                        /* Editing Card Form */
                        <div className="p-4 bg-white">
                          <div className="flex flex-col gap-3.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Edit Task</p>
                            
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 focus:outline-hidden focus:border-blue-300 focus:bg-white"
                              placeholder="タスク名を入力..."
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">優先度</label>
                                <select
                                  value={editPriority}
                                  onChange={(e) => setEditPriority(e.target.value as Priority)}
                                  className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700"
                                >
                                  <option value={Priority.High}>高</option>
                                  <option value={Priority.Medium}>中</option>
                                  <option value={Priority.Low}>低</option>
                                </select>
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">カテゴリ</label>
                                <select
                                  value={editCategory}
                                  onChange={(e) => setEditCategory(e.target.value)}
                                  className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700"
                                >
                                  {CATEGORIES.filter(c => c.id !== "all").map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">期限日</label>
                                <input
                                  type="date"
                                  value={editDueDate}
                                  onChange={(e) => setEditDueDate(e.target.value)}
                                  className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700"
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">詳細メモ</label>
                              <textarea
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                rows={2}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-hidden focus:border-blue-300"
                                placeholder="詳細なメモを追加..."
                              />
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              >
                                キャンセル
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(todo.id)}
                                disabled={!editTitle.trim()}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                              >
                                保存する
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Expanded Section (Notes detail & Subtasks) */}
                      <AnimatePresence>
                        {isExpanded && !isEditing && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-gray-50 bg-gray-50/40"
                          >
                            <div className="p-4 md:p-5 text-xs text-gray-600 space-y-4">
                              
                              {/* Notes Content */}
                              {todo.notes && (
                                <div className="bg-white p-3 rounded-lg border border-gray-100">
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">詳細メモ</p>
                                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{todo.notes}</p>
                                </div>
                              )}

                              {/* Subtasks Block */}
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subtasks Checklist</span>
                                  {totalSubs > 0 && (
                                    <span className="text-[10px] font-bold text-blue-600 font-mono">
                                      {completedSubs} / {totalSubs} 完了 ({subPct}%)
                                    </span>
                                  )}
                                </div>

                                {totalSubs > 0 && (
                                  <div className="w-full bg-gray-150 h-1 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-blue-600 h-full rounded-full transition-all duration-300" 
                                      style={{ width: `${subPct}%` }} 
                                    />
                                  </div>
                                )}

                                {/* Subtasks list */}
                                <div className="space-y-1.5">
                                  {todo.subtasks.map((st) => (
                                    <div 
                                      key={st.id} 
                                      className="flex items-center justify-between group/sub bg-white hover:bg-gray-50 p-2 rounded-lg border border-gray-100 transition-colors"
                                    >
                                      <label className="flex items-center gap-2 flex-1 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={st.completed}
                                          onChange={() => handleToggleSubtask(todo.id, st.id)}
                                          className="rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500/20 w-3.5 h-3.5 cursor-pointer"
                                        />
                                        <span className={`font-semibold text-xs ${st.completed ? "text-gray-400 line-through" : "text-gray-700"}`}>
                                          {st.text}
                                        </span>
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSubtask(todo.id, st.id)}
                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover/sub:opacity-100 p-0.5 transition-all cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* Quick inline subtask input */}
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="サブタスクをクイック追加..."
                                    value={newSubtaskTexts[todo.id] || ""}
                                    onChange={(e) => setNewSubtaskTexts(prev => ({ ...prev, [todo.id]: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddSubtask(todo.id);
                                      }
                                    }}
                                    className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-hidden focus:border-blue-300"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAddSubtask(todo.id)}
                                    disabled={!(newSubtaskTexts[todo.id] || "").trim()}
                                    className="bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    追加
                                  </button>
                                </div>

                              </div>

                              <div className="pt-3.5 border-t border-gray-100/60 flex items-center justify-between text-[9px] text-gray-400 font-mono font-bold">
                                <span>CREATED: {new Date(todo.createdAt).toLocaleString('ja-JP')}</span>
                                {todo.completed && (
                                  <span className="text-emerald-600">COMPLETED</span>
                                )}
                              </div>

                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </section>

        </section>

      </main>

    </div>
  );
}
