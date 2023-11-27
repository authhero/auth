export default function parseUserId(userId: string) {
  if (!userId.includes("|")) {
    console.error("Invalid user_id format");
    return userId;
  }

  const [provider, id] = userId.split("|")[1];

  return {
    provider,
    id,
  };
}
