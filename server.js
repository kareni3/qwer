const permissions = require('./routes/routes/permissions');
const roles = require('./routes/routes/roles');
const user_permissions = require('./routes/routes/user_permissions');
const role_users = require('./routes/routes/role_users');
const role_permissions = require('./routes/routes/role_permissions');
const user_roles = require('./routes/routes/user_roles');
const requires = require('./requires/requires');

const app = new requires.Koa();
const router = new requires.Router();

app.use(requires.bodyParser())
   .use(router.routes())
   .use(requires.logger())
   .use(router.allowedMethods());
   /*.use(requires.koaJsonLogger({
       name: 'app',
       path: 'config/log',
       jsonapi: false
   }));*/ // это лог и он мне мешает, раскомментить вконце если нужен

//Редактирование и чтение коллекции Permissions (psid - slug or id)
router.get('/permissions', permissions.selectAll)
      .post('/permissions', permissions.createNewOne)
      .put('/permissions/:psid', permissions.changeOne)
      .patch('/permissions/:psid', permissions.changeOne)
      .delete('/permissions/:pid', permissions.deleteOne);

//Присвоенные права и пользователи. Взаимодействие
router.get('/users/:uid/permissions', user_permissions.selectAll)
      .get('/users/:uid/permissions/:psid', user_permissions.selectOne)
      .put('/users/:uid/permissions/:psid', user_permissions.assignPermission)
      .delete('/users/:uid/permissions/:psid', user_permissions.deleteAssignment);

//Редактирование и чтение коллекции Roles
router.get('/roles', roles.selectAll)
      .post('/roles', roles.createNewOne)
      .put('/roles/:rid', roles.changeOne)
      .patch('/roles/:rid', roles.changeOne)
      .delete('/roles/:rid', roles.deleteOne);

//Роли и пользователи. Взаимодействие
router.get('/role/:rid/users', role_users.selectAll)
      .put('/roles/:rid/users/:uid', role_users.assignRole)
      .delete('/roles/:rid/users/:uid', role_users.deleteAssignment)
      .get('/user/:uid/roles', user_roles.selectAll);

//Присвоенные права и роли. Взаимодействие
router.get('/roles/:rid/permissions', role_permissions.selectAll)
      .get('/roles/:rid/permissions/:psid', role_permissions.selectOne)
      .put('/roles/:rid/permissions/:psid', role_permissions.assignPermission)
      .delete('/roles/:rid/permissions/:psid', role_permissions.deleteAssignment);


app.listen(3000, () => {
      console.log("Server is running on port 3000");
});