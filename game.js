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
            let cost;
            if (damage <= 3) cost = 1;
            else if (damage <= 6) cost = 2;
            else cost = 3; // 7-10 cost 3 mana
            const hasAbility = Math.random() < 0.2; // 20% chance
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
    let totalCost = 0;
    selectedCardIndices.forEach(idx => totalCost += playerHand[idx].cost);
    playerHand.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        if (selectedCardIndices.includes(index)) cardDiv.classList.add('selected');
        cardDiv.style.backgroundImage = `url('images/${card.type}.png')`;
        cardDiv.onclick = () => selectCard(index);

        const damageDiv = document.createElement('div');
        damageDiv.classList.add('damage');
        damageDiv.textContent = card.damage;
        cardDiv.appendChild(damageDiv);

        const costDiv = document.createElement('div');
        costDiv.classList.add('mana-cost');
        costDiv.textContent = card.cost;
        cardDiv.appendChild(costDiv);

        if (card.ability) {
            const abilityDiv = document.createElement('div');
            abilityDiv.textContent = card.ability.charAt(0).toUpperCase() + card.ability.slice(1);
            cardDiv.appendChild(abilityDiv);
        }

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
            selectedCardIndices = [index]; // Replace selection if type differs
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

// Animate card play for multiple cards
function animatePlay(cards, targetId, callback) {
    const targetDiv = document.getElementById(targetId);
    targetDiv.innerHTML = ''; // Clear previous cards
    cards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        cardDiv.style.backgroundImage = `url('images/${card.type}.png')`;
        cardDiv.innerHTML = `<div class="damage">${card.damage}</div><div class="mana-cost">${card.cost}</div>`;
        if (card.ability) cardDiv.innerHTML += `<div>${card.ability.charAt(0).toUpperCase() + card.ability.slice(1)}</div>`;
        targetDiv.appendChild(cardDiv);
    });
    setTimeout(callback, 500);
}

// Submit turn with combined damage
document.getElementById('submit-card').onclick = () => {
    if (selectedCardIndices.length === 0) return;
    let totalCost = selectedCardIndices.reduce((sum, idx) => sum + playerHand[idx].cost, 0);
    if (totalCost > playerCurrentMana) {
        alert('Not enough mana!');
        return;
    }

    // Update mana and collect played cards
    playerCurrentMana -= totalCost;
    const playedCards = selectedCardIndices.sort((a, b) => b - a).map(idx => playerHand[idx]);
    playerHand = playerHand.filter((_, idx) => !selectedCardIndices.includes(idx));
    playedCards.forEach(card => playerDiscard.push(card));

    // Boss plays the same number of cards
    const bossCards = [];
    for (let i = 0; i < playedCards.length; i++) {
        bossCards.push(bossDeck[Math.floor(Math.random() * bossDeck.length)]);
    }

    // Step 1: Apply 'heal' abilities
    playedCards.forEach(card => {
        if (card.ability === 'heal') playerHealth = Math.min(playerHealth + 3, 30);
    });
    bossCards.forEach(card => {
        if (card.ability === 'heal') bossHealth = Math.min(bossHealth + 3, 30);
    });

    // Step 2: Calculate raw total damage
    let playerRawDamage = playedCards.reduce((sum, card) => sum + card.damage, 0);
    let bossRawDamage = bossCards.reduce((sum, card) => sum + card.damage, 0);

    // Step 3: Apply 'debuff' abilities
    const playerDebuffCount = bossCards.filter(card => card.ability === 'debuff').length;
    const bossDebuffCount = playedCards.filter(card => card.ability === 'debuff').length;
    let playerEffectiveDamage = Math.max(0, playerRawDamage - playerDebuffCount * 2);
    let bossEffectiveDamage = Math.max(0, bossRawDamage - bossDebuffCount * 2);

    // Step 4: Determine type advantage
    const typeAdvantage = { 'rock': 'scissors', 'scissors': 'paper', 'paper': 'rock' };
    const playerType = playedCards[0].type; // All player cards are the same type
    let wins = 0, losses = 0;
    bossCards.forEach(bossCard => {
        if (typeAdvantage[playerType] === bossCard.type) wins++;
        else if (typeAdvantage[bossCard.type] === playerType) losses++;
    });
    let advantage = wins > losses ? 'player' : losses > wins ? 'boss' : 'neutral';

    // Step 5: Calculate damage based on advantage
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

    // Step 6: Apply 'shield' abilities
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

    // Display result
    let resultText = `Player Damage: ${playerEffectiveDamage} (Raw: ${playerRawDamage})\n`;
    resultText += `Boss Damage: ${bossEffectiveDamage} (Raw: ${bossRawDamage})\n`;
    if (advantage === 'player') {
        resultText += `Player has type advantage! Deals ${damageDealt} damage to boss.`;
    } else if (advantage === 'boss') {
        resultText += `Boss has type advantage! Deals ${damageDealt} damage to player.`;
    } else if (damageDealt > 0) {
        resultText += `${dealer.charAt(0).toUpperCase() + dealer.slice(1)} deals ${damageDealt} damage to ${dealer === 'player' ? 'boss' : 'player'}.`;
    } else {
        resultText += 'Tie! No damage dealt.';
    }
    document.getElementById('result').textContent = resultText;

    // Animate cards
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

// Next Round button handler
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
