async function call(data) {
  try {
    const response = await fetch("http://localhost:8080/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log("Success:", result);
  } catch (error) {
    //console.error("Error:", error);
  }
}

setInterval(function () {
    call();
}, 50);
