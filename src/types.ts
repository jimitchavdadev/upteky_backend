export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface FeedbackForm {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  fields: FormField[];
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'rating';
  required: boolean;
  placeholder?: string;
}

export interface Feedback {
  id: string;
  formId: string;
  name: string;
  email: string;
  message: string;
  rating: number;
  createdAt: string;
  responses: Record<string, string | number>;
}

export interface AnalyticsData {
  totalFeedbacks: number;
  averageRating: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
}
