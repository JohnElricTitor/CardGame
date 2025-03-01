// Constants for easy configuration
const DECK_CONFIG = {
    types: ['rock', 'paper', 'scissors'],
    damageRange: { min: 1, max: 10 },
    abilities: ['heal', 'debuff', 'shield', 'freeze', 'burn'],
    abilityChance: 0.2
};

const HAND_SIZE = 4;
const MAX_HEALTH = 30;
const MAX_MANA = 15;
const INITIAL_MANA = 3;
const CARD_REVEAL_COST = 5;

// Card class with validation
class Card {
    constructor(type, damage, cost, ability = null) {
        const validTypes = ['rock', 'paper', 'scissors'];
        if (!validTypes.includes(type)) throw new Error(`Invalid card type: ${type}`);
        if (!Number.isInteger(damage) || damage < 1) throw new Error(`Invalid damage: ${damage}`);
        this.type = type;
        this.damage = damage;
        this.cost = cost;
        this.ability = ability && ['heal', 'debuff', 'shield', 'freeze', 'burn'].includes(ability) ? ability : null;
    }

    static calculateCost(damage) {
        return damage <= 3 ? 1 : damage <= 6 ? 2 : 3;
    }
}

// Generate deck with configurable parameters
function generateDeck(config = DECK_CONFIG) {
    const deck = [];
    config.types.forEach(type => {
        for (let damage = config.damageRange.min; damage <= config.damageRange.max; damage++) {
            const cost = Card.calculateCost(damage);
            const hasAbility = Math.random() < config.abilityChance;
            const ability = hasAbility ? config.abilities[Math.floor(Math.random() * config.abilities.length)] : null;
            deck.push(new Card(type, damage, cost, ability));
        }
    });
    return deck;
}

// Shuffle utility without modifying input
function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

// GameState class to manage game variables
class GameState {
    constructor() {
        this.baseDeck = generateDeck();
        this.playerDeck = shuffle(this.baseDeck);
        this.playerHand = Array(HAND_SIZE).fill(null);
        this.playerDiscard = [];
        this.bossDeck = shuffle(this.baseDeck);
        this.bossHand = Array(HAND_SIZE).fill(null);
        this.bossDiscard = [];
        this.playerHealth = MAX_HEALTH;
        this.bossHealth = MAX_HEALTH;
        this.playerMana = INITIAL_MANA;
        this.bossMana = INITIAL_MANA;
        this.playerManaReset = false;
        this.bossManaReset = false;
        this.isHandRevealed = false;
        this.playedCards = [];
        this.bossPlayedCards = [];
        this.isFirstTurn = true;
        this.isPlayerTurn = true;
        this.lastRoundWinner = null;
        this.playerHasPlayed = false;
        this.bossHasPlayed = false;
        this.frozenBossCards = [];
        this.isSelectingFreezeTarget = false;
        this.isSelectingBurnTarget = false;
        this.areBossCardsRevealed = true; // Controls visibility of boss played cards

        // Initial deal
        for (let i = 0; i < HAND_SIZE; i++) {
            this.playerHand[i] = this.drawCard('player');
            this.bossHand[i] = this.drawCard('boss');
        }
    }

    drawCard(entity) {
        const deck = entity === 'player' ? this.playerDeck : this.bossDeck;
        const discard = entity === 'player' ? this.playerDiscard : this.bossDiscard;
        if (deck.length === 0) {
            if (discard.length === 0) return null;
            deck.push(...shuffle(discard));
            discard.length = 0;
        }
        return deck.pop();
    }

