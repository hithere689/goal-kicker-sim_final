const suits = ["Spades", "Hearts", "Diamonds", "Clubs"];
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"];
const suitSymbols = { "Spades": "\u2660", "Hearts": "\u2665", "Diamonds": "\u2666", "Clubs": "\u2663" };
let deck = [];
let usedCards = [];
let trials = 0, within = 0, outside = 0, same = 0, finalPayout = 0;
let trialHistory = [];
let currentPage = 1;
const trialsPerPage = 10;

function initializeDeck() {
    deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({ rank, suit });
        }
    }
    shuffle(deck);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function drawCard() {
    if (deck.length < 3 && document.querySelector('input[name="condition"]:checked').value === "dependent") {
        trialHistory.push({
            card1: "Deck Reshuffled",
            card2: "---",
            card3: "---",
            result: "---",
            outcome: 0,
            currentPayout: finalPayout
        });
        updateTable();
        initializeDeck();
    }
    if (deck.length === 0) initializeDeck();
    const card = deck.pop();
    usedCards.push(card);
    return card;
}

function drawDifferentRankCard(existingRank) {
    let card;
    do {
        card = drawCard();
    } while (card.rank === existingRank);
    return card;
}

function getCardValue(rank) {
    if (rank === "A") return 1;
    if (rank === "T") return 10;
    if (rank === "J") return 11;
    if (rank === "Q") return 12;
    if (rank === "K") return 13;
    return parseInt(rank);
}

function checkResult(card1, card2, card3) {
    const val1 = getCardValue(card1.rank);
    const val2 = getCardValue(card2.rank);
    const val3 = getCardValue(card3.rank);
    const min = Math.min(val1, val2);
    const max = Math.max(val1, val2);

    if (val3 === val1 || val3 === val2) return "Same";
    if (val3 > min && val3 < max) return "Within";
    return "Outside";
}

function getAutoGuess(card1, card2) {
    const val1 = getCardValue(card1.rank);
    const val2 = getCardValue(card2.rank);
    const min = Math.min(val1, val2);
    const max = Math.max(val1, val2);
    const withinCount = max - min - 1; // Cards strictly between min and max
    const outsideCount = 13 - withinCount - 2; // Total ranks minus within and two drawn
    return withinCount >= outsideCount ? "Within" : "Outside"; // Within for tie
}

function validateInputs(bettingMode) {
    if (bettingMode === "payouts") {
        const bet = parseInt(document.getElementById("betInput").value);
        const withinVal = parseInt(document.getElementById("withinInput").value);
        const outsideVal = parseInt(document.getElementById("outsideInput").value);
        const sameVal = parseInt(document.getElementById("sameInput").value);
        return Number.isInteger(bet) && bet > 0 &&
               Number.isInteger(withinVal) &&
               Number.isInteger(outsideVal) &&
               Number.isInteger(sameVal);
    } else {
        const bet = parseInt(document.getElementById("guessBetInput").value);
        const winVal = parseInt(document.getElementById("winInput").value);
        const loseVal = parseInt(document.getElementById("loseInput").value);
        const sameVal = parseInt(document.getElementById("guessSameInput").value);
        return Number.isInteger(bet) && bet > 0 &&
               Number.isInteger(winVal) &&
               Number.isInteger(loseVal) &&
               Number.isInteger(sameVal);
    }
}

function getOutcome(result, card1, card2) {
    const bettingMode = document.querySelector('input[name="betting"]:checked').value;
    if (bettingMode === "payouts") {
        const bet = parseInt(document.getElementById("betInput").value);
        const settings = {
            "Within": parseInt(document.getElementById("withinInput").value),
            "Outside": parseInt(document.getElementById("outsideInput").value),
            "Same": parseInt(document.getElementById("sameInput").value)
        };
        return settings[result] - bet;
    } else {
        const bet = parseInt(document.getElementById("guessBetInput").value);
        const winPayout = parseInt(document.getElementById("winInput").value);
        const losePayout = parseInt(document.getElementById("loseInput").value);
        const samePayout = parseInt(document.getElementById("guessSameInput").value);
        if (result === "Same") return samePayout - bet;
        const guess = getAutoGuess(card1, card2);
        return (result === guess ? winPayout : losePayout) - bet;
    }
}

function updateStatsAndPayout(result, outcome) {
    trials++;
    if (result === "Within") within++;
    else if (result === "Outside") outside++;
    else if (result === "Same") same++;
    finalPayout += outcome;
    document.getElementById("stats").textContent = 
        `Total Trials: ${trials}, Within: ${within}, Outside: ${outside}, Same: ${same}, Final Payout: ${finalPayout}`;
}

function displayCard(card, elementId) {
    const img = document.getElementById(elementId);
    const rankSpan = document.getElementById(`rank${elementId.slice(-1)}`);
    img.src = `cards/${card.rank}${card.suit[0]}.svg`;
    img.style.display = "inline";
    rankSpan.textContent = card.rank === "T" ? "10" : card.rank;
    rankSpan.style.display = "inline";
}

function clearCards() {
    document.getElementById("card1").style.display = "none";
    document.getElementById("card2").style.display = "none";
    document.getElementById("card3").style.display = "none";
    document.getElementById("rank1").style.display = "none";
    document.getElementById("rank2").style.display = "none";
    document.getElementById("rank3").style.display = "none";
    document.getElementById("result").textContent = "";
    document.getElementById("guessOptions").style.display = "none";
}

function formatCard(card) {
    if (card === "Deck Reshuffled") return card;
    const rank = card.rank === "T" ? "10" : card.rank;
    return `${rank}${suitSymbols[card.suit] || ''}`;
}

