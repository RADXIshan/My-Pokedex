document.getElementById('pokemon-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const pokemonName = formData.get('pokemonName');
    fetch('/pokemon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pokemonName })
    })
    .then(response => response.json())
    .then(data => {
        showPokemon(data);
    })
    .catch(() => {
        showPokemon({ error: "Failed to fetch Pokémon data" });
    });
});

function showPokemon(data) {
    const container = document.getElementById("pokemon-container");
    const img = document.getElementById("pokemonImage");
    const name = document.getElementById("pokemonName");
    const types = document.getElementById("pokemonTypes");
    const height = document.getElementById("pokemonHeight");
    const weight = document.getElementById("pokemonWeight");
    const abilities = document.getElementById("pokemonAbilities");
    const errorMsg = document.getElementById("errorMsg");

    // Remove any previous type-* class
    container.className = container.className
        .split(' ')
        .filter(c => !c.startsWith('type-'))
        .join(' ');

    if (data.error) {
        img.src = "";
        name.textContent = "";
        types.textContent = "";
        height.textContent = "";
        weight.textContent = "";
        abilities.textContent = "";
        errorMsg.textContent = data.error;
        container.classList.remove("visible");
        container.classList.add("hidden");
    } else {
        img.src = data.image;
        name.textContent = data.name.charAt(0).toUpperCase() + data.name.slice(1);
        types.textContent = "Type: " + data.types.join(", ");
        height.textContent = "Height: " + data.height / 10 + " m";
        weight.textContent = "Weight: " + data.weight / 10 + " kg";
        abilities.textContent = "Abilities: " + data.abilities.join(", ");
        errorMsg.textContent = "";

        // Add the type class for background and text color
        if (data.types && data.types.length > 0) {
            const primaryType = data.types[0].toLowerCase();
            container.classList.add("type-" + primaryType);
        }

        container.classList.remove("hidden");
        container.classList.add("visible");
        container.classList.remove("fade-in");
        setTimeout(() => {
            container.classList.add("fade-in");
        }, 500);
    }
}

// Fetch all Pokémon names and images from PokéAPI
let pokemonNames = [];
let pokemonNameToImage = {};

