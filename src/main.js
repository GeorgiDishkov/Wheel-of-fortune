import * as PIXI from "pixi.js";
import { arrow, showAmountChanges, showModal } from "./components/elements";
import { attachSectors, degreesToRadians, radiansToDegrees, easeOutCubic, drawReward, showBulkRewardsModal } from "./utils/utils";
import { cannonSectors } from "./constant/sectors";
import { store } from "./store/basicStore";

const spinButtonElement = document.getElementById("spin-button");
const amountFieldElement = document.getElementById("amount");
const depositButtonElement = document.getElementById("deposit-button");
const freeSpinsElement = document.getElementById("free-spins");
const historyPanelElement = document.getElementById("history-panel");




const app = new PIXI.Application({
  resizeTo: window,
  backgroundColor: 0x42f5da,
});
app.view.style.position = "absolute";
document.body.appendChild(app.view);


//states
const { amount, costOnSpin, duration, spins } = store.getState() || {};

const angleStep = (2 * Math.PI) / cannonSectors.length;
const sectorSizeInDeg = radiansToDegrees(angleStep);
let isSpinning = false;
let spinsCounter = 0;


const updateButtonPosition = () => {
  spinButtonElement.style.left = `${app.view.width / 1.55}px`;
  spinButtonElement.style.top = `${app.view.height / 2}px`;
};
updateButtonPosition();

const wheelContainer = new PIXI.Container();
wheelContainer.rotation = degreesToRadians(0);
app.stage.addChild(wheelContainer);

const updateWheelContainerPosition = () => {
  wheelContainer.x = app.view.width / 1.55;
  wheelContainer.y = app.view.height / 2;
}
updateWheelContainerPosition()

const updateArrowPosition = () => {
  arrow.x = app.view.width / 1.55;
  arrow.y = app.view.height / 2 - 400;
}
updateArrowPosition()

app.stage.addChild(arrow);

// working on responsiveness and positions 
window.addEventListener("resize", () => {
  updateWheelContainerPosition()
  updateButtonPosition()
  updateArrowPosition()
});

attachSectors(wheelContainer)

amountFieldElement.innerText = `$ ${amount}`;

const updateHistoryWall = () => {
  const historyState = store.getState().history;

  const typeColors = {
    T1: "#FFD700",
    T2: "#C0C0C0",
    basicRewards: "#87CEEB",
    adviceRewards: "#FF6347",
    rareRewards: "#8A2BE2",
    lostTurn: "#ffffff",
    freeSpins: "#fab669"
  };

  historyPanelElement.innerHTML = "";

  historyState?.forEach((element) => {
    const div = document.createElement("div");
    const backgroundColor =
      element.text === "Free Spins" ? typeColors["freeSpins"] :
        element.text === "Lose Turn" ? typeColors["lostTurn"] :
          typeColors[element.type] || "#FFFFFF"; // Default color

    div.textContent = `${element.text || "Unknown"} (${element.type || "Unknown"})`;
    div.classList.add('reward')
    div.style.backgroundColor = backgroundColor
    historyPanelElement.appendChild(div);
  });
};
updateHistoryWall()

