// Card class
class Card {
    constructor(type, damage, cost, ability = null) {
        this.type = type; // 'rock', 'paper', 'scissors'
        this.damage = damage; // 1 to 10
        this.cost = cost; // ceil(damage / 2)
        this.ability = ability; // 'heal', 'debuff', 'chain', 'shield', or null
    }
}

// Generate identical deck for player and boss
function generateDeck() {
    const types = ['rock', 'paper', 'scissors'];
    const abilities = ['heal', 'debuff', 'chain', 'shield'];
    const deck = [];
    types.forEach(type => {
        for (let damage = 1; damage <= 10; damage++) {
            const cost = Math.ceil(damage / 2);
            const hasAbility = Math.random() < 0.2; // 20% chance
            const ability = hasAbility ? abilities[Math.floor(Math.random() * abilities.length)] : null;
            deck.push(new Card(type, damage, cost, ability));
        }
    });
    return deck;
}

// Utility to shuffle deck
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Initial setup
const baseDeck = generateDeck();
let playerDeck = shuffle([...baseDeck]);
let playerHand = [];
let playerDiscard = [];
let bossDeck = shuffle([...baseDeck]);
let playerHealth = 30;
let bossHealth = 30;
let playerMaxMana = 1;
let playerCurrentMana = 1;
let selectedCardIndex = null;
let playerLastCard = null;
let bossLastCard = null;
let playerShield = false;
let bossShield = false;
let bossDebuff = 0;

// Draw cards to hand
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

// Initial draw
while (playerHand.length < 4) drawCard();

// Display player's hand
function displayHand() {
    const handDiv = document.getElementById('hand');
    handDiv.innerHTML = '';
    playerHand.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        if (card.cost > playerCurrentMana) cardDiv.classList.add('unplayable');
        if (index === selectedCardIndex) cardDiv.classList.add('selected');
        cardDiv.style.backgroundImage = `url('images/${card.type}.png')`;
        cardDiv.onclick = () => selectCard(index);

        const damageDiv = document.createElement('div');
        damageDiv.classList.add('damage');
        damageDiv.textContent = card.damage;
        cardDiv.appendChild(damageDiv);

        const costDiv = document.createElement('div');
        costDiv.classList.add('cost');
        costDiv.textContent = card.cost;
        cardDiv.appendChild(costDiv);

        if (card.ability) {
            const abilityDiv = document.createElement('div');
            abilityDiv.classList.add('ability');
            abilityDiv.textContent = card.ability.charAt(0).toUpperCase() + card.ability.slice(1);
            cardDiv.appendChild(abilityDiv);
        }

        handDiv.appendChild(cardDiv);
    });
    document.getElementById('submit-card').disabled = selectedCardIndex === null;
}

// Select a card and show ability
function selectCard(index) {
    selectedCardIndex = index;
    const card = playerHand[index];
    const desc = document.getElementById('ability-desc');
    if (card.ability) {
        switch (card.ability) {
            case 'heal': desc.textContent = 'Restore 3 health when played.'; break;
            case 'debuff': desc.textContent = "Reduce opponent's next card's damage by 2."; break;
            case 'chain': desc.textContent = 'If the previous card played was the same type, gain +3 damage.'; break;
            case 'shield': desc.textContent = 'Block the next damage you would take.'; break;
        }
    } else {
        desc.textContent = 'No special ability.';
    }
    displayHand();
}

// Compare cards with type advantage
function compareCards(playerCard, bossCard) {
    const typeAdvantage = { 'rock': 'scissors', 'scissors': 'paper', 'paper': 'rock' };
    let playerDamage = playerCard.damage;
    let bossDamage = bossCard.damage - bossDebuff;
    if (bossDebuff > 0) bossDebuff = 0; // Clear debuff after applying
    let playerBonus = typeAdvantage[playerCard.type] === bossCard.type ? 3 : 0;
    let bossBonus = typeAdvantage[bossCard.type] === playerCard.type ? 3 : 0;

    if (playerCard.ability === 'chain' && playerLastCard && playerLastCard.type === playerCard.type) {
        playerDamage += 3;
    }

    const playerEffective = playerDamage + playerBonus;
    const bossEffective = bossDamage + bossBonus;

    return {
        winner: playerEffective > bossEffective ? 'player' : bossEffective > playerEffective ? 'boss' : 'tie',
        playerDamage: playerDamage,
        bossDamage: bossDamage,
        playerBonus: playerBonus,
        bossBonus: bossBonus,
        playerEffective: playerEffective,
        bossEffective: bossEffective
    };
}