    reset() {
        this.playerDeck = shuffle(this.baseDeck);
        this.playerHand = Array(HAND_SIZE).fill(null);
        this.playerDiscard = [];
        this.bossDeck = shuffle(this.baseDeck);
        this.bossHand = Array(HAND_SIZE).fill(null);
        this.bossDiscard = [];
        this.playerHealth = MAX_HEALTH;
        this.bossHealth = MAX_HEALTH;
        this.playerMana = INITIAL_MANA;
        this.bossMana = INITIAL_MANA;
        this.playerManaReset = false;
        this.bossManaReset = false;
        this.isHandRevealed = false;
        this.playedCards = [];
        this.bossPlayedCards = [];
        this.isFirstTurn = true;
        this.isPlayerTurn = true;
        this.lastRoundWinner = null;
        this.playerHasPlayed = false;
        this.bossHasPlayed = false;
        this.frozenBossCards = [];
        this.isSelectingFreezeTarget = false;
        this.isSelectingBurnTarget = false;
        this.areBossCardsRevealed = true;
        for (let i = 0; i < HAND_SIZE; i++) {
            this.playerHand[i] = this.drawCard('player');
            this.bossHand[i] = this.drawCard('boss');
        }
    }
}

let gameState = new GameState();

// Ability descriptions
const abilityDescriptions = {
    heal: 'Restore 3 health when played.',
    debuff: "Reduce opponent's damage by 2.",
    shield: 'Block 3 damage when played.',
    freeze: "Freeze an opponent's card, making it unplayable until the next round.",
    burn: "Burn one of the opponent's cards, removing it from their hand."
};

// Reusable card element creation
function createCardElement(card, index, isDraggable = false, isRevealed = true) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    cardDiv.dataset.index = index;
    if (isDraggable) cardDiv.draggable = true;
    if (isRevealed) {
        cardDiv.style.backgroundImage = `url('images/${card.type}.png')`;
        cardDiv.innerHTML = `
            <div class="damage">${card.damage}</div>
            <div class="mana-cost">${card.cost}</div>
            ${card.ability ? `<div class="ability">${card.ability.charAt(0).toUpperCase() + card.ability.slice(1)}</div>` : ''}
        `;
    } else {
        cardDiv.style.backgroundImage = `url('images/back.png')`;
        cardDiv.innerHTML = '';
    }
    return cardDiv;
}

// Display player hand
function displayHand() {
    const handDiv = document.getElementById('hand');
    handDiv.innerHTML = '';
    gameState.playerHand.forEach((card, index) => {
        if (card) {
            const cardDiv = createCardElement(card, index, true, true);
            cardDiv.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', index);
                document.querySelector('.info-box')?.remove();
            });
            if (card.ability) {
                cardDiv.addEventListener('mouseenter', (e) => {
                    document.querySelector('.info-box')?.remove();
                    const infoBox = document.createElement('div');
                    infoBox.classList.add('info-box');
                    infoBox.textContent = abilityDescriptions[card.ability];
                    infoBox.style.position = 'absolute';
                    infoBox.style.left = `${e.pageX + 10}px`;
                    infoBox.style.top = `${e.pageY + 10}px`;
                    document.body.appendChild(infoBox);
                });
                cardDiv.addEventListener('mouseleave', () => document.querySelector('.info-box')?.remove());
            }
            handDiv.appendChild(cardDiv);
        } else {
            const emptySlot = document.createElement('div');
            emptySlot.classList.add('empty-slot');
            handDiv.appendChild(emptySlot);
        }
    });
    document.getElementById('player-health').textContent = `Player Health: ${gameState.playerHealth} | Mana: ${gameState.playerMana}`;
    document.getElementById('deck-count').textContent = gameState.playerDeck.length;
}

