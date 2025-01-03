interface Dog {
  bark(): void;
}

interface Cat {
  meow(): void;
}

function isDog(animal: Dog | Cat): animal is Dog {
  return "bark" in animal;
}

function makeSound(animal: Dog | Cat) {
  if (isDog(animal)) animal.bark();
  else animal.meow();
}
