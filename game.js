// Pusher setup (replace with your credentials)
const pusher = new Pusher('54bd73077135a1b7a703', {
    cluster: 'us2',
    encrypted: true
});

// Game state
let playerDeck = shuffle([...generateDeck()]);
let playerHand = Array(4).fill(null);
let playerDiscard = [];
let opponentDeck = shuffle([...generateDeck()]);
let opponentHand = Array(4).fill(null);
let opponentDiscard = [];
let playerHealth = 30;
let opponentHealth = 30;
let playerMana = 3;
let opponentMana = 3;
let isPlayerTurn = false;
let playedCard = null;
let opponentPlayedCard = null;
let roomCode = null;
let channel = null;

// Generate deck (simple rock-paper-scissors example)
function generateDeck() {
    const types = ['rock', 'paper', 'scissors'];
    const abilities = [null, 'heal', 'debuff', 'shield'];
    let deck = [];
    for (let i = 0; i < 30; i++) {
        deck.push({
            type: types[Math.floor(Math.random() * 3)],
            damage: Math.floor(Math.random() * 5) + 1,
            cost: Math.floor(Math.random() * 3) + 1,
            ability: abilities[Math.floor(Math.random() * 4)]
        });
    }
    return deck;
}

// Shuffle array
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Draw card
function drawCard(deck, discard) {
    if (deck.length === 0) {
        deck.push(...shuffle(discard));
        discard.length = 0;
    }
    return deck.length > 0 ? deck.pop() : null;
}

// Initial hands
for (let i = 0; i < 4; i++) {
    playerHand[i] = drawCard(playerDeck, playerDiscard);
    opponentHand[i] = drawCard(opponentDeck, opponentDiscard);
}

// Display player hand
function displayHand() {
    const handDiv = document.getElementById('hand');
    handDiv.innerHTML = '';
    playerHand.forEach((card, index) => {
        if (card) {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card');
            cardDiv.dataset.index = index;
            cardDiv.draggable = isPlayerTurn;
            cardDiv.style.backgroundImage = `url('images/${card.type}.png')`;
            cardDiv.innerHTML = `
                <div class="damage">${card.damage}</div>
                <div class="mana-cost">${card.cost}</div>
                ${card.ability ? `<div class="ability">${card.ability.charAt(0).toUpperCase() + card.ability.slice(1)}</div>` : ''}
            `;
            cardDiv.addEventListener('dragstart', (e) => {
                if (isPlayerTurn) e.dataTransfer.setData('text/plain', index);
            });
            handDiv.appendChild(cardDiv);
        } else {
            const emptySlot = document.createElement('div');
            emptySlot.classList.add('empty-slot');
            handDiv.appendChild(emptySlot);
        }
    });
    document.getElementById('deck-count').textContent = playerDeck.length;
    document.getElementById('player-health').textContent = `Your Health: ${playerHealth} | Mana: ${playerMana}`;
}

// Display opponent hand
function displayOpponentHand() {
    const opponentHandDiv = document.getElementById('opponent-hand');
    opponentHandDiv.innerHTML = '';
    opponentHand.forEach(card => {
        if (card) {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card');
            cardDiv.style.backgroundImage = `url('images/${card.type}.png')`;
            cardDiv.innerHTML = `
                <div class="damage">${card.damage}</div>
                <div class="mana-cost">${card.cost}</div>
                ${card.ability ? `<div class="ability">${card.ability.charAt(0).toUpperCase() + card.ability.slice(1)}</div>` : ''}
            `;
            opponentHandDiv.appendChild(cardDiv);
        }
    });
    document.getElementById('opponent-health').textContent = `Opponent Health: ${opponentHealth} | Mana: ${opponentMana}`;
}

// Display played cards
function displayPlayedCards() {
    const playerCardDiv = document.getElementById('player-card');
    playerCardDiv.innerHTML = playedCard ? `
        <div class="card" style="background-image: url('images/${playedCard.type}.png');">
            <div class="damage">${playedCard.damage}</div>
            <div class="mana-cost">${playedCard.cost}</div>
            ${playedCard.ability ? `<div class="ability">${playedCard.ability.charAt(0).toUpperCase() + playedCard.ability.slice(1)}</div>` : ''}
        </div>
    ` : '';
    const opponentCardDiv = document.getElementById('opponent-card');
    opponentCardDiv.innerHTML = opponentPlayedCard ? `
        <div class="card" style="background-image: url('images/${opponentPlayedCard.type}.png');">
            <div class="damage">${opponentPlayedCard.damage}</div>
            <div class="mana-cost">${opponentPlayedCard.cost}</div>
            ${opponentPlayedCard.ability ? `<div class="ability">${opponentPlayedCard.ability.charAt(0).toUpperCase() + opponentPlayedCard.ability.slice(1)}</div>` : ''}
        </div>
    ` : '';
}

