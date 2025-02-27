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
let playerGoesFirst = true; // Track who goes first
let playedCards = []; // Player's played cards
let bossPlayedCards = []; // Boss's played cards

// Define ability descriptions for the info box
const abilityDescriptions = {
    heal: 'Restore 3 health when played.',
    debuff: "Reduce opponent's damage by 2.",
    shield: 'Block 3 damage when played.'
};

// Draw card for player
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

// Draw card for boss
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

// Initial hands
for (let i = 0; i < 4; i++) {
    playerHand[i] = drawCard();
    bossHand[i] = drawBossCard();
}

// Function to create the info box
function createInfoBox(ability) {
    const infoBox = document.createElement('div');
    infoBox.classList.add('info-box');
    infoBox.textContent = abilityDescriptions[ability] || 'No ability description available.';
    return infoBox;
}

// Display player hand with hover functionality
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

// Display boss hand (always face-up)
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
            bossHandDiv.appendChild(cardDiv);
        } else {
            const emptySlot = document.createElement('div');
            emptySlot.classList.add('empty-slot');
            bossHandDiv.appendChild(emptySlot);
        }
    });
    document.getElementById('boss-health').textContent = `Opponent Health: ${bossHealth} | Mana: ${bossMana}`;
}

// Display played cards (player)
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

// Boss card selection (ensures same type)
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
    if (validCombinations.length === 0) return [];
    return validCombinations[Math.floor(Math.random() * validCombinations.length)];
}

// Determine the winner based on card types
function determineWinner(playerType, opponentType) {
    if (playerType === opponentType) {
        return 'tie'; // No damage dealt
    } else if (
        (playerType === 'rock' && opponentType === 'scissors') ||
        (playerType === 'paper' && opponentType === 'rock') ||
        (playerType === 'scissors' && opponentType === 'paper')
    ) {
        return 'player'; // Player wins
    } else {
        return 'opponent'; // Opponent wins
    }
}

// Calculate damage for the winning side
function calculateDamage(cards) {
    let damage = cards.reduce((sum, card) => sum + card.damage, 0);
    // Apply abilities like debuff or shield here if needed
    return damage;
}

// Resolve turn with correct damage application
function resolveTurn() {
    const playerType = playedCards.length > 0 ? playedCards[0].type : null;
    const opponentType = bossPlayedCards.length > 0 ? bossPlayedCards[0].type : null;

    let playerDamage = 0;
    let bossDamage = 0;

    // Determine the winner based on types
    if (playerType && opponentType) {
        const winner = determineWinner(playerType, opponentType);
        if (winner === 'player') {
            playerDamage = calculateDamage(playedCards);
        } else if (winner === 'opponent') {
            bossDamage = calculateDamage(bossPlayedCards);
        }
        // If tie, both damages remain 0
    } else if (playerType) {
        // Only player played a card
        playerDamage = calculateDamage(playedCards);
    } else if (opponentType) {
        // Only boss played a card
        bossDamage = calculateDamage(bossPlayedCards);
    }

    // Apply damage to health
    bossHealth -= playerDamage;
    playerHealth -= bossDamage;

    // Update UI
    document.getElementById('player-health').textContent = `Player Health: ${playerHealth} | Mana: ${playerMana}`;
    document.getElementById('boss-health').textContent = `Opponent Health: ${bossHealth} | Mana: ${bossMana}`;
    let resultText = `Player Damage: ${playerDamage}\n`;
    resultText += `Boss Damage: ${bossDamage}\n`;
    document.getElementById('result').textContent = resultText;

    // Check for win condition
    if (playerHealth <= 0) {
        alert('Boss wins!');
        resetGame();
    } else if (bossHealth <= 0) {
        alert('Player wins!');
        resetGame();
    } else {
        document.getElementById('next-round').style.display = 'inline-block';
        document.getElementById('end-turn').disabled = true;
    }
}

// Start turn
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

    if (!playerGoesFirst) {
        const bossCardIndices = bossSelectCards();
        bossPlayedCards = bossCardIndices.map(idx => bossHand[idx]);
        const totalBossCost = bossPlayedCards.reduce((sum, card) => sum + card.cost, 0);
        bossMana -= totalBossCost;
        bossCardIndices.forEach(idx => bossHand[idx] = null);
        displayBossPlayedCards();
    }

    document.getElementById('ability-desc').textContent = 'Drag cards to play area or burn slot and end turn when ready.';
    document.getElementById('player-card').innerHTML = '';
    if (playerGoesFirst) document.getElementById('boss-card').innerHTML = '';
    document.getElementById('result').textContent = '';
    document.getElementById('end-turn').disabled = false;
    document.getElementById('next-round').disabled = true;
    displayHand();
    displayBossHand();
    displayPlayedCards();
}

// Reset game
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
    playerGoesFirst = true;
    for (let i = 0; i < 4; i++) {
        playerHand[i] = drawCard();
        bossHand[i] = drawBossCard();
    }
    startTurn();
}

// Button handlers
document.getElementById('end-turn').onclick = () => {
    resolveTurn();
};

document.getElementById('next-round').onclick = () => {
    startTurn();
};

// Tutorial button handler
document.getElementById('tutorial-button').onclick = () => {
    document.getElementById('tutorial-panel').style.display = 'block';
};

// Close tutorial handler
document.getElementById('close-tutorial').onclick = () => {
    document.getElementById('tutorial-panel').style.display = 'none';
};

// Drag-and-drop setup for player-card
document.getElementById('player-card').addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.getElementById('player-card').addEventListener('drop', (e) => {
    e.preventDefault();
    const index = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (playerHand[index] !== null) {
        const cardToPlay = playerHand[index];
        if (playedCards.length > 0 && cardToPlay.type !== playedCards[0].type) {
            alert('All played cards must be of the same type!');
            return;
        }
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
    }
});

// Drag-and-drop setup for burn-slot
document.getElementById('burn-slot').addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.getElementById('burn-slot').addEventListener('drop', (e) => {
    e.preventDefault();
    const index = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (playerHand[index] !== null) {
        const burnedCard = playerHand[index];
        playerMana = Math.min(playerMana + burnedCard.cost, 15);
        playerDiscard.push(burnedCard);
        playerHand[index] = null;
        displayHand();
        document.getElementById('player-health').textContent = `Player Health: ${playerHealth} | Mana: ${playerMana}`;
    }
});

// Initialize
startTurn();
