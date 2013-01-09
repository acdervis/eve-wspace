// Portions Copyright (c) 2011 Georgi Kolev (arcanis@wiadvice.com). Licensed under the GPL (http://www.gnu.org/copyleft/gpl.html) license.

var loadtime = null;
var paper = null;
var objSystems = new Array();
var indentX = 150; //The amount of space (in px) between system ellipses on the X axis. Should be between 120 and 180.
var indentY = 64; // The amount of space (in px) between system ellipses on the Y axis
var renderWormholeTags = true; // Determines whether wormhole types are shown on the map.


$(document).ready(function(){setInterval(function(){doMapAjaxCheckin();}, 5000);});
$(document).ready(function(){
    $('#mapDiv').html(ajax_image);
    RefreshMap();
});


function processAjax(data){
    if (data['dialogHTML']){
        $(data['dialogHTML']).dialog({
            autoOpen: false,
            close: function(event, ui) { 
                $(this).dialog("destroy");
                $(this).remove();
            }
        });
        $('#igbAddDialog').dialog('open');
    }
    if (data['logs']){
        if ($('#logList').length == 0){
            $('#baseContentHeadDiv').append(data['logs']);
        }else{
            $('#logList').replaceWith(data['logs']);
        }
    }
    
}


function doMapAjaxCheckin() {
    var currentpath = "update/";
    $.ajax({
        type: "POST",
        url: currentpath,
        data: {"loadtime": loadtime},
        success: function(data) {processAjax(data);},
        error: function(errorThrown) {alert("An error occurred querying the server.");}
        });
}


function DisplaySystemDetails(msID, sysID){
    address = "system/" + msID + "/";
    $.ajax({
        type: "GET",
        url: address,
        success: function(data){
            if (!document.getElementById("sysInfoDiv")){
                $('#baseContentDiv').append(data);
            }
            else{
                $('#sysInfoDiv').html(data);
            }
            LoadSignatures(msID, true);
            $.ajax({
                type: "GET",
                url: "system/" + msID +  "/signatures/new/",
                success: function(data){
                    $('#sys'+msID+'SigAddForm').html(data);
                },
                error: function(){
                    alert("An error occured getting a blank signature add form.");
                }
            });
            GetPOSList(sysID);
            GetDestinations(msID);
            CloseSystemMenu();
        },
        error: function(errorThrown) {alert("An error occured building the details page.");}
    });
}


function GetPOSList(sysID){
    address = "/pos/" + sysID + "/";
    $.ajax({
        type: "GET",
        url: address,
        success: function(data){
            $('#sys' + sysID + "POSDiv").html(data);
        },
    });
}


function GetDestinations(msID){
    address = "system/" + msID + "/destinations/";
    $.ajax({
        type: "GET",
        url: address,
        success: function(data){
            $('#systemDestinationsDiv').html(data);
        }
    });
}


function DisplaySystemMenu(msID, x, y){
    address = "system/" + msID + "/menu/";
    $.ajax({
        type: "GET",
        url: address,
        success: function(data) { 
            if (!document.getElementById("sysMenu")){
                $('#mapDiv').append(data);
            }
            else{
                $('#sysMenu').replaceWith(data);
            }
            var div = document.getElementById("sysMenu");
            div.style.position = "absolute";
            div.style.top = y + 'px';
            div.style.left = x + 10 + 'px';
            div.style.visibility = "visible";
        },
        error: function(errorThrown) {alert("An error occured loading the system menu.");}
    });
}


function MarkScanned(msID, fromPanel, sysID){
    address = "system/" + msID + "/scanned/";
    $.ajax({
        type: "POST",
        url: address,
        async: false,
        data: {},
        success: function(data) { 
            GetSystemTooltip(msID);
            if (fromPanel){
                DisplaySystemDetails(msID, sysID);
            }
            CloseSystemMenu();

        },
        error: function(errorThrown) {alert("An error occured marking the system scanned.");}
    });
}

function SetInterest(msID){
    address = "system/" + msID + "/interest/";
    $.ajax({
        type: "POST",
        url: address,
        async: false,
        data: {"action": "set"},
        success: function(data) {
            CloseSystemMenu();
            RefreshMap();
        },
        error: function(errorThrown) {alert("An error occured setting the interest.");}
    });
   
}

