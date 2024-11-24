const LOCAL_STATE_KEY = "appState"

const initialState = { isSpinning: false, amount: 1000, costOnSpin: 200, duration: 3000, spins: 3, spinTracker: 1, T1Count: 3, T2Count: 2, freeSpinsCounter: 0, history: [], freeSpinsRewards: [] }
const createStateManager = (key, initialState) => {
    let state = JSON.parse(localStorage.getItem(key)) || initialState;

    return {
        getState() {
            return state;
        },
        setState(newState) {
            state = { ...state, ...newState };
            localStorage.setItem(key, JSON.stringify(state));
        },
        nextSpin() {
            if (state.spinTracker >= 10) {
                state.spinTracker = 1;
                state.T1Count = 3;
                state.T2Count = 2;
            } else {
                state.spinTracker++;
            }
            this.setState(state);
        },
        rowT1Reward() {
            if (state.T1Count > 0) {
                state.T1Count--;
            }
        },
        rowT2Reward() {
            if (state.T2Count >= 0) {
                state.T2Count--;
            }
        },
        triggerFreeSpins() {
            state.freeSpinsCounter += 3;
            this.setState(state);
        },
        useFreeSpin() {
            if (state.freeSpinsCounter > 0) {
                state.freeSpinsCounter--;
                state.duration = 4000;
            } else {
                state.duration = 5000;
            }
            this.setState(state);
        },
        useAddHistory(spin) {
            if (!state.history) {
                state.history = [];
            }
            if (state.history.length >= 10) {
                state.history.pop();
                state.history.unshift(spin);
            } else {
                state.history.unshift(spin);
            }
            this.setState(state);
        },
        useAddFreeSpinsRewards(spin) {
            if (!state.freeSpinsRewards) {
                state.freeSpinsRewards = [];
            }
            state.freeSpinsRewards.push(spin);
            this.setState(state);
        },
        clearFreeSpinsRewards() {
            state.freeSpinsRewards = [];
            this.setState(state);
        }
    };
}

export const store = createStateManager(LOCAL_STATE_KEY, initialState);