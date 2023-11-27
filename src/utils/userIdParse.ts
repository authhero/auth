export default function userIdParse(userId: string) {
  if (!userId.includes("|")) {
    console.error("Invalid user_id format");
    return userId;
  }

  const [provider, id] = userId.split("|")[1];

  return id;
}