function RemoveInterest(msID){
    address = "system/" + msID + "/interest/";
    $.ajax({
        type: "POST",
        url: address,
        async: false,
        data: {"action": "remove"},
        success: function(data) { 
            CloseSystemMenu();
            RefreshMap();
        },
        error: function(errorThrown) {alert("An error occured removing the interest.");}
    });

}

function AssertLocation(msID){
    address = "system/" + msID + "/location/";
    $.ajax({
        type: "POST",
        url: address,
        async: true,
        data: {},
        success: function(data) { 
            RefreshMap();
        },
        error: function(errorThrown) {alert("An error occured asserting your location.");}
    });
}

function GetSystemTooltip(msID){
    address = "system/" + msID + "/tooltip/";
    $.ajax({
        type: "GET",
        url: address,
        success: function(data){
               var divName = "#sys" + msID + "Tip";
                if ($(divName).length == 0){
                    div = $('<div></div>').html(data).attr('id','sys' + msID + 'Tip').addClass('systemTooltip').addClass('tip').appendTo('body');
               }else{
                $(divName).html(data);
               }
        },
            error: function(errorThrown) {alert("An error occured loading the tooltip.");}
            });
}


function GetAddPOSDialog(sysID){
    address = "/pos/" + sysID + "/add/";
    $.ajax({
        type: "GET",
        url: address,
        success: function(data){
             $(data).dialog({
                autoOpen: false,
                close: function(event, ui) { 
                $(this).dialog("destroy");
                $(this).remove();
                },
                width: "400px"
            });
            $('#addPOSDialog').dialog('open');
        },
            error: function(errorThrown) {alert("An error occured loading the add POS box.");}
            });

}


function GetSiteSpawns(msID, sigID){
    address = "system/" + msID + "/signatures/" + sigID + /spawns/;
    $.ajax({
        type: "GET",
        url: address,
        success: function(data){
             $(data).dialog({
                autoOpen: false,
                close: function(event, ui) { 
                $(this).dialog("destroy");
                $(this).remove();
                },
                width: "400px"
            });
            $('#siteSpawnsDialog').dialog('open');
        },
            error: function(errorThrown) {alert("An error occured loading the add POS box.");}
            });

}



function AddPOS(sysID){
    //This function adds a system using the information in a form named #sysAddForm
    address = "/pos/" + sysID + "/add/";
    $.ajax({
        type: "POST",
        url: address,
        data: $('#addPOSForm').serialize(),
        success: function(data){
            GetPOSList(sysID);
        },
        error: function(errorThrown){
            alert("An error occured adding the POS, please check your input.");
        }
    });
}


function DeletePOS(posID, sysID){
    address = "/pos/" + sysID + "/" + posID + "/remove/";
    $.ajax({
        type: "POST",
        url: address,
        success: function(){
            GetPOSList(sysID);
        },
        error: function(){
            alert("Corp POSes cannot be deleted from the map.");
        }
    });
}


function GetEditPOSDialog(posID, sysID){
    address= "/pos/" + sysID + "/" + posID + "/edit/";
    $.ajax({
        type: "GET",
        url: address,
        success: function(data){
             $(data).dialog({
                autoOpen: false,
                width: "400px",
                close: function(event, ui) { 
                $(this).dialog("destroy");
                $(this).remove();
                },
            });
             $('#editPOSDialog').dialog('open');
        }
    });
}


function EditPOS(posID, sysID){
    //This function adds a system using the information in a form named #sysAddForm
    address = "/pos/" + sysID + "/" + posID + "/edit/";
    $.ajax({
        type: "POST",
        url: address,
        data: $('#editPOSForm').serialize(),
        success: function(data){
            GetPOSList(sysID);
        },
        error: function(errorThrown){
            alert("An error occured editing the POS, please check your input.");
        }
    });
}


function GetWormholeTooltip(whID){
    address = "wormhole/" + whID + "/tooltip/";
    $.ajax({
        type: "GET",
        url: address,
        success: function(data){
               var divName = "#wh" + whID + "Tip";
                if ($(divName).length == 0){
                    div = $('<div></div>').html(data).attr('id','wh' + whID + 'Tip').addClass('wormholeTooltip').addClass('tip').appendTo('body');
               }else{
                $(divName).html(data);
               }
        },
            error: function(errorThrown) {alert("An error occured loading the wormhole tooltip.");}
            });
}