function updateTable() {
    const tbody = document.getElementById("trialRows");
    tbody.innerHTML = "";
    const start = (currentPage - 1) * trialsPerPage;
    const end = Math.min(start + trialsPerPage, trialHistory.length);
    for (let i = start; i < end; i++) {
        const trial = trialHistory[i];
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${trial.card1}</td>
            <td>${trial.card2}</td>
            <td>${trial.card3}</td>
            <td>${trial.result}</td>
            <td>${trial.outcome}</td>
            <td>${trial.currentPayout}</td>
        `;
        tbody.appendChild(row);
    }

    const totalPages = Math.ceil(trialHistory.length / trialsPerPage);
    document.getElementById("pageInfo").textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById("prevPage").disabled = currentPage === 1;
    document.getElementById("nextPage").disabled = currentPage === totalPages;
}

document.querySelectorAll('input[name="betting"]').forEach(radio => {
    radio.addEventListener("change", () => {
        const bettingMode = radio.value;
        document.getElementById("payoutInputs").style.display = bettingMode === "payouts" ? "inline-block" : "none";
        document.getElementById("guessInputs").style.display = bettingMode === "guess" ? "inline-block" : "none";
    });
});

document.getElementById("interactiveBtn").addEventListener("click", () => {
    clearCards();
    initializeDeck();
    const card1 = drawCard();
    const card2 = drawDifferentRankCard(card1.rank);
    displayCard(card1, "card1");
    displayCard(card2, "card2");
    document.getElementById("guessOptions").style.display = "block";

    document.querySelectorAll(".guess").forEach(btn => {
        btn.onclick = () => {
            const card3 = drawCard();
            displayCard(card3, "card3");
            const result = checkResult(card1, card2, card3);
            const guess = btn.dataset.guess;
            document.getElementById("result").textContent = 
                `Result: ${result}${guess === result.toLowerCase() ? " (Correct!)" : " (Wrong)"}`;
        };
    });
});

document.getElementById("autoBtn").addEventListener("click", () => {
    const bettingMode = document.querySelector('input[name="betting"]:checked').value;
    if (!validateInputs(bettingMode)) {
        document.getElementById("result").textContent = "Please enter valid integer inputs (Bet > 0)";
        return;
    }
    clearCards();
    if (document.querySelector('input[name="condition"]:checked').value === "independent") {
        initializeDeck();
    }
    const card1 = drawCard();
    const card2 = drawDifferentRankCard(card1.rank);
    const card3 = drawCard();
    displayCard(card1, "card1");
    displayCard(card2, "card2");
    displayCard(card3, "card3");
    const result = checkResult(card1, card2, card3);
    const outcome = getOutcome(result, card1, card2);
    document.getElementById("result").textContent = `Result: ${result}`;
    updateStatsAndPayout(result, outcome);
    trialHistory.push({
        card1: formatCard(card1),
        card2: formatCard(card2),
        card3: formatCard(card3),
        result: result,
        outcome: outcome,
        currentPayout: finalPayout
    });
    updateTable();
    setTimeout(clearCards, 1000); // 1 second
});

document.getElementById("runTrials").addEventListener("click", async () => {
    const bettingMode = document.querySelector('input[name="betting"]:checked').value;
    if (!validateInputs(bettingMode)) {
        document.getElementById("result").textContent = "Please enter valid integer inputs (Bet > 0)";
        return;
    }
    clearCards();
    const numTrials = parseInt(document.getElementById("trialCount").value);
    const condition = document.querySelector('input[name="condition"]:checked').value;
    if (condition === "independent") {
        for (let i = 0; i < numTrials; i++) {
            initializeDeck();
            const card1 = drawCard();
            const card2 = drawDifferentRankCard(card1.rank);
            const card3 = drawCard();
            displayCard(card1, "card1");
            displayCard(card2, "card2");
            displayCard(card3, "card3");
            const result = checkResult(card1, card2, card3);
            const outcome = getOutcome(result, card1, card2);
            document.getElementById("result").textContent = `Result: ${result}`;
            updateStatsAndPayout(result, outcome);
            trialHistory.push({
                card1: formatCard(card1),
                card2: formatCard(card2),
                card3: formatCard(card3),
                result: result,
                outcome: outcome,
                currentPayout: finalPayout
            });
            updateTable();
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1s per trial
            clearCards();
        }
    } else {
        for (let i = 0; i < numTrials; i++) {
            const card1 = drawCard();
            const card2 = drawDifferentRankCard(card1.rank);
            const card3 = drawCard();
            displayCard(card1, "card1");
            displayCard(card2, "card2");
            displayCard(card3, "card3");
            const result = checkResult(card1, card2, card3);
            const outcome = getOutcome(result, card1, card2);
            document.getElementById("result").textContent = `Result: ${result}`;
            updateStatsAndPayout(result, outcome);
            trialHistory.push({
                card1: formatCard(card1),
                card2: formatCard(card2),
                card3: formatCard(card3),
                result: result,
                outcome: outcome,
                currentPayout: finalPayout
            });
            updateTable();
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1s per trial
            clearCards();
        }
    }
    document.getElementById("result").textContent = `Completed ${numTrials} trials. Check stats!`;
});

document.getElementById("resetStatsBtn").addEventListener("click", () => {
    trials = 0;
    within = 0;
    outside = 0;
    same = 0;
    finalPayout = 0;
    trialHistory = [];
    currentPage = 1;
    document.getElementById("stats").textContent = 
        `Total Trials: ${trials}, Within: ${within}, Outside: ${outside}, Same: ${same}, Final Payout: ${finalPayout}`;
    updateTable();
});

document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        updateTable();
    }
});

document.getElementById("nextPage").addEventListener("click", () => {
    const totalPages = Math.ceil(trialHistory.length / trialsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        updateTable();
    }
});

initializeDeck();