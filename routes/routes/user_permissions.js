const queries = require('../queries');

module.exports = {
    selectAll: async (ctx) => {
        await queries.selectAllUserPermissions(ctx);
    },
    selectOne: async (ctx) => {
        await queries.selectOneUserPermission(ctx);
    },
    assignPermission: async (ctx) => {
        await queries.assignUserPermission(ctx);
    },
    deleteAssignment: async (ctx) => {
        await queries.deleteUserPermission(ctx);
    },
}