function RefreshMap(){
    address = "refresh/";
    $.ajax({
        type: "GET",
        url: address,
        success: function(data){
            CloseSystemMenu();
            objSystems = new Array();
            newData = $.parseJSON(data);
            systemsJSON = $.parseJSON(newData[1]);
            loadtime = newData[0];
            StartDrawing();
        },
        error: function(errorThrown){
            alert("An error occured reloading the map.");
        }
    });
}


function EditSignature(msID, sigID){
    address = "system/" + msID + "/signatures/" + sigID + "/edit/";
    $.ajax({
        url: address,
        type: "POST",
        data: $("#sigEditForm").serialize(),
        success: function(data){
            $('#sys' + msID + "SigAddForm").html(data);
            LoadSignatures(msID, false);
        },
        error: function(){
            alert("An error occured editing the signature.");
        }
    });
}


function GetEditSignatureBox(msID, sigID){
    address = "system/" + msID + "/signatures/" + sigID + "/edit";
    $.ajax({
        url: address,
        type: "GET",
        success: function(data){
            $('#sys' + msID + "SigAddForm").html(data);
        },
        error: function(){
            alert("An error occured getting the edit sig form.");
        }
    });
}


function AddSignature(msID){
    address = "system/" + msID + "/signatures/new/";
    $.ajax({
        url: address,
        type: "POST",
        data: $("#sigAddForm").serialize(),
        success: function(data){
            $('#sys' + msID + "SigAddForm").html(data);
            LoadSignatures(msID, false);
        },
        error: function(){
            alert("An error occured adding the signature.");
        }
    });
}


function LoadSignatures(msID, startTimer){
    address = "system/" + msID + "/signatures/";
    $.ajax({
        url: address,
        type: "GET",
        success: function(data){
            $('#sys' + msID + "Signatures").html(data);
            if (startTimer){
                setTimeout(function(){
                    if (document.getElementById("sys" + msID + "Signatures")){
                        LoadSignatures(msID, true);
                    }
                }, 5000);
            }
        },
        error: function(){
            alert("An error occured loading the signature list.");
        }
    });
}


function MarkCleared(sigID, msID){
    address = "system/" + msID + "/signatures/" + sigID + "/clear/";
    $.ajax({
        url: address,
        type: "POST",
        success: function(){
            LoadSignatures(msID, false);
        },
        error: function(){
            alert("The signature action failed.");
        }
    });
}


function MarkEscalated(sigID, msID){
    address = "system/" + msID + "/signatures/" + sigID + "/escalate/";
    $.ajax({
        url: address,
        type: "POST",
        success: function(){
            LoadSignatures(msID, false);
        },
        error: function(){
            alert("The signature action failed.");
        }
    });
}


function MarkActivated(sigID, msID){
    address = "system/" + msID + "/signatures/" + sigID + "/activate/";
    $.ajax({
        url: address,
        type: "POST",
        success: function(){
            LoadSignatures(msID, false);
        },
        error: function(){
            alert("The signature action failed.");
        }
    });
}


function DeleteSignature(sigID, msID){
    address = "system/" + msID + "/signatures/" + sigID + "/remove/";
    $.ajax({
        url: address,
        type: "POST",
        success: function(){
            LoadSignatures(msID, false);
        },
        error: function(){
            alert("The signature action failed.");
        }
    });
}


function GetAddSystemDialog(msID){
    //This funciton gets the dialog for manual system adding with msID being
    //the parent's msID
    address = "system/" + msID + "/addchild/";
    $.ajax({
        url: address,
        type: "GET",
        async: false,
        success: function(data){
            $(data).dialog({
                autoOpen: false,
                close: function(event, ui) { 
                $(this).dialog("destroy");
                $(this).remove();
                }
            });
            $('#addSystemDialog').dialog('open');
        },
        eror: function(){
            alert("Failed to get the add system dialog.");
        }
    });
}


function AddSystem(){
    //This function adds a system using the information in a form named #sysAddForm
    address = "system/new/";
    $.ajax({
        type: "POST",
        url: address,
        data: $('#sysAddForm').serialize(),
        success: function(data){
            setTimeout(function(){RefreshMap();}, 500);
        },
        error: function(errorThrown){
            alert("An error occured adding the system to the map.");
        }
    });
}


