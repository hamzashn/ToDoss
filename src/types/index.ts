/** 0 Düşük, 1 Orta, 2 Yüksek */
export type Priority = 0 | 1 | 2;

/** Varsayılan kategorilerin değişmez anahtarı; kullanıcı kategorilerinde null */
export type CategorySlug = 'work' | 'personal' | 'shopping' | 'health';

export interface Category {
  id: number;
  slug: CategorySlug | null;
  name: string;
  color: string;
  icon: string;
  isDefault: boolean;
  sortOrder: number;
}

export interface CategoryInput {
  name: string;
  color: string;
  icon?: string;
}

export interface Task {
  id: number;
  title: string;
  note: string | null;
  /** 'YYYY-MM-DD' (yerel) */
  date: string;
  /** 'HH:mm' */
  startTime: string | null;
  /** 'HH:mm' */
  endTime: string | null;
  categoryId: number;
  priority: Priority;
  reminderEnabled: boolean;
  reminderMinutes: number;
  notificationId: string | null;
  completed: boolean;
  /** 'YYYY-MM-DDTHH:mm:ss' (yerel) */
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskWithCategory extends Task {
  categoryName: string;
  categoryColor: string;
  categorySlug: CategorySlug | null;
}

export type TaskInput = Pick<
  Task,
  | 'title'
  | 'note'
  | 'date'
  | 'startTime'
  | 'endTime'
  | 'categoryId'
  | 'priority'
  | 'reminderEnabled'
  | 'reminderMinutes'
>;

export interface Settings {
  userName: string;
  onboardingDone: boolean;
  notificationsEnabled: boolean;
  defaultReminderMinutes: number;
}
