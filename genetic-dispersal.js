var config = {
    mutationRate: 0.015,
    tournamentSize: 5,
    populationSize: 20,
    routeSize: 20,
    elitsm: true,
}

export function setup(config) {
    config = config;
}

var pop = [];

var child = {
    route: [],
    fitness: 0,
}

export function evolvePopulation(pop) {
    var newPop = [];
    // Keep our best individual if elitism is enabled
    var elitismOffset = 0;
    if (config.elitism) {
        newPop[0] = getFittest(pop);
        elitismOffset = 1;
    }

    // Crossover population
    // Loop over the new population's size and create individuals from
    // Current population
    for (var i = elitismOffset; i < config.populationSize; i++) {
        // Select parents
        var parent1 = tournamentSelection(pop);
        var parent2 = tournamentSelection(pop);
        // Crossover parents
        var child = crossover(parent1, parent2);
        // Add child to new population
        newPop.push(child);
    }

    // Mutate the new population a bit to add some new genetic material
    for (var i = elitismOffset; i < config.populationSize; i++) {
        pop[i] = mutate(pop[i]);
    }

    return newPop;
}

function mutate(child) {
    // Loop through tour cities
    for (var index1 = 0; index1 < config.routeSize; index1++) {
        // Apply mutation rate
        if (Math.random() < config.mutationRate) {
            // Get a second random position in the tour
            var index2 = Math.floor(child.route.length * Math.random());

            // Get the cities at target position in tour
            var parcel1 = child.route[index1];
            var parcel2 = child.route[index2];

            // Swap them around
            child.route[index2] = parcel1;
            child.route[index1] = parcel2;
        }
    }
    
    return child;
}

function crossover(parcel1, parcel2) {
    if(parcel1.fitness > parcel2.fitness){
        return JSON.parse(JSON.stringify(parcel1));
    } else {
        return JSON.parse(JSON.stringify(parcel2));
    }
}

function tournamentSelection(pop) {
    // Create a tournament population
    var tourn = [];
    // For each place in the tournament get a random candidate tour and
    // add it
    for (var i = 0; i < config.tournamentSize; i++) {
        var randomId = Math.floor(Math.random() * pop.length);
        tourn.push(pop[randomId]);
    }
    // Get the fittest of tourn
    return getFittest(tourn);
}

export function getFittest(pop) {
    var best = 0;
    for (var i = 1; i < pop.length; i++) {
        if (pop[i].fitness > pop[best].fitness) {
            best = i;
        }
    }

    return pop[best];
}
