// Card class to define card properties
class Card {
    constructor(type, damage, cost, ability = null) {
        this.type = type; // 'rock', 'paper', 'scissors'
        this.damage = damage; // 1 to 10
        this.cost = cost; // 1, 2, or 3 based on damage
        this.ability = ability; // 'heal', 'debuff', 'shield', 'discard', or null
    }
}

// Generate a deck with various cards, including the new 'discard' ability
function generateDeck() {
    const types = ['rock', 'paper', 'scissors'];
    const abilities = ['heal', 'debuff', 'shield', 'discard'];
    const deck = [];
    types.forEach(type => {
        for (let damage = 1; damage <= 10; damage++) {
            let cost = damage <= 3 ? 1 : damage <= 6 ? 2 : 3;
            const hasAbility = Math.random() < 0.2; // 20% chance for an ability
            const ability = hasAbility ? abilities[Math.floor(Math.random() * abilities.length)] : null;
            deck.push(new Card(type, damage, cost, ability));
        }
    });
    return deck;
}

// Shuffle utility function
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Initial game state
const baseDeck = generateDeck();
let playerDeck = shuffle([...baseDeck]);
let playerHand = Array(4).fill(null);
let playerDiscard = [];
let bossDeck = shuffle([...baseDeck]);
let bossHand = Array(4).fill(null);
let bossDiscard = [];
let playerHealth = 30;
let bossHealth = 30;
let playerMana = 3;
let bossMana = 3;
let playerManaReset = false;
let bossManaReset = false;
let isFirstTurn = true;
let isPlayerTurn = true;
let playedCards = []; // Player's played cards this turn
let bossPlayedCards = []; // Opponent's played cards this turn
let currentTurnStarter = 'player'; // Tracks who starts each round
let discardCount = 0; // Number of opponent's cards the player can discard

// Ability descriptions for the info box
const abilityDescriptions = {
    heal: 'Restore 3 health when played.',
    debuff: "Reduce opponent's damage by 2.",
    shield: 'Block 3 damage when played.',
    discard: "Discard one of opponent's cards before ending turn."
};

// Draw a card from the player's deck
function drawCard() {
    if (playerDeck.length === 0) {
        playerDeck = shuffle([...playerDiscard]);
        playerDiscard = [];
    }
    if (playerDeck.length > 0) {
        return playerDeck.pop();
    }
    return null;
}

// Draw a card for the boss
function drawBossCard() {
    if (bossDeck.length === 0) {
        bossDeck = shuffle([...bossDiscard]);
        bossDiscard = [];
    }
    if (bossDeck.length > 0) {
        return bossDeck.pop();
    }
    return null;
}

// Initialize hands with 4 cards each
for (let i = 0; i < 4; i++) {
    playerHand[i] = drawCard();
    bossHand[i] = drawBossCard();
}

// Create an info box for card abilities on hover
function createInfoBox(ability) {
    const infoBox = document.createElement('div');
    infoBox.classList.add('info-box');
    infoBox.textContent = abilityDescriptions[ability] || 'No ability description available.';
    return infoBox;
}

// Display the player's hand with drag-and-drop and hover effects
function displayHand() {
    const handDiv = document.getElementById('hand');
    handDiv.innerHTML = '';
    playerHand.forEach((card, index) => {
        if (card) {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card');
            cardDiv.dataset.index = index;
            cardDiv.draggable = true;
            cardDiv.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', index);
                const infoBox = document.querySelector('.info-box');
                if (infoBox) infoBox.remove();
            });
            cardDiv.style.backgroundImage = `url('images/${card.type}.png')`;
            cardDiv.innerHTML = `
                <div class="damage">${card.damage}</div>
                <div class="mana-cost">${card.cost}</div>
                ${card.ability ? `<div class="ability">${card.ability.charAt(0).toUpperCase() + card.ability.slice(1)}</div>` : ''}
            `;
            if (card.ability) {
                cardDiv.addEventListener('mouseenter', (e) => {
                    const infoBox = createInfoBox(card.ability);
                    infoBox.style.position = 'absolute';
                    infoBox.style.left = `${e.pageX + 10}px`;
                    infoBox.style.top = `${e.pageY + 10}px`;
                    document.body.appendChild(infoBox);
                });
                cardDiv.addEventListener('mouseleave', () => {
                    const infoBox = document.querySelector('.info-box');
                    if (infoBox) infoBox.remove();
                });
            }
            handDiv.appendChild(cardDiv);
        } else {
            const emptySlot = document.createElement('div');
            emptySlot.classList.add('empty-slot');
            handDiv.appendChild(emptySlot);
        }
    });
    document.getElementById('player-health').textContent = `Player Health: ${playerHealth} | Mana: ${playerMana}`;
}

