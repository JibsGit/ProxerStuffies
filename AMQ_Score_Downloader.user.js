// ==UserScript==
// @name         AMQ Score Download
// @version      1.0.7
// @description  Displays Score Final in AMQ of all Players and downloads a json of them
// @author       Jib
// @match        https://animemusicquiz.com/*
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// @grant        none
// @downloadURL  https://github.com/JibsGit/ProxerStuffies/raw/main/AMQ_Score_Downloader.user.js
// @updateURL    https://github.com/JibsGit/ProxerStuffies/raw/main/AMQ_Score_Downloader.user.js
// ==/UserScript==

// don't load on login page
if (document.getElementById("startPage")) return;

//

let exportData = [];

function createNewTable() {
    exportData = [];
}

// Wait until the LOADING... screen is hidden and load script
let loadInterval = setInterval(() => {
    if (document.getElementById("loadingScreen").classList.contains("hidden")) {
        setup();
        clearInterval(loadInterval);
    }
}, 500);

let settingsDataNew = [
    {
        containerId: "smScoreDownloadOptions",
        title: "Score Display and Download Options",
        data: [
            {
                label: "Auto-Download Score",
                id: "smAutoDownload",
                popover: "Enables or disables the auto Download of Score-File",
                offset: 0,
                default: false
            }
        ]
    }
];

// Create the "Score Download" tab in settings
$("#settingModal .tabContainer")
    .append($("<div></div>")
        .addClass("tab leftRightButtonTop clickAble")
        .attr("onClick", "options.selectTab('settingsCustomNewContainer', this)")
        .append($("<h5></h5>")
            .text("Score DL")
        )
    );

//Create the body base
$("#settingModal .modal-body")
    .append($("<div></div>")
        .attr("id", "settingsCustomNewContainer")
        .addClass("settingContentNewContainer hide")
        .append($("<div></div>")
            .addClass("row")
        )
    );