function BulkImport(msID){
    address = "system/" + msID + "/signatures/bulkadd/";
    $.ajax({
        type: "POST",
        url: address,
        data: $('#bulkSigForm').serialize(),
        success: function(data){
            LoadSignatures(msID, false);
        },
    });
}


function GetBulkImport(msID){
    address= "system/" + msID + "/signatures/bulkadd/";
    $.ajax({
        type: "GET",
        url: address,
        success: function(data){
            $(data).dialog({
                autoOpen: false,
                close: function(event, ui) { 
                $(this).dialog("destroy");
                $(this).remove();
                }
            });
            $('#bulkSigDialog').dialog('open');
        },
        error: function(){
            alert('There was an error getting the edit wormhole dialog.');
        }
    });
}


function GetEditWormholeDialog(whID){
    address= "wormhole/" + whID + "/edit/";
    $.ajax({
        type: "GET",
        url: address,
        success: function(data){
            $(data).dialog({
                autoOpen: false,
                close: function(event, ui) { 
                $(this).dialog("destroy");
                $(this).remove();
                }
            });
            $('#editWormholeDialog').dialog('open');
        },
        error: function(){
            alert('There was an error getting the edit wormhole dialog.');
        }
    });
}


function EditWormhole(whID){
    address = "wormhole/" + whID + "/edit/";
    $.ajax({
        type: 'POST',
        url: address,
        data: $('#editWormholeForm').serialize(),
        success: function(){
            RefreshMap();
        },
        error: function(){
            alert('There was an error editing the wormhole.');
        }
    });
}


function GetEditSystemDialog(msID){
    address= "system/" + msID + "/edit/";
    $.ajax({
        type: "GET",
        url: address,
        success: function(data){
            $(data).dialog({
                autoOpen: false,
                close: function(event, ui) { 
                $(this).dialog("destroy");
                $(this).remove();
                }
            });
            $('#editSystemDialog').dialog('open');
        },
        error: function(){
            alert('There was an error getting the edit system dialog.');
        }
    });
}


function EditSystem(msID){
    address = "system/" + msID + "/edit/";
    $.ajax({
        type: 'POST',
        url: address,
        data: $('#editSystemForm').serialize(),
        success: function(){
            RefreshMap();
            DisplaySystemDetails(msID);
        },
        error: function(){
            alert('There was an error editing the system.');
        }
    });
}


function DeleteSystem(msID){
    CloseSystemMenu();
    address = "system/" + msID + "/remove/";
    $.ajax({
        type: "POST",
        url: address,
        success: function(){
            setTimeout(function(){RefreshMap();}, 500);
        },
        error: function(){
            alert("An error occured removing the system from the map.");
        }
    });
}


function CloseSystemMenu(){
    $('#sysMenu').remove();
}


function StartDrawing() {
    if ((typeof (systemsJSON) != "undefined") && (systemsJSON != null)) {
        var stellarSystemsLength = systemsJSON.length;
        $('#mapDiv').empty();
        if (stellarSystemsLength > 0) {
            InitializeRaphael();

            var i = 0;
            for (i = 0; i < stellarSystemsLength; i++){
                var stellarSystem = systemsJSON[i];
                DrawSystem(stellarSystem)
            }
        }
    }
}


