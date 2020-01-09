const {ipcRenderer} = electron;

const header = document.querySelector("header");
const section = document.querySelector("section");
const footer = document.querySelector("footer");

let collection;
let drawer;
db.getAll("flashcards", function(succ, table) {
    if (succ) {
        collection = new Collection(table);
    } else {
        console.log(table);
    }
});
db.getAll("boxes", function(succ, table) {
    if (succ) {
        drawer = new Drawer(collection, table);                
    } else {
        console.log(table);
    }
});

let collectionContener = section.querySelector("div.collection-contener");
let drawerContener = section.querySelector("div.drawer-contener");

let cards = new Array();
let selectedCards;
let targetedBox = new Array();
function refreshHTML() { // Afficher toutes les cartes  
    // Affichage de la collection de cartes :
    collectionContener.querySelector("div.cards-contener").innerHTML = "";
    if (collection.cards.length) {
        for (let i = 0; i < collection.cards.length; i++) {
            const card = collection.cards[i];
            collectionContener.querySelector("div.cards-contener").innerHTML += card.outerHTML;
        }
    } else {
        collectionContener.querySelector("div.cards-contener").innerHTML = "Il n'y a aucune carte dans votre collection.&nbsp;<a class='add-card-link'>En ajouter une ?</a>";
    }
    cards = collectionContener.querySelectorAll(".card");
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        card.addEventListener("contextmenu", function(e) {
            ipcRenderer.send("contextmenu.card", {
                x: e.pageX,
                y: e.pageY,
                id: parseInt(this.querySelector("input.card-selector").value)
            });
        });
        card.addEventListener("click", function(e) {
            e.stopPropagation();
            if (!e.toElement.classList.contains("card-selector")) {
                this.classList.toggle("is-flipped"); 
            }
        });
    }
    let inputs = collectionContener.querySelectorAll("input.card-selector");
    selectedCards = new Array();
    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        input.addEventListener("input", function(e) {
            if (input.checked) {
                selectedCards.push(parseInt(input.value));
            } else {
                let index = selectedCards.indexOf(parseInt(input.value));
                if (index > -1) {
                    selectedCards.splice(index);
                }
            }
        })
    }
    // Affichage des box :
    drawerContener.innerHTML = "";
    for (let i = 0; i < drawer.boxes.length; i++) {
        const box = drawer.boxes[i];
        let article = document.createElement("article");
            article.classList.add("box-contener");
        let playButton = document.createElement("span");
            playButton.classList.add("play-button");
            playButton.classList.add("icon");
            playButton.innerHTML = "&#xe8b9;";
            playButton.title = "Jouer cette box";
            playButton.addEventListener("click", function(e) {
                if (box.cards.length) {
                    playarea.querySelector("div.settings").classList.remove("disabled");
                    document.querySelector("div.playarea").classList.add("showed");
                    selectedBox = box.id;
                }
            });
            let articleTitle = document.createElement("h4");
            articleTitle.classList.add("box-title");
            let boxTools = document.createElement("div");
                boxTools.classList.add("box-tools");
                let span = document.createElement("span");
                    span.classList.add("icon");
                    span.classList.add("roller");
                    span.innerHTML = "&#xe8a9;";
                    span.title = "Dérouler cette box";
                let deleteBoxButton = document.createElement("button");
                    deleteBoxButton.classList.add("delete-box-button");
                    deleteBoxButton.classList.add("not-button");
                    deleteBoxButton.title = "Supprimer cette box";
                    deleteBoxButton.addEventListener("click", function(e) {
                        targetedBox.push(box.id);
                        ipcRenderer.send("popup.open", "confirm.delete.box");
                    });
                    let icon = document.createElement("span");
                        icon.classList.add("icon");
                        icon.innerHTML = "&#xe88d;";
                        deleteBoxButton.appendChild(icon);
        let cardsContener = document.createElement("div");
            cardsContener.classList.add("cards-contener");
        boxTools.appendChild(span);
        boxTools.appendChild(deleteBoxButton);
        article.appendChild(playButton);
        articleTitle.innerText += box.name+" ("+box.cards.length+")";
        article.appendChild(articleTitle);
        article.appendChild(boxTools);
        article.appendChild(cardsContener);
        drawerContener.appendChild(article);
        // Affichage des cartes des box
        if (box.cards.length) {
            for (let j = 0; j < box.cards.length; j++) {
                const card = box.cards[j];
                cardsContener.innerHTML += card.outerHTML;
            }
        } else {
            cardsContener.innerHTML = "Il n'y a aucune carte dans cette box.";
        }
        let cardsBox = article.querySelectorAll(".card");
        for (let i = 0; i < cardsBox.length; i++) {
            const card = cardsBox[i];
            card.addEventListener("contextmenu", function(e) {
                let data = {
                    x: e.pageX,
                    y: e.pageY,
                    id: parseInt(this.querySelector("input.card-selector").value),
                    idBox: box.id
                };
                ipcRenderer.send("contextmenu.cardbox", data);
            });
            card.addEventListener("click", function(e) {
                e.stopPropagation();
                this.classList.toggle("is-flipped");
            });
        }
    }
    let article = document.createElement("article");
        article.classList.add("box-contener");
    let articleTitle = document.createElement("h4");
        articleTitle.classList.add("box-title");
        let plusButton = document.createElement("span");
            plusButton.classList.add("plus-button");
            plusButton.classList.add("icon");
            plusButton.innerHTML = "&#xe86e;";
        let input = document.createElement("input");
            input.type = "text";
            input.placeholder = "Nouvelle box";
        let submit = document.createElement("input");
            submit.type = "submit";
            submit.value = "Créer";
            submit.classList.add("add-box-button");
            submit.addEventListener("click", function(e) {
                let input = this.previousSibling;
                if (input.value != false) {
                    ipcRenderer.send("send-data", {
                        action: "box.add",
                        name: input.value
                    }); 
                }
            });
    article.appendChild(articleTitle);
    article.appendChild(plusButton);
    articleTitle.appendChild(input);
    articleTitle.appendChild(submit);
    drawerContener.appendChild(article);
    let boxContener = drawerContener.querySelectorAll("article.box-contener");
    for (let i = 0; i < boxContener.length-1; i++) {
        let contener = boxContener[i];
        contener.querySelector("h4").addEventListener("click", function(e) {
            e.stopPropagation();
            contener.querySelector(".cards-contener").classList.toggle("unrolled");
            if (contener.querySelector(".cards-contener").classList.contains("unrolled")) {
                contener.querySelector("span.roller").innerHTML = "&#xe8a8;";
            } else {
                contener.querySelector("span.roller").innerHTML = "&#xe8a9;";
            }
        });
    }
    if (section.querySelector("a.add-card-link")) {
        section.querySelector("a.add-card-link").addEventListener("click", function(e) {
            ipcRenderer.send("popup.open", "card.add");
        });
    }
}
refreshHTML();
function toggleSelectCards(mode) { // Rend les cartes sélectionnables
    if (collection.cards.length) {
        var cardsCollection = collectionContener.querySelectorAll(".card");                
        for (let i = 0; i < cardsCollection.length; i++) {
            const card = cardsCollection[i];
            card.classList.toggle("selectable");
            card.querySelector("input").checked = false;
        }
    }
}

