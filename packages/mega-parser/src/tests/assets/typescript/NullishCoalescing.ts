function getName(user: { name?: string }) {
  return user.name ?? "Anonymous";
}
