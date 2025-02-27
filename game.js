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
let playerHand = [];
let playerDiscard = [];
let bossDeck = shuffle([...baseDeck]);
let bossHealth = 30;
let playerHealth = 30;
let playerMaxMana = 3;
let playerCurrentMana = 3;
let selectedCardIndices = [];

// Draw card
function drawCard() {
    if (playerDeck.length === 0) {
        playerDeck = shuffle([...playerDiscard]);
        playerDiscard = [];
    }
    const card = playerDeck.pop();
    playerHand.push(card);
    document.getElementById('deck-count').textContent = `Deck: ${playerDeck.length}`;
    return card;
}

// Initial hand
while (playerHand.length < 4) drawCard();

// Display hand
function displayHand() {
    const handDiv = document.getElementById('hand');
    handDiv.innerHTML = '';
    let totalCost = selectedCardIndices.reduce((sum, idx) => sum + playerHand[idx].cost, 0);
    playerHand.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        if (selectedCardIndices.includes(index)) cardDiv.classList.add('selected');
        cardDiv.style.backgroundImage = `url('images/${card.type}.png')`;
        cardDiv.onclick = () => selectCard(index);

        cardDiv.innerHTML = `
            <div class="damage">${card.damage}</div>
            <div class="mana-cost">${card.cost}</div>
            ${card.ability ? `<div>${card.ability.charAt(0).toUpperCase() + card.ability.slice(1)}</div>` : ''}
        `;
        handDiv.appendChild(cardDiv);
    });
    document.getElementById('submit-card').disabled = selectedCardIndices.length === 0 || totalCost > playerCurrentMana;
    document.getElementById('player-health').textContent = `Player Health: ${playerHealth} | Mana: ${playerCurrentMana}/3`;
}