// Display boss hand
function displayBossHand() {
    const bossHandDiv = document.getElementById('boss-hand');
    bossHandDiv.innerHTML = '';
    gameState.bossHand.forEach((card, index) => {
        if (card) {
            const cardDiv = createCardElement(card, index, false, gameState.isHandRevealed);
            if (gameState.frozenBossCards.includes(index)) {
                cardDiv.classList.add('frozen');
            }
            if (gameState.isSelectingFreezeTarget && !gameState.frozenBossCards.includes(index)) {
                cardDiv.addEventListener('click', () => {
                    if (gameState.isSelectingFreezeTarget) {
                        gameState.frozenBossCards.push(index);
                        gameState.isSelectingFreezeTarget = false;
                        displayBossHand();
                    }
                }, { once: true });
            }
            if (gameState.isSelectingBurnTarget) {
                cardDiv.addEventListener('click', () => {
                    if (gameState.isSelectingBurnTarget) {
                        const burnedCard = gameState.bossHand[index];
                        if (burnedCard) {
                            gameState.bossDiscard.push(burnedCard);
                            gameState.bossHand[index] = null;
                        }
                        gameState.isSelectingBurnTarget = false;
                        displayBossHand();
                    }
                }, { once: true });
            }
            if (gameState.isHandRevealed && card.ability) {
                cardDiv.addEventListener('mouseenter', (e) => {
                    document.querySelector('.info-box')?.remove();
                    const infoBox = document.createElement('div');
                    infoBox.classList.add('info-box');
                    infoBox.textContent = abilityDescriptions[card.ability];
                    infoBox.style.position = 'absolute';
                    infoBox.style.left = `${e.pageX + 10}px`;
                    infoBox.style.top = `${e.pageY + 10}px`;
                    document.body.appendChild(infoBox);
                });
                cardDiv.addEventListener('mouseleave', () => document.querySelector('.info-box')?.remove());
            }
            bossHandDiv.appendChild(cardDiv);
        } else {
            const emptySlot = document.createElement('div');
            emptySlot.classList.add('empty-slot');
            bossHandDiv.appendChild(emptySlot);
        }
    });
    document.getElementById('boss-health').textContent = `Boss Health: ${gameState.bossHealth} | Mana: ${gameState.bossMana}`;
}

// Display played cards (player)
function displayPlayedCards() {
    const playerCardDiv = document.getElementById('player-card');
    playerCardDiv.innerHTML = '';
    gameState.playedCards.forEach(card => {
        const cardDiv = createCardElement(card, -1, false, true);
        playerCardDiv.appendChild(cardDiv);
    });
}

// Reveal entire boss hand
function revealCard() {
    if (gameState.playerMana < CARD_REVEAL_COST) {
        alert('Not enough mana to reveal the opponent\'s hand!');
        return;
    }
    gameState.playerMana -= CARD_REVEAL_COST;
    gameState.isHandRevealed = true;
    displayBossHand();
    displayHand();
}

// Boss card selection
function bossSelectCards() {
    const hand = gameState.bossHand.filter((card, index) => card && !gameState.frozenBossCards.includes(index));
    if (!hand.length) return [];
    const type = hand[0].type;
    const validCards = hand.filter(card => card.type === type)
        .sort((a, b) => b.damage - a.damage);
    let totalCost = 0;
    const selected = [];
    for (const card of validCards) {
        if (totalCost + card.cost <= gameState.bossMana) {
            selected.push(card);
            totalCost += card.cost;
        }
    }
    return selected.map(card => gameState.bossHand.indexOf(card));
}

// Animate boss cards with CSS transitions, respecting reveal state
function animateBossPlay(indices, targetId, callback) {
    const targetDiv = document.getElementById(targetId);
    const handCards = document.querySelectorAll('#boss-hand .card');
    indices.forEach(idx => {
        if (handCards[idx]) handCards[idx].style.visibility = 'hidden';
    });
    setTimeout(() => {
        targetDiv.innerHTML = '';
        gameState.bossPlayedCards.forEach(card => {
            const playedCard = createCardElement(card, -1, false, gameState.areBossCardsRevealed);
            targetDiv.appendChild(playedCard);
        });
        callback();
    }, 500);
}

// Helper functions for resolveTurn
function applyAbilities(cards, health) {
    cards.forEach(card => {
        if (card.ability === 'heal') health = Math.min(health + 3, MAX_HEALTH);
    });
    return health;
}

function calculateDamage(cards, debuffs) {
    const raw = cards.reduce((sum, card) => sum + card.damage, 0);
    return Math.max(0, raw - debuffs * 2);
}

// Function to burn a random player card for boss's burn ability
function burnRandomPlayerCard() {
    const playerHandIndices = gameState.playerHand.map((card, idx) => card ? idx : null).filter(idx => idx !== null);
    if (playerHandIndices.length > 0) {
        const randomIdx = playerHandIndices[Math.floor(Math.random() * playerHandIndices.length)];
        const burnedCard = gameState.playerHand[randomIdx];
        gameState.playerDiscard.push(burnedCard);
        gameState.playerHand[randomIdx] = null;
    }
}