// Display the boss's hand (face-up), with clickable cards for discarding
function displayBossHand() {
    const bossHandDiv = document.getElementById('boss-hand');
    bossHandDiv.innerHTML = '';
    bossHand.forEach((card, index) => {
        if (card) {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card');
            cardDiv.dataset.index = index;
            cardDiv.style.backgroundImage = `url('images/${card.type}.png')`;
            cardDiv.innerHTML = `
                <div class="damage">${card.damage}</div>
                <div class="mana-cost">${card.cost}</div>
                ${card.ability ? `<div class="ability">${card.ability.charAt(0).toUpperCase() + card.ability.slice(1)}</div>` : ''}
            `;
            // Make cards clickable for discarding if discardCount > 0
            if (discardCount > 0) {
                cardDiv.style.cursor = 'pointer';
                cardDiv.onclick = () => discardOpponentCard(index);
            }
            bossHandDiv.appendChild(cardDiv);
        } else {
            const emptySlot = document.createElement('div');
            emptySlot.classList.add('empty-slot');
            bossHandDiv.appendChild(emptySlot);
        }
    });
    document.getElementById('boss-health').textContent = `Opponent Health: ${bossHealth} | Mana: ${bossMana}`;
}

// Display the player's played cards
function displayPlayedCards() {
    const playerCardDiv = document.getElementById('player-card');
    playerCardDiv.innerHTML = '';
    playedCards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        cardDiv.style.backgroundImage = `url('images/${card.type}.png')`;
        cardDiv.innerHTML = `
            <div class="damage">${card.damage}</div>
            <div class="mana-cost">${card.cost}</div>
            ${card.ability ? `<div class="ability">${card.ability.charAt(0).toUpperCase() + card.ability.slice(1)}</div>` : ''}
        `;
        playerCardDiv.appendChild(cardDiv);
    });
}

// Boss AI: Select cards of the same type within mana limit
function bossSelectCards() {
    const availableTypes = [...new Set(bossHand.map(card => card ? card.type : null).filter(Boolean))];
    if (availableTypes.length === 0) return [];
    const selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const typeCards = bossHand.map((card, idx) => card && card.type === selectedType ? idx : null).filter(idx => idx !== null);
    const combinations = [];
    for (let i = 0; i < typeCards.length; i++) {
        combinations.push([typeCards[i]]);
        for (let j = i + 1; j < typeCards.length; j++) {
            combinations.push([typeCards[i], typeCards[j]]);
            for (let k = j + 1; k < typeCards.length; k++) {
                combinations.push([typeCards[i], typeCards[j], typeCards[k]]);
            }
        }
    }
    const validCombinations = combinations.filter(combo => {
        const totalCost = combo.reduce((sum, idx) => sum + (bossHand[idx] ? bossHand[idx].cost : 0), 0);
        return totalCost <= bossMana;
    });
    return validCombinations.length > 0 ? validCombinations[Math.floor(Math.random() * validCombinations.length)] : [];
}

// Animate boss cards moving to the play area
function animateBossPlay(indices, targetId, callback) {
    const targetDiv = document.getElementById(targetId);
    const handCards = document.querySelectorAll('#boss-hand .card');
    const playAreaRect = targetDiv.getBoundingClientRect();
    const animatedCards = [];

    indices.forEach((idx, i) => {
        const card = bossHand[idx];
        if (card && handCards[idx]) {
            handCards[idx].style.visibility = 'hidden';
            const rect = handCards[idx].getBoundingClientRect();
            const animatedCard = document.createElement('div');
            animatedCard.classList.add('card');
            animatedCard.style.position = 'absolute';
            animatedCard.style.left = `${rect.left}px`;
            animatedCard.style.top = `${rect.top}px`;
            animatedCard.style.backgroundImage = `url('images/${card.type}.png')`;
            animatedCard.innerHTML = `
                <div class="damage">${card.damage}</div>
                <div class="mana-cost">${card.cost}</div>
                ${card.ability ? `<div class="ability">${card.ability.charAt(0).toUpperCase() + card.ability.slice(1)}</div>` : ''}
            `;
            document.body.appendChild(animatedCard);
            animatedCards.push(animatedCard);
            setTimeout(() => {
                animatedCard.style.transition = 'all 0.5s ease';
                animatedCard.style.left = `${playAreaRect.left + (playAreaRect.width / 2 - animatedCard.clientWidth / 2)}px`;
                animatedCard.style.top = `${playAreaRect.top + (playAreaRect.height / 2 - animatedCard.clientHeight / 2)}px`;
            }, 10);
        }
    });

    setTimeout(() => {
        animatedCards.forEach(card => card.remove());
        targetDiv.innerHTML = '';
        indices.forEach(idx => {
            const card = bossPlayedCards.find(c => c === bossHand[idx]);
            if (card) {
                const playedCard = document.createElement('div');
                playedCard.classList.add('card');
                playedCard.style.backgroundImage = `url('images/${card.type}.png')`;
                playedCard.innerHTML = `
                    <div class="damage">${card.damage}</div>
                    <div class="mana-cost">${card.cost}</div>
                    ${card.ability ? `<div class="ability">${card.ability.charAt(0).toUpperCase() + card.ability.slice(1)}</div>` : ''}`;
                targetDiv.appendChild(playedCard);
            }
        });
        callback();
    }, 500);
}