// Resolve battle
function resolveBattle() {
    if (!playedCard || !opponentPlayedCard) return;
    let playerDamage = playedCard.damage;
    let opponentDamage = opponentPlayedCard.damage;

    if (playedCard.type === 'rock' && opponentPlayedCard.type === 'scissors' ||
        playedCard.type === 'scissors' && opponentPlayedCard.type === 'paper' ||
        playedCard.type === 'paper' && opponentPlayedCard.type === 'rock') {
        opponentHealth -= playerDamage;
    } else if (opponentPlayedCard.type === 'rock' && playedCard.type === 'scissors' ||
               opponentPlayedCard.type === 'scissors' && playedCard.type === 'paper' ||
               opponentPlayedCard.type === 'paper' && playedCard.type === 'rock') {
        playerHealth -= opponentDamage;
    }

    if (playedCard.ability === 'heal') playerHealth = Math.min(playerHealth + 3, 30);
    if (playedCard.ability === 'debuff') opponentDamage = Math.max(0, opponentDamage - 2);
    if (playedCard.ability === 'shield') playerHealth += 3;
    if (opponentPlayedCard.ability === 'heal') opponentHealth = Math.min(opponentHealth + 3, 30);
    if (opponentPlayedCard.ability === 'debuff') playerDamage = Math.max(0, playerDamage - 2);
    if (opponentPlayedCard.ability === 'shield') opponentHealth += 3;

    playerHealth = Math.max(0, playerHealth);
    opponentHealth = Math.max(0, opponentHealth);
    displayHand();
    displayOpponentHand();
    displayPlayedCards();

    const resultDiv = document.getElementById('result');
    if (playerHealth <= 0) resultDiv.textContent = 'You Lose!';
    else if (opponentHealth <= 0) resultDiv.textContent = 'You Win!';
    else document.getElementById('next-round').disabled = false;
}

// Start turn
function startTurn() {
    document.getElementById('end-turn').disabled = !isPlayerTurn;
    document.getElementById('ability-desc').textContent = isPlayerTurn ? 'Your turn: Play or burn a card.' : 'Waiting for opponent...';
    displayHand();
    displayOpponentHand();
    displayPlayedCards();
}

// Room creation
document.getElementById('create-room').addEventListener('click', () => {
    roomCode = 'presence-' + Math.random().toString(36).substr(2, 9);
    channel = pusher.subscribe(roomCode);
    channel.bind('pusher:subscription_succeeded', () => {
        document.getElementById('room-status').textContent = `Room created! Code: ${roomCode}`;
        isPlayerTurn = true;
        startTurn();
    });
    setupPusherEvents();
});

// Join room
document.getElementById('join-room').addEventListener('click', () => {
    roomCode = document.getElementById('room-code-input').value;
    if (!roomCode) {
        alert('Enter a room code!');
        return;
    }
    channel = pusher.subscribe(roomCode);
    channel.bind('pusher:subscription_succeeded', () => {
        document.getElementById('room-status').textContent = `Joined room: ${roomCode}`;
        isPlayerTurn = false;
        startTurn();
    });
    setupPusherEvents();
});

// Pusher event bindings
function setupPusherEvents() {
    channel.bind('client-play-card', data => {
        opponentPlayedCard = data.card;
        displayPlayedCards();
        if (playedCard) resolveBattle();
    });
    channel.bind('client-burn-card', data => {
        opponentMana = Math.min(15, opponentMana + opponentHand[data.index].cost);
        opponentDiscard.push(opponentHand[data.index]);
        opponentHand[data.index] = drawCard(opponentDeck, opponentDiscard);
        displayOpponentHand();
    });
    channel.bind('client-end-turn', () => {
        isPlayerTurn = true;
        opponentMana = opponentMana === 0 ? 3 : Math.min(15, opponentMana + 3);
        opponentHand[opponentHand.indexOf(null)] = drawCard(opponentDeck, opponentDiscard);
        startTurn();
    });
}

// Drag-and-drop setup
document.getElementById('player-card').addEventListener('dragover', e => e.preventDefault());
document.getElementById('player-card').addEventListener('drop', e => {
    e.preventDefault();
    if (!isPlayerTurn || playedCard) return;
    const index = parseInt(e.dataTransfer.getData('text/plain'), 10);
    const card = playerHand[index];
    if (card && playerMana >= card.cost) {
        playerMana -= card.cost;
        playedCard = card;
        playerHand[index] = null;
        playerDiscard.push(card);
        displayHand();
        displayPlayedCards();
        channel.trigger('client-play-card', { card });
    } else {
        alert('Not enough mana!');
    }
});

document.getElementById('burn-slot').addEventListener('dragover', e => e.preventDefault());
document.getElementById('burn-slot').addEventListener('drop', e => {
    e.preventDefault();
    if (!isPlayerTurn || playedCard) return;
    const index = parseInt(e.dataTransfer.getData('text/plain'), 10);
    const card = playerHand[index];
    if (card) {
        playerMana = Math.min(15, playerMana + card.cost);
        playerDiscard.push(card);
        playerHand[index] = drawCard(playerDeck, playerDiscard);
        displayHand();
        channel.trigger('client-burn-card', { index });
    }
});

// End turn
document.getElementById('end-turn').addEventListener('click', () => {
    if (!isPlayerTurn) return;
    isPlayerTurn = false;
    playerMana = playerMana === 0 ? 3 : Math.min(15, playerMana + 3);
    playerHand[playerHand.indexOf(null)] = drawCard(playerDeck, playerDiscard);
    channel.trigger('client-end-turn', {});
    startTurn();
});

// Next round
document.getElementById('next-round').addEventListener('click', () => {
    playedCard = null;
    opponentPlayedCard = null;
    document.getElementById('next-round').disabled = true;
    startTurn();
});