function ConnectSystems(obj1, obj2, line, bg, interest) {
    var systemTo = obj2;
    if (obj1.line && obj1.from && obj1.to) {
        line = obj1;
        obj1 = line.from;
        obj2 = line.to;
    }
    var bb1 = obj1.getBBox(),
        bb2 = obj2.getBBox(),
        p = [{ x: bb1.x + bb1.width / 2, y: bb1.y - 1 },
        { x: bb1.x + bb1.width / 2, y: bb1.y + bb1.height + 1 },
        { x: bb1.x - 1, y: bb1.y + bb1.height / 2 },
        { x: bb1.x + bb1.width + 1, y: bb1.y + bb1.height / 2 },
        { x: bb2.x + bb2.width / 2, y: bb2.y - 1 },
        { x: bb2.x + bb2.width / 2, y: bb2.y + bb2.height + 1 },
        { x: bb2.x - 1, y: bb2.y + bb2.height / 2 },
        { x: bb2.x + bb2.width + 1, y: bb2.y + bb2.height / 2}],
        d = {}, dis = [];
    for (var i = 0; i < 4; i++) {
        for (var j = 4; j < 8; j++) {
            var dx = Math.abs(p[i].x - p[j].x),
        dy = Math.abs(p[i].y - p[j].y);
            if ((i == j - 4) || (((i != 3 && j != 6) || p[i].x < p[j].x) && ((i != 2 && j != 7) || p[i].x > p[j].x) && ((i != 0 && j != 5) || p[i].y > p[j].y) && ((i != 1 && j != 4) || p[i].y < p[j].y))) {
                dis.push(dx + dy);
                d[dis[dis.length - 1]] = [i, j];
            }
        }
    }
    if (dis.length == 0) {
        var res = [0, 4];
    } else {
        res = d[Math.min.apply(Math, dis)];
    }
    var x1 = p[res[0]].x,
        y1 = p[res[0]].y,
        x4 = p[res[1]].x,
        y4 = p[res[1]].y;
    dx = Math.max(Math.abs(x1 - x4) / 2, 10);
    dy = Math.max(Math.abs(y1 - y4) / 2, 10);
    var x2 = [x1, x1, x1 - dx, x1 + dx][res[0]].toFixed(3),
        y2 = [y1 - dy, y1 + dy, y1, y1][res[0]].toFixed(3),
        x3 = [0, 0, 0, 0, x4, x4, x4 - dx, x4 + dx][res[1]].toFixed(3),
        y3 = [0, 0, 0, 0, y1 + dy, y1 - dy, y4, y4][res[1]].toFixed(3);

    var path = ["M", x1.toFixed(3), y1.toFixed(3), "C", x2, y2, x3, y3, x4.toFixed(3), y4.toFixed(3)].join(",");


    if (line && line.line) {
        line.bg && line.bg.attr({ path: path });
        line.line.attr({ path: path });
    } else {
        var color = typeof line == "string" ? line : "#000";
        if (renderWormholeTags){
            strokeWidth = 1;
            interestWidth = 2;
            var dasharray = "none";
        } else {
            strokeWidth = 2;
            interestWidth = 2;
            if (systemTo.WhFromParentBubbled || systemTo.WhToParentBubbled){
                var dasharray = "none";
                color = "#FF9900";
            } else {
                var dasharray = "none";
            }
        }
        if (interest == true) {
            var dasharray = "--";
            var lineObj = paper.path(path).attr({ stroke: color, fill: "none", "stroke-dasharray": dasharray, "stroke-width": interestWidth });
        } else {
            var lineObj = paper.path(path).attr({ stroke: color, fill: "none", "stroke-dasharray": dasharray, "stroke-width": strokeWidth });
        }
        GetWormholeTooltip(systemTo.whID);
        lineObj.toBack();
        lineObj.mouseover(OnWhOver);
        lineObj.mouseout(OnWhOut);
        lineObj.whID = systemTo.whID;
        lineObj.click(function(){ GetEditWormholeDialog(lineObj.whID);});
    }


};
function InitializeRaphael() {
    var stellarSystemsLength = systemsJSON.length;
    var maxLevelX = 0;
    var maxLevelY = 0;

    var i = 0;
    for (i = 0; i < stellarSystemsLength; i++){
        var stellarSystem = systemsJSON[i];

        if (stellarSystem.LevelX > maxLevelX) {
            maxLevelX = stellarSystem.LevelX;
        }
        if (stellarSystem.LevelY > maxLevelY) {
            maxLevelY = stellarSystem.LevelY;
        }
    }
    var holderHeight = 90 + maxLevelY * indentY;
    var holderWidth = 170 + maxLevelX * (indentX + 20);
    if (paper){
        paper.clear();
        paper.remove();
    }
    paper = Raphael("mapDiv", holderWidth, holderHeight);
    holder = document.getElementById("mapDiv");
    holder.style.height = holderHeight + "px";
    holder.style.width = holderWidth + "px";
}


function GetSystemX(system){
    if (system){
        var startX = 70;

        var sysX = startX + indentX * system.LevelX;
        return sysX;
    }else{
        alert("GetSystemX: System is null or undefined");
    }
}


function GetSystemY(system){
    if (system){
        var startY = 40;
        var sysY = startY + indentY * system.LevelY;
        return sysY;
    }else{
        alert("GetSystemY: System is null or undefined.");
    }
}


