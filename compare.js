// Global variables
let activeSuggestion1 = -1;
let activeSuggestion2 = -1;
let pokemon1Data = null;
let pokemon2Data = null;

// DOM elements
const pokemon1Input = document.getElementById('pokemon1');
const pokemon2Input = document.getElementById('pokemon2');
const suggestions1Container = document.getElementById('suggestions1');
const suggestions2Container = document.getElementById('suggestions2');
const compareBtn = document.getElementById('compare-btn');
const comparisonResults = document.getElementById('comparison-results');
const pokemonCard1 = document.getElementById('pokemon-card-1');
const pokemonCard2 = document.getElementById('pokemon-card-2');
const winnerContainer = document.getElementById('winner-container');
const winnerCard = document.getElementById('winner-card');
const winnerReason = document.getElementById('winner-reason');
const loadingContainer = document.getElementById('loading-container');

// Event listeners for search inputs
pokemon1Input.addEventListener('input', function() {
    fetchSuggestions(this.value, suggestions1Container, 1);
});

pokemon2Input.addEventListener('input', function() {
    fetchSuggestions(this.value, suggestions2Container, 2);
});

// Event listeners for keyboard navigation
pokemon1Input.addEventListener('keydown', function(e) {
    handleKeyNavigation(e, suggestions1Container, 1);
});

pokemon2Input.addEventListener('keydown', function(e) {
    handleKeyNavigation(e, suggestions2Container, 2);
});

// Hide suggestions when clicking outside
document.addEventListener('click', function(e) {
    if (e.target !== pokemon1Input) {
        suggestions1Container.innerHTML = '';
        suggestions1Container.style.display = 'none';
    }
    if (e.target !== pokemon2Input) {
        suggestions2Container.innerHTML = '';
        suggestions2Container.style.display = 'none';
    }
});

// Compare button click event
compareBtn.addEventListener('click', function() {
    const pokemon1Name = pokemon1Input.value.trim().toLowerCase();
    const pokemon2Name = pokemon2Input.value.trim().toLowerCase();
    
    if (!pokemon1Name || !pokemon2Name) {
        alert('Please enter both Pokémon names');
        return;
    }
    
    if (pokemon1Name === pokemon2Name) {
        alert('Please select two different Pokémon');
        return;
    }
    
    showLoadingAnimation();
    
    // Fetch data for both Pokémon
    Promise.all([
        fetchPokemonData(pokemon1Name),
        fetchPokemonData(pokemon2Name)
    ])
    .then(([data1, data2]) => {
        pokemon1Data = data1;
        pokemon2Data = data2;
        
        setTimeout(() => {
            hideLoadingAnimation();
            displayComparisonResults();
        }, 1500);
    })
    .catch(error => {
        hideLoadingAnimation();
        alert('Error fetching Pokémon data. Please try again.');
        console.error(error);
    });
});

// Function to fetch suggestions
let allPokemonList = null;

