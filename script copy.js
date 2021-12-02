function makeRequest(URL) {
  var results;

  $.ajax({
    url: URL,
    dataType: "json",
    type: "GET",
    crossDomain: true,
    contentType: "application/json",

    // $.parseJSON

    success: function (result) {
      console.log("försöker att parsa data");
      return result.data;
    },
    error: function (error) {
      alert("error" + error.type);
    },
  });
}

function getUppgifter() {
  let results;
  const URL = "http://localhost:8080/RESTful/api/canvas/uppgifter";

  console.log("försöker att skicka url till metod MakeRequest");
  results = makeRequest(URL);
  console.log("försöker skriva ut resultat");
  console.log(results);
}
