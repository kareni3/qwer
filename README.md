# Permissions на Node.js
## 
### npm

'''
npm install
'''

### Create bd

'''
CREATE SCHEMA schema;

CREATE TABLE schema.permissions (
    "id"            bigint CONSTRAINT firstkey PRIMARY KEY,
    "slug"          text NOT NULL,
    "name"          text,
    "default"       boolean,
    "description"   text,
    "is_deleted"    boolean
);

CREATE TABLE schema.roles (
    "id"            bigint CONSTRAINT secondkey PRIMARY KEY,
    "name"          text,
    "description"   text,
    "is_deleted"    boolean
);

CREATE TABLE schema.users (
    "id"          bigint CONSTRAINT thirdkey PRIMARY KEY
);

CREATE TABLE schema.users_roles (
    "user_id"          bigint REFERENCES schema.users,
    "role_id"          bigint REFERENCES schema.roles,
    CONSTRAINT code_title1 PRIMARY KEY(user_id,role_id)
);

CREATE TABLE schema.roles_permissions (
    "role_id"          bigint REFERENCES schema.roles, 
    "permission_id"    bigint REFERENCES schema.permissions,
    "value"	           text,
    CONSTRAINT code_title2 PRIMARY KEY(role_id,permission_id)
);

CREATE TABLE schema.users_permissions (
    "user_id"           bigint REFERENCES schema.users,
    "permission_id"     bigint REFERENCES schema.permissions,
    "value"	            text,
    CONSTRAINT code_title3 PRIMARY KEY(user_id,permission_id)
);
'''

### Slugs

'''
can_edit_all_users

can_create_projects
can_edit_own_projects
can_edit_all_projects
can_delete_own_projects
can_delete_all_projects

can_create_tasks
can_edit_own_tasks
can_edit_all_tasks
can_delete_own_tasks
can_delete_all_tasks

'''

### FIRST INSERTS

'''
INSERT INTO schema.permissions(
	id, slug, name, "default", description, is_deleted)
	VALUES (1, 'can_edit_all_users', 'can_edit_all_users', true, 'description', false),
	(2, 'can_create_projects', 'can_create_projects', true, 'description', false),
	(3, 'can_edit_own_projects', 'can_edit_own_projects', true, 'description', false),
	(4, 'can_edit_all_projects', 'can_edit_all_projects', true, 'description', false);


INSERT INTO schema.roles(
	id, name, description, is_deleted)
	VALUES (1, 'admin', '?', false),
	(2, 'user', '?', false),
	(3, 'manager', '?', false);

INSERT INTO schema.users(
	id)
	VALUES (1),(2);

INSERT INTO schema.users_roles(
	user_id, role_id)
	VALUES (1, 1), (2, 2);

INSERT INTO schema.roles_permissions(
	role_id, permission_id, value)
	VALUES (1, 1, '?'),(1, 2, '?'),(1, 3, '?'),(1, 4, '?'),
	(2, 2, '?'),(2, 3, '?'),
	(3, 2, '?'),(3, 3, '?'),(3, 4, '?');
'''


### Triggers 

'''
CREATE FUNCTION schema.add_to_users()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF 
AS $BODY$
BEGIN
    IF  (TG_OP = 'INSERT') THEN
        INSERT INTO schema.users(id) values (NEW.user_id)
		ON CONFLICT (id) DO NOTHING;
        RETURN NEW;
	END IF;
END;

$BODY$;

ALTER FUNCTION schema.add_to_users()
    OWNER TO postgres;
'''

'''
CREATE TRIGGER add_user
BEFORE INSERT ON schema.users_permissions
    FOR EACH ROW EXECUTE PROCEDURE schema.add_to_users();
'''
'''
    CREATE TRIGGER add_user_role
BEFORE INSERT ON schema.users_roles
    FOR EACH ROW EXECUTE PROCEDURE schema.add_to_users();
'''

 ### View 

 #### Для выборки прав пользователя ( с учетом его ролей ) 

'''
    CREATE VIEW schema.user_permission
    AS 
SELECT distinct pp.id , pp.slug , pp.name , pp.default , 
pp.description , up.value , up.user_id user_id, 0 role_id
FROM schema.permissions pp 
INNER JOIN schema.users_permissions up 
ON (up.permission_id = pp.id) 
UNION 
SELECT distinct pp.id, pp.slug, pp.name, pp.default, pp.description, rp.value, 0 , rr.id
FROM schema.permissions pp 
INNER JOIN schema.roles_permissions rp 
ON (rp.permission_id = pp.id) 
INNER JOIN schema.roles rr 
ON (rp.role_id = rr.id) 
INNER JOIN schema.users_roles ur 
ON (ur.role_id = rr.id) 
order by role_id
'''						