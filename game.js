// Pusher setup with your credentials (replace with your actual key)
const pusher = new Pusher('54bd73077135a1b7a703', {
    cluster: 'us2',
    encrypted: true
});

// Card class
class Card {
    constructor(type, damage, cost, ability = null) {
        this.type = type; // 'rock', 'paper', 'scissors'
        this.damage = damage; // 1 to 10
        this.cost = cost; // 1, 2, or 3 based on damage
        this.ability = ability; // 'heal', 'debuff', 'shield', or null
    }
}

// Generate deck
function generateDeck() {
    const types = ['rock', 'paper', 'scissors'];
    const abilities = ['heal', 'debuff', 'shield'];
    const deck = [];
    types.forEach(type => {
        for (let damage = 1; damage <= 10; damage++) {
            let cost = damage <= 3 ? 1 : damage <= 6 ? 2 : 3;
            const hasAbility = Math.random() < 0.2;
            const ability = hasAbility ? abilities[Math.floor(Math.random() * abilities.length)] : null;
            deck.push(new Card(type, damage, cost, ability));
        }
    });
    return deck;
}

// Shuffle utility
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Game state
let playerDeck = shuffle([...generateDeck()]);
let playerHand = Array(4).fill(null);
let playerDiscard = [];
let opponentHand = Array(4).fill(null);
let playerHealth = 30;
let opponentHealth = 30;
let playerMana = 3;
let opponentMana = 3;
let isPlayerTurn = false;
let playedCards = [];
let burnedCards = [];
let roomCode = null;
let playerId = null;
let channel = null;

// Initial hands
for (let i = 0; i < 4; i++) {
    playerHand[i] = drawCard(playerDeck, playerDiscard);
}

// Draw card
function drawCard(deck, discard) {
    if (deck.length === 0) {
        deck.push(...shuffle(discard));
        discard.length = 0;
    }
    return deck.length > 0 ? deck.pop() : null;
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
            cardDiv.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', index));
            cardDiv.innerHTML = `
                <div class="damage">${card.damage}</div>
                <div class="mana-cost">${card.cost}</div>
                ${card.ability ? `<div class="ability">${card.ability.charAt(0).toUpperCase() + card.ability.slice(1)}</div>` : ''}
            `;
            handDiv.appendChild(cardDiv);
        }
    });
    document.getElementById('player-health').textContent = `Your Health: ${playerHealth} | Mana: ${playerMana}`;
    document.getElementById('deck-count').textContent = `Deck: ${playerDeck.length}`;
}

// Display opponent hand (always visible)
function displayOpponentHand() {
    const opponentHandDiv = document.getElementById('opponent-hand');
    opponentHandDiv.innerHTML = '';
    opponentHand.forEach(card => {
        if (card) {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card');
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
    playerCardDiv.innerHTML = '';
    playedCards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        cardDiv.innerHTML = `
            <div class="damage">${card.damage}</div>
            <div class="mana-cost">${card.cost}</div>
            ${card.ability ? `<div class="ability">${card.ability.charAt(0).toUpperCase() + card.ability.slice(1)}</div>` : ''}
        `;
        playerCardDiv.appendChild(cardDiv);
    });
}

// Display opponent played cards
function displayOpponentPlayedCards(cards) {
    const opponentCardDiv = document.getElementById('opponent-card');
    opponentCardDiv.innerHTML = '';
    cards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        cardDiv.innerHTML = `
            <div class="damage">${card.damage}</div>
            <div class="mana-cost">${card.cost}</div>
            ${card.ability ? `<div class="ability">${card.ability.charAt(0).toUpperCase() + card.ability.slice(1)}</div>` : ''}
        `;
        opponentCardDiv.appendChild(cardDiv);
    });
}

// Room management
document.getElementById('create-room').addEventListener('click', () => {
    roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    playerId = 'player1';
    channel = pusher.subscribe(`presence-${roomCode}`);
    channel.bind('pusher:subscription_succeeded', () => {
        document.getElementById('room-status').textContent = `Room created! Code: ${roomCode}. Waiting for opponent...`;
        setupChannelEvents();
    });
});

