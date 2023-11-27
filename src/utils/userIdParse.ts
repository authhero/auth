export default function userIdParse(userId: string) {
  if (!userId.includes("|")) {
    console.error("Invalid user_id format");
    return userId;
  }

  console.log("userIdParse ", userId);

  const [provider, id] = userId.split("|");

  return id;
}
