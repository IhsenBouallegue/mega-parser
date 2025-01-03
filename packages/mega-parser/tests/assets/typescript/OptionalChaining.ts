interface User {
  address?: {
    street?: string;
  };
}

function getStreet(user: User) {
  return user?.address?.street;
}
