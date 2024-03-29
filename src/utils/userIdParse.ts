export default function userIdParse(userId: string) {
  if (!userId.includes("|")) {
    console.error("Invalid user_id format");
    return userId;
  }

  const [, id] = userId.split("|");

  return id;
}