function DrawSystem(system) {
    if (system == null) {
        return;
    }

    var sysX = GetSystemX(system);
    var sysY = GetSystemY(system);
    var classString;
    switch (system.SysClass){
        case 7:
            classString = "H";
            break;
        case 8:
            classString = "L";
            break;
        case 9:
            classString = "N";
            break;
        default:
            classString = "C"+system.SysClass;
            break;
    }
    if (system.Friendly){
        var friendly = system.Friendly + "\n";
    }else{
        var friendly = "";
    }
    var sysName = friendly + system.Name;
    sysName += "\n("+classString+"+"+system.activePilots+"P)";
    var sysText;
    if (system.LevelX != null && system.LevelX > 0) {
        var childSys = paper.ellipse(sysX, sysY, 40, 28);
        childSys.msID = system.msID;
        childSys.whID = system.whID;
        childSys.WhFromParentBubbled = system.WhFromParentBubbled;
        childSys.WhToParentBubbled = system.WhToParentBubbled;
        childSys.click(onSysClick);
        sysText = paper.text(sysX, sysY, sysName);
        sysText.msID = system.msID;
        sysText.click(onSysClick);
        ColorSystem(system, childSys, sysText);
        objSystems.push(childSys);
        var parentIndex = GetSystemIndex(system.ParentID);
        var parentSys = systemsJSON[parentIndex];
        var parentSysEllipse = objSystems[parentIndex];

        if (parentSysEllipse) {
            var lineColor = GetConnectionColor(system);
            var whColor = GetWormholeColor(system);
            if (system.interestpath == true || system.interest == true){
                ConnectSystems(parentSysEllipse, childSys, lineColor, "#fff", true);
            }else{
                ConnectSystems(parentSysEllipse, childSys, lineColor, "#fff", false);
            }
                DrawWormholes(parentSys, system, whColor);
        }else{
            alert("Error processing system " + system.Name);
        }
    }else{
        var rootSys = paper.ellipse(sysX, sysY, 40, 30);
        rootSys.msID = system.msID;
        rootSys.click(onSysClick);
        sysText = paper.text(sysX, sysY, sysName);
        sysText.msID = system.msID;
        sysText.click(onSysClick);

        ColorSystem(system, rootSys, sysText);

        objSystems.push(rootSys);
    }
}


function GetConnectionColor(system){
    var goodColor = "#009900";
    var badColor = "#FF3300";
    var warningColor = "#CC00CC";
    if (!system){
        return "#000";
    }
    if (system.LevelX < 1) {
        return "#000";
    }
    var badFlag = false;
    var warningFlag = false;
    if (system.WhMassStatus == 1){
        warningFlag = true;
    }
    if (system.WhMassStatus == 2 || system.WhTimeStatus != 0){
        badFlag = true;
    }
    if (badFlag == true){
        return badColor;
    }
    if (warningFlag == true){
        return warningColor;
    }
    return goodColor;
}

function GetWormholeColor(system) {
    var goodColor = "#009900";
    var badColor = "#FF3300";
    if (!system) {
        return "#000";
    }

    if (system.LevelX < 1) {
        return "#000";
    }
    if (system.WhToParentBubbled == true && system.WhFromParentBubbled == true){
        return badColor;
    }else{
        return goodColor;
    }
}


