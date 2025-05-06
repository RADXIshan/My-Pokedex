document.addEventListener('DOMContentLoaded', () => {
    const music = document.getElementById('backgroundMusic');
    
    // Try to load the saved music time
    const savedTime = localStorage.getItem('music-time');
    if (savedTime) {
        music.currentTime = parseFloat(savedTime);
    }
    
    let musicStarted = false;
    
    document.body.addEventListener('mouseover', () => {
        if (!musicStarted) {
            music.muted = false;
            music.play().then(() => {
                console.log('Music resumed!');
                musicStarted = true;
            }).catch((error) => {
                console.error('Autoplay prevented or file missing:', error);
            });
        }
    });
    
    // Keep saving music time every second
    setInterval(() => {
        if (!music.paused) {
            localStorage.setItem('music-time', music.currentTime);
        }
    }, 1000);
    
    // Also save time just before leaving the page
    window.addEventListener('beforeunload', () => {
        localStorage.setItem('music-time', music.currentTime);
    });
    
    // Pokedex functionality
    const pokedexGrid = document.getElementById('pokedexGrid');
    const searchInput = document.getElementById('pokedexSearch');
    const searchSuggestions = document.getElementById('searchSuggestions');
    const typeFilters = document.getElementById('typeFilters');
    const regionFilters = document.getElementById('regionFilters');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    const loadingContainer = document.getElementById('loading-container');
    
    let allPokemon = [];
    let filteredPokemon = [];
    let currentPage = 1;
    let pokemonPerPage = 20;
    let activeTypeFilters = [];
    let activeRegionFilter = null;
    
    // Pokemon regions with their corresponding ID ranges
    const regions = [
        { name: 'Kanto', range: [1, 151] },
        { name: 'Johto', range: [152, 251] },
        { name: 'Hoenn', range: [252, 386] },
        { name: 'Sinnoh', range: [387, 493] },
        { name: 'Unova', range: [494, 649] },
        { name: 'Kalos', range: [650, 721] },
        { name: 'Alola', range: [722, 809] },
        { name: 'Galar', range: [810, 898] },
        { name: 'Paldea', range: [899, 1008] }
    ];
    
    // Pokemon types
    const types = [
        'normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting',
        'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost',
        'dragon', 'dark', 'steel', 'fairy'
    ];
    
    // Initialize type filters
    types.forEach(type => {
        const typeOption = document.createElement('div');
        typeOption.className = 'filter-option';
        typeOption.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        typeOption.dataset.type = type;
        typeOption.addEventListener('click', () => toggleTypeFilter(type, typeOption));
        typeFilters.appendChild(typeOption);
    });
    
    // Initialize region filters
    regions.forEach(region => {
        const regionOption = document.createElement('div');
        regionOption.className = 'filter-option';
        regionOption.textContent = region.name;
        regionOption.dataset.region = region.name;
        regionOption.addEventListener('click', () => setRegionFilter(region, regionOption));
        regionFilters.appendChild(regionOption);
    });
    
    // Toggle type filter
    function toggleTypeFilter(type, element) {
        element.classList.toggle('active');
        
        if (element.classList.contains('active')) {
            activeTypeFilters.push(type);
        } else {
            activeTypeFilters = activeTypeFilters.filter(t => t !== type);
        }
        
        applyFilters();
    }
    
    // Set region filter
    function setRegionFilter(region, element) {
        // Remove active class from all region filters
        document.querySelectorAll('#regionFilters .filter-option').forEach(el => {
            el.classList.remove('active');
        });
        
        if (activeRegionFilter === region.name) {
            // If clicking the active filter, deselect it
            activeRegionFilter = null;
        } else {
            // Otherwise, set as active
            element.classList.add('active');
            activeRegionFilter = region.name;
        }
        
        applyFilters();
    }
    
    // Apply all filters
    function applyFilters() {
        filteredPokemon = allPokemon.filter(pokemon => {
            // Filter by type if any type filters are active
            const typeMatch = activeTypeFilters.length === 0 || 
                pokemon.types.some(type => activeTypeFilters.includes(type));
            
            // Filter by region if a region filter is active
            let regionMatch = true;
            if (activeRegionFilter) {
                const region = regions.find(r => r.name === activeRegionFilter);
                regionMatch = pokemon.id >= region.range[0] && pokemon.id <= region.range[1];
            }
            
            // Filter by search text
            const searchText = searchInput.value.toLowerCase().trim();
            const searchMatch = searchText === '' || 
                pokemon.name.toLowerCase().includes(searchText) || 
                pokemon.id.toString() === searchText; // Fixed search by number with exact match
            
            return typeMatch && regionMatch && searchMatch;
        });
        
        currentPage = 1;
        renderPokemon();
    }
    
    // Search functionality
    searchInput.addEventListener('input', () => {
        // Show suggestions based on user typing
        const searchText = searchInput.value.toLowerCase().trim();
        
        if (searchText.length > 0) {
            // Filter Pokemon that start with or contain the search text
            const exactMatches = allPokemon.filter(p => 
                p.name.toLowerCase().startsWith(searchText) || 
                p.id.toString() === searchText // Exact match for ID
            ).slice(0, 3);
            
            const partialMatches = allPokemon.filter(p => 
                !p.name.toLowerCase().startsWith(searchText) && 
                p.name.toLowerCase().includes(searchText) && 
                p.id.toString() !== searchText
            ).slice(0, 2);
            
            const suggestions = [...exactMatches, ...partialMatches].slice(0, 5);
            
            searchSuggestions.innerHTML = '';
            if (suggestions.length > 0) {
                searchSuggestions.style.display = 'block';
                suggestions.forEach(pokemon => {
                    const suggestion = document.createElement('div');
                    suggestion.className = 'suggestion-item-card';
                    suggestion.innerHTML = `
                        <img src="${pokemon.image || getBackupImage(pokemon.id)}" alt="${pokemon.name}" class="suggestion-img">
                        <span class="suggestion-name">${pokemon.name} (#${pokemon.id})</span>
                    `;
                    suggestion.addEventListener('click', () => {
                        searchInput.value = pokemon.name;
                        searchSuggestions.style.display = 'none';
                        applyFilters();
                    });
                    searchSuggestions.appendChild(suggestion);
                });
            } else {
                searchSuggestions.style.display = 'none';
            }
        } else {
            searchSuggestions.style.display = 'none';
        }
        
        // Apply filters after updating suggestions
        applyFilters();
    });
    
    // Function to get backup image if the main image is missing
    function getBackupImage(id) {
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
    }
    
    // Render Pokemon grid
    function renderPokemon() {
        pokedexGrid.innerHTML = '';
        
        const startIndex = (currentPage - 1) * pokemonPerPage;
        const endIndex = startIndex + pokemonPerPage;
        const pokemonToShow = filteredPokemon.slice(startIndex, endIndex);
        
        if (pokemonToShow.length === 0) {
            const noResults = document.createElement('div');
            noResults.textContent = 'No Pokémon found matching your filters';
            noResults.style.gridColumn = '1 / -1';
            noResults.style.textAlign = 'center';
            noResults.style.padding = '20px';
            noResults.style.color = 'white';
            noResults.style.textShadow = '1px 1px 2px black';
            pokedexGrid.appendChild(noResults);
        } else {
            pokemonToShow.forEach(pokemon => {
                const card = document.createElement('div');
                card.className = 'pokemon-card';
                card.innerHTML = `
                    <div class="pokemon-number">#${pokemon.id.toString().padStart(3, '0')}</div>
                    <img src="${pokemon.image || getBackupImage(pokemon.id)}" alt="${pokemon.name}" onerror="this.src='${getBackupImage(pokemon.id)}'">
                    <div class="pokemon-name">${pokemon.name}</div>
                    <div>
                        ${pokemon.types.map(type => 
                            `<span class="pokemon-type type-${type}">${type}</span>`
                        ).join('')}
                    </div>
                `;
                
                card.addEventListener('click', () => showPokemonDetails(pokemon));
                pokedexGrid.appendChild(card);
            });
        }
        
        // Update pagination
        const totalPages = Math.ceil(filteredPokemon.length / pokemonPerPage);
        pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    }
    
    // Add a reset button to clear search and filters
    const searchContainer = document.querySelector('.search-container');
    const resetButton = document.createElement('button');
    resetButton.id = 'resetSearch';
    resetButton.className = 'reset-button';
    resetButton.textContent = 'Reset';
    resetButton.addEventListener('click', () => {
        // Clear search input
        searchInput.value = '';
        
        // Clear type filters
        activeTypeFilters = [];
        document.querySelectorAll('#typeFilters .filter-option').forEach(el => {
            el.classList.remove('active');
        });
        
        // Clear region filter
        activeRegionFilter = null;
        document.querySelectorAll('#regionFilters .filter-option').forEach(el => {
            el.classList.remove('active');
        });
        
        // Reset to all Pokemon
        filteredPokemon = [...allPokemon];
        currentPage = 1;
        renderPokemon();
    });
    searchInput.parentNode.insertBefore(resetButton, searchInput.nextSibling);
    
    // Create popup elements
    const popupOverlay = document.createElement('div');
    popupOverlay.className = 'popup-overlay hidden';
    document.body.appendChild(popupOverlay);
    
    const popupContainer = document.createElement('div');
    popupContainer.className = 'popup-container hidden';
    document.body.appendChild(popupContainer);
    
    // Modify showPokemonDetails function to show popup instead of redirecting
    async function showPokemonDetails(pokemon) {
        // Show loading state in popup
        popupContainer.innerHTML = `
            <div class="popup-close">×</div>
            <div class="popup-content">
                <div class="popup-header">
                    <div class="pokemon-number">#${pokemon.id.toString().padStart(3, '0')}</div>
                    <h2 class="popup-name">${pokemon.name}</h2>
                </div>
                <div class="popup-image-container">
                    <img src="${pokemon.image || getBackupImage(pokemon.id)}" alt="${pokemon.name}" 
                         onerror="this.src='${getBackupImage(pokemon.id)}'">
                </div>
                <div class="popup-types">
                    ${pokemon.types.map(type => 
                        `<span class="pokemon-type type-${type}">${type}</span>`
                    ).join('')}
                </div>
                <div class="popup-stats">
                    <div class="stat-item">
                        <div class="stat-label">Height</div>
                        <div class="stat-value">Loading...</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Weight</div>
                        <div class="stat-value">Loading...</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Abilities</div>
                        <div class="stat-value">Loading...</div>
                    </div>
                </div>
            </div>
        `;
        
        // Show popup
        popupOverlay.classList.remove('hidden');
        popupContainer.classList.remove('hidden');
        
        // Add event listener to close button
        const closeButton = document.querySelector('.popup-close');
        closeButton.addEventListener('click', closePopup);
        
        // Close popup when clicking outside
        popupOverlay.addEventListener('click', closePopup);
        
        // Fetch detailed Pokemon data
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}`);
            const data = await response.json();
            
            // Format height (convert from decimeters to meters)
            const heightInMeters = data.height / 10;
            const formattedHeight = `${heightInMeters} m`;
            
            // Format weight (convert from hectograms to kilograms)
            const weightInKg = data.weight / 10;
            const formattedWeight = `${weightInKg} kg`;
            
            // Format abilities
            const abilities = data.abilities
                .map(ability => ability.ability.name.replace('-', ' '))
                .map(name => name.charAt(0).toUpperCase() + name.slice(1))
                .join(', ');
            
            // Update popup with fetched data
            const heightElement = popupContainer.querySelector('.popup-stats .stat-item:nth-child(1) .stat-value');
            const weightElement = popupContainer.querySelector('.popup-stats .stat-item:nth-child(2) .stat-value');
            const abilitiesElement = popupContainer.querySelector('.popup-stats .stat-item:nth-child(3) .stat-value');
            
            heightElement.textContent = formattedHeight;
            weightElement.textContent = formattedWeight;
            abilitiesElement.textContent = abilities;
            
        } catch (error) {
            console.error('Error fetching Pokemon details:', error);
            
            // Update with error message
            const statValues = popupContainer.querySelectorAll('.stat-value');
            statValues.forEach(element => {
                element.textContent = 'Failed to load';
            });
        }
    }
    
    // Function to close popup
    function closePopup() {
        popupOverlay.classList.add('hidden');
        popupContainer.classList.add('hidden');
    }
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target !== searchInput) {
            searchSuggestions.style.display = 'none';
        }
    });
    
    // Pagination
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderPokemon();
            window.scrollTo(0, 0);
        }
    });
    
    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredPokemon.length / pokemonPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderPokemon();
            window.scrollTo(0, 0);
        }
    });
    
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const regionParam = urlParams.get('region');
    if (regionParam) {
        const regionElement = document.querySelector(`[data-region="${regionParam}"]`);
        if (regionElement) {
            const region = regions.find(r => r.name === regionParam);
            setRegionFilter(region, regionElement);
        }
    }
    
    // Fetch all Pokemon
    async function fetchAllPokemon() {
        showLoadingAnimation();
        try {
            // First get the total count
            const countResponse = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1');
            const countData = await countResponse.json();
            const count = Math.min(1008, countData.count); // Limit to 1008 Pokemon for performance
            
            // Then fetch all Pokemon
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${count}`);
            const data = await response.json();
            
            // Process Pokemon data in batches to avoid overwhelming the browser
            const batchSize = 50;
            const batches = Math.ceil(data.results.length / batchSize);
            
            for (let i = 0; i < batches; i++) {
                const start = i * batchSize;
                const end = Math.min(start + batchSize, data.results.length);
                const batch = data.results.slice(start, end);
                
                const pokemonPromises = batch.map(async (pokemon, index) => {
                    const id = start + index + 1;
                    try {
                        const res = await fetch(pokemon.url);
                        const pokeData = await res.json();
                        
                        return {
                            id: id,
                            name: pokeData.name.charAt(0).toUpperCase() + pokeData.name.slice(1),
                            image: pokeData.sprites.other["official-artwork"].front_default || 
                                   pokeData.sprites.front_default,
                            types: pokeData.types.map(t => t.type.name)
                        };
                    } catch (err) {
                        console.error(`Error fetching Pokemon ${id}:`, err);
                        // Return a placeholder for failed fetches
                        return {
                            id: id,
                            name: pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
                            image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
                            types: ['unknown']
                        };
                    }
                });
                
                const batchResults = await Promise.all(pokemonPromises);
                allPokemon = [...allPokemon, ...batchResults];
                filteredPokemon = [...allPokemon];
                
                // Render after each batch to show progress
                renderPokemon();
            }
            
            hideLoadingAnimation();
        } catch (err) {
            console.error('Error fetching Pokemon:', err);
            hideLoadingAnimation();
            
            // Show error message
            pokedexGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: white; text-shadow: 1px 1px 2px black;">
                    Failed to load Pokémon data. Please try again later.
                </div>
            `;
        }
    }
    
    function showLoadingAnimation() {
        loadingContainer.classList.remove('hidden');
    }
    
    function hideLoadingAnimation() {
        loadingContainer.classList.add('hidden');
    }
    
    // Check if we came from another page with a Pokemon parameter
    const pokemonParam = urlParams.get('pokemon');
    if (pokemonParam) {
        searchInput.value = pokemonParam;
    }
    
    // Initialize
    fetchAllPokemon();
});