export interface Role {
  id: number;
  name: 'vicerrectoria' | 'decanatura' | 'docenteAdministrativo' | 'docentePlanta' | 'admin';
}

export interface Status {
  id: number;
  name: 'activo' | 'inactivo';
}

export interface User {
  id: string; // cédula (PK)
  email: string;
  firstName: string;
  secondName: string;
  firstLastName: string;
  secondLastName: string;
  password: string; // SHA-256 hash
  rolId: number;
  statusId: number;
}

export interface AuthState {
  user: Omit<User, 'password'> | null;
  isAuthenticated: boolean;
  roleName: Role['name'] | null;
}

export const ROLES: Role[] = [
  { id: 0, name: 'admin' },
  { id: 1, name: 'vicerrectoria' },
  { id: 2, name: 'decanatura' },
  { id: 3, name: 'docenteAdministrativo' },
  { id: 4, name: 'docentePlanta' },
];

export const STATUSES: Status[] = [
  { id: 0, name: 'inactivo' },
  { id: 1, name: 'activo' },
];

export const getRoleName = (rolId: number): Role['name'] | null => {
  return ROLES.find(r => r.id === rolId)?.name ?? null;
};
