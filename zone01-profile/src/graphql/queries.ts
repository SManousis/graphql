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

export const PROGRESS = `
query MyProgress($limit: Int = 2000, $userId: Int!) {
  progress(
    order_by: [{ updatedAt: desc }, { createdAt: desc }]
    limit: $limit
    where: { userId: { _eq: $userId }, isDone: { _eq: true } }
  ) {
    id
    grade
    createdAt
    updatedAt
    path
    objectId
    object { id name type }
    user { id login }
  }
}
`;
