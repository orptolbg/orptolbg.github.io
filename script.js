//get and parse time
const today = new Date();
let hours = today.getHours().toString();
let minutes = today.getMinutes().toString();
//add zero if necessary
if (hours.length == 1) {hours = `0${hours}`};
if (minutes.length == 1) {minutes = `0${minutes}`};
let time = `${hours}:${minutes}`
document.getElementById("header").textContent = `Departures from Orpington to London Bridge - ${time}`;

const sectionHeadings = ["ORP","LBG","","SPEED"];

const token = window.location.search.substring(1);

async function getData() {
    try {
        var servicesResponse = await fetch(`https://huxley2.azurewebsites.net/departures/ORP/to/LBG/12/?accessToken=${token}`);
    } catch (error) { //catch invalid/no token provided
        console.log(error);
        errorMessage = document.createElement("h2");
        errorMessage.innerHTML = "Error - invalid token, data cannot be retrieved.<br>Append /?{Your OpenLDBWS token} to the end of the URL.";
        document.body.appendChild(errorMessage);
        return;
    }
    let servicesJson = await servicesResponse.json();
    let trainServices = servicesJson.trainServices;

    let serviceIds = [];
    for (i=0; i<trainServices.length; i++) {
        serviceIds.push(trainServices[i].serviceIdPercentEncoded)
    }

    //forEach gives jumbled order, this awaits and arrives in order
    for (const serviceId of serviceIds) {
        await addService(serviceId);
    }
}

async function addService(serviceId) {
    let serviceResponse = await fetch(`https://huxley2.azurewebsites.net/service/${serviceId}?accessToken=${token}`);
    let serviceJson = await serviceResponse.json();

    let orpArrival = serviceJson.std;
    let estimatedOrpArrival = serviceJson.etd;
    let subsequentCallingPoints = serviceJson.subsequentCallingPoints[0].callingPoint;
    let stopsLeft = subsequentCallingPoints.length;
    if (stopsLeft <= 3) {
        var speed = "FAST";
    } else {
        var speed = "SLOW";
    }
    let destinationCrs = subsequentCallingPoints[stopsLeft-1].crs;
    let destinationArrival = subsequentCallingPoints[stopsLeft-1].st;
    let estimatedDestinationArrival = subsequentCallingPoints[stopsLeft-1].et;
    if (destinationCrs == "CST") {
        var lbgJson = subsequentCallingPoints[stopsLeft-2]; //CST services second last CP is LBG
    } else {
        var lbgJson = subsequentCallingPoints[stopsLeft-3]; //CHX services third last CP is LBG
    }
    let lbgArrival = lbgJson.st;
    let estimatedLbgArrival = lbgJson.et;
    let platform = serviceJson.platform;

    createService(
        orpArrival, estimatedOrpArrival, platform,
        destinationCrs, destinationArrival, estimatedDestinationArrival,
        lbgArrival, estimatedLbgArrival, speed
    );
}

function createService(
    orpArrival, estimatedOrpArrival, platform,
    destinationCrs, destinationArrival, estimatedDestinationArrival,
    lbgArrival, estimatedLbgArrival, speed) {

        let mains = [orpArrival, lbgArrival, destinationArrival, speed];
        let estimates = [estimatedOrpArrival, estimatedLbgArrival, estimatedDestinationArrival, ""];
        
        let train = document.createElement("div");
        train.classList.add("train");
        document.body.appendChild(train);

        //sections
        for (i = 0; i < 4; i++) {
            let section = document.createElement("div");
            section.classList.add("train-section");
            train.appendChild(section);

            let heading = document.createElement("p");
            if (i == 0) { 
                if (platform != null) {
                    heading.innerHTML = `${sectionHeadings[i]} PL.${platform}`;
                } else {
                    heading.innerHTML = `${sectionHeadings[i]} PL.-`;
                }
            } else if (sectionHeadings[i]) {
                heading.textContent = sectionHeadings[i];
            } else {
                heading.textContent = destinationCrs;
            }
            section.appendChild(heading);

            let main = document.createElement("p");
            main.classList.add("main");
            if (mains[i]) {
                main.textContent = mains[i];
            } else {
                main.textContent = "-";
            }
            if (mains[i] == "FAST" || mains[i] == "SLOW") {
                main.classList.add(mains[i].toLowerCase());
            }
            section.appendChild(main);

            let estimate = document.createElement("p");
            if (estimates[i] == "Cancelled") {
                estimate.classList.add("slow");
            } else if (estimates[i]) {
                estimate.classList.add("estimate");
            } else {
                estimate.classList.add("blank");
            }
            estimate.textContent = `(${estimates[i]})`
            section.appendChild(estimate)
        }
}


getData();
