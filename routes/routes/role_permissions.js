const queries = require('../queries');

module.exports = {
  selectAll: async (ctx) => {
    await queries.selectAllRolePermissions(ctx);
  },
  selectOne: async (ctx) => {
    await queries.selectOneRolePermission(ctx);
  },
  assignPermission: async (ctx) => {
    await queries.assignRolePermission(ctx);
  },
  deleteAssignment: async (ctx) => {
    await queries.deleteRolePermission(ctx);
  }
}