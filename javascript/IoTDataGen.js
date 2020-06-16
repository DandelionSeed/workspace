// --------------------------------- IoT Sensor Data Generator ------------------------------------
const tempScope = { min: -20, max: 130 };
const pressScope = { min: -400, max: 400 };
const moistScope = { min: 0.12, max: 0.88 };
const voltScope = { min: 4.5, max: 5.5 };

const TEMP_STEP = (tempScope.max - getAvg(tempScope)) / 70;
const PRESS_STEP = (pressScope.max - getAvg(pressScope)) / 70;
const MOIST_STEP = (moistScope.max - getAvg(moistScope)) / 70;
const VOLT_STEP = (voltScope.max - getAvg(voltScope)) / 70;

var sensorDataMap = new Map();
var itvs = new Map();

function getAvg(jsonobj) {
    return (jsonobj.min + jsonobj.max) / 2;
}//getAvg() end
function getRandom(step) {
    return Number.parseFloat(((Math.random() * step * 2) - step).toFixed(7));
}//getRandom() end
function initSensors(modelID, children) { // String, object Array
    var model = [];
    for (var i = 0; i < children.length; i++) {
        model[i] = {};
        model[i].objid = children[i].PV_DT_OBJID;
        model[i].temperature = getAvg(tempScope);
        model[i].pressure = getAvg(pressScope);
        model[i].moist = getAvg(moistScope);
        model[i].connect = true;
    }//for() end
    sensorDataMap.set(modelID, model);
}//initSensors() end
function udtData(modelID) {
    var targetModel = sensorDataMap.get(modelID);
    for (i in targetModel) {
        if (targetModel[i].connect == true) {
            targetModel[i].temperature += getRandom(TEMP_STEP);
            targetModel[i].pressure += getRandom(PRESS_STEP);
            targetModel[i].moist += getRandom(MOIST_STEP);
        }//if() end
    }//for() end
    sensorDataMap.set(modelID, targetModel);
    redisPublisher.publish(modelID, JSON.stringify(targetModel));
}//udtData() end
function startGenData(modelID, children) {
    initSensors(modelID, children);
    itvs.set(modelID, setInterval(function () {
        udtData(modelID);
    }, 1000));
}//startGenData() end
function stopGenData(modelID) {
    clearInterval(itvs.get(modelID));
    itvs.delete(modelID);
    var lastData = sensorDataMap.get(modelID);
    for (i in lastData) {
        lastData[i].connect = false;
    }//for() end
    redisPublisher.publish(modelID, JSON.stringify(lastData));
    sensorDataMap.delete(modelID);
}//stopGenData() end
function requestTBWREST(param) {
    var option = reqOption;
    var resultBody;
    option.body.formdata = param;
    request.post(option, function (err, httpResponse, body) {
        if (err) {
            console.log("An error occured while requesting TBW REST API.");
            console.log(err);
            return;
        }//if() end
    });//request.post() end
}//requestTBWREST() end
function controlSensor(modelID, objID, val) {
    var idx;
    var sensors = sensorDataMap.get(modelID);
    for (i in sensors) {
        if (sensors.objid == objID) {
            idx = i;
            break;
        }//if() end
    }//for() end
    sensors[idx].connect = val;
    sensorDataMap.set(modelID, sensors);
}//controlSensor() end
function controlValue(modelID, action, objLength) {
    var sensors = sensorDataMap.get(modelID);
    var targetIdx = Math.ceil(Math.random() * objLength) - 1;
    var targetType = Math.ceil(Math.random() * 3);

    if (action == 'error') {
        if (targetType == 1)
            sensors[targetIdx].temperature = tempScope.max + TEMP_STEP * 10;
        if (targetType == 2)
            sensors[targetIdx].pressure = pressScope.max + PRESS_STEP * 10;
        if (targetType == 3)
            sensors[targetIdx].moist = moistScope.max + MOIST_STEP * 10;
    } else {
        for (i in sensors) {
            sensors[i].temperature = getAvg(tempScope);
            sensors[i].pressure = getAvg(pressScope);
            sensors[i].moist = getAvg(moistScope);
        }//for() end
    }//if~else() end
    sensorDataMap.set(modelID, sensors);
}//controlValue() end