document.getElementById('join-room').addEventListener('click', () => {
    roomCode = document.getElementById('room-code-input').value.toUpperCase();
    playerId = 'player2';
    channel = pusher.subscribe(`presence-${roomCode}`);
    channel.bind('pusher:subscription_succeeded', () => {
        if (channel.members.count > 2) {
            alert('Room is full!');
            pusher.unsubscribe(`presence-${roomCode}`);
            return;
        }
        document.getElementById('room-status').textContent = `Joined room ${roomCode}!`;
        setupChannelEvents();
        if (playerId === 'player2') {
            channel.trigger('client-start-game', {});
        }
    });
});

// Setup Pusher channel events
function setupChannelEvents() {
    channel.bind('client-start-game', () => {
        if (playerId === 'player1') {
            isPlayerTurn = true;
            document.getElementById('ability-desc').textContent = 'Your turn! Drag cards to play or burn.';
            document.getElementById('end-turn').disabled = false;
        } else {
            document.getElementById('ability-desc').textContent = 'Opponent’s turn...';
        }
        displayHand();
        document.getElementById('room-management').style.display = 'none';
    });

    channel.bind('client-opponent-hand', data => {
        opponentHand = data.hand.map(c => c ? new Card(c.type, c.damage, c.cost, c.ability) : null);
        displayOpponentHand();
    });

    channel.bind('client-turn-end', data => {
        if (data.playerId !== playerId) {
            displayOpponentPlayedCards(data.playedCards);
            opponentHealth = data.health;
            opponentMana = data.mana;
            opponentHand = data.hand.map(c => c ? new Card(c.type, c.damage, c.cost, c.ability) : null);
            resolveBattle(data.playedCards);
        }
    });

    channel.bind('client-next-round', data => {
        if (data.playerId !== playerId) {
            opponentHealth = data.health;
            opponentMana = data.mana;
            opponentHand = data.hand.map(c => c ? new Card(c.type, c.damage, c.cost, c.ability) : null);
            startNextRound();
        }
    });
}

// End turn logic
document.getElementById('end-turn').addEventListener('click', () => {
    if (!isPlayerTurn) return;
    isPlayerTurn = false;
    document.getElementById('end-turn').disabled = true;
    document.getElementById('ability-desc').textContent = 'Opponent’s turn...';

    const handData = playerHand.map(c => c ? { type: c.type, damage: c.damage, cost: c.cost, ability: c.ability } : null);
    channel.trigger('client-turn-end', {
        playerId,
        playedCards: playedCards.map(c => ({ type: c.type, damage: c.damage, cost: c.cost, ability: c.ability })),
        health: playerHealth,
        mana: playerMana,
        hand: handData
    });

    channel.trigger('client-opponent-hand', { hand: handData });
});

// Resolve battle
function resolveBattle(opponentPlayedCards) {
    const typeAdvantage = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
    let playerDamage = playedCards.reduce((sum, c) => sum + c.damage, 0);
    let opponentDamage = opponentPlayedCards.reduce((sum, c) => sum + c.damage, 0);

    const playerType = playedCards[0]?.type;
    const opponentType = opponentPlayedCards[0]?.type;

    playedCards.forEach(c => { if (c.ability === 'heal') playerHealth = Math.min(30, playerHealth + 3); });
    opponentPlayedCards.forEach(c => { if (c.ability === 'heal') opponentHealth = Math.min(30, opponentHealth + 3); });

    const playerDebuff = opponentPlayedCards.filter(c => c.ability === 'debuff').length * 2;
    const opponentDebuff = playedCards.filter(c => c.ability === 'debuff').length * 2;
    playerDamage = Math.max(0, playerDamage - playerDebuff);
    opponentDamage = Math.max(0, opponentDamage - opponentDebuff);

    let resultText = '';
    if (playerType && opponentType) {
        if (typeAdvantage[playerType] === opponentType) {
            const shield = opponentPlayedCards.filter(c => c.ability === 'shield').length * 3;
            opponentHealth -= Math.max(0, playerDamage - shield);
            resultText = `You deal ${Math.max(0, playerDamage - shield)} damage!`;
        } else if (typeAdvantage[opponentType] === playerType) {
            const shield = playedCards.filter(c => c.ability === 'shield').length * 3;
            playerHealth -= Math.max(0, opponentDamage - shield);
            resultText = `Opponent deals ${Math.max(0, opponentDamage - shield)} damage!`;
        } else {
            const playerShield = playedCards.filter(c => c.ability === 'shield').length * 3;
            const opponentShield = opponentPlayedCards.filter(c => c.ability === 'shield').length * 3;
            opponentHealth -= Math.max(0, playerDamage - opponentShield);
            playerHealth -= Math.max(0, opponentDamage - playerShield);
            resultText = `You deal ${Math.max(0, playerDamage - opponentShield)}, opponent deals ${Math.max(0, opponentDamage - playerShield)}!`;
        }
    }

    document.getElementById('result').textContent = resultText;
    displayHand();
    displayOpponentHand();

    if (playerHealth <= 0) {
        alert('Opponent wins!');
        resetGame();
    } else if (opponentHealth <= 0) {
        alert('You win!');
        resetGame();
    } else {
        document.getElementById('next-round').disabled = false;
    }
}

