const queries = require('../queries');

module.exports = {
  selectAll: async (ctx) => {
    await queries.selectAllUserRoles(ctx);
  }
}