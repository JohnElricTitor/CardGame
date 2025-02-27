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
let selectedCardIndices = [];
let revealedIndices = [];
let cardRevealCost = 2;
let isRevealing = false;
let playerPassed = false;
let bossPassed = false;
let isFirstTurn = true;

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

// Display player hand
function displayHand() {
    const handDiv = document.getElementById('hand');
    handDiv.innerHTML = '';
    playerHand.forEach((card, index) => {
        if (card === null) {
            const emptySlot = document.createElement('div');
            emptySlot.classList.add('empty-slot');
            handDiv.appendChild(emptySlot);
        } else {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card');
            cardDiv.dataset.index = index;
            if (selectedCardIndices.includes(index)) cardDiv.classList.add('selected');
            cardDiv.style.backgroundImage = `url('images/${card.type}.png')`;
            cardDiv.onclick = () => selectCard(index);
            cardDiv.innerHTML = `
                <div class="damage">${card.damage}</div>
                <div class="mana-cost">${card.cost}</div>
                ${card.ability ? `<div class="ability">${card.ability.charAt(0).toUpperCase() + card.ability.slice(1)}</div>` : ''}
            `;
            handDiv.appendChild(cardDiv);
        }
    });
    document.getElementById('player-health').textContent = `Player Health: ${playerHealth} | Mana: ${playerMana}`;
}

// Display boss hand
function displayBossHand() {
    const bossHandDiv = document.getElementById('boss-hand');
    bossHandDiv.innerHTML = '';
    bossHand.forEach((card, index) => {
        if (card === null) {
            const emptySlot = document.createElement('div');
            emptySlot.classList.add('empty-slot');
            bossHandDiv.appendChild(emptySlot);
        } else {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card');
            cardDiv.dataset.index = index;
            if (revealedIndices.includes(index)) {
                cardDiv.style.backgroundImage = `url('images/${card.type}.png')`;
                cardDiv.innerHTML = `
                    <div class="damage">${card.damage}</div>
                    <div class="mana-cost">${card.cost}</div>
                    ${card.ability ? `<div class="ability">${card.ability.charAt(0).toUpperCase() + card.ability.slice(1)}</div>` : ''}
                `;
            } else {
                cardDiv.style.backgroundImage = `url('images/back.png')`;
            }
            cardDiv.onclick = () => {
                if (isRevealing) {
                    revealCard(index);
                    isRevealing = false;
                }
            };
            bossHandDiv.appendChild(cardDiv);
        }
    });
    document.getElementById('boss-health').textContent = `Boss Health: ${bossHealth} | Mana: ${bossMana}`;
}

// Select card
function selectCard(index) {
    if (selectedCardIndices.includes(index)) {
        selectedCardIndices = selectedCardIndices.filter(i => i !== index);
    } else {
        if (selectedCardIndices.length === 0 || (playerHand[index] && playerHand[selectedCardIndices[0]].type === playerHand[index].type)) {
            selectedCardIndices.push(index);
        } else {
            selectedCardIndices = [index];
        }
    }
    displayHand();
    updateAbilityDesc();
}

// Update ability description
function updateAbilityDesc() {
    const desc = document.getElementById('ability-desc');
    if (selectedCardIndices.length === 0) {
        desc.textContent = 'Select a card to see its ability.';
    } else if (selectedCardIndices.length === 1) {
        const card = playerHand[selectedCardIndices[0]];
        desc.textContent = card.ability ? {
            'heal': 'Restore 3 health per heal card.',
            'debuff': "Reduce opponent's total damage by 2 per debuff card.",
            'shield': 'Block 3 damage per shield card.'
        }[card.ability] : 'No ability.';
    } else {
        desc.textContent = 'Multiple cards selected.';
    }
}

// Reveal card
function revealCard(index) {
    if (playerMana < cardRevealCost) {
        alert('Not enough mana to reveal a card!');
        return;
    }
    playerMana -= cardRevealCost;
    revealedIndices.push(index);
    displayBossHand();
    displayHand(); // Update mana display
}

