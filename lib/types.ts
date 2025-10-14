export interface RandomUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  fullName: string;
  createdAt: string;
  supabaseUserId?: string;
}
