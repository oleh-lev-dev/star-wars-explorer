import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';

Vue.use(Vuex);

function getIdFromUrl(url) {
  return url.split('/').reverse()[1]
}

function mapStarship(starship) {
  return {
    ...starship,
    id: getIdFromUrl(starship.url)
  };
}

export default new Vuex.Store({
  state: {
    starships: [],
    next: null,
    prev: null,
    isLoading: false
  },

  mutations: {
    addStarships(state, {results, next, previous}) {
      state.starships = results.map(mapStarship);
      state.next = next;
      state.prev = previous;
    },

    updateStarship(state, newStarship = {}) {
      //if starships is present
      let indexOfStarship;
      state.starships = state.starships.map((starship, index) => {
        if (starship.id === newStarship.id) {
          indexOfStarship = index;
          return {
            ...starship,
            ...newStarship
          }
        }

        return starship;
      });

      ////if no starships OR starship is absent
      if (indexOfStarship === undefined || !state.starships.length) {
        state.starships.push(newStarship)
      }
    },
    setIsLoading(state, isLoading) {
      state.isLoading = isLoading;
    }
  },
  actions: {
    async searchStarships(store, searchQuery = '') {
      const url = `https://swapi.co/api/starships?format=json&search=${searchQuery}`;
      store.dispatch('fetchStarships', url)
    },
    fetchStarships: async function (store, url = 'https://swapi.co/api/starships?format=json') {
      try {
        this.commit('setIsLoading', true);
        const starships = await axios.get(url);
        this.commit('addStarships', starships.data);
        this.commit('setIsLoading', false);
      } catch (error) {
        console.error('unable to load starships', error);
      }
    },
    fetchStarship: async function (store, id) {
      try {
        const url = `https://swapi.co/api/starships/${id}?format=json`;
        this.commit('setIsLoading', true);
        const starship = await axios.get(url);
        let mappedStarship = mapStarship(starship.data);
        this.commit('updateStarship', mappedStarship);
        this.commit('setIsLoading', false);

        const pilots = await Promise.all(
          mappedStarship.pilots.map((pilot) => {
            return axios.get(pilot)
          })
        );

        mappedStarship = {
          ...mappedStarship,
          pilots: pilots.map((pilot) => pilot.data.name).join(', '),
        };
        this.commit('updateStarship', mappedStarship);

        const films = await Promise.all(
          mappedStarship.films.map((film) => {
            return axios.get(film)
          })
        );
        
        mappedStarship = {
          ...mappedStarship,
          films: films.map((film) => film.data.title).join(', '),
        };

        this.commit('updateStarship', mappedStarship);

      } catch (error) {
        console.error('unable to load starships', error);
      }
    }
  },
});
