INSERT INTO public.roles (id, name, description) 
VALUES (5, 'Soporte', 'Rol técnico de soporte. Sin jerarquía. Gestiona usuarios del sistema (CRUD).')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

SELECT setval('roles_id_seq', GREATEST((SELECT MAX(id) FROM public.roles), 5));