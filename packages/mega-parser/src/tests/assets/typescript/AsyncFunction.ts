async function fetchData() {
  try {
    const response = await fetch("api/data");
    return await response.json();
  } catch (error) {
    console.error(error);
  }
}
