const queries = require('../queries');

module.exports = {
  selectAll: async (ctx) => {
    await queries.selectAllPermissions(ctx);
  },
  createNewOne: async (ctx) => {
    await queries.createNewPermission(ctx);
  },
  changeOne: async (ctx) => {
    await queries.changePermission(ctx);
  },
  deleteOne: async (ctx) => {
    await queries.deletePermission(ctx);
  }
}