let collectionTools = collectionContener.querySelector(".collection-tools");
// Ajouter une carte
section.querySelector(".add-card-button").addEventListener("click", function(e) {
    ipcRenderer.send("popup.open", "card.add");
});
// Supprime des cartes :
let deleteForm = collectionContener.querySelector("div.delete-cards-form");
section.querySelector(".delete-cards-button").addEventListener("click", function(e) {
    if (collection.cards.length) {
        toggleSelectCards();
        for (let i = 0; i < collectionTools.children.length; i++) {
            const button = collectionTools.children[i];
            button.disabled = true;
        }
        deleteForm.classList.remove("disabled");
    }
});
deleteForm.querySelector("button.cancel-button").addEventListener("click", function(e) {
    toggleSelectCards();
    deleteForm.classList.add("disabled");
        for (let i = 0; i < collectionTools.children.length; i++) {
            const button = collectionTools.children[i];
            button.disabled = false;
        }
});
deleteForm.querySelector("button.submit-button").addEventListener("click", function(e) {
    if (selectedCards.length) {
        ipcRenderer.send("popup.open", "confirm.delete.cards");
    }
})
// Ajoute des cartes à une box :
let addForm = collectionContener.querySelector("div.addcards-box-form");
section.querySelector(".addcards-box-button").addEventListener("click", function(e) {
    if (collection.cards.length) {
        toggleSelectCards();
        for (let i = 0; i < collectionTools.children.length; i++) {
            const button = collectionTools.children[i];
            button.disabled = true;
        }
        addForm.classList.remove("disabled");
    }
});
addForm.querySelector("button.cancel-button").addEventListener("click", function(e) {
    toggleSelectCards();
        for (let i = 0; i < collectionTools.children.length; i++) {
            const button = collectionTools.children[i];
            button.disabled = false;
        }
    addForm.classList.add("disabled");
});
addForm.querySelector("button.submit-button").addEventListener("click", function(e) {
    if (selectedCards.length) {
        ipcRenderer.send("popup.open", "box.select");
    }
});
// Joue une carte :
let playarea = document.querySelector("div.playarea");
let cardsPlay = new Array();
let order;
let firstFace;
let retry;
playarea.querySelector("button.cancel-button").addEventListener("click", function(e) {
    carpet.innerHTML = "";
    selectedBox = null;
    playarea.querySelector("div.settings").classList.remove("disabled");
    playarea.classList.remove("showed");
});
playarea.querySelector("button.submit-button").addEventListener("click", function(e) {
    for (let i = 0; i < drawer.boxes.length; i++) {
        const box = drawer.boxes[i];
        if (box.id == selectedBox) {
            for (let j = 0; j < box.cards.length; j++) {
                const card = box.cards[j];
                cardsPlay.push(card);
            }
        }
    }
    for (let i = 0; i < document.getElementsByName("order").length; i++) {
        const input = document.getElementsByName("order")[i];
        if (input.checked) {
            order = input.value;
        }
    }
    switch (order) {
        case "reverse":
            cardsPlay.reverse();
            break;
        case "random":
            shuffle(cardsPlay);
            break;
        default:
            break;
    }
    cardsPlay.unshift(null);
    for (let i = 0; i < document.getElementsByName("firstface").length; i++) {
        const input = document.getElementsByName("firstface")[i];
        if (input.checked) {
            firstFace = input.value;
        }
    }
    retry = document.getElementById("retry").checked;
    playarea.querySelector("div.settings").classList.add("disabled");
    play();
});
let carpet = document.querySelector(".carpet");
function play() {
    cardsPlay.shift();
    if (cardsPlay != false) {
        carpet.innerHTML = cardsPlay[0].outerHTML;
        card = carpet.querySelector(".card");
        let retry2 = false;
        let retryContener = document.createElement("div");
            retryContener.classList.add("retry-contener");
        let labelRight = document.createElement("label");
            labelRight.for = "right";
            let right = document.createElement("input");
                right.type = "radio";
                right.id = "right"
                right.classList.add("right");
                right.name = "retry";
                right.disabled = true;
                right.checked = false;
                right.oninput = function(e) {
                    next.disabled = false;
                    if (this.checked) {
                        retry2 = false;
                    }
                }
                labelRight.appendChild(right);
                labelRight.appendChild(document.createTextNode("J'ai eu la bonne réponse"));
            retryContener.appendChild(labelRight);
        let labelWrong = document.createElement("label");
            labelWrong.for = "wrong";
            retryContener.appendChild(labelWrong);
            let wrong = document.createElement("input");
                wrong.type = "radio";
                wrong.id = "wrong"
                wrong.classList.add("wrong");
                wrong.name = "retry";
                wrong.disabled = true;
                wrong.checked = false;
                wrong.oninput = function(e) {
                    next.disabled = false;
                    if (this.checked) {
                        retry2 = true;
                    }
                }
                labelWrong.appendChild(wrong);
                labelWrong.appendChild(document.createTextNode("Je n'ai pas eu la bonne réponse"));
            retryContener.appendChild(labelWrong);
        let next = document.createElement("button");
            next.innerText = "Retourner";
            carpet.appendChild(next);
            next.onclick = function(e) {
                right.disabled = false;
                wrong.disabled = false;
                if (retry) {
                    this.disabled = true;
                }
                card.classList.toggle("is-flipped");
                this.onclick = function(e) {    
                    if (retry2) {
                        cardsPlay.push(cardsPlay[0]);
                    }
                    play();                        
                };
                this.innerHTML = "Suivant";
            };
        if (retry) {
            carpet.appendChild(retryContener);
        }
        if (firstFace === "blue") {
            card.classList.add("is-flipped");
        } else if (firstFace === "both") {
            if (!Math.floor(Math.random())) {
                card.classList.add("is-flipped");
            }
        }
    } else {
        carpet.innerHTML = "";
        selectedBox = null;
        playarea.querySelector("div.settings").classList.remove("disabled");
        playarea.classList.remove("showed");
    }
}
// Quand on reçoit des données :
ipcRenderer.on("data-reception", function(e, data) {
    switch (data.action) {
        case "card.add":
            collection.add(data);
            break;
        case "card.edit":
            if (selectedCards.length) {
                collection.edit({
                    id: selectedCards[0],
                    front: data.front,
                    back: data.back
                });
            }
            break;
        case "confirm.delete.cards":
            if (data.confirmed) {
                for (let i = 0; i < drawer.boxes.length; i++) {
                    const box = drawer.boxes[i];
                    box.remove(selectedCards);
                }
                collection.delete(selectedCards);
            }
            toggleSelectCards();
            deleteForm.classList.add("disabled");
            break;
        case "box.select":
            for (let i = 0; i < drawer.boxes.length; i++) {
                const box = drawer.boxes[i];
                if (box.id == data.idBox) {
                    box.add(selectedCards);
                }
            }
            toggleSelectCards();
            addForm.classList.add("disabled");
            break;
        case "box.add":
            drawer.add({
                name: data.name,
                cards: selectedCards
            });
            toggleSelectCards();
            addForm.classList.add("disabled");
            break;
        case "confirm.delete.box":
            if (data.confirmed) {
                drawer.delete(targetedBox);
            }
            break;
        case "confirm.box.remove.card":
            if (data.confirmed) {
                if (targetedBox != false && selectedCards.length) {
                    for (let i = 0; i < drawer.boxes.length; i++) {
                        const box = drawer.boxes[i];
                        if (box.id == targetedBox[0]) {
                            box.remove(selectedCards);
                        }
                    }
                }
            }
            break;
    }
    refreshHTML();
    for (let i = 0; i < collectionTools.children.length; i++) {
        const button = collectionTools.children[i];
        button.disabled = false;
    }
});
// Quand une popup s'est fermée :
ipcRenderer.on("popup.canceled", function(e, data) {
    // Si la popup a été annulée :
    if (data[1]) {
        for (let i = 0; i < collectionTools.children.length; i++) {
            const button = collectionTools.children[i];
            button.disabled = false;
        }
    }
})
// Quand on reçoit des données venant des cliques droits :
ipcRenderer.on("contextmenu.card.delete", function(e, data) {
    selectedCards.push(data.id);
    ipcRenderer.send("popup.open", "confirm.delete.cards");
})
ipcRenderer.on("contextmenu.card.edit", function(e, data) {
    selectedCards.push(data.id);
    ipcRenderer.send("popup.open", "card.edit");
});
ipcRenderer.on("contextmenu.cardbox.delete", function(e, data) {
    selectedCards.push(data.id);
    targetedBox.push(data.idBox);
    ipcRenderer.send("popup.open", "confirm.box.remove.card");
})