// Select card
function selectCard(index) {
    if (selectedCardIndices.includes(index)) {
        selectedCardIndices = selectedCardIndices.filter(i => i !== index);
    } else {
        if (selectedCardIndices.length === 0 || playerHand[index].type === playerHand[selectedCardIndices[0]].type) {
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

// Boss card selection logic
function bossSelectCards() {
    const bossMana = 3;
    const availableTypes = [...new Set(bossDeck.map(card => card.type))];
    if (availableTypes.length === 0) return [];

    // Randomly select a type
    const selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const typeCards = bossDeck.filter(card => card.type === selectedType);

    // Generate all possible combinations (up to 3 cards for simplicity)
    const combinations = [];
    for (let i = 0; i < typeCards.length; i++) {
        // Single card
        combinations.push([typeCards[i]]);
        for (let j = i + 1; j < typeCards.length; j++) {
            // Two cards
            combinations.push([typeCards[i], typeCards[j]]);
            for (let k = j + 1; k < typeCards.length; k++) {
                // Three cards
                combinations.push([typeCards[i], typeCards[j], typeCards[k]]);
            }
        }
    }

    // Filter combinations where total cost ≤ bossMana
    const validCombinations = combinations.filter(combo => {
        const totalCost = combo.reduce((sum, card) => sum + card.cost, 0);
        return totalCost <= bossMana;
    });

    // If no valid combinations, pick a single card with cost ≤ 3
    if (validCombinations.length === 0) {
        const affordableCard = typeCards.find(card => card.cost <= bossMana);
        return affordableCard ? [affordableCard] : [];
    }

    // Randomly select a valid combination
    const selectedCombo = validCombinations[Math.floor(Math.random() * validCombinations.length)];

    // Remove selected cards from bossDeck
    selectedCombo.forEach(card => {
        const index = bossDeck.findIndex(c => c === card);
        if (index !== -1) bossDeck.splice(index, 1);
    });

    return selectedCombo;
}

// Animate card play
function animatePlay(cards, targetId, callback) {
    const targetDiv = document.getElementById(targetId);
    targetDiv.innerHTML = '';
    cards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        cardDiv.style.backgroundImage = `url('images/${card.type}.png')`;
        cardDiv.innerHTML = `
            <div class="damage">${card.damage}</div>
            <div class="mana-cost">${card.cost}</div>
            ${card.ability ? `<div>${card.ability.charAt(0).toUpperCase() + card.ability.slice(1)}</div>` : ''}
        `;
        targetDiv.appendChild(cardDiv);
    });
    setTimeout(callback, 500);
}

// Submit turn
document.getElementById('submit-card').onclick = () => {
    if (selectedCardIndices.length === 0) return;
    let totalCost = selectedCardIndices.reduce((sum, idx) => sum + playerHand[idx].cost, 0);
    if (totalCost > playerCurrentMana) {
        alert('Not enough mana!');
        return;
    }

    playerCurrentMana -= totalCost;
    const playedCards = selectedCardIndices.sort((a, b) => b - a).map(idx => playerHand[idx]);
    playerHand = playerHand.filter((_, idx) => !selectedCardIndices.includes(idx));
    playedCards.forEach(card => playerDiscard.push(card));

    const bossCards = bossSelectCards();

    // Apply heals
    playedCards.forEach(card => {
        if (card.ability === 'heal') playerHealth = Math.min(playerHealth + 3, 30);
    });
    bossCards.forEach(card => {
        if (card.ability === 'heal') bossHealth = Math.min(bossHealth + 3, 30);
    });

    // Calculate raw damage
    let playerRawDamage = playedCards.reduce((sum, card) => sum + card.damage, 0);
    let bossRawDamage = bossCards.reduce((sum, card) => sum + card.damage, 0);

    // Apply debuffs
    const playerDebuffCount = bossCards.filter(card => card.ability === 'debuff').length;
    const bossDebuffCount = playedCards.filter(card => card.ability === 'debuff').length;
    let playerEffectiveDamage = Math.max(0, playerRawDamage - playerDebuffCount * 2);
    let bossEffectiveDamage = Math.max(0, bossRawDamage - bossDebuffCount * 2);

    // Determine type advantage
    const typeAdvantage = { 'rock': 'scissors', 'scissors': 'paper', 'paper': 'rock' };
    const playerType = playedCards[0]?.type;
    const bossType = bossCards[0]?.type;
    let advantage = 'neutral';
    if (playerType && bossType) {
        if (typeAdvantage[playerType] === bossType) advantage = 'player';
        else if (typeAdvantage[bossType] === playerType) advantage = 'boss';
    }

    // Calculate damage
    let damageDealt = 0;
    let dealer = '';
    if (advantage === 'player') {
        damageDealt = playerEffectiveDamage;
        dealer = 'player';
    } else if (advantage === 'boss') {
        damageDealt = bossEffectiveDamage;
        dealer = 'boss';
    } else {
        damageDealt = Math.abs(playerEffectiveDamage - bossEffectiveDamage);
        dealer = playerEffectiveDamage > bossEffectiveDamage ? 'player' : bossEffectiveDamage > playerEffectiveDamage ? 'boss' : '';
    }

    // Apply shields
    const playerShieldCount = playedCards.filter(card => card.ability === 'shield').length;
    const bossShieldCount = bossCards.filter(card => card.ability === 'shield').length;
    if (dealer === 'player' && damageDealt > 0) {
        damageDealt = Math.max(0, damageDealt - bossShieldCount * 3);
        bossHealth -= damageDealt;
    } else if (dealer === 'boss' && damageDealt > 0) {
        damageDealt = Math.max(0, damageDealt - playerShieldCount * 3);
        playerHealth -= damageDealt;
    }

    // Update UI
    document.getElementById('player-health').textContent = `Player Health: ${playerHealth} | Mana: ${playerCurrentMana}/3`;
    document.getElementById('boss-health').textContent = `Boss Health: ${bossHealth}`;

    let resultText = `Player Damage: ${playerEffectiveDamage} (Raw: ${playerRawDamage})\n`;
    resultText += `Boss Damage: ${bossEffectiveDamage} (Raw: ${bossRawDamage})\n`;
    if (advantage === 'player') resultText += `Player has type advantage! Deals ${damageDealt} damage to boss.`;
    else if (advantage === 'boss') resultText += `Boss has type advantage! Deals ${damageDealt} damage to player.`;
    else if (damageDealt > 0) resultText += `${dealer.charAt(0).toUpperCase() + dealer.slice(1)} deals ${damageDealt} damage to ${dealer === 'player' ? 'boss' : 'player'}.`;
    else resultText += 'Tie! No damage dealt.';
    document.getElementById('result').textContent = resultText;

    animatePlay(playedCards, 'player-card', () => {
        animatePlay(bossCards, 'boss-card', () => {
            if (playerHealth <= 0 || bossHealth <= 0) {
                setTimeout(() => {
                    alert(playerHealth <= 0 ? 'Boss wins!' : 'Player wins!');
                    resetGame();
                }, 1000);
            } else {
                document.getElementById('next-round').style.display = 'block';
                document.getElementById('submit-card').disabled = true;
            }
        });
    });
};

// Next Round
document.getElementById('next-round').onclick = () => {
    document.getElementById('next-round').style.display = 'none';
    document.getElementById('submit-card').disabled = false;
    startTurn();
};

// Start turn
function startTurn() {
    playerCurrentMana = playerMaxMana;
    while (playerHand.length < 4) drawCard();
    selectedCardIndices = [];
    document.getElementById('ability-desc').textContent = 'Select a card to see its ability.';
    document.getElementById('player-card').innerHTML = '?';
    document.getElementById('boss-card').innerHTML = '?';
    document.getElementById('result').textContent = '';
    document.getElementById('player-health').textContent = `Player Health: ${playerHealth} | Mana: ${playerCurrentMana}/3`;
    displayHand();
}

// Reset game
function resetGame() {
    playerDeck = shuffle([...baseDeck]);
    playerHand = [];
    playerDiscard = [];
    bossDeck = shuffle([...baseDeck]);
    playerHealth = 30;
    bossHealth = 30;
    playerMaxMana = 3;
    playerCurrentMana = 3;
    selectedCardIndices = [];
    while (playerHand.length < 4) drawCard();
    startTurn();
}

// Initialize
startTurn();