// Discard an opponent's card when clicked
function discardOpponentCard(index) {
    if (discardCount <= 0 || bossHand[index] === null) return;
    const discardedCard = bossHand[index];
    bossDiscard.push(discardedCard);
    bossHand[index] = null;
    discardCount--;
    updateAbilityDesc();
    displayBossHand();
}

// Update the ability description text based on discardCount
function updateAbilityDesc() {
    const abilityDesc = document.getElementById('ability-desc');
    if (discardCount > 0) {
        abilityDesc.textContent = `Discard ${discardCount} opponent's card(s) by clicking on them.`;
    } else {
        abilityDesc.textContent = 'Drag cards to play area or burn slot and end turn when ready.';
    }
}

// Resolve the turn after the player ends it
function resolveTurn() {
    // If player started, opponent plays now
    if (currentTurnStarter === 'player') {
        playOpponentTurn();
    }

    // Calculate effects of abilities and damage
    let playerHeal = 0, bossHeal = 0, playerDamage = 0, bossDamage = 0;
    let dealer = '';
    playedCards.forEach(card => {
        if (card.ability === 'heal') playerHeal += 3;
        else if (card.ability === 'debuff') bossDamage -= 2;
        else if (card.ability === 'shield') playerDamage -= 3;
        playerDamage += card.damage;
    });
    bossPlayedCards.forEach(card => {
        if (card.ability === 'heal') bossHeal += 3;
        else if (card.ability === 'debuff') playerDamage -= 2;
        else if (card.ability === 'shield') bossDamage -= 3;
        bossDamage += card.damage;
    });

    playerDamage = Math.max(playerDamage, 0);
    bossDamage = Math.max(bossDamage, 0);
    playerHealth = Math.min(playerHealth + playerHeal, 30) - bossDamage;
    bossHealth = Math.min(bossHealth + bossHeal, 30) - playerDamage;

    // Determine the winner of the round for dynamic turn order
    if (playerDamage > bossDamage && playerHealth > 0) dealer = 'player';
    else if (bossDamage > playerDamage && bossHealth > 0) dealer = 'boss';

    document.getElementById('player-health').textContent = `Player Health: ${playerHealth} | Mana: ${playerMana}`;
    document.getElementById('boss-health').textContent = `Opponent Health: ${bossHealth} | Mana: ${bossMana}`;
    document.getElementById('result').textContent = `Player dealt ${playerDamage} damage, Opponent dealt ${bossDamage} damage`;

    // Animate boss play and cleanup
    const bossSelectedIndices = currentTurnStarter === 'player' ? bossSelectCards() : [];
    animateBossPlay(bossSelectedIndices, 'boss-card', () => {
        bossSelectedIndices.forEach(idx => bossHand[idx] = null);
        displayBossHand();
        document.getElementById('end-turn').disabled = true;
        document.getElementById('next-round').disabled = false;

        // Check for game end
        if (playerHealth <= 0) {
            alert('Opponent wins!');
            resetGame();
        } else if (bossHealth <= 0) {
            alert('Player wins!');
            resetGame();
        } else {
            // Set the next turn starter based on the round winner
            if (dealer === 'player') {
                currentTurnStarter = 'player';
            } else if (dealer === 'boss') {
                currentTurnStarter = 'opponent';
            } // Tie keeps the current starter
        }
    });
}

