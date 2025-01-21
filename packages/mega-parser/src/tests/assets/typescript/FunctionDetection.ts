// Regular function
function regularFunction() {
  return true;
}

// Function with parameters and return type
function complexFunction(a: number, b: string): boolean {
  return a > 0 && b.length > 0;
}

// Arrow function assignment
const arrowFunction = () => {
  console.log("test");
};

// Class with method
class TestClass {
  method() {
    return false;
  }
}

// Type definition (should not be counted)
type FunctionType = () => void;

// Function in string (should not be counted)
const str = "function test() { }";

// Arrow in type union (should not be counted)
type Result = string | (() => void);

// Commented function (should not be counted)
// function commentedFunction() { }
