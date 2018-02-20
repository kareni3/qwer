const requires = require('../requires/requires');
const db = require('../config/config');

// TODO
// 1 сторонний айдишник - пока сделано просто в Боди.
// 2 Иньекция

module.exports = {

  /*sql иньекция */
  selectAllPermissions: async (ctx) => {
      let params = {
        before: ctx.request.query.before!== undefined ? 
                ctx.request.query.before : Math.pow(2,62),
        after: ctx.request.query.after!== undefined ? 
                ctx.request.query.after : 0,
        limit: !isNaN(ctx.request.query.limit) ? 
               ctx.request.query.limit : 50,
        sort: ctx.request.query.sort !== undefined ? 
              ctx.request.query.sort : 'id',
        direction: ctx.request.query.direction === 'asc' ? 
                   'asc' : 'desc'
      };
    try {
      let permissions = await db.query('SELECT id, slug, name, "default", '
                                      +'description  FROM schema.permissions ' 
                                      +'WHERE id >= $2 AND id <= $3 '
                                      +'ORDER BY "' + params.sort + '" ' + params.direction + ' '
                                      +'LIMIT $1',
                                      [params.limit, params.after,
                                                    params.before]);
      ctx.status = 200;
      ctx.body = permissions.rows;
    }

    catch (er) {
      ctx.status = 400;
    }
  },

/*ЧТО ТО СДЕЛАТЬ С ID*/
  createNewPermission: async (ctx) => {
    let item = {
      id: ctx.request.body.id,
      slug: ctx.request.body.slug,
      name: ctx.request.body.name,
      default: ctx.request.body.default,
      description: ctx.request.body.description ? 
                   ctx.request.body.description : null
    };
    try {
      let permission = await db.query('SELECT * FROM schema.permissions '
        + 'WHERE slug = $1 OR id = $2',
        [item.slug, item.id]);
      if (permission.rowCount) {
        ctx.status = 201;
        ctx.body = permission.rows[0];
        return; 
      }
      await db.query('INSERT INTO schema.permissions '
        + '(id, slug, name, "default", description, is_deleted) '
        + 'VALUES ($1, $2, $3, $4, $5, $6);',
        [item.id, item.slug, item.name, item.default,
        item.description, false]);
      ctx.status = 201;
      ctx.body = item;
    }
    catch (err) {
      ctx.status = 400;
    }
  },
// Что то сделать с id
  changePermission: async (ctx) => {
    let item = {
      id: !isNaN(ctx.params.psid) ?
          ctx.params.psid : 0,
      slug: isNaN(ctx.params.psid) ?
            ctx.params.psid : ctx.request.body.slug,
      name: ctx.request.body.name,
      default: ctx.request.body.default,
      description: ctx.request.body.description
    };
    let obj = [item.id], i=2, str='';
    for (key in item) {
      if(undefined!==item[key] && key!='id') {
        str += i==2 ? '' : ', ';
        obj[i-1] = item[key];
      }
      else 
        continue;
      str += '"'+key+'"=$'+i;
      i++;
    }
    try {
      let qw = await db.query('UPDATE schema.permissions '
        + 'SET ' + str + ' '
        + 'WHERE id=$1' + (item.id ? '' : ' OR slug like $2')
        + ';',
        obj);
        ctx.status = qw.rowCount ? 200 : 400;
    }
    catch (err) {
      ctx.status = 400;
    }
  },

  deletePermission: async (ctx) => {
    try {
      await db.query('DELETE FROM schema.permissions '
        + 'WHERE id=$1;',
        [ctx.params.pid]);
      ctx.status = 204;
    }
    catch (err) {
      ctx.status = 400;
    }
  },


  selectAllRolePermissions: async (ctx) => { 
    try {
      let permissions = await db.query('SELECT pp.id, pp.slug, pp.name, pp.default, '
                                      +'pp.description, rp.value '
                                      +'FROM schema.roles_permissions rp '
                                      +'INNER JOIN schema.permissions pp '
                                      +'ON (rp.permission_id = pp.id) '
                                      +'WHERE rp.role_id = $1',
                                      [ctx.params.rid]);
      ctx.status = permissions.rowCount !== 0 ? 200 : 400;
      ctx.body = permissions.rows;
    }

    catch (er) {
      ctx.status = 400;
    }
  },

  selectOneRolePermission: async (ctx) => { 
    try {
      let permission = isNaN(ctx.params.psid) ? 
                       "slug" : "id";

      let permissions = await db.query('SELECT pp.id, pp.slug, pp.name, pp.default, '
                                      +'pp.description, rp.value '
                                      +'FROM schema.roles_permissions rp '
                                      +'INNER JOIN schema.permissions pp '
                                      +'ON (rp.permission_id = pp.id) '
                                      +'WHERE rp.role_id = $1 AND pp.'+ permission +' = $2',
                                      [ctx.params.rid, ctx.params.psid]);
      ctx.status = permissions.rowCount !== 0 ? 200 : 400;
      ctx.body = permissions.rows[0];
    }

    catch (er) {
      ctx.status = 400;
    }
  },

  assignRolePermission: async (ctx) => { 
    let item = {
      roleID: ctx.params.rid,
      permissionID: !isNaN(ctx.params.psid) ?
                    ctx.params.psid : 0,
      permissionSlug: isNaN(ctx.params.psid) ?
                      ctx.params.psid : ''
    };
    let permission;
      try {
        permission = await db.query('SELECT id, slug, name, "default", '
                                   +'description FROM schema.permissions '
                                   +'WHERE slug like $1 OR id=$2', 
                                    [item.permissionSlug, item.permissionID]);
        if(permission.rowCount === 0) throw err;
        item.permissionID = permission.rows[0].id;
      }
      catch (err) {
        ctx.status = 400;
        return;
      }
    try {
      permission.rows[0].value = ctx.request.body.value === undefined ? 
                                 permission.rows[0].default : ctx.request.body.value;
      await db.query('INSERT INTO schema.roles_permissions '
                   + '(role_id, permission_id, value) '
                   + 'VALUES ($1, $2, $3) '
                   + 'ON CONFLICT (role_id, permission_id) DO '
                   + 'UPDATE SET '
                   + 'value=EXCLUDED.value '
                   + ';',
                     [item.roleID, item.permissionID,
                      permission.rows[0].value]);
      ctx.status = 201;
      ctx.body = permission.rows[0];
    }
    catch (err) {
      ctx.status = 400;
    }
  },

  deleteRolePermission: async (ctx) => { 
    let item = {
      roleID: ctx.params.rid,
      permissionID: !isNaN(ctx.params.psid) ?
                    ctx.params.psid : 0,
      permissionSlug: isNaN(ctx.params.psid) ?
                      ctx.params.psid : ''
    };
    if(!item.permissionID){
      try {
        permission = await db.query('SELECT * FROM schema.permissions '
                                  + 'WHERE slug like $1 OR id=$2;', 
                                    [item.permissionSlug, item.permissionID]);
        if(permission.rowCount === 0) throw err; 
        item.permissionID = permission.rows[0].id;
      }
      catch (err) {
        ctx.status = 400;
        return;
      }
    }
    try {
      await db.query('DELETE FROM schema.roles_permissions '
                   + 'WHERE role_id = $1 AND permission_id = $2',
                     [item.roleID, item.permissionID]);
      ctx.status = 204;
    }
    catch (err) {
      ctx.status = 400;
    }
  },

  selectAllRoleUsers: async (ctx) => { 
    let params = {
      before: ctx.request.query.before !== undefined ? 
              ctx.request.query.before : Math.pow(2,62),
      after: ctx.request.query.after !== undefined ? 
              ctx.request.query.after : 0,
      limit: !isNaN(ctx.request.query.limit) ? 
             ctx.request.query.limit : 50,
      sort: 'ur.user_id',
      direction: ctx.request.query.direction === 'asc' ? 
                 'asc' : 'desc'
    };
    try {
      let roles = await db.query('SELECT ur.user_id '
                                +'FROM schema.users_roles ur '
                                +'INNER JOIN schema.roles rr '
                                +'ON (ur.role_id = rr.id) '
                                +'WHERE ur.role_id = $1 AND '
                                +'ur.role_id >= $3 AND ur.role_id <= $4 '
                                +'ORDER BY ' + params.sort + ' ' + params.direction + ' '
                                +'LIMIT $2',
                                [ctx.params.rid, params.limit, params.after,
                                                            params.before]);
      ctx.status = roles.rowCount !== 0 ? 200 : 400;
      ctx.body = roles.rows; 
    }
    catch (er) {
      ctx.status = 400;
    }
  },

  assignRoleUser: async (ctx) => { 
    let item = {
      userID: ctx.params.uid,
      roleID: ctx.params.rid
    };
    try {
      await db.query('INSERT INTO schema.users_roles '
                     + '(user_id, role_id) '
                     + 'VALUES ($1, $2) '
                     + 'ON CONFLICT (role_id, user_id) DO NOTHING',
                       [item.userID, item.roleID]);
      ctx.status = 204;
    }
    catch (err) {
      ctx.status = 400;
    }
  },

  deleteRoleUser: async (ctx) => { 
    let item = {
      userID: ctx.params.uid,
      roleID: ctx.params.rid
    };
    try {
      await db.query('DELETE FROM schema.users_roles '
                   + 'WHERE user_id = $1 AND role_id = $2',
                     [item.userID, item.roleID]);
      ctx.status = 204;
    }
    catch (err) {
      ctx.status = 400;
    }
  },

 /*sql инъекция */
  selectAllRoles: async (ctx) => {
    let params = {
      before: ctx.request.query.before !== undefined ? 
              ctx.request.query.before : Math.pow(2,62),
      after: ctx.request.query.after !== undefined ? 
              ctx.request.query.after : 0,
      limit: !isNaN(ctx.request.query.limit) ? 
             ctx.request.query.limit : 50,
      sort: ctx.request.query.sort !== undefined ? 
            ctx.request.query.sort : 'id',
      direction: ctx.request.query.direction === 'asc' ? 
                 'asc' : 'desc'
    };
    try {
      let roles = await db.query('SELECT id, name, description '
                                +'FROM schema.roles '
                                +'WHERE id >= $2 AND id <= $3 '
                                +'ORDER BY "' + params.sort + '" ' 
                                              + params.direction + ' '
                                +'LIMIT $1',
                                [params.limit, params.after,
                                              params.before]);
      ctx.status = 200;
      ctx.body = roles.rows;
    }

    catch (er) {
      ctx.status = 400;
    }
  },
 /*Что то сделать с ИД */
  createNewRole: async (ctx) => {
    let item = {
      id: ctx.request.body.id,
      name: ctx.request.body.name,
      description: ctx.request.body.description ? 
                   ctx.request.body.description : null
    };
    try {
      let roles = await db.query('SELECT * FROM schema.roles '
                               + 'WHERE name = $1 OR id = $2',
                                 [item.name, item.id]);
      if (roles.rowCount !== 0) {
        ctx.status = 201;
        ctx.body = roles.rows[0];
        return;
      }
      await db.query('INSERT INTO schema.roles '
        + '(id, name, description, is_deleted) '
        + 'VALUES ($1, $2, $3, $4);',
        [item.id, item.name,
        item.description, false]);
      ctx.status = 201;
      ctx.body = item;
    }
    catch (err) {
      ctx.status = 400;
    }
  },
/*Что то сделать с ИД */
  changeRole: async (ctx) => {
    let item = {
      id: ctx.params.rid,
      name: ctx.request.body.name,
      description: ctx.request.body.description
    };
    let obj = [item.id], i=2, str='';
    for (key in item) {
      if(undefined!==item[key] && key!='id') {
        str += i==2 ? '' : ', ';
        obj[i-1] = item[key];
      }
      else 
        continue;
      str += '"'+key+'"=$'+i
      i++;
    }
    try {
      await db.query('UPDATE schema.roles '
        + 'SET ' + str + ' '
        + 'WHERE id=$1;',
        obj);
      ctx.status = 200;
    }
    catch (err) {
      ctx.status = 400;
    }
  },

  deleteRole: async (ctx) => {
    try {
      await db.query('DELETE FROM schema.roles '
        + 'WHERE id=$1;',
        [ctx.params.rid]);
      ctx.status = 204;
    }
    catch (err) {
      ctx.status = 400;
    }
  },

  selectAllUserPermissions: async (ctx) => {
    try {
      let permissions = await db.query('SELECT pp.id, pp.slug, pp.name, pp.default, '
                                      +'pp.description, up.value '
                                      +'FROM schema.users_permissions up '
                                      +'INNER JOIN schema.permissions pp '
                                      +'ON (up.permission_id = pp.id) '
                                      +'WHERE up.user_id = $1',
                                      [ctx.params.uid]);
      ctx.status = permissions.rowCount !== 0 ? 200 : 400;
      ctx.body = permissions.rows;
    }
    catch (er) {
      ctx.status = 400;
    }
  },

  selectOneUserPermission: async (ctx) => { 
            //здесь будет возникать конфликт. Он решен.
            //value разное у права Пользователя и прав Ролей, а ролей у пользователя может быть не 1
            //тогда возникает вопрос, а какой валью учитывать?
            //сделал такой порядок: 1 - пользователь, 2.. - роли с 1-й по последнюю по порядку. 
            //(решено с помощью view в базе)
    try {
      let permission = isNaN(ctx.params.psid) ? 
                       "slug" : "id";
      let permissions = await db.query(
        'SELECT DISTINCT ON (up.id) up.id, up.slug, up.name, up.default, '
       +'up.description, up.value '
       +'FROM schema.user_permission up '
       +'left join schema.users_roles ur '
       +'ON ur.user_id=up.user_id OR ur.role_id=up.role_id '
       +'where up.'+ permission +' = $2 and (up.user_id = $1 or ur.user_id=$1 and up.role_id=ur.role_id)',
        [ctx.params.uid, ctx.params.psid]
        );
      ctx.body = permissions.rows[0];
      ctx.status = permissions.rowCount ? 200 : 400;
    }
    catch (er) {
      ctx.status = 400;
    }
  },

  assignUserPermission: async (ctx) => {
    let item = {
      userID: ctx.params.uid,
      permissionID: !isNaN(ctx.params.psid) ?
                    ctx.params.psid : 0,
      permissionSlug: isNaN(ctx.params.psid) ?
                      ctx.params.psid : ''
    };
    let permission;
      try {
        permission = await db.query('SELECT id, slug, name, "default", '
                                   +'description FROM schema.permissions '
                                   +'WHERE slug like $1 OR id=$2', 
                                    [item.permissionSlug, item.permissionID]);
        if(permission.rowCount === 0) throw err;                           
        item.permissionID = permission.rows[0].id;
      }
      catch (err) {
        ctx.status = 400;
        return;
      }
    try {
      permission.rows[0].value = ctx.request.body.value === undefined ? 
                   permission.rows[0].default : ctx.request.body.value;
      await db.query('INSERT INTO schema.users_permissions '
                     + '(user_id, permission_id, value) '
                     + 'VALUES ($1, $2, $3) '
                     + 'ON CONFLICT (user_id, permission_id) DO '
                     + 'UPDATE SET '
                     + 'value=EXCLUDED.value '
                     + ';',
                       [item.userID, item.permissionID,
                        permission.rows[0].value]);
      ctx.status = 200;
      ctx.body = permission.rows[0];
    }
    catch (err) {
      ctx.status = 400;
    }
  },

  deleteUserPermission: async (ctx) => {
    let item = {
      userID: ctx.params.uid,
      permissionID: !isNaN(ctx.params.psid) ?
                    ctx.params.psid : 0,
      permissionSlug: isNaN(ctx.params.psid) ?
                      ctx.params.psid : ''
    };
    if(!item.permissionID){
      try {
        permission = await db.query('SELECT * FROM schema.permissions '
                                  + 'WHERE slug like $1 OR id=$2;', 
                                    [item.permissionSlug, item.permissionID]);
        if(permission.rowCount === 0) throw err; 
        item.permissionID = permission.rows[0].id;
      }
      catch (err) {
        ctx.status = 400;
        return;
      }
    }
    try {
      await db.query('DELETE FROM schema.users_permissions '
                   + 'WHERE user_id = $1 AND permission_id = $2',
                     [item.userID, item.permissionID]);
      ctx.status = 204;
    }
    catch (err) {
      ctx.status = 400;
    }
  },

/*sql иньекция */
  selectAllUserRoles: async (ctx) => { 
    let params = {
      before: ctx.request.query.before !== undefined ? 
              ctx.request.query.before : Math.pow(2,62),
      after: ctx.request.query.after !== undefined ? 
              ctx.request.query.after : 0,
      limit: !isNaN(ctx.request.query.limit) ? 
             ctx.request.query.limit : 50,
      sort: ctx.request.query.sort !== undefined ? 
            ctx.request.query.sort : 'id',
      direction: ctx.request.query.direction === 'asc' ? 
                 'asc' : 'desc'
    };
    try {
      let roles = await db.query('SELECT rr.id, rr.name, '
                                +'rr.description '
                                +'FROM schema.users_roles ur '
                                +'INNER JOIN schema.roles rr '
                                +'ON (ur.role_id = rr.id) '
                                +'WHERE ur.user_id = $1 AND '
                                +'rr.id >= $3 AND rr.id <= $4 '
                                +'ORDER BY rr.' + params.sort + ' ' 
                                              + params.direction + ' '
                                +'LIMIT $2',
                                [ctx.params.uid, params.limit, params.after,
                                                      params.before]);
      ctx.status = roles.rowCount !== 0 ? 200 : 400;
      ctx.body = roles.rows; 
    }

    catch (er) {
      ctx.status = 400;
    }
  }

}