const executeSpin = (predefinedSector) => {

  let skipReward = false;
  let remainingFreeSpins = store.getState().freeSpinsCounter
  const spinsInDeg = spins * 360;
  const resultIndex = cannonSectors.findIndex(
    (sector) => sector.id === predefinedSector.id
  );
  const resultAngle = resultIndex >= 1 ? resultIndex * sectorSizeInDeg : 0;
  const targetAngle = spinsInDeg - resultAngle;
  const startTime = performance.now();

  const animateSpin = () => {
    const startAngle = 0;
    const elapsedTime = performance.now() - startTime;
    const progress = Math.min(elapsedTime / duration, 2);
    const easedProgress = easeOutCubic(progress);
    const currentAngle = startAngle + easedProgress * targetAngle;
    wheelContainer.rotation = degreesToRadians(currentAngle);

    if (progress < 1) {
      requestAnimationFrame(animateSpin);
    } else {
      const currentState = store.getState();
      let updatedAmount = currentState.amount;

      if (typeof predefinedSector.text === "number") {
        updatedAmount += predefinedSector.text;
        showAmountChanges(predefinedSector.text);
      } else if (predefinedSector.text === "Jackpot") {
        showModal({
          title: "Congratulations, You Hit the Jackpot!",
          content: `<p>You have earned $ 5000</p>`,
          onConfirm: () => {
          }
        });
        updatedAmount += 5000;
        showAmountChanges(5000);
      } else if (predefinedSector.text === "Free Spins") {
        if (remainingFreeSpins <= 0) {
          skipReward = true
        }
        if (remainingFreeSpins > 0) {
          showModal({
            title: "Claim Your Free Spins!",
            content: `<p>You have earned <b>3 free spins</b></p>`,
          })
          store.triggerFreeSpins();
          remainingFreeSpins += 3;
          freeSpinsElement.innerText = `${remainingFreeSpins} remaining free spins`
          store.useFreeSpin()
          executeSpin(drawReward())
        } else {
          showModal({
            title: "Claim Your Free Spins!",
            content: `<p>You have earned <b>3 free spins</b></p>`,
            onConfirm: () => {
              store.triggerFreeSpins();
              remainingFreeSpins += 3;
              freeSpinsElement.innerText = `${remainingFreeSpins} remaining free spins`
              store.useFreeSpin()
              executeSpin(drawReward())
            },
            onCancel: () => {
              store.triggerFreeSpins();
              remainingFreeSpins += 3;
              freeSpinsElement.innerText = `${remainingFreeSpins} remaining free spins`
              store.useFreeSpin()
              executeSpin(drawReward())
            }
          });
        }
      }

      store.setState({ amount: updatedAmount });

      if (remainingFreeSpins > 0) {
        spinButtonElement.disabled = true
        freeSpinsElement.innerText = `${remainingFreeSpins} remaining free spins`
        remainingFreeSpins -= 1;
        spinsCounter += 1;
        if (!skipReward) {
          store.useAddFreeSpinsRewards(predefinedSector)
        }
        store.useFreeSpin()
        executeSpin(drawReward());
      } else {
        if (
          store.getState().freeSpinsRewards?.length > 0
        ) {
          store.useAddFreeSpinsRewards(predefinedSector)
          const spinRewards = store.getState().freeSpinsRewards
          showBulkRewardsModal(spinRewards, spinsCounter)
        }
        isSpinning = false;
        spinButtonElement.disabled = false
        freeSpinsElement.innerText = "";;
      }
      store.useAddHistory(predefinedSector)
      updateHistoryWall()
      amountFieldElement.textContent = `$ ${updatedAmount}`;
    }
  };

  animateSpin();
};


if (amount < 200) {
  spinButtonElement.ariaDisabled
}

if (store.getState().freeSpinsCounter > 0) {
  executeSpin(drawReward());
}

spinButtonElement.addEventListener("click", () => {
  if (isSpinning || store.getState().amount < costOnSpin) return;
  isSpinning = true;

  const currentAmount = store.getState().amount - costOnSpin;
  store.setState({ amount: currentAmount });
  amountFieldElement.textContent = `$ ${currentAmount}`;
  showAmountChanges(-costOnSpin);

  const predefinedSector = drawReward();
  executeSpin(predefinedSector);
});

depositButtonElement.addEventListener("click", () => {
  const amount = store.getState().amount;

  showModal({
    title: "Deposit $1000",
    content: `<p>Please confirm... inserting $ 1000</p>`,
    onConfirm: () => {
      store.setState({ amount: amount + 1000 });
      amountFieldElement.textContent = `$ ${store.getState().amount}`;
      showAmountChanges(1000);
    }
  });
});
