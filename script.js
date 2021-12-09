const button = document.getElementById("button-test");
const buttonChange = document.getElementById("btn-change");
const buttonLadok = document.getElementById("btn-ladok");
let tablebody = document.getElementById("table-body");
let kurskodDropdown = document.getElementById("kurskod");
let terminDropdown = document.getElementById("termin");
let modulDropdown = document.getElementById("modul");

let checkboxes = document.querySelectorAll(".checkbox");

let canvasData;
let epokTillfalleData;
let epokModulData;
let tableData;

const modal = document.querySelector(".modal");
const trigger = document.querySelector(".trigger");
const closeButton = document.querySelector(".close-button");

function toggleModal() {
  modal.classList.toggle("show-modal");
}

function windowOnClick(event) {
  if (event.target === modal) {
    toggleModal();
  }
}

closeButton.addEventListener("click", toggleModal);
window.addEventListener("click", windowOnClick);

let statusRegistrerad = [];

function createStatus(message, uppgiftId) {
  let status = {
    uppgiftId: uppgiftId,
    status: message,
  };

  return status;
}

function addStatusToDB(status) {
  statusRegistrerad.push(status);
}

function isUppgiftRegistrerad(uppgiftId) {
  for (let i = 0; i < statusRegistrerad.length; i++) {
    if (statusRegistrerad[i].uppgiftId == uppgiftId) return true;
  }

  return false;
}

$(document).ready(function () {
  $("#table").DataTable({});
  loadCanvasData();
  queryKurskoder();
});

buttonChange.addEventListener("click", function (e) {
  console.log("test");
  toggleModal();
  let checked = document.querySelectorAll("input:checked");
  let selectedRows = [];

  for (let i = 0; i < checked.length; i++) {
    let row;
    let uppgiftId;
    let modul;
    let namn;
    let betygCanvas;
    let betygLadok;
    let datum;

    row = checked[i].parentNode.parentNode;
    uppgiftId = row.childNodes[0].innerText;
    modul = row.childNodes[1].innerText;
    namn = row.childNodes[2].innerText;
    betygCanvas = row.childNodes[4].innerText;
    datum = row.childNodes[5].innerText;
    betygLadok = row.childNodes[6].innerText;

    uppgift = queryUppgift(uppgiftId);
    itsstudent = getPersonInfo(uppgift.anvandarnamn);
  }
});

buttonLadok.addEventListener("click", function (e) {
  let checked = document.querySelectorAll("input:checked");
  let selectedRows = [];

  for (let i = 0; i < checked.length; i++) {
    let uppgiftColumn = "";
    let betygColumn = "";
    let sendResult;
    let uppgiftId = "";
    let uppgift;
    let namn;
    let itsstudent;
    let row = checked[i].parentNode.parentNode;
    let rowIndex = row.rowIndex;

    // info till ladok
    let ladok_personnummer; //check
    let ladok_kurskod;
    let ladok_modulkod;
    let ladok_betyg;
    let ladok_datum;

    uppgiftColumn = row.childNodes[0];
    betygColumn = row.childNodes[6].innerText;
    namn = row.childNodes[2].innerText;
    uppgiftId = uppgiftColumn.innerText;

    uppgift = queryUppgift(uppgiftId);
    itsstudent = getPersonInfo(uppgift.anvandarnamn);

    ladok_personnummer = itsstudent[0].personnummer;
    ladok_kurskod = uppgift.kurskod;
    ladok_modulkod = uppgift.modulkod;
    ladok_betyg = betygColumn;
    ladok_datum = uppgift.examinationsdatum;

    sendResult = {
      personnummer: ladok_personnummer,
      kurskod: ladok_kurskod,
      modulkod: ladok_modulkod,
      betyg: ladok_betyg,
      datum: ladok_datum + "Z",
    };

    let jsonResult = JSON.stringify(sendResult);

    let response = queryLadokStudent(ladok_personnummer);

    if (response.statusCode == 404) {
      alert("Studenten " + namn + " finns inte registrerad i Ladok");
    } else {
      setLadokResult(jsonResult);
      let status = createStatus("Registrerad", uppgiftId);
      addStatusToDB(status);
      row.childNodes[7].innerText = status.status;
      updateTable();
    }
  }
});

button.addEventListener("click", function (e) {
  updateTable();
});

function updateTable() {
  let selectedKurskod = kurskodDropdown.value;
  let selectedTermin = terminDropdown.value;
  let selectedModul = modulDropdown.value;

  renderUppgifter(selectedKurskod, selectedTermin, selectedModul);
}

kurskodDropdown.addEventListener("click", (event) => {
  let selectedKurskod = kurskodDropdown.value;
  terminDropdown.value = "";
  modulDropdown.value = "";

  queryTerminer(selectedKurskod);
});

terminDropdown.addEventListener("click", (event) => {
  let selectedKurskod = kurskodDropdown.value;
  let selectedTermin = terminDropdown.value;
  modulDropdown.value = "";

  if (selectedTermin != "0") {
    loadEpokTillfalleData(selectedKurskod, selectedTermin);
    queryModuler(selectedKurskod, selectedTermin);
  }
});

function getPersonInfo(anvandarnamn) {
  let URL =
    "http://localhost:8080/RESTful/api/student-its/studenter?anvandarnamn=" +
    anvandarnamn;
  let params = newParams(URL, "GET", "json", null);
  return httpRequest(params);
}