function ColorSystem(system, ellipseSystem, textSysName) {

    if (!system) {
        alert("system is null or undefined");
        return;
    }

    var selected = false;
    var sysColor = "#f00";
    var sysStroke = "#fff";
    var sysStrokeWidth = 2;
    var textFontSize = 12;
    var sysStrokeDashArray = "none";
    var textColor = "#000";
    GetSystemTooltip(ellipseSystem.msID);
    if (system.sysID == GetSelectedSysID()) {

        // selected
        sysStrokeWidth = 5;
        selected = true;
    }
    if (system.interest == true) {
        sysStrokeWidth = 7;
        sysStrokeDashArray = "--";
    }

    if (system.LevelX < 1) {

        // root
        sysColor = "#A600A6";
        //sysStroke = "#0657B9";
        sysStroke = "#6A006A";
        textColor = "#fff";
        //textFontSize = 14;

    } else {

        // not selected
        switch (system.SysClass) {

            case 9:
                sysColor = "#CC0000";
                sysStroke = "#840000";
                textColor = "#fff";
                break;
            case 8:
                sysColor = "#93841E";
                sysStroke = "#7D5500";
                textColor = "#fff";
                break;
            case 7:
                sysColor = "#009F00";
                sysStroke = "#006600";
                textColor = "#fff";
                break;
             case 6:
                sysColor = "#0022FF";
                sysStroke = "#000000";
                textColor = "#FFF";
                break;
             case 5:
                sysColor = "#0044FF";
                sysStroke = "#000000";
                textColor = "#FFF";
                break; 
            case 4:
                sysColor = "#0066FF";
                sysStroke = "#000000";
                textColor = "#FFF";
                break;
            case 3:
                sysColor = "#0088FF";
                sysStroke = "#000000";
                textColor = "#FFF";
                break;
             case 2:
                sysColor = "#00AAFF";
                sysStroke = "#000000";
                textColor = "#FFF";
                break;
             case 1:
                sysColor = "#00CDFF";
                sysStroke = "#000000";
                textColor = "#FFF"; 
                break;
           default:
                sysColor = "#F2F4FF";
                sysStroke = "#0657B9";
                textColor = "#0974EA";
                break;
        }
    }
    iconX = ellipseSystem.attr("cx")+40;
    iconY = ellipseSystem.attr("cy")-35;
    if (system.imageURL){
        paper.image(system.imageURL, iconX, iconY, 25, 25);
    }
    ellipseSystem.attr({ fill: sysColor, stroke: sysStroke, "stroke-width": sysStrokeWidth, cursor: "pointer", "stroke-dasharray": sysStrokeDashArray });
    textSysName.attr({ fill: textColor, "font-size": textFontSize, cursor: "pointer" });

    if (selected == false) {

        ellipseSystem.sysInfoPnlID = 0;
        textSysName.sysInfoPnlID = 0;

        
        ellipseSystem.hover(OnSysOver, OnSysOut); 
        textSysName.ellipseIndex = objSystems.length;
        textSysName.hover(OnSysOver, OnSysOut);
        
    }
}


function DrawWormholes(systemFrom, systemTo, textColor) {

    var sysY1 = GetSystemY(systemFrom);
    var sysY2 = GetSystemY(systemTo);

    var sysX1 = GetSystemX(systemFrom);
    var sysX2 = GetSystemX(systemTo);

    var changePos = ChangeSysWormholePosition(systemTo, systemFrom);

    var textCenterX = (sysX1 + sysX2) / 2;
    var textCenterY = (sysY1 + sysY2) / 2;

    var whFromSysX = textCenterX;
    var whFromSysY = textCenterY;

    var whToSysX = textCenterX;
    var whToSysY = textCenterY;

    if (sysY1 != sysY2) {

        whFromSysX = textCenterX + 23;
        whToSysX = textCenterX - 23;

    } else {

        whFromSysY = textCenterY - 8;
        whToSysY = textCenterY + 8;
    }

    // draws labels near systemTo ellipse if previous same Level X system's levelY = systemTo.levelY - 1
    if (changePos == true) {

        textCenterX = sysX2 - 73;
        textCenterY = sysY2 - 30;
        if (renderWormholeTags){
            whFromSysX = textCenterX + 23;
            whToSysX = textCenterX - 23;
        }else{
            whFromSysX = textCenterX + 35;
            whToSysX = textCenterX - 10;
        }
        whFromSysY = textCenterY;
        whToSysY = textCenterY;
    } 
    

    var whFromSys = null;
    var whToSys = null;
    var whFromColor = null;
    var whToColor = null;
    var decoration = null;
    if (systemTo.WhFromParentBubbled == true){
        whFromColor = "#FF3300";
        decoration = "bold";
    }else{
        whFromColor = textColor;
    }

    if (systemTo.WhToParentBubbled == true){
        whToColor = "#FF3300";
        decoration = "bold";
    }else{
        whToColor = textColor;
    }
    
    if (systemTo.WhFromParent) {
        if (!renderWormholeTags){
            whFromText = ">";
            whToText = "<";
        }else{
            whFromText = systemTo.WhFromParent + " >";
            whToText = "< " + systemTo.WhToParent;
        }
        whFromSys = paper.text(whFromSysX, whFromSysY, whFromText);
        whFromSys.attr({ fill: whFromColor, cursor: "pointer", "font-size": 11, "font-weight": decoration });  //stroke: "#fff"
        whFromSys.click(function(){GetEditWormholeDialog(systemTo.whID);});
        whFromSys.whID = systemTo.whID;
        whFromSys.mouseover(OnWhOver);
        whFromSys.mouseout(OnWhOut);
    }
    if (systemTo.WhToParent) {
        whToSys = paper.text(whToSysX, whToSysY, whToText);
        whToSys.attr({ fill: whToColor, cursor: "pointer", "font-size": 11, "font-weight": decoration });

        whToSys.whID = systemTo.whID;
        whToSys.click(function(){GetEditWormholeDialog(systemTo.whID);});
        whToSys.mouseover(OnWhOver);
        whToSys.mouseout(OnWhOut);
    }
}


