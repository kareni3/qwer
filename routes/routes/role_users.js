const queries = require('../queries');

module.exports = {
    selectAll: async (ctx) => {
        await queries.selectAllRoleUsers(ctx);
    },
    assignRole: async (ctx) => {
        await queries.assignRoleUser(ctx);
    },
    deleteAssignment: async (ctx) => {
        await queries.deleteRoleUser(ctx);
    }
}