// Opponent's turn logic
function playOpponentTurn() {
    const bossSelectedIndices = bossSelectCards();
    bossPlayedCards = bossSelectedIndices.map(idx => bossHand[idx]);
    const bossTotalCost = bossPlayedCards.reduce((sum, card) => sum + card.cost, 0);
    bossMana -= bossTotalCost;
    displayBossPlayedCards();
}

// Display the boss's played cards
function displayBossPlayedCards() {
    const bossCardDiv = document.getElementById('boss-card');
    bossCardDiv.innerHTML = '';
    bossPlayedCards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        cardDiv.style.backgroundImage = `url('images/${card.type}.png')`;
        cardDiv.innerHTML = `
            <div class="damage">${card.damage}</div>
            <div class="mana-cost">${card.cost}</div>
            ${card.ability ? `<div class="ability">${card.ability.charAt(0).toUpperCase() + card.ability.slice(1)}</div>` : ''}`;
        bossCardDiv.appendChild(cardDiv);
    });
}

// Start a new turn
function startTurn() {
    if (!isFirstTurn) {
        if (playerManaReset) playerMana = 3;
        else playerMana = Math.min(playerMana + 3, 15);
        if (bossManaReset) bossMana = 3;
        else bossMana = Math.min(bossMana + 3, 15);
    }
    playerHand = playerHand.map(card => card === null ? drawCard() : card);
    bossHand = bossHand.map(card => card === null ? drawBossCard() : card);
    playedCards = [];
    bossPlayedCards = [];
    isPlayerTurn = true;
    discardCount = 0; // Reset discard count each turn
    document.getElementById('player-card').innerHTML = '';
    document.getElementById('boss-card').innerHTML = '';
    document.getElementById('result').textContent = '';
    document.getElementById('end-turn').disabled = false;
    document.getElementById('next-round').disabled = true;
    displayHand();
    displayBossHand();
    updateAbilityDesc();

    // If opponent starts, they play immediately
    if (currentTurnStarter === 'opponent') {
        playOpponentTurn();
    }
    isFirstTurn = false;
}

// Reset the game to initial state
function resetGame() {
    playerDeck = shuffle([...baseDeck]);
    playerHand = Array(4).fill(null);
    playerDiscard = [];
    bossDeck = shuffle([...baseDeck]);
    bossHand = Array(4).fill(null);
    bossDiscard = [];
    playerHealth = 30;
    bossHealth = 30;
    playerMana = 3;
    bossMana = 3;
    playerManaReset = false;
    bossManaReset = false;
    isFirstTurn = true;
    isPlayerTurn = true;
    currentTurnStarter = 'player';
    discardCount = 0;
    for (let i = 0; i < 4; i++) {
        playerHand[i] = drawCard();
        bossHand[i] = drawBossCard();
    }
    startTurn();
}

// Button event handlers
document.getElementById('end-turn').onclick = () => {
    resolveTurn();
};

document.getElementById('next-round').onclick = () => {
    startTurn();
};

// Tutorial panel handlers
document.getElementById('tutorial-button').onclick = () => {
    document.getElementById('tutorial-panel').style.display = 'block';
};

document.getElementById('close-tutorial').onclick = () => {
    document.getElementById('tutorial-panel').style.display = 'none';
};

// Drag-and-drop for playing cards
document.getElementById('player-card').addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.getElementById('player-card').addEventListener('drop', (e) => {
    e.preventDefault();
    const index = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (playerHand[index] !== null && isPlayerTurn) {
        const cardToPlay = playerHand[index];
        if (cardToPlay.cost > playerMana) {
            alert('Not enough mana to play this card!');
            return;
        }
        playerMana -= cardToPlay.cost;
        playedCards.push(cardToPlay);
        playerHand[index] = null;
        displayHand();
        displayPlayedCards();
        document.getElementById('player-health').textContent = `Player Health: ${playerHealth} | Mana: ${playerMana}`;

        // Increment discard count if the card has the discard ability
        if (cardToPlay.ability === 'discard') {
            discardCount++;
            updateAbilityDesc();
        }
    }
});

// Drag-and-drop for burning cards
document.getElementById('burn-slot').addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.getElementById('burn-slot').addEventListener('drop', (e) => {
    e.preventDefault();
    const index = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (playerHand[index] !== null && isPlayerTurn) {
        const burnedCard = playerHand[index];
        playerMana = Math.min(playerMana + burnedCard.cost, 15);
        playerDiscard.push(burnedCard);
        playerHand[index] = null;
        displayHand();
        document.getElementById('player-health').textContent = `Player Health: ${playerHealth} | Mana: ${playerMana}`;
    }
});

// Initialize the game
startTurn();
