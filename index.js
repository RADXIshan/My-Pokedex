import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3000;

app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/pokemon", async (req, res) => {
    const pokemonName = req.body.pokemonName.toLowerCase().trim();
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
        if (!response.ok) {
            return res.status(404).json({ error: "Pokémon not found" });
        }
        const data = await response.json();
        res.json({
            name: data.name,
            image: data.sprites.front_default,
            types: data.types.map(t => t.type.name),
            height: data.height,
            weight: data.weight,
            abilities: data.abilities.map(a => a.ability.name)
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch Pokémon data" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});