function ChangeSysWormholePosition(system, parent) {

    var change = false;
    var parentY = parent.LevelY;
    var currSysY = system.LevelY;

    if (currSysY > parentY + 1) {
        change = true;
    }

    return change;
}

function GetSystemIndex(systemID) {

    var stellarSystemsLength = systemsJSON.length;

    var i = 0;
    var index = -1;
    for (i = 0; i < stellarSystemsLength; i++) {
        var stellarSystem = systemsJSON[i];

        if (stellarSystem.msID == systemID) {
            index = i;
            return index;
        }
    }

    if (index < 1) {
        alert("could not find system with ID = " + systemID);
    }

}


function getScrollY() {
var scrOfX = 0, scrOfY = 0;
if (typeof (window.pageYOffset) == 'number') {
//Netscape compliant
scrOfY = window.pageYOffset;
scrOfX = window.pageXOffset;
} else if (document.body && (document.body.scrollLeft || document.body.scrollTop)) {
//DOM compliant
scrOfY = document.body.scrollTop;
scrOfX = document.body.scrollLeft;
} else if (document.documentElement && (document.documentElement.scrollLeft || document.documentElement.scrollTop)) {
//IE6 standards compliant mode
scrOfY = document.documentElement.scrollTop;
scrOfX = document.documentElement.scrollLeft;
}
//return [scrOfX, scrOfY];
return scrOfY;
}

function getScrollX() {
var scrOfX = 0, scrOfY = 0;
if (typeof (window.pageYOffset) == 'number') {
//Netscape compliant
scrOfY = window.pageYOffset;
scrOfX = window.pageXOffset;
} else if (document.body && (document.body.scrollLeft || document.body.scrollTop)) {
//DOM compliant
scrOfY = document.body.scrollTop;
scrOfX = document.body.scrollLeft;
} else if (document.documentElement && (document.documentElement.scrollLeft || document.documentElement.scrollTop)) {
//IE6 standards compliant mode
scrOfY = document.documentElement.scrollTop;
scrOfX = document.documentElement.scrollLeft;
}
//return [scrOfX, scrOfY];
return scrOfX;
}

function GetSelectedSysID() {
    return;
}

function onSysClick(e) {
    var x = e.pageX;
    var y = e.pageY;
    DisplaySystemMenu(this.msID, x, y);
    var div = document.getElementById("sys"+this.msID+"Tip");
    div.style.display = 'none';
}

function OnWhOver(e) {
    var divName = "wh" + this.whID + "Tip";
    var div = document.getElementById(divName);

    if (div){
    
        var mouseX = e.clientX + getScrollX();
        var mouseY = e.clientY + getScrollY();

        div.style.position = "absolute";
        div.style.top = mouseY + "px";
        div.style.left = mouseX + 10 + "px";
        div.style.display = 'block';
    }
}

function OnWhOut() {
    var divName = "wh" + this.whID + "Tip";
    var div = document.getElementById(divName);

    if (div) {
        div.style.display = 'none';
    }
}

function OnSysOver(e) {
    var divName = "sys" + this.msID + "Tip";
    var div = document.getElementById(divName);
    if (div){
    
        var mouseX = e.clientX + getScrollX();
        var mouseY = e.clientY + getScrollY();

        div.style.position = "absolute";
        div.style.top = mouseY + "px";
        div.style.left = mouseX + 10 + "px";
        div.style.display = 'block';
    }
}

function OnSysOut() {
    var divName = "sys" + this.msID + "Tip";
    var div = document.getElementById(divName);
    if (div){
        div.style.display = 'none';
    }
}
