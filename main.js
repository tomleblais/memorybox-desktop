const electron = require("electron");
const db = require("electron-db");
const {app, BrowserWindow, Menu, MenuItem, ipcMain} = electron;

let mainWindow;
let popups = new Array(); // Tableau contenant les popups
let contextmenu = new Array();

// Affichage de la fenêtre principale
app.on("ready", function() {
    mainWindow = new BrowserWindow({
        icon: "img/logo.png",
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainWindow.loadFile("index.html")
    mainWindow.on("closed", function() {
        mainWindow = null;
    });
    // Clique droit :
    ipcMain.on("contextmenu.card", function(e, data) {
        contextmenu["card"] = new Menu();
        contextmenu["card"].append(new MenuItem({
            label: "Éditer",
            click() {
                mainWindow.webContents.send("contextmenu.card.edit", data);
            }
        }));
        contextmenu["card"].append(new MenuItem({
            label: "Supprimer",
            click() {
                mainWindow.webContents.send("contextmenu.card.delete", data);
            }
        }));
        contextmenu["card"].popup(mainWindow, data.y, data.x);
    });
    ipcMain.on("contextmenu.cardbox", function(e, data) {
        contextmenu["cardbox"] = new Menu();
        contextmenu["cardbox"].append(new MenuItem({
            label: "Éditer",
            enabled: false
        }));
        contextmenu["cardbox"].append(new MenuItem({
            label: "Retirer de la box",
            click() {
                mainWindow.webContents.send("contextmenu.cardbox.delete", data);
            }
        }));
        contextmenu["cardbox"].popup(mainWindow, data.y, data.x);
    });
    //// POPUPS :
    // Popup pour ajouter une carte :
    popups["card.add"] = new BrowserWindow({
        width: 500,
        height: 400,
        show: false,
        parent: mainWindow,
        modal: true,
        frame: false,
        resizable: false,
        center: true,
        closable: false,
        webPreferences: {
            nodeIntegration: true
        }
    });
    // Popup pour modifier une carte :
    popups["card.edit"] = new BrowserWindow({
        width: 500,
        height: 400,
        show: false,
        parent: mainWindow,
        modal: true,
        frame: false,
        resizable: false,
        center: true,
        closable: false,
        webPreferences: {
            nodeIntegration: true
        }
    });
    // Popup de confirmation pour supprimer des cartes :
    popups["confirm.delete.cards"] = new BrowserWindow({
        width: 500,
        height: 200,
        show: false,
        parent: mainWindow,
        modal: true,
        frame: false,
        resizable: false,
        center: true,
        closable: false,
        webPreferences: {
            nodeIntegration: true
        }
    });
    // Popup de confirmation pour supprimer une box :
    popups["confirm.delete.box"] = new BrowserWindow({
        width: 500,
        height: 200,
        show: false,
        parent: mainWindow,
        modal: true,
        frame: false,
        resizable: false,
        center: true,
        closable: false,
        webPreferences: {
            nodeIntegration: true
        }
    });
    // Popup de confirmation pour retirer une carte d'une box :
    popups["confirm.box.remove.card"] = new BrowserWindow({
        width: 500,
        height: 200,
        show: false,
        parent: mainWindow,
        modal: true,
        frame: false,
        resizable: false,
        center: true,
        closable: false,
        webPreferences: {
            nodeIntegration: true
        }
    });
    // Popup pour ajouter une carte :
    popups["box.select"] = new BrowserWindow({
        width: 400,
        height: 350,
        show: false,
        parent: mainWindow,
        modal: true,
        frame: false,
        resizable: false,
        center: true,
        closable: false,
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainWindow.setMenu(null)
});
ipcMain.on("popup.open", function(e, data) {
    let popup = popups[data];
    popup.loadFile("popups/"+data+".html");
    popup.show();
});
ipcMain.on("popup.close", function(e, data) {
    let popup = popups[data[0]];
    mainWindow.webContents.send("popup.canceled", data[1]);
    popup.hide()
});
// Rendre publiques les données privées :
ipcMain.on("send-data", function(e, data) {
    mainWindow.webContents.send("data-reception", data);
});
// 
ipcMain.on("window.minimize", function(e, data) {
    mainWindow.minimize();
});
ipcMain.on("window.close", function(e, data) {
    mainWindow.close();
    mainWindow = null;
});
// Création des tables de données :
if (!db.tableExists("flashcards")) {
    db.createTable("flashcards", function(succ, msg) {
        if (!succ) {
            console.log(msg);
        }
    });
}
if (!db.tableExists("boxes")) {
    db.createTable("boxes", function(succ, msg) {
        if (!succ) {
            console.log(msg);
        }
    });
}