function loadCanvasData() {
  const URL = "http://localhost:8080/RESTful/api/canvas/uppgifter";
  let params = newParams(URL, "GET", "json", null);
  canvasData = httpRequest(params);
}

function loadEpokTillfalleData(kurskod, termin) {
  const URL =
    "http://localhost:8080/RESTful/api/epok/tillfallen?termin=" +
    termin +
    "&kurskod=" +
    kurskod;
  let params = newParams(URL, "GET", "json", null);
  epokTillfalleData = httpRequest(params);
}

function loadEpokModulData(tillfalles_Id) {
  const URL =
    "http://localhost:8080/RESTful/api/epok/moduler?tillfalle-id=" +
    tillfalles_Id;
  let params = newParams(URL, "GET", "json", null);
  epokModulData = httpRequest(params);
}

function httpRequest(params) {
  $.ajax({
    type: params.TYPE,
    url: params.URL,
    dataType: params.DATATYPE,
    data: params.POSTDATA,
    timeout: 10000,
    async: false,
    contentType: "application/json",

    success: function (data) {
      response = data;
    },
    error: function (error) {
      response = error.responseJSON;
    },
  });

  return response;
}

function setLadokResult(resultat) {
  let response = "";

  const URL = "http://localhost:8080/RESTful/api/ladok/resultat";
  let params = newParams(URL, "POST", "json", resultat);
  response = httpRequest(params);

  return response;
}

function queryKurskoder() {
  let kurskoder = [];
  kurskoder.push("<option value=0></option>");

  // Clear table if no data is entered
  if (canvasData.length > 0) $("#table").DataTable().clear();

  $.each(canvasData, function (key, value) {
    let html_string = "";

    html_string += '<option value="';
    html_string += value.kurskod;
    html_string += '">';
    html_string += value.kurskod;
    html_string += "</option>";

    // Lägg till kurskod om denna inte finns i listan
    if (!kurskoder.includes(html_string)) kurskoder.push(html_string);
  });

  $("#kurskod").append(kurskoder);
}

function queryLadokStudent(personnummer) {
  let student;

  const URL =
    "http://localhost:8080/RESTful/api/ladok/studenter?personnummer=" +
    personnummer;
  let params = newParams(URL, "GET", "json", null);
  student = httpRequest(params);

  return student;
}

function queryUppgift(uppgiftId) {
  let uppgift = "";

  const URL = "http://localhost:8080/RESTful/api/canvas/uppgifter/" + uppgiftId;
  let params = newParams(URL, "GET", "json", null);
  uppgift = httpRequest(params);

  return uppgift;
}

function queryTerminer(kurskod) {
  let terminer = [];
  terminer.push("<option value=0></option>");
  // Rensa
  if (canvasData.length > 0) $("#termin option").remove();

  $.each(canvasData, function (key, value) {
    // Skriv ut terminer som har den valda kurskoden
    if (value.kurskod == kurskod) {
      let html_string = "";
      html_string += '<option value="';
      html_string += value.termin;
      html_string += '">';
      html_string += value.termin;
      html_string += "</option>";

      // Lägg till kurskod om denna inte finns i listan
      if (!terminer.includes(html_string)) terminer.push(html_string);
    }
  });

  $("#termin").append(terminer);
}

function queryModuler(kurskod, modul) {
  let tillfallen;
  let moduler = [];
  moduler.push("<option value=0></option>");
  // Rensa
  if (epokTillfalleData.length > 0) $("#modul option").remove();

  $.each(epokTillfalleData, function (key, value) {
    tillfallen = value.tillfalleId;
  });

  loadEpokModulData(tillfallen);

  $.each(epokModulData, function (key, value) {
    let html_string = "";
    html_string += '<option value="';
    html_string += value.modulkod;
    html_string += '">';
    html_string += value.modulkod + " : " + value.beskrivning;
    html_string += "</option>";

    // Lägg till kurskod om denna inte finns i listan
    moduler.push(html_string);
  });

  $("#modul").append(moduler);
}

function newParams(url, type, datatype, postData) {
  let params = {
    URL: url,
    TYPE: type,
    DATATYPE: datatype,
    POSTDATA: postData,
  };

  return params;
}

function renderUppgifter(kurskod, termin, modulkod) {
  const URL =
    "http://localhost:8080/RESTful/api/canvas/uppgifter?kurskod=" +
    kurskod +
    "&modulkod=" +
    modulkod +
    "&termin=" +
    termin;
  let html_string = "";
  let params = newParams(URL, "GET", "json", null);

  // Get response
  tableData = httpRequest(params);

  // Clear table if no data is entered
  if (tableData.length > 0) $("#table").DataTable().clear();

  // Send data to table
  $.each(tableData, function (key, value) {
    let personInfo = getPersonInfo(value.anvandarnamn);
    let namn = personInfo[0].namn;
    let datum = value.examinationsdatum;
    let status = "";
    let checkbox = "<input type='checkbox' class='checkbox'>";

    let registrerad = isUppgiftRegistrerad(value.uppgiftId);

    if (registrerad == true) {
      status = "Registrerad";
      checkbox = "";
    } else status = "Ej klar";

    let short = datum.substring(0, datum.length - 1);
    $("#table")
      .DataTable()
      .row.add([
        value.uppgiftId,
        value.modulkod,
        namn,
        value.anvandarnamn,
        value.omdome,
        short,
        "G",
        status,
        checkbox,
      ])
      .draw();
  });
}