// Play card with animation
function animatePlay(card, targetId, callback) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card', 'playing');
    cardDiv.style.backgroundImage = `url('images/${card.type}.png')`;
    cardDiv.innerHTML = `<div class="damage">${card.damage}</div><div class="cost">${card.cost}</div>`;
    if (card.ability) cardDiv.innerHTML += `<div class="ability">${card.ability.charAt(0).toUpperCase() + card.ability.slice(1)}</div>`;
    document.getElementById(targetId).innerHTML = '';
    document.getElementById(targetId).appendChild(cardDiv);
    setTimeout(() => {
        cardDiv.classList.remove('playing');
        callback();
    }, 500);
}

// Submit and play turn
document.getElementById('submit-card').onclick = () => {
    if (selectedCardIndex === null) return;

    const playerCard = playerHand[selectedCardIndex];
    if (playerCard.cost > playerCurrentMana) {
        alert('Not enough mana to play this card!');
        return;
    }

    // Remove card from hand and update state
    playerCurrentMana -= playerCard.cost;
    playerHand.splice(selectedCardIndex, 1);
    playerDiscard.push(playerCard);

    // Animate player card
    animatePlay(playerCard, 'player-card', () => {
        // Boss plays
        const bossCard = bossDeck[Math.floor(Math.random() * bossDeck.length)];
        animatePlay(bossCard, 'boss-card', () => {
            // Resolve turn
            const comparison = compareCards(playerCard, bossCard);
            let resultText = `Player: ${playerCard.type}-${playerCard.damage}`;
            if (comparison.playerBonus > 0) resultText += ` (+3 type bonus) = ${comparison.playerEffective}`;
            if (playerCard.ability === 'chain' && playerLastCard && playerLastCard.type === playerCard.type) {
                resultText += ` (+3 chain bonus)`;
            }
            resultText += `\nBoss: ${bossCard.type}-${comparison.bossDamage}`;
            if (comparison.bossBonus > 0) resultText += ` (+3 type bonus) = ${comparison.bossEffective}`;

            if (comparison.winner === 'player') {
                if (bossShield) {
                    resultText += '\nBoss Shield blocks damage!';
                    bossShield = false;
                } else {
                    bossHealth -= playerCard.damage;
                    resultText += `\nPlayer wins! Boss takes ${playerCard.damage} damage.`;
                }
            } else if (comparison.winner === 'boss') {
                if (playerShield) {
                    resultText += '\nPlayer Shield blocks damage!';
                    playerShield = false;
                } else {
                    playerHealth -= bossCard.damage;
                    resultText += `\nBoss wins! Player takes ${bossCard.damage} damage.`;
                }
            } else {
                resultText += '\nTie! No damage dealt.';
            }

            // Apply abilities
            if (playerCard.ability === 'heal') playerHealth = Math.min(playerHealth + 3, 30);
            if (playerCard.ability === 'debuff') bossDebuff = 2;
            if (playerCard.ability === 'shield') playerShield = true;

            // Update last played
            playerLastCard = playerCard;
            bossLastCard = bossCard;
            document.getElementById('player-last').textContent = `Player's Last Card: ${playerLastCard.type}-${playerLastCard.damage}`;
            document.getElementById('boss-last').textContent = `Boss's Last Card: ${bossLastCard.type}-${bossLastCard.damage}`;

            // Update UI
            document.getElementById('player-health').textContent = `Player Health: ${playerHealth} | Mana: ${playerCurrentMana}/${playerMaxMana}`;
            document.getElementById('boss-health').textContent = `Boss Health: ${bossHealth}`;
            document.getElementById('result').textContent = resultText;

            // Check game end
            if (playerHealth <= 0 || bossHealth <= 0) {
                setTimeout(() => {
                    alert(playerHealth <= 0 ? 'Boss wins!' : 'Player wins!');
                    resetGame();
                }, 1000);
            } else {
                startTurn();
            }
        });
    });
};

// Start new turn
function startTurn() {
    playerMaxMana = Math.min(playerMaxMana + 1, 10);
    playerCurrentMana = playerMaxMana;
    while (playerHand.length < 4) {
        const newCard = drawCard();
        displayHand();
        const lastCard = document.querySelector('#hand .card:last-child');
        lastCard.classList.add('drawing');
        setTimeout(() => lastCard.classList.remove('drawing'), 50);
    }
    selectedCardIndex = null;
    document.getElementById('ability-desc').textContent = 'Select a card to see its ability.';
    document.getElementById('player-card').textContent = '?';
    document.getElementById('boss-card').textContent = '?';
    document.getElementById('result').textContent = '';
    document.getElementById('player-health').textContent = `Player Health: ${playerHealth} | Mana: ${playerCurrentMana}/${playerMaxMana}`;
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
    playerMaxMana = 1;
    playerCurrentMana = 1;
    selectedCardIndex = null;
    playerLastCard = null;
    bossLastCard = null;
    playerShield = false;
    bossShield = false;
    bossDebuff = 0;
    while (playerHand.length < 4) drawCard();
    startTurn();
}

// Start game
startTurn();