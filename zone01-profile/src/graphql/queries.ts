export const ME = `query { user { id login firstName lastName email } }`;

export const XP_TRANSACTIONS = `
query MyXp($limit: Int = 1000) {
  transaction(
    where: { type: { _eq: "xp" } }
    order_by: { createdAt: asc }
    limit: $limit
  ) { id amount objectId userId createdAt path }
}
`;

export const OBJECT_BY_IDS = `
query ObjByIds($ids: [Int!]) {
  object(where: { id: { _in: $ids } }) { id name type }
}
`;

export const RESULTS = `
query MyResults($limit: Int = 2000) {
  result(order_by: { createdAt: asc }, limit: $limit) {
    id grade type createdAt path
  }
}
`;