// Boss card selection
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

// Animate card play
function animatePlay(playedCards, playedIndices, sourceHandId, targetId, callback) {
    const targetDiv = document.getElementById(targetId);
    const handCards = document.querySelectorAll(`#${sourceHandId} .card`);
    const playAreaRect = targetDiv.getBoundingClientRect();
    const animatedCards = [];

    playedIndices.forEach((idx, i) => {
        const card = playedCards[i];
        if (card && handCards[idx]) {
            handCards[idx].style.visibility = 'hidden'; // Hide original card during animation
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
        playedCards.forEach(card => {
            const playedCard = document.createElement('div');
            playedCard.classList.add('card');
            playedCard.style.backgroundImage = `url('images/${card.type}.png')`;
            playedCard.innerHTML = `
                <div class="damage">${card.damage}</div>
                <div class="mana-cost">${card.cost}</div>
                ${card.ability ? `<div class="ability">${card.ability.charAt(0).toUpperCase() + card.ability.slice(1)}</div>` : ''}
            `;
            targetDiv.appendChild(playedCard);
        });
        callback();
    }, 500);
}

// Resolve turn
function resolveTurn() {
    playerPassed = selectedCardIndices.length === 0;
    const playerPlayedIndices = playerPassed ? [] : [...selectedCardIndices];
    const playerPlayedCards = playerPlayedIndices.map(idx => playerHand[idx]);

    const bossPlayedIndices = bossSelectCards();
    bossPassed = bossPlayedIndices.length === 0;
    const bossPlayedCards = bossPlayedIndices.map(idx => bossHand[idx]);

    // Deduct mana
    if (!playerPassed) {
        const totalCost = playerPlayedCards.reduce((sum, card) => sum + card.cost, 0);
        playerMana -= totalCost;
    }
    if (!bossPassed) {
        const totalBossCost = bossPlayedCards.reduce((sum, card) => sum + card.cost, 0);
        bossMana -= totalBossCost;
    }

    // Apply heals
    playerPlayedCards.forEach(card => {
        if (card.ability === 'heal') playerHealth = Math.min(playerHealth + 3, 30);
    });
    bossPlayedCards.forEach(card => {
        if (card.ability === 'heal') bossHealth = Math.min(bossHealth + 3, 30);
    });

    // Calculate damage
    const playerRawDamage = playerPlayedCards.reduce((sum, card) => sum + card.damage, 0);
    const bossRawDamage = bossPlayedCards.reduce((sum, card) => sum + card.damage, 0);
    const playerDebuffCount = bossPlayedCards.filter(card => card.ability === 'debuff').length;
    const bossDebuffCount = playerPlayedCards.filter(card => card.ability === 'debuff').length;
    let playerEffectiveDamage = Math.max(0, playerRawDamage - playerDebuffCount * 2);
    let bossEffectiveDamage = Math.max(0, bossRawDamage - bossDebuffCount * 2);

    // Type advantage
    const typeAdvantage = { 'rock': 'scissors', 'scissors': 'paper', 'paper': 'rock' };
    const playerType = playerPlayedCards.length > 0 ? playerPlayedCards[0].type : null;
    const bossType = bossPlayedCards.length > 0 ? bossPlayedCards[0].type : null;
    let damageDealt = 0;
    let dealer = '';

    if (playerType && bossType) {
        if (typeAdvantage[playerType] === bossType) {
            damageDealt = playerEffectiveDamage;
            dealer = 'player';
        } else if (typeAdvantage[bossType] === playerType) {
            damageDealt = bossEffectiveDamage;
            dealer = 'boss';
        } else {
            damageDealt = Math.abs(playerEffectiveDamage - bossEffectiveDamage);
            dealer = playerEffectiveDamage > bossEffectiveDamage ? 'player' : bossEffectiveDamage > playerEffectiveDamage ? 'boss' : '';
        }
    } else if (playerType) {
        damageDealt = playerEffectiveDamage;
        dealer = 'player';
    } else if (bossType) {
        damageDealt = bossEffectiveDamage;
        dealer = 'boss';
    }

    // Apply shields
    const playerShieldCount = playerPlayedCards.filter(card => card.ability === 'shield').length;
    const bossShieldCount = bossPlayedCards.filter(card => card.ability === 'shield').length;
    if (dealer === 'player' && damageDealt > 0) {
        damageDealt = Math.max(0, damageDealt - bossShieldCount * 3);
        bossHealth -= damageDealt;
    } else if (dealer === 'boss' && damageDealt > 0) {
        damageDealt = Math.max(0, damageDealt - playerShieldCount * 3);
        playerHealth -= damageDealt;
    }

    // Update UI
    document.getElementById('player-health').textContent = `Player Health: ${playerHealth} | Mana: ${playerMana}`;
    document.getElementById('boss-health').textContent = `Boss Health: ${bossHealth} | Mana: ${bossMana}`;
    let resultText = `Player Damage: ${playerEffectiveDamage} (Raw: ${playerRawDamage})\n`;
    resultText += `Boss Damage: ${bossEffectiveDamage} (Raw: ${bossRawDamage})\n`;
    if (dealer === 'player' && damageDealt > 0) resultText += `Player deals ${damageDealt} damage to boss.`;
    else if (dealer === 'boss' && damageDealt > 0) resultText += `Boss deals ${damageDealt} damage to player.`;
    else resultText += 'No damage dealt.';
    document.getElementById('result').textContent = resultText;

    // Animate
    animatePlay(playerPlayedCards, playerPlayedIndices, 'hand', 'player-card', () => {
        animatePlay(bossPlayedCards, bossPlayedIndices, 'boss-hand', 'boss-card', () => {
            // After both animations, set played slots to null
            playerPlayedIndices.forEach(idx => playerHand[idx] = null);
            bossPlayedIndices.forEach(idx => bossHand[idx] = null);
            displayHand();
            displayBossHand();
            document.getElementById('play-cards').disabled = true;
            document.getElementById('end-turn').disabled = true;
            document.getElementById('reveal-card').disabled = true;
            document.getElementById('next-round').disabled = false;
        });
    });

    // Set reset flags
    playerManaReset = playerMana === 0;
    bossManaReset = bossMana === 0;

    isFirstTurn = false;
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
    selectedCardIndices = [];
    revealedIndices = [];
    playerPassed = false;
    bossPassed = false;
    document.getElementById('ability-desc').textContent = 'Select a card to see its ability.';
    document.getElementById('player-card').innerHTML = '?';
    document.getElementById('boss-card').innerHTML = '?';
    document.getElementById('result').textContent = '';
    document.getElementById('play-cards').disabled = false;
    document.getElementById('end-turn').disabled = false;
    document.getElementById('reveal-card').disabled = false;
    document.getElementById('next-round').disabled = true;
    displayHand();
    displayBossHand();
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
    selectedCardIndices = [];
    revealedIndices = [];
    isFirstTurn = true;
    for (let i = 0; i < 4; i++) {
        playerHand[i] = drawCard();
        bossHand[i] = drawBossCard();
    }
    startTurn();
}

// Button handlers
document.getElementById('play-cards').onclick = () => {
    if (selectedCardIndices.length === 0) {
        alert('Select cards to play!');
        return;
    }
    const totalCost = selectedCardIndices.reduce((sum, idx) => sum + (playerHand[idx] ? playerHand[idx].cost : 0), 0);
    if (totalCost > playerMana) {
        alert('Not enough mana!');
        return;
    }
    resolveTurn();
};

document.getElementById('end-turn').onclick = () => {
    selectedCardIndices = [];
    resolveTurn();
};

document.getElementById('reveal-card').onclick = () => {
    if (playerMana < cardRevealCost) {
        alert('Not enough mana to reveal a card!');
        return;
    }
    isRevealing = true;
};

document.getElementById('next-round').onclick = () => {
    startTurn();
};

// Initialize
startTurn();
