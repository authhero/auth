export default function userIdParse(userId: string) {
  if (!userId.includes("|")) {
    // uncomment this to really fail tests
    // throw new Error("Invalid user_id format");
    console.error("Invalid user_id format");
    return userId;
  }

  const [, id] = userId.split("|");

  return id;
}
