const electron = require("electron");
const db = require("electron-db");

class Card {
    constructor(row) {
        this.id = parseInt(row.id);     // Contient l'identificateur de la carte
        this.front = row.front;         // Contient le contenu de la face avant
        this.back = row.back;           // Contient le contenu de la face arrière
        this.table = "flashcards";      // Contient le nom de la table
        this.outerHTML = this.refreshHTML();
    }
    edit(form={}) { // Change le contenu d'un carte
        // Mise à jour des données de la carte dans la table :
        db.updateRow(this.table, {id: this.id}, {
            front: form.front,
            back: form.back
        }, function(succ, msg) {
            if (!succ) {
                console.log(msg);
            }
        });
        // Mise à jour des données de la carte dans la classe :
        this.front = form.front;
        this.back = form.back;
        this.outerHTML = this.refreshHTML();
    }
    refreshHTML() {
        var card = document.createElement("span");
            card.style = "margin: 5px";
            card.classList.add("card");
        // Face Avant de la carte :
        var front = document.createElement("span");
            front.classList.add("front");
            front.innerText = this.front;
        // Face Arrière de la carte :
        var back = document.createElement("span");
            back.classList.add("back");
            back.innerText = this.back;
        var input = document.createElement("input");
            input.type = "checkbox";
            input.value = this.id;
            input.classList.add("card-selector");
        card.appendChild(front);
        card.appendChild(back);
        card.appendChild(input);
        return card.outerHTML;
    }
}
class Collection {
    constructor(table) {
        this.ids = new Array();             // COntient l'identificateur de chaque carte
        this.cards = new Array();           // Contient la totalité des cartes
        this.table = "flashcards";          // Contient le nom de la table
        for (let i = 0; i < table.length; i++) {
            const row = table[i];
            this.ids.push(row.id);
            this.cards.push(new Card(row));
        }
    }
    add(form={}) { // Ajoute une carte
        // Ajoute une carte dans la table :
        db.insertTableContent(this.table, { 
            front: form.front,
            back: form.back
        }, function(succ, msg) {
            if (!succ) {
                console.log(msg);
            }
        });
        // Ajouter une carte dans la classe :
        this.ids.push(this.getLastCard().id);
        this.cards.push(new Card(this.getLastCard()));
        return this.cards;
    }
    delete(ids=[]) { // Supprime des cartes 
        for (let i = 0; i < ids.length; i++) {
            const id = parseInt(ids[i]);
            // Suppression des cartes dans la table :
            db.deleteRow(this.table, {id: id}, function(succ, msg) {
                if (!succ) {
                    console.log(msg);
                }
            });
            // Suppression des cartes dans la classe :
            var index = this.ids.indexOf(id);
            if (index > -1) {
                this.ids.splice(index, 1);
                this.cards.splice(index, 1);
            }
        }
        return this.cards;
    }
    getLastCard() { // Obtient la dernière carte dans la table de données
        let row;
        db.getAll(this.table, function(succ, data) {
            if (succ) {
                row = data[data.length-1];
            } else {
                row = false;
            }
        });
        return row;
    }
    edit(data={}) {
        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];
            if (card.id == data.id) {
                card.edit(data);
            }
        }
    }
}
class Box {
    constructor(collection, row={}) {
        this.id = row.id;
        this.name = row.name;
        this.ids = new Array();
        this.cards = new Array();
        this.table = "boxes";
        this.collection = collection;
        for (let i = 0; i < this.collection.cards.length; i++) {
            const card = this.collection.cards[i];
            var index = row.cards.indexOf(card.id);
            if (index > -1) {
                this.ids.push(card.id);
            }
            for (let j = 0; j < this.ids.length; j++) {
                const id = this.ids[j];
                if (card.id == id) {
                    this.cards.push(card);
                }
            }
        }
    }
    add(ids=[]) { // Ajoute des cartes dans la box :
        for (let i = 0; i < this.collection.cards.length; i++) {
            const card = this.collection.cards[i];
            for (let j = 0; j < ids.length; j++) {
                const id = ids[j];
                if (card.id == id) {
                    var index = this.ids.indexOf(id);
                    if (index == -1) {
                        // Ajoute des cartes à la classe :
                        this.cards.push(card);
                        this.ids.push(id);
                        // Ajoute des cartes à la table :
                        db.updateRow(this.table, {id: this.id}, {cards: this.ids}, function(succ, msg) {
                            if (!succ) {
                                console.log(msg);
                            }
                        });
                    }
                }
            }
        }
    }
    remove(ids=[]) { // Retire des cartes de la box
        for (let i = 0; i < this.collection.cards.length; i++) {
            const card = collection.cards[i];
            for (let j = 0; j < ids.length; j++) {
                const id = ids[j];
                if (card.id == id) {
                    // Ajoute des cartes à la classe :
                    var index = this.ids.indexOf(id);
                    if (index > -1) {
                        this.ids.splice(index, 1);
                        this.cards.splice(index, 1);
                    }
                    // Ajoute des cartes à la table :
                    db.updateRow(this.table, {id: this.id}, {cards: this.ids}, function(succ, msg) {
                        if (!succ) {
                            console.log(msg);
                        }
                    });
                }
            }
        }
    }
}
class Drawer {
    constructor(collection, table) {        
        this.ids = new Array();
        this.boxes = new Array();
        this.table = "boxes";
        for (let i = 0; i < table.length; i++) {
            const row = table[i];
            this.ids.push(row.id);
            this.boxes.push(new Box(collection, row));
        }
    }
    add(form={}) { // Ajoute une box
        // Ajoute une box à la table :
        db.insertTableContent(this.table, {
            name: form.name,
            cards: form.cards
        }, function(succ, msg) {
            if (!succ) {
                console.log(msg);
            }
        });
        // Ajoute une box à la classe :
        this.ids.push(this.getLastBox().id);
        this.boxes.push(new Box(collection, this.getLastBox()));
    }
    delete(ids=[]) { // Supprime une box
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            // Supprime une box à la table :
            db.deleteRow(this.table, {id: id}, function(succ, msg) {
                if (!succ) {
                    console.log(msg);
                }
            });
            // Supprime une box à la classe :
            var index = this.ids.indexOf(id);
            if (index > -1) {
                this.ids.splice(index, 1);
                this.boxes.splice(index, 1);
            }
        }
    }
    getLastBox() { // Obtient la dernière entrée
        let row;
        db.getAll(this.table, function(succ, data) {
            if (succ) {
                row = data[data.length-1];
            } else {
                row = false;
            }
        });
        return row;
    }
}
function insertAfter(newElement, referenceElement) {
    referenceElement.parentElement.insertBefore(newElement, referenceElement.nextSibling);
}
function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
}