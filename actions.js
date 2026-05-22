const inputField = document.querySelector('#new-item-input');
const addBtn = document.querySelector('#add-btn');
const itemsList = document.querySelector('#items-list');
const remainingTags = document.querySelector('#remaining-tags');
const boughtTags = document.querySelector('#bought-tags');

let items = JSON.parse(localStorage.getItem('shoppingList'));
if (!items || items.length === 0) {
    items = [
        { id: 1, name: 'Помідори', amount: 2, bought: true },
        { id: 2, name: 'Печиво', amount: 2, bought: false },
        { id: 3, name: 'Сир', amount: 1, bought: false }
    ];
}

function saveData() {
    localStorage.setItem('shoppingList', JSON.stringify(items));
}

function renderStats() {
    remainingTags.innerHTML = '';
    boughtTags.innerHTML = '';

    items.forEach(item => {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.textContent = item.name + ' ';
        
        const amountSpan = document.createElement('span');
        amountSpan.className = 'tag-amount';
        amountSpan.textContent = item.amount;
        tag.append(amountSpan);

        if (item.bought) {
            boughtTags.append(tag);
        } else {
            remainingTags.append(tag);
        }
    });
}

function createItemElement(item) {
    const li = document.createElement('li');
    li.className = 'item-row';
    if (item.bought) li.classList.add('is-bought');
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'item-name';
    nameSpan.textContent = item.name;
    li.append(nameSpan);

    nameSpan.addEventListener('click', function() {
        if (item.bought) return;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = item.name;
        input.className = 'edit-name-input';
        
        nameSpan.replaceWith(input);
        input.focus();

        const saveEdit = function() {
            const newName = input.value.trim();
            if (newName !== "") {
                item.name = newName;
                nameSpan.textContent = newName;
            }
            input.replaceWith(nameSpan); 
            renderStats();
            saveData();
        };

        input.addEventListener('blur', saveEdit, { once: true });
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') input.blur();
        });
    });

    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'item-controls';

    let minusBtnClass = item.amount > 1 ? 'btn-red' : 'btn-light';
    let minusDisabled = item.amount <= 1 ? 'disabled' : '';
    let statusText = item.bought ? 'Не куплено' : 'Куплено';
    let statusTooltip = item.bought ? 'Скасувати покупку' : 'Відмітити як куплене';

    controlsDiv.innerHTML = `
        <button class="btn btn-minus ${minusBtnClass}" ${minusDisabled} data-tooltip="Зменшити кількість">-</button>
        <span class="amount-display">${item.amount}</span>
        <button class="btn btn-plus btn-green" data-tooltip="Збільшити кількість">+</button>
        <button class="btn btn-gray btn-status" data-tooltip="${statusTooltip}">${statusText}</button>
        <button class="btn btn-red btn-delete" data-tooltip="Видалити товар">✖</button>
    `;
    li.append(controlsDiv);
    
    const minusBtn = controlsDiv.querySelector('.btn-minus');
    const plusBtn = controlsDiv.querySelector('.btn-plus');
    const statusBtn = controlsDiv.querySelector('.btn-status');
    const deleteBtn = controlsDiv.querySelector('.btn-delete');
    const amountDisplay = controlsDiv.querySelector('.amount-display');

    plusBtn.addEventListener('click', function() {
        item.amount++;
        amountDisplay.textContent = item.amount;
        
        minusBtn.disabled = false;
        minusBtn.classList.remove('btn-light');
        minusBtn.classList.add('btn-red');
        
        renderStats();
        saveData();
    });

    minusBtn.addEventListener('click', function() {
        if (item.amount > 1) {
            item.amount--;
            amountDisplay.textContent = item.amount;
            
            if (item.amount === 1) {
                minusBtn.disabled = true;
                minusBtn.classList.remove('btn-red');
                minusBtn.classList.add('btn-light');
            }
            renderStats();
            saveData();
        }
    });

    statusBtn.addEventListener('click', function() {
        item.bought = !item.bought;
        
        if (item.bought) {
            li.classList.add('is-bought');
            statusBtn.textContent = 'Не куплено';
            statusBtn.dataset.tooltip = 'Скасувати покупку';
        } else {
            li.classList.remove('is-bought');
            statusBtn.textContent = 'Куплено';
            statusBtn.dataset.tooltip = 'Відмітити як куплене';
        }
        
        renderStats();
        saveData();
    });

    deleteBtn.addEventListener('click', function() {
        const index = items.indexOf(item);
        if (index > -1) {
            items.splice(index, 1); 
        }
        li.remove();
        renderStats();
        saveData();
    });
    
    return li;
}

function initialRender() {
    itemsList.innerHTML = '';
    items.forEach(item => {
        itemsList.append(createItemElement(item));
    });
    renderStats();
}

function addItem() {
    const name = inputField.value.trim();
    if (name) {
        const newItem = {
            id: Date.now(),
            name: name,
            amount: 1,
            bought: false
        };
        items.push(newItem);
        itemsList.append(createItemElement(newItem));
        
        inputField.value = '';
        inputField.focus();
        
        renderStats();
        saveData();
    }
}

addBtn.addEventListener('click', addItem);
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addItem();
});

initialRender();