// Resolve turn logic
function resolveTurn() {
    if (!gameState.playerHasPlayed || !gameState.bossHasPlayed) {
        console.error('Resolve called before both played!');
        return;
    }

    gameState.playerHealth = applyAbilities(gameState.playedCards, gameState.playerHealth);
    gameState.bossHealth = applyAbilities(gameState.bossPlayedCards, gameState.bossHealth);

    const playerDamage = calculateDamage(gameState.playedCards, gameState.bossPlayedCards.filter(card => card.ability === 'debuff').length);
    const bossDamage = calculateDamage(gameState.bossPlayedCards, gameState.playedCards.filter(card => card.ability === 'debuff').length);

    const typeAdvantage = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
    const playerType = gameState.playedCards[0]?.type;
    const bossType = gameState.bossPlayedCards[0]?.type;
    let dealer = '', damage = 0;
    if (playerType && bossType) {
        if (typeAdvantage[playerType] === bossType) { dealer = 'player'; damage = playerDamage; }
        else if (typeAdvantage[bossType] === playerType) { dealer = 'boss'; damage = bossDamage; }
        else { dealer = playerDamage > bossDamage ? 'player' : 'boss'; damage = Math.abs(playerDamage - bossDamage); }
    } else if (playerType) { dealer = 'player'; damage = playerDamage; }
    else if (bossType) { dealer = 'boss'; damage = bossDamage; }

    if (dealer === 'player') {
        damage = Math.max(0, damage - gameState.bossPlayedCards.filter(card => card.ability === 'shield').length * 3);
        gameState.bossHealth -= damage;
    } else if (dealer === 'boss') {
        damage = Math.max(0, damage - gameState.playedCards.filter(card => card.ability === 'shield').length * 3);
        gameState.playerHealth -= damage;
    }

    gameState.areBossCardsRevealed = true; // Reveal boss cards after player's turn
    animateBossPlay(gameState.bossPlayedCards.map(card => gameState.bossHand.indexOf(card)), 'boss-card', () => {
        displayHand();
        displayBossHand();
        document.getElementById('result').textContent = 
            `Player Damage: ${playerDamage}\nBoss Damage: ${bossDamage}\n${dealer ? `${dealer} deals ${damage} damage.` : 'No damage dealt.'}`;
        gameState.lastRoundWinner = damage > 0 ? dealer : null;
        document.getElementById('next-round').disabled = false;

        if (gameState.playerHealth <= 0) { alert('Boss wins!'); gameState.reset(); }
        else if (gameState.bossHealth <= 0) { alert('Player wins!'); gameState.reset(); }

        gameState.playerManaReset = gameState.playerMana === 0;
        gameState.bossManaReset = gameState.bossMana === 0;
        gameState.isFirstTurn = false;
    });
}

// Start turn logic
function startTurn() {
    if (!gameState.isFirstTurn) {
        gameState.playerMana = gameState.playerManaReset ? INITIAL_MANA : Math.min(gameState.playerMana + 3, MAX_MANA);
        gameState.bossMana = gameState.bossManaReset ? INITIAL_MANA : Math.min(gameState.bossMana + 3, MAX_MANA);
    }
    gameState.frozenBossCards = []; // Unfreeze all cards
    gameState.playerHand = gameState.playerHand.map(card => card || gameState.drawCard('player'));
    gameState.bossHand = gameState.bossHand.map(card => card || gameState.drawCard('boss'));
    gameState.playedCards = [];
    gameState.bossPlayedCards = [];
    gameState.isHandRevealed = false;
    gameState.playerHasPlayed = false;
    gameState.bossHasPlayed = false;
    gameState.areBossCardsRevealed = true; // Default to revealed unless boss goes first

    document.getElementById('end-turn').disabled = false;
    document.getElementById('reveal-card').disabled = false;
    document.getElementById('next-round').disabled = true;
    document.getElementById('player-card').innerHTML = '';
    document.getElementById('boss-card').innerHTML = '';
    document.getElementById('result').textContent = '';

    if (gameState.lastRoundWinner === 'boss' && !gameState.isFirstTurn) {
        const indices = bossSelectCards();
        gameState.bossPlayedCards = indices.map(idx => gameState.bossHand[idx]);
        gameState.bossPlayedCards.forEach(card => {
            if (card.ability === 'burn') {
                burnRandomPlayerCard();
            }
        });
        gameState.bossMana -= gameState.bossPlayedCards.reduce((sum, card) => sum + card.cost, 0);
        gameState.bossHasPlayed = true;
        gameState.areBossCardsRevealed = false; // Hide boss cards initially
        animateBossPlay(indices, 'boss-card', () => {
            indices.forEach(idx => gameState.bossHand[idx] = null);
            displayBossHand();
            gameState.isPlayerTurn = true;
        });
    } else {
        gameState.isPlayerTurn = true;
    }
    displayHand();
    displayBossHand();
    displayPlayedCards();
}

