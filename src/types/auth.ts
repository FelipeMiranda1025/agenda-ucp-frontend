export interface Role {
  id: number;
  name: 'docentePlanta';
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
  { id: 6, name: 'docentePlanta' },
];

export const STATUSES: Status[] = [
  { id: 0, name: 'inactivo' },
  { id: 1, name: 'activo' },
];

export const getRoleName = (rolId: number): Role['name'] | null => {
  return ROLES.find(r => r.id === rolId)?.name ?? null;
};