async function getAllPokemonList() {
    if (allPokemonList) return allPokemonList;
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10000');
    const data = await response.json();
    allPokemonList = data.results;
    return allPokemonList;
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

const fetchSuggestions = debounce(async function(query, container, inputNum) {
    if (!query) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    const pokemonList = await getAllPokemonList();
    const filteredPokemon = pokemonList
        .filter(pokemon => pokemon.name.startsWith(query.toLowerCase()))
        .slice(0, 5);

    container.innerHTML = '';

    if (filteredPokemon.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';

    Promise.all(filteredPokemon.map(pokemon =>
        fetch(pokemon.url)
            .then(response => response.json())
            .then(pokemonData => ({
                name: pokemonData.name,
                img: pokemonData.sprites.front_default
            }))
    ))
    .then(pokemonDetails => {
        pokemonDetails.forEach(pokemon => {
            const div = document.createElement('div');
            div.className = 'suggestion-item-card';
            div.innerHTML = `
                <img class="suggestion-img" src="${pokemon.img}" alt="${pokemon.name}">
                <span class="suggestion-name">${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</span>
            `;

            div.addEventListener('mousedown', function(e) {
                e.preventDefault();
                if (inputNum === 1) {
                    pokemon1Input.value = pokemon.name;
                    activeSuggestion1 = -1;
                } else {
                    pokemon2Input.value = pokemon.name;
                    activeSuggestion2 = -1;
                }
                container.innerHTML = '';
                container.style.display = 'none';
            });

            container.appendChild(div);
        });
    });
}, 250);

// Add event listeners to hide suggestions when clicking outside
document.addEventListener('mousedown', function(event) {
    const suggestions1 = document.getElementById('suggestions1');
    const suggestions2 = document.getElementById('suggestions2');
    if (suggestions1 && !suggestions1.contains(event.target) && event.target !== pokemon1Input) {
        suggestions1.innerHTML = '';
        suggestions1.style.display = 'none';
    }
    if (suggestions2 && !suggestions2.contains(event.target) && event.target !== pokemon2Input) {
        suggestions2.innerHTML = '';
        suggestions2.style.display = 'none';
    }
});

// Function to handle keyboard navigation
function handleKeyNavigation(e, container, inputNum) {
    const items = container.querySelectorAll('.suggestion-item-card');
    if (!items.length) return;
    
    let activeVar = inputNum === 1 ? activeSuggestion1 : activeSuggestion2;
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeVar = (activeVar + 1) % items.length;
        updateActive(items, activeVar);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeVar = (activeVar - 1 + items.length) % items.length;
        updateActive(items, activeVar);
    } else if (e.key === 'Enter') {
        if (activeVar > -1) {
            e.preventDefault();
            items[activeVar].click();
        }
    }
    
    if (inputNum === 1) {
        activeSuggestion1 = activeVar;
    } else {
        activeSuggestion2 = activeVar;
    }
}

// Function to update active suggestion
function updateActive(items, activeIndex) {
    items.forEach((item, idx) => {
        item.classList.toggle('active', idx === activeIndex);
    });
}

// Function to fetch Pokémon data from PokeAPI
function fetchPokemonData(pokemonName) {
    return fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Pokémon "${pokemonName}" not found`);
            }
            return response.json();
        })
        .then(data => {
            // Extract and format the data we need
            return {
                name: data.name,
                image: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
                types: data.types.map(type => type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1)),
                stats: {
                    hp: data.stats.find(stat => stat.stat.name === 'hp').base_stat,
                    attack: data.stats.find(stat => stat.stat.name === 'attack').base_stat,
                    defense: data.stats.find(stat => stat.stat.name === 'defense').base_stat,
                    specialAttack: data.stats.find(stat => stat.stat.name === 'special-attack').base_stat,
                    specialDefense: data.stats.find(stat => stat.stat.name === 'special-defense').base_stat,
                    speed: data.stats.find(stat => stat.stat.name === 'speed').base_stat
                }
            };
        })
        .catch(error => {
            console.error(`Error fetching data for ${pokemonName}:`, error);
            return { error: `Could not find Pokémon "${pokemonName}"` };
        });
}

// Function to display comparison results
function displayComparisonResults() {
    if (!pokemon1Data || !pokemon2Data) return;
    
    // Render first Pokémon card
    renderPokemonCard(pokemonCard1, pokemon1Data);
    
    // Render second Pokémon card
    renderPokemonCard(pokemonCard2, pokemon2Data);
    
    // Show comparison results
    comparisonResults.classList.remove('hidden');
    
    // Determine winner
    determineWinner();
}

// Function to render a Pokémon card
function renderPokemonCard(cardElement, data) {
    if (!data || data.error) {
        cardElement.innerHTML = `<p class="error">${data?.error || 'Error loading Pokémon data'}</p>`;
        return;
    }
    
    // Get primary type for background
    const primaryType = data.types[0].toLowerCase();
    
    // Create type badges HTML
    const typesBadges = data.types.map(type => 
        `<span class="pokemon-type-badge type-${type.toLowerCase()}">${type}</span>`
    ).join('');
    
    // Calculate stat percentages (assuming max stat is 255)
    const maxStat = 255;
    const hpPercent = (data.stats.hp / maxStat) * 100;
    const attackPercent = (data.stats.attack / maxStat) * 100;
    const defensePercent = (data.stats.defense / maxStat) * 100;
    const spAttackPercent = (data.stats.specialAttack / maxStat) * 100;
    const spDefensePercent = (data.stats.specialDefense / maxStat) * 100;
    const speedPercent = (data.stats.speed / maxStat) * 100;
    
    // Set card HTML
    cardElement.innerHTML = `
        <div class="pokemon-compare-img">
            <img src="${data.image}" alt="${data.name}">
        </div>
        <h3 class="pokemon-compare-name">${data.name.charAt(0).toUpperCase() + data.name.slice(1)}</h3>
        <div class="pokemon-compare-types">${typesBadges}</div>
        <div class="pokemon-stats">
            <div class="stat-bar">
                <div class="stat-name">HP: ${data.stats.hp}</div>
                <div class="stat-bar-container">
                    <div class="stat-bar-fill" style="width: ${hpPercent}%"></div>
                </div>
            </div>
            <div class="stat-bar">
                <div class="stat-name">Attack: ${data.stats.attack}</div>
                <div class="stat-bar-container">
                    <div class="stat-bar-fill" style="width: ${attackPercent}%"></div>
                </div>
            </div>
            <div class="stat-bar">
                <div class="stat-name">Defense: ${data.stats.defense}</div>
                <div class="stat-bar-container">
                    <div class="stat-bar-fill" style="width: ${defensePercent}%"></div>
                </div>
            </div>
            <div class="stat-bar">
                <div class="stat-name">Sp. Atk: ${data.stats.specialAttack}</div>
                <div class="stat-bar-container">
                    <div class="stat-bar-fill" style="width: ${spAttackPercent}%"></div>
                </div>
            </div>
            <div class="stat-bar">
                <div class="stat-name">Sp. Def: ${data.stats.specialDefense}</div>
                <div class="stat-bar-container">
                    <div class="stat-bar-fill" style="width: ${spDefensePercent}%"></div>
                </div>
            </div>
            <div class="stat-bar">
                <div class="stat-name">Speed: ${data.stats.speed}</div>
                <div class="stat-bar-container">
                    <div class="stat-bar-fill" style="width: ${speedPercent}%"></div>
                </div>
            </div>
        </div>
    `;
    
    // Set card background based on type
    cardElement.className = `pokemon-compare-card type-${primaryType}`;
}

// Function to determine the winner
function determineWinner() {
    if (!pokemon1Data || !pokemon2Data) return;

    const stats1 = pokemon1Data.stats;
    const stats2 = pokemon2Data.stats;
    const total1 = Object.values(stats1).reduce((a, b) => a + b, 0);
    const total2 = Object.values(stats2).reduce((a, b) => a + b, 0);

    const type1 = pokemon1Data.types[0].toLowerCase();
    const type2 = pokemon2Data.types[0].toLowerCase();

    // Type advantage chart (simplified)
    const typeAdvantages = {
        'fire': ['grass', 'ice', 'bug', 'steel'],
        'water': ['fire', 'ground', 'rock'],
        'grass': ['water', 'ground', 'rock'],
        'electric': ['water', 'flying'],
        'psychic': ['fighting', 'poison'],
        'ice': ['grass', 'ground', 'flying', 'dragon'],
        'dragon': ['dragon'],
        'dark': ['psychic', 'ghost'],
        'fairy': ['fighting', 'dragon', 'dark']
    };

    let winner = null;
    let loser = null;
    let winnerTotal = 0;
    let loserTotal = 0;
    let reason = "";

    // Helper to check significant stat difference (15%)
    function isSignificantDifference(big, small) {
        return (big - small) / small > 0.15;
    }

    // 1. Type advantage, but only if stats are not much lower
    if (typeAdvantages[type1] && typeAdvantages[type1].includes(type2)) {
        if (!isSignificantDifference(total2, total1)) {
            winner = pokemon1Data;
            loser = pokemon2Data;
            winnerTotal = total1;
            loserTotal = total2;
            reason = `${pokemon1Data.name.charAt(0).toUpperCase() + pokemon1Data.name.slice(1)} has a type advantage over ${pokemon2Data.name.charAt(0).toUpperCase() + pokemon2Data.name.slice(1)} and comparable stats.`;
        } else {
            winner = pokemon2Data;
            loser = pokemon1Data;
            winnerTotal = total2;
            loserTotal = total1;
            reason = `${pokemon2Data.name.charAt(0).toUpperCase() + pokemon2Data.name.slice(1)} wins due to much higher stats, despite type disadvantage.`;
        }
    } else if (typeAdvantages[type2] && typeAdvantages[type2].includes(type1)) {
        if (!isSignificantDifference(total1, total2)) {
            winner = pokemon2Data;
            loser = pokemon1Data;
            winnerTotal = total2;
            loserTotal = total1;
            reason = `${pokemon2Data.name.charAt(0).toUpperCase() + pokemon2Data.name.slice(1)} has a type advantage over ${pokemon1Data.name.charAt(0).toUpperCase() + pokemon1Data.name.slice(1)} and comparable stats.`;
        } else {
            winner = pokemon1Data;
            loser = pokemon2Data;
            winnerTotal = total1;
            loserTotal = total2;
            reason = `${pokemon1Data.name.charAt(0).toUpperCase() + pokemon1Data.name.slice(1)} wins due to much higher stats, despite type disadvantage.`;
        }
    } else {
        // 2. If no type advantage, compare total stats
        if (total1 > total2) {
            winner = pokemon1Data;
            loser = pokemon2Data;
            winnerTotal = total1;
            loserTotal = total2;
            reason = `${pokemon1Data.name.charAt(0).toUpperCase() + pokemon1Data.name.slice(1)} has higher total stats (${total1} vs ${total2}).`;
        } else if (total2 > total1) {
            winner = pokemon2Data;
            loser = pokemon1Data;
            winnerTotal = total2;
            loserTotal = total1;
            reason = `${pokemon2Data.name.charAt(0).toUpperCase() + pokemon2Data.name.slice(1)} has higher total stats (${total2} vs ${total1}).`;
        } else {
            // 3. If total stats are equal, compare speed
            if (stats1.speed > stats2.speed) {
                winner = pokemon1Data;
                loser = pokemon2Data;
                winnerTotal = total1;
                loserTotal = total2;
                reason = `${pokemon1Data.name.charAt(0).toUpperCase() + pokemon1Data.name.slice(1)} is faster (Speed: ${stats1.speed} vs ${stats2.speed}).`;
            } else if (stats2.speed > stats1.speed) {
                winner = pokemon2Data;
                loser = pokemon1Data;
                winnerTotal = total2;
                loserTotal = total1;
                reason = `${pokemon2Data.name.charAt(0).toUpperCase() + pokemon2Data.name.slice(1)} is faster (Speed: ${stats2.speed} vs ${stats1.speed}).`;
            } else {
                // 4. If everything is equal, it's a tie
                winner = null;
                reason = "It's a tie! Both Pokémon are evenly matched.";
            }
        }
    }

    // Show in center winner area
    const centerWinner = document.getElementById('center-winner');
    if (centerWinner) {
        centerWinner.textContent = winner
            ? `${winner.name.charAt(0).toUpperCase() + winner.name.slice(1)} Wins!`
            : "It's a Tie!";
    }
}

// Loading animation functions
function showLoadingAnimation() {
    comparisonResults.classList.add('hidden');
    loadingContainer.classList.remove('hidden');
}

function hideLoadingAnimation() {
    loadingContainer.classList.add('hidden');
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Carousel Data (example, replace with your own or fetch dynamically)
// --- Carousel logic (auto-sliding, matching index.html style) ---
// Remove or comment out the old hardcoded carouselPokemon array
// const carouselPokemon = [ ... ];

// New: dynamically fetch and shuffle Pokémon for the carousel
let carouselPokemon = [];
let carouselIndex = 1;
let carouselInterval = null;

async function loadCarouselPokemon() {
    // Fetch a list of Pokémon (limit to 150 for speed)
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=150');
    const data = await response.json();
    let pokemonList = data.results;

    // Shuffle the list
    pokemonList = shuffleArray(pokemonList);

    // Fetch details for the first 10 shuffled Pokémon (to avoid too many API calls)
    const details = await Promise.all(
        pokemonList.slice(0, 10).map(async (pokemon) => {
            const res = await fetch(pokemon.url);
            const pokeData = await res.json();
            return {
                name: pokeData.name,
                image: pokeData.sprites.other['official-artwork'].front_default || pokeData.sprites.front_default,
                types: pokeData.types.map(t => t.type.name)
            };
        })
    );

    carouselPokemon = details;
    carouselIndex = 1;
    renderCarouselCompareMulti();
}

// Update renderCarouselCompareMulti to use the new carouselPokemon structure
function renderCarouselCompareMulti() {
    const carousel = document.getElementById('pokemon-carousel-compare');
    if (!carousel || carouselPokemon.length < 3) return;
    const prev = (carouselIndex - 1 + carouselPokemon.length) % carouselPokemon.length;
    const next = (carouselIndex + 1) % carouselPokemon.length;

    carousel.innerHTML = `
        <div class="carousel-item">
            <div class="carousel-img"><img src="${carouselPokemon[prev].image}" alt="${carouselPokemon[prev].name}"></div>
            <div class="carousel-name">${capitalize(carouselPokemon[prev].name)}</div>
        </div>
        <div class="carousel-item center">
            <div class="carousel-img"><img src="${carouselPokemon[carouselIndex].image}" alt="${carouselPokemon[carouselIndex].name}"></div>
            <div class="carousel-name">${capitalize(carouselPokemon[carouselIndex].name)}</div>
        </div>
        <div class="carousel-item">
            <div class="carousel-img"><img src="${carouselPokemon[next].image}" alt="${carouselPokemon[next].name}"></div>
            <div class="carousel-name">${capitalize(carouselPokemon[next].name)}</div>
        </div>
    `;
}

function startCarouselMulti() {
    renderCarouselCompareMulti();
    carouselInterval = setInterval(() => {
        carouselIndex = (carouselIndex + 1) % carouselPokemon.length;
        renderCarouselCompareMulti();
    }, 2200);
}

function stopCarouselMulti() {
    if (carouselInterval) clearInterval(carouselInterval);
}

document.addEventListener('DOMContentLoaded', () => {
    loadCarouselPokemon().then(() => {
        startCarouselMulti();
    });
    // Hide carousel on compare
    const compareBtn = document.getElementById('compare-btn');
    const carousel = document.getElementById('pokemon-carousel-compare');
    if (compareBtn && carousel) {
        compareBtn.addEventListener('click', () => {
            carousel.classList.add('hidden');
            stopCarouselMulti();
        });
    }
});

// Fisher-Yates shuffle function
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Example usage after fetching Pokémon data
async function fetchAndDisplayPokemon() {
    const response = await fetch('YOUR_API_ENDPOINT'); // Replace with your actual API endpoint
    let pokemonList = await response.json();

    // Shuffle the Pokémon list
    pokemonList = shuffleArray(pokemonList);

    // Now render the shuffled list in your carousel
    renderCarousel(pokemonList); // Replace with your actual render function
}

// Call this function when you want to load the carousel
fetchAndDisplayPokemon();