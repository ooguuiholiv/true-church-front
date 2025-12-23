
export type ModuleType = 'dashboard' | 'finance' | 'kids' | 'events' | 'ministries' | 'people' | 'secretary';

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  joinDate: string;
  birthDate: string;
  status: 'active' | 'inactive' | 'visitor' | 'leader' | 'candidate';
  photo: string;
  cellGroup?: string;
  ministries: string[];
  address?: string;
  gender?: 'M' | 'F';
  maritalStatus?: 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)';
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  subCategory?: string;
  method: string;
  amount: number;
  type: 'income' | 'expense';
}

export interface ChurchEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  registrationDeadline?: string;
  image: string;
  status: 'open' | 'closed' | 'confirmed' | 'last_spots' | 'draft';
  price?: string;
  registrationProgress: number;
}

export interface Ministry {
  id: string;
  name: string;
  leaderId?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface Schedule {
  id: string;
  date: string;
  time: string;
  title: string;
  status: 'Confirmado' | 'Pendente' | 'Rascunho' | 'Encerrado';
  assignments: {
    ministryId: string;
    memberIds: string[];
  }[];
}