// Start next round
document.getElementById('next-round').addEventListener('click', () => {
    startNextRound();
});

function startNextRound() {
    playerMana = playerMana === 0 ? 3 : Math.min(15, playerMana + 3);
    burnedCards.forEach(() => playerDiscard.push(drawCard(playerDeck, playerDiscard)));
    playedCards.forEach(() => playerDiscard.push(drawCard(playerDeck, playerDiscard)));
    playerHand = playerHand.map(c => c ? c : drawCard(playerDeck, playerDiscard));
    playedCards = [];
    burnedCards = [];
    isPlayerTurn = true;
    document.getElementById('player-card').innerHTML = '';
    document.getElementById('opponent-card').innerHTML = '';
    document.getElementById('result').textContent = '';
    document.getElementById('ability-desc').textContent = 'Your turn! Drag cards to play or burn.';
    document.getElementById('end-turn').disabled = false;
    document.getElementById('next-round').disabled = true;
    displayHand();

    const handData = playerHand.map(c => c ? { type: c.type, damage: c.damage, cost: c.cost, ability: c.ability } : null);
    channel.trigger('client-next-round', { playerId, health: playerHealth, mana: playerMana, hand: handData });
    channel.trigger('client-opponent-hand', { hand: handData });
}

// Reset game
function resetGame() {
    playerDeck = shuffle([...generateDeck()]);
    playerHand = Array(4).fill(null);
    playerDiscard = [];
    opponentHand = Array(4).fill(null);
    playerHealth = 30;
    opponentHealth = 30;
    playerMana = 3;
    opponentMana = 3;
    isPlayerTurn = false;
    playedCards = [];
    burnedCards = [];
    for (let i = 0; i < 4; i++) playerHand[i] = drawCard(playerDeck, playerDiscard);
    document.getElementById('room-management').style.display = 'block';
    document.getElementById('room-status').textContent = '';
    displayHand();
    displayOpponentHand();
}

// Drag-and-drop for play area
document.getElementById('player-card').addEventListener('dragover', e => e.preventDefault());
document.getElementById('player-card').addEventListener('drop', e => {
    e.preventDefault();
    if (!isPlayerTurn) return;
    const index = parseInt(e.dataTransfer.getData('text/plain'), 10);
    const card = playerHand[index];
    if (!card) return;

    if (playedCards.length > 0 && card.type !== playedCards[0].type) {
        alert('All played cards must be of the same type!');
        return;
    }
    if (card.cost > playerMana) {
        alert('Not enough mana!');
        return;
    }

    playerMana -= card.cost;
    playedCards.push(card);
    playerHand[index] = null;
    displayHand();
    displayPlayedCards();
});

// Drag-and-drop for burn slot
document.getElementById('burn-slot').addEventListener('dragover', e => e.preventDefault());
document.getElementById('burn-slot').addEventListener('drop', e => {
    e.preventDefault();
    if (!isPlayerTurn) return;
    const index = parseInt(e.dataTransfer.getData('text/plain'), 10);
    const card = playerHand[index];
    if (!card) return;

    playerMana = Math.min(15, playerMana + card.cost);
    burnedCards.push(card);
    playerHand[index] = null;
    displayHand();
});

// Tutorial controls
document.getElementById('tutorial-button').addEventListener('click', () => {
    document.getElementById('tutorial-panel').style.display = 'block';
});
document.getElementById('close-tutorial').addEventListener('click', () => {
    document.getElementById('tutorial-panel').style.display = 'none';
});

// Initial display
displayHand();
displayOpponentHand();
