import * as PIXI from "pixi.js";

const dialogContentElement = document.getElementById("dialog-content");
const dialogElement = document.getElementById("dialog");
const updateAmountElement = document.getElementById("update-amount");

export const arrow = new PIXI.Graphics();
arrow.lineStyle(2, 0x000000);
arrow.beginFill(0x38BFEC);
arrow.moveTo(-45, 0);
arrow.lineTo(45, 0);
arrow.lineTo(0, +60);
arrow.closePath();
arrow.endFill();

export const showModal = ({ title, content, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Close" }) => {
    dialogContentElement.innerHTML = '';

    if (title) {
        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        dialogContentElement.appendChild(titleElement);
    }

    const contentElement = document.createElement('div');
    contentElement.innerHTML = content;
    dialogContentElement.appendChild(contentElement);

    const confirmButton = document.createElement('button');
    confirmButton.classList.add('confirm-button');
    confirmButton.textContent = confirmText;
    confirmButton.addEventListener('click', () => {
        onConfirm && onConfirm();
        dialogElement.close();
    });

    const cancelButton = document.createElement('button');
    cancelButton.classList.add('cancel-button');
    cancelButton.textContent = cancelText;
    cancelButton.addEventListener('click', () => {
        onCancel && onCancel()
        dialogElement.close();
    });

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('dialog-buttons-container');
    buttonContainer.appendChild(confirmButton);
    buttonContainer.appendChild(cancelButton);
    dialogContentElement.appendChild(buttonContainer);

    dialogElement.style.display = 'block';
    dialogElement.showModal();
};

export const showAmountChanges = (amount) => {

    updateAmountElement.classList.add("fade-out")
    updateAmountElement.textContent = amount;
    updateAmountElement.style.opacity = 1;
    updateAmountElement.classList.toggle('positive', amount > 0);
    updateAmountElement.classList.toggle('negative', amount < 0);

    setTimeout(() => {
        updateAmountElement.style.opacity = 0;
    }, 1500)
}
