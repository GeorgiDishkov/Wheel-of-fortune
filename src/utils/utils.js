import * as PIXI from "pixi.js";
import { cannonSectors } from "../constant/sectors";
import { store } from "../store/basicStore";
import { showAmountChanges, showModal } from "../components/elements";


export const easeOutCubic = (time) => {
    return 1 - Math.pow(1 - time, 3);
}


export function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}


export const radiansToDegrees = (radians) => {
    return radians * (180 / Math.PI);
}


export const attachSectors = (container) => {
    const angleStep = (2 * Math.PI) / cannonSectors.length
    cannonSectors.forEach((sector, index) => {
        const graphics = new PIXI.Graphics();
        const startAngle = index * angleStep - Math.PI / 2 - angleStep / 2;
        const endAngle = startAngle + angleStep;

        graphics.lineStyle(2, 0x000000);
        graphics.beginFill(sector.color);
        graphics.moveTo(0, 0);
        graphics.arc(0, 0, 360, startAngle, endAngle);
        graphics.lineTo(0, 0);
        graphics.endFill();

        container.addChild(graphics);

        const midAngle = startAngle + angleStep / 2;
        const text = new PIXI.Text(`${typeof sector.text === "number" ? "$" : ""} ${sector.text}`, {
            fontSize: 24,
            fontWeight: 600,
            fill: 0x0000000,
        });
        text.x = Math.cos(midAngle) * 360 * 0.8;
        text.y = Math.sin(midAngle) * 360 * 0.8;

        text.rotation = midAngle + Math.PI;

        text.anchor.set(0.5);
        container.addChild(text);
    });
}

export const drawReward = () => {
    const { spinTracker, T1Count, T2Count } = store.getState() || {}

    const T1Rewards = cannonSectors.filter(sector => sector.type === "T1")
    const T2Rewards = cannonSectors.filter(sector => sector.type === "T2")
    const cannonRewards = cannonSectors.filter(sector => sector.type === "basicRewards")
    const adviceRewards = cannonSectors.filter(sector => sector.type === "adviceRewards")
    const rareRewards = cannonSectors.filter(sector => sector.type === "rareRewards")
    let reward

    if (spinTracker % 2 !== 0 && (T1Count > 0 || T2Count > 0)) {

        if (T1Count > 0 && T2Count > 0) {
            const chooseТ1 = Math.random() < 0.5
            reward = getRandomReward(chooseТ1 ? T1Rewards : T2Rewards)
            chooseТ1 ? store.rowT1Reward() : store.rowT2Reward()
        } else if (T1Count > 0) {
            reward = getRandomReward(T1Rewards)
            store.rowT1Reward()
        } else if (T2Count > 0) {
            reward = getRandomReward(T2Rewards)
            store.rowT2Reward()
        }
    } else {
        const chance = Math.random()
        if (chance < 0.5) {
            reward = getRandomReward(cannonRewards)
        } else {
            reward = getRandomReward(chance < 0.95 ? adviceRewards : rareRewards)
        }

    }
    store.nextSpin()
    return reward
}


function getRandomReward(array) {
    if (array.length === 0) {
        throw new Error("Array is empty. Cannot select a random element.");
    }

    if (array.length === 1) {
        return array[0];
    }
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

export const showBulkRewardsModal = (bulkRewards, spinsCounter) => {
    const rewardDetails = bulkRewards
        .map(reward => {
            if (typeof reward.text === 'number') {
                return `<div>$ ${reward.text}</div>`;
            } else if (reward.text === "Jackpot") {
                return `<div>JACKPOT! ($5000)</div>`;
            } else {
                return `<div>${reward.text}</div>`;
            }
        })
        .join("");

    const totalReward = bulkRewards.reduce((total, reward) => {
        if (typeof reward.text === 'number') {
            return total + reward.text;
        } else if (reward.text === "Jackpot") {
            return total + 5000;
        }
        return total;
    }, 0);
    store.clearFreeSpinsRewards()
    showModal({
        title: "Spins reward",
        content: `
        <p>You have earned the following rewards:</p>
        ${rewardDetails}
        <hr />
        spins: ${spinsCounter} 
        <hr />
        <strong>Total: $${totalReward}</strong>
      `,
        onConfirm: () => {
            showAmountChanges(totalReward)
        }
    });
};