// Create the checkboxes
for (let setting of settingsDataNew) {
    $("#settingsCustomNewContainer > .row")
        .append($("<div></div>")
            .addClass("col-xs-6")
            .attr("id", setting.containerId)
            .append($("<div></div>")
                .attr("style", "text-align: center")
                .append($("<label></label>")
                    .text(setting.title)
                )
            )
        );
    for (let data of setting.data) {
        $("#" + setting.containerId)
            .append($("<div></div>")
                .addClass("customCheckboxContainer")
                .addClass(data.offset !== 0 ? "offset" + data.offset : "")
                .addClass(data.offset !== 0 ? "disabled" : "")
                .append($("<div></div>")
                    .addClass("customCheckbox")
                    .append($("<input id='" + data.id + "' type='checkbox'>")
                        .prop("checked", data.default !== undefined ? data.default : false)
                    )
                    .append($("<label for='" + data.id + "'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                )
                .append($("<label></label>")
                    .addClass("customCheckboxContainerLabel")
                    .text(data.label)
                )
            );
        if (data.popover !== undefined) {
            $("#" + data.id).parent().parent().find("label:contains(" + data.label + ")")
                .attr("data-toggle", "popover")
                .attr("data-content", data.popover)
                .attr("data-trigger", "hover")
                .attr("data-html", "true")
                .attr("data-placement", "top")
                .attr("data-container", "#settingModal")
        }
    }
}

let scoreboardReady = false;
let playerDataReady = false;
let returningToLobby = false;
let missedFromOwnList = 0;
let playerData = {};

// listeners
let quizReadyRigTracker;
let answerResultsRigTracker;
let quizEndRigTracker;
let returnLobbyVoteListener;
let joinLobbyListener;
let spectateLobbyListener;


// Creates the player data for counting rig (and score)
function initialisePlayerData() {
    clearPlayerData();
    for (let entryId in quiz.players) {
         playerData[entryId] = {
             score: 0,
             name: quiz.players[entryId]._name
         };
    }
    playerDataReady = true;
}

// Clears player data
function clearPlayerData() {
    playerData = {};
    playerDataReady = false;
}

function getPlayerCount(){
    let count = 0;
    for (let entryId in quiz.players) {
        count++;
    }
    return count;
}

// Write the final result at the end of the game
function writeResultsToChat() {
    let firstIterate = true;
    let count = getPlayerCount();
    let tmpData = [];
    for (let key of Object.keys(playerData)) {
        tmpData.push(playerData[key]);
    }
    let oldMessage = gameChat.$chatInputField.val();
    //gameChat.$chatInputField.val("count: " + count);
    //gameChat.sendMessage();
    if (!returningToLobby) {
        createNewTable();
		for(let entryId in quiz.players){
            if(firstIterate == true){
                if(entryId > 0){
                    entryId=0;
                }
            }
            //gameChat.$chatInputField.val("count: " + count + "EntryId: " + entryId);
            //gameChat.sendMessage();
            let loop = true;
            while(loop == true && entryId<count){
                try{
                    //gameChat.$chatInputField.val("try");
                    //gameChat.sendMessage();
                    let y = tmpData[entryId].name;
                    //gameChat.$chatInputField.val(tmpData[entryId].name);
                    //gameChat.sendMessage();
                    let x = tmpData[entryId].score;
                    loop = false;
                }
                catch (e){
                    //gameChat.$chatInputField.val("catch");
                    //gameChat.sendMessage();
                    loop = true;
                    entryId++;
                }
            }
                let newScore = {
                    name: tmpData[entryId].name,
                    score :tmpData[entryId].score
                };
                exportData.push(newScore);
            firstIterate = false;
            }
        if($("#smAutoDownload").prop("checked")){
            download();
        }
    }
    else {
        for(let entryId in quiz.players){
            gameChat.$chatInputField.val("Score: " + tmpData[entryId].name + " " + tmpData[entryId].score);
            gameChat.sendMessage();
		}
    }
    gameChat.$chatInputField.val(oldMessage);
}

function download(){
    //var json = JSON.stringify(t_obj);
    let d = new Date();
    let fileName = "score_export_";
    fileName += d.getFullYear() + "-";
    fileName += (d.getMonth() + 1 < 10 ? "0" + (d.getMonth() + 1) : d.getMonth() + 1) + "-";
    fileName += (d.getDate() < 10 ? ("0" + d.getDate()) : d.getDate()) + "_";
    fileName += (d.getHours() < 10 ? ("0" + d.getHours()) : d.getHours()) + "-";
    fileName += (d.getMinutes() < 10 ? ("0" + d.getMinutes()) : d.getMinutes()) + "-";
    fileName += (d.getSeconds() < 10 ? ("0" + d.getSeconds()) : d.getSeconds()) + ".json";
    let JSONData = new Blob([JSON.stringify(exportData)], {type: "application/json"});
    let tmpLink = $(`<a href="${URL.createObjectURL(JSONData)}" download="${fileName}"></a>`);
    $(document.body).append(tmpLink);
    tmpLink.get(0).click();
    tmpLink.remove();
}

function setup() {

    // Initial setup on quiz start
    quizReadyRigTracker = new Listener("quiz ready", (data) => {
        returningToLobby = false;
        clearPlayerData();
        clearScoreboard();
        if ($("#smRigTracker").prop("checked") && quiz.gameMode !== "Ranked") {
            answerResultsRigTracker.bindListener();
            quizEndRigTracker.bindListener();
            returnLobbyVoteListener.bindListener();
            initialisePlayerData();
        }
        else {
            answerResultsRigTracker.unbindListener();
            quizEndRigTracker.unbindListener();
            returnLobbyVoteListener.unbindListener();
        }
    });
    // stuff to do on answer reveal
    answerResultsRigTracker = new Listener("answer results", (result) => {
        if (quiz.gameMode === "Ranked") {
            return;
        }
        if (!playerDataReady) {
            initialisePlayerData();
        }
        if (playerDataReady) {
            for (let player of result.players) {
                if (player.correct === true) {
                    playerData[player.gamePlayerId].score++;
                }
            }
        }
    });

    // stuff to do on quiz end
    quizEndRigTracker = new Listener("quiz end result", (result) => {
        writeResultsToChat();
    });

    // stuff to do on returning to lobby
    returnLobbyVoteListener = new Listener("return lobby vote result", (payload) => {
        if (payload.passed) {
            returningToLobby = true;
            writeResultsToChat();

        }
    });

    // Reset data when joining a lobby
    joinLobbyListener = new Listener("Join Game", (payload) => {
        if (payload.error) {
            return;
        }
        if (payload.settings.gameMode !== "Ranked") {
            answerResultsRigTracker.bindListener();
            quizEndRigTracker.bindListener();
            returnLobbyVoteListener.bindListener();
        }
        else {
            answerResultsRigTracker.unbindListener();
            quizEndRigTracker.unbindListener();
            returnLobbyVoteListener.unbindListener();
        }
        clearPlayerData();
    });

    // Reset data when spectating a lobby
    spectateLobbyListener = new Listener("Spectate Game", (payload) => {
        if (payload.error) {
            return;
        }
        if (quiz.gameMode !== "Ranked") {
            answerResultsRigTracker.bindListener();
            quizEndRigTracker.bindListener();
            returnLobbyVoteListener.bindListener();
        }
        else {
            answerResultsRigTracker.unbindListener();
            quizEndRigTracker.unbindListener();
            returnLobbyVoteListener.unbindListener();
        }
        clearPlayerData();
    });

    // bind listeners
    quizReadyRigTracker.bindListener();
    answerResultsRigTracker.bindListener();
    quizEndRigTracker.bindListener();
    returnLobbyVoteListener.bindListener();
    joinLobbyListener.bindListener();
    spectateLobbyListener.bindListener();

    AMQ_addScriptData({
        name: "Score Download",
        author: "Jib",
        description: `
            <p>Score Download for multi-people lobbies into a .json file</p>
        `
    });


    // CSS stuff
    AMQ_addStyle(`
        .qpsPlayerRig {
            padding-right: 5px;
            opacity: 0.3;
        }
        .customCheckboxContainer {
            display: flex;
        }
        .customCheckboxContainer > div {
            display: inline-block;
            margin: 5px 0px;
        }
        .customCheckboxContainer > .customCheckboxContainerLabel {
            margin-left: 5px;
            margin-top: 5px;
            font-weight: normal;
        }
        .offset1 {
            margin-left: 20px;
        }
        .offset2 {
            margin-left: 40px;
        }
        .offset3 {
            margin-left: 60px;
        }
        .offset4 {
            margin-left: 80px;
        }
    `);
}