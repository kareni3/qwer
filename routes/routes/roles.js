const queries = require('../queries');

module.exports = {
  selectAll: async (ctx) => {
    await queries.selectAllRoles(ctx);
  },
  createNewOne: async (ctx) => {
    await queries.createNewRole(ctx);
  },
  changeOne: async (ctx) => {
    await queries.changeRole(ctx);
  },
  deleteOne: async (ctx) => {
    await queries.deleteRole(ctx);
  }
}