// Reset game
function resetGame() {
    gameState.reset();
    startTurn();
}

// Event handlers
document.getElementById('end-turn').onclick = () => {
    if (!gameState.playerHasPlayed) {
        gameState.playerHasPlayed = true;
        gameState.isPlayerTurn = false;
        document.getElementById('end-turn').disabled = true;
        document.getElementById('reveal-card').disabled = true;
        if (!gameState.bossHasPlayed) {
            const indices = bossSelectCards();
            gameState.bossPlayedCards = indices.map(idx => gameState.bossHand[idx]);
            gameState.bossPlayedCards.forEach(card => {
                if (card.ability === 'burn') {
                    burnRandomPlayerCard();
                }
            });
            gameState.bossMana -= gameState.bossPlayedCards.reduce((sum, card) => sum + card.cost, 0);
            gameState.bossHasPlayed = true;
            animateBossPlay(indices, 'boss-card', () => {
                indices.forEach(idx => gameState.bossHand[idx] = null);
                displayBossHand();
                resolveTurn();
            });
        } else {
            resolveTurn();
        }
    }
};

document.getElementById('reveal-card').onclick = revealCard;
document.getElementById('next-round').onclick = startTurn;

document.getElementById('player-card').addEventListener('dragover', e => e.preventDefault());
document.getElementById('player-card').addEventListener('drop', e => {
    e.preventDefault();
    const index = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (gameState.playerHand[index] && gameState.isPlayerTurn) {
        const card = gameState.playerHand[index];
        if (gameState.playedCards.length > 0 && card.type !== gameState.playedCards[0].type) {
            alert('All played cards must be of the same type!');
            return;
        }
        if (card.cost > gameState.playerMana) {
            alert('Not enough mana to play this card!');
            return;
        }
        gameState.playerMana -= card.cost;
        gameState.playedCards.push(card);
        gameState.playerHand[index] = null;
        displayHand();
        displayPlayedCards();
        if (card.ability === 'freeze') {
            gameState.isSelectingFreezeTarget = true;
            alert('Click a boss card to freeze it until the next round.');
            displayBossHand();
        } else if (card.ability === 'burn') {
            gameState.isSelectingBurnTarget = true;
            alert('Click a boss card to burn it.');
            displayBossHand();
        }
    }
});

document.getElementById('burn-slot').addEventListener('dragover', e => e.preventDefault());
document.getElementById('burn-slot').addEventListener('drop', e => {
    e.preventDefault();
    const index = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (gameState.playerHand[index] && gameState.isPlayerTurn) {
        const card = gameState.playerHand[index];
        gameState.playerMana = Math.min(gameState.playerMana + card.cost, MAX_MANA);
        gameState.playerDiscard.push(card);
        gameState.playerHand[index] = null;
        displayHand();
    }
});

// Tutorial handlers
document.getElementById('tutorial-button').onclick = () => 
    document.getElementById('tutorial-panel').style.display = 'flex';
document.getElementById('close-tutorial').onclick = () => 
    document.getElementById('tutorial-panel').style.display = 'none';

// Start game
startTurn();