async function fetchAllPokemonNames() {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10000');
        const data = await response.json();
        pokemonNames = data.results.map(p => ({
            name: capitalize(p.name),
            url: p.url
        }));

        // Preload images for first 151 Pokémon for performance (can be increased)
        const promises = pokemonNames.slice(0, 151).map(async (p) => {
            const res = await fetch(p.url);
            const pokeData = await res.json();
            pokemonNameToImage[p.name] = pokeData.sprites.front_default;
        });
        await Promise.all(promises);
    } catch (err) {
        // fallback to static list if needed
        pokemonNames = [
            { name: "Bulbasaur", url: "" }, { name: "Ivysaur", url: "" }, { name: "Venusaur", url: "" },
            { name: "Charmander", url: "" }, { name: "Charmeleon", url: "" }, { name: "Charizard", url: "" },
            { name: "Squirtle", url: "" }, { name: "Wartortle", url: "" }, { name: "Blastoise", url: "" },
            { name: "Pikachu", url: "" }, { name: "Raichu", url: "" }, { name: "Jigglypuff", url: "" }
        ];
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

fetchAllPokemonNames();

const input = document.getElementById('pokemonNameInput');
const suggestionsContainer = document.getElementById('suggestions');
let activeSuggestion = -1;

input.addEventListener('input', async function() {
    const value = this.value.toLowerCase();
    suggestionsContainer.innerHTML = '';
    activeSuggestion = -1;
    if (value.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    // Wait for names to be loaded
    if (pokemonNames.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    const suggestions = pokemonNames.filter(p => p.name.toLowerCase().startsWith(value)).slice(0, 8);
    if (suggestions.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    suggestionsContainer.style.display = 'block';
    suggestions.forEach((p, idx) => {
        const div = document.createElement('div');
        div.className = 'suggestion-item-card';

        // Use preloaded image if available, else fallback to PokéAPI sprite
        let imgSrc = pokemonNameToImage[p.name];
        if (!imgSrc && p.url) {
            // fallback to default sprite using id from url
            const idMatch = p.url.match(/\/pokemon\/(\d+)\//);
            if (idMatch) {
                imgSrc = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${idMatch[1]}.png`;
            }
        }
        div.innerHTML = `
            <img src="${imgSrc || ''}" alt="${p.name}" class="suggestion-img">
            <span class="suggestion-name">${p.name}</span>
        `;
        div.onclick = function() {
            input.value = p.name;
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
        };
        suggestionsContainer.appendChild(div);
    });
});

input.addEventListener('keydown', function(e) {
    const items = suggestionsContainer.querySelectorAll('.suggestion-item-card');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeSuggestion = (activeSuggestion + 1) % items.length;
        updateActive(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeSuggestion = (activeSuggestion - 1 + items.length) % items.length;
        updateActive(items);
    } else if (e.key === 'Enter') {
        if (activeSuggestion > -1) {
            e.preventDefault();
            items[activeSuggestion].click();
        }
    }
});

function updateActive(items) {
    items.forEach((item, idx) => {
        item.classList.toggle('active', idx === activeSuggestion);
    });
}

document.addEventListener('click', function(e) {
    if (e.target !== input) {
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.style.display = 'none';
    }
});

// --- Pokémon Carousel Logic ---
const carouselData = [
    { name: "Bulbasaur", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png" },
    { name: "Ivysaur", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/2.png" },
    { name: "Venusaur", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png" },
    { name: "Charmander", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png" },
    { name: "Charmeleon", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/5.png" },
    { name: "Charizard", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png" },
    { name: "Squirtle", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png" },
    { name: "Wartortle", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/8.png" },
    { name: "Blastoise", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png" },
    { name: "Pikachu", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png" },
    { name: "Raichu", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/26.png" },
    { name: "Jigglypuff", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png" },
    { name: "Gengar", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png" },
    { name: "Snorlax", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png" },
    { name: "Eevee", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png" },
    { name: "Mewtwo", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png" },
    { name: "Mew", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/151.png" },
    { name: "Psyduck", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/54.png" },
    { name: "Machamp", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/68.png" },
    { name: "Lapras", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/131.png" },
    { name: "Dragonite", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/149.png" },
    { name: "Magikarp", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/129.png" },
    { name: "Gyarados", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/130.png" },
    { name: "Alakazam", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/65.png" },
    { name: "Onix", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/95.png" }
];

// Shuffle carouselData for randomness
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}
shuffle(carouselData);

const carouselContainer = document.getElementById('pokemon-carousel');
let carouselIndex = 0;
let carouselInterval = null;

function renderCarousel() {
    carouselContainer.innerHTML = '';
    for (let i = -1; i <= 1; i++) {
        let idx = (carouselIndex + i + carouselData.length) % carouselData.length;
        const item = carouselData[idx];
        const div = document.createElement('div');
        div.className = 'carousel-item' + (i === 0 ? ' active' : '');
        div.innerHTML = `
            <img class="carousel-img" src="${item.img}" alt="${item.name}">
            <div class="carousel-name">${item.name}</div>
        `;
        carouselContainer.appendChild(div);
    }
}

function startCarousel() {
    renderCarousel();
    carouselInterval = setInterval(() => {
        carouselIndex = (carouselIndex + 1) % carouselData.length;
        renderCarousel();
    }, 1800);
}

function stopCarousel() {
    if (carouselInterval) clearInterval(carouselInterval);
    carouselContainer.classList.add('hidden');
}

startCarousel();

// Hide carousel on search
document.getElementById('pokemon-form').addEventListener('submit', function(e) {
    stopCarousel();
});