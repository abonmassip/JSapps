const settingsEl = document.querySelector('#settings');
const settingButtons = settingsEl.querySelectorAll('button');
const inputCount = settingsEl.querySelector('.input_qty');
const referenceCount = settingsEl.querySelector('.reference_qty');
const inputGroup = document.querySelector('#inputs');
const referenceGroup = document.querySelector('#references');
const submitButton = document.querySelector('#submit button');
const matchesEl = document.querySelector('#matches');
const commonsEl = document.querySelector('#commons');

let inputs;
let references;

const data = {
  inputs: [],
  references: [],
  matches: {},
  commonFinds: {}
};

// TODO is this code identical?

const inputHTML = `<input data-type="title" type="text" placeholder="TITLE">
  <textarea name="list" placeholder="gene list separated by jumpline"></textarea>
  <input data-type="values" type="text" placeholder="COUNT" value="" readonly>
  <button data-type="clear">clear</button>`;
const referenceHTML = `<input data-type="title" type="text" placeholder="TITLE">
  <textarea name="list" placeholder="gene list separated by jumpline"></textarea>
  <input data-type="values" type="text" placeholder="COUNT" value="" readonly>
  <button data-type="clear">clear</button>`;

/* 
const inputHTML = `<input data-type="title" type="text" placeholder="TITLE" value="colors1">
  <textarea name="list" placeholder="gene list separated by jumpline">blau${'\n'}gris${'\n'}vermell${'\n'}groc${'\n'}verd</textarea>
  <input data-type="values" type="text" placeholder="COUNT" value="" readonly>
  <button data-type="clear">clear</button>`;
const referenceHTML = `<input data-type="title" type="text" placeholder="TITLE" value="italia">
  <textarea name="list" placeholder="gene list separated by jumpline">blanc${'\n'}verd${'\n'}vermell</textarea>
  <input data-type="values" type="text" placeholder="COUNT" value="" readonly>
  <button data-type="clear">clear</button>`;
 */
function resetData() {
  data.inputs = [];
  data.references = [];
  data.matches = {};
  data.commonFinds = {};
}

function setLists() {
  const { action, type } = this.dataset;
  action === 'add' ? addList(type) : removeList(type);
  inputCount.textContent = inputs.length;
  referenceCount.textContent = references.length;
}

function updateLists() {
  inputs = document.querySelectorAll('#inputs .list');
  references = document.querySelectorAll('#references .list');
}

function addList(type) {
  const group = type === 'input' ? inputGroup : referenceGroup;
  const html = type === 'input' ? inputHTML : referenceHTML;
  const newList = document.createElement('div');
  newList.classList.add("list");
  newList.dataset.type = type;
  newList.innerHTML = html;
  group.appendChild(newList);
  newList.addEventListener('keyup', handleInput);
  newList.addEventListener('click', handleInput);
  updateLists();
}

function removeList(type) {
  const group = type === 'input' ? inputGroup : referenceGroup;
  if(group.children.length > 1){
    group.lastChild.remove();
  };
  updateLists();
}

function copyToClipboard(str) {
  const el = document.createElement('textarea');
  el.value = str;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

function handleInput(e) {
  const parent = e.currentTarget.parentElement.id;
  if(parent === 'inputs' || parent === 'references') {
    const title = e.currentTarget.querySelector('[data-type="title"]');
    const list = e.currentTarget.querySelector('textarea');
    const listLength = list.value.split(/\r?\n/g).length;
    const count = e.currentTarget.querySelector('[data-type="values"]');
    list.value ? count.value = listLength : count.value = "";
    if(e.target.dataset.type === 'clear') {
      title.value = '';
      list.value = '';
      count.value = '';
    }
  }
   
  if(parent === 'matches') {
    if(e.target.dataset.type === 'result') {
      const copyResult = e.currentTarget.querySelector('.result-list');
      const jumplines = copyResult.textContent.split(',').join(`\n`);
      copyToClipboard(jumplines);
    }
  }
  if(parent === 'commons') {
    if(e.target.dataset.type === 'result') {
      const copyResult = e.currentTarget.querySelector('.result-list');
      copyToClipboard(copyResult.textContent);
    }
  }
}

function setDataFromInputs(element) {
  element.querySelectorAll('.list').forEach(input => {
    const title = input.querySelector('[data-type="title"]').value;
    const list = input.querySelector('textarea').value;
    const obj = {
      title: title,
      list: list.split(/\r?\n/g)
    };
    if(title && list) {
      data[element.id].push(obj);
    }
  });
}

function handleSubmit() {
  
  resetData();
  
  setDataFromInputs(inputGroup);
  setDataFromInputs(referenceGroup);

  const matches = {};
  data.inputs.forEach(({title: inputTitle, list: inputList}) => {
    data.references.forEach(({title: referenceTitle, list: referenceList}) => {
      matches[`${inputTitle} in ${referenceTitle}`] = referenceList.filter(referenceItem => {
        return inputList.some(inputItem => inputItem === referenceItem)
      }).sort((a,b) => {
        return inputList.indexOf(a) - inputList.indexOf(b);
      });
    })
  })

  data.matches = matches;

  let commonFinds = {};
  data.inputs.forEach(({title: inputTitle, list: inputList}) => {
    const itemCommons = {};
    inputList.forEach(inputItem => {
      const itemSearch = []
      data.references.forEach(({title: referenceTitle, list: referenceList}) => {
        if(referenceList.some(referenceItem => referenceItem === inputItem)) {
          itemSearch.push(referenceTitle);
        };
      });
      if(itemSearch.length > 1) {
        itemCommons[inputItem] = itemSearch;
      };
      if(Object.keys(itemCommons).length) {
        commonFinds[`common finds in ${inputTitle}`] = itemCommons;
      }
    });
  });

  data.commonFinds = commonFinds;

  resetResults();

  Object.entries(data.matches).forEach(([matchTitle, matchList]) => {
    const newResult = document.createElement('div');
    newResult.classList.add('result');
    const resultHTML = `<p class="result-title">${matchTitle}</p><textarea class="result-list" name="list">${matchList}</textarea><input data-type="values" type="text" value="${matchList.length}" readonly><button data-type="result">COPY</button>`;
    newResult.innerHTML = resultHTML;
    matchesEl.appendChild(newResult);
    newResult.addEventListener('click', handleInput);
  });

  Object.entries(data.commonFinds).forEach(([commonTitle, commonList]) => {
    const newResult = document.createElement('div');
    newResult.classList.add('result');
    let listHTML = [];
    Object.entries(commonList).forEach(([listTitle, list]) => {
      const listLine = `<p><strong>${listTitle}</strong>,${list.join(',')}</p>`;
      listHTML.push(listLine);
    })
    const resultHTML = `<p class="result-title">${commonTitle}</p><div class="result-list">${listHTML.join(`\n`)}</div><input data-type="values" type="text" value="${listHTML.length}" readonly><button data-type="result">COPY</button>`;
    newResult.innerHTML = resultHTML;
    commonsEl.appendChild(newResult);
    newResult.addEventListener('click', handleInput);
  });

}

function resetResults() {
  const resultsList = document.querySelectorAll('#results .result');
  resultsList.forEach(item => {
    item.removeEventListener('click', handleInput);
    item.remove();
  })
}


settingButtons.forEach(button => button.addEventListener('click', setLists));
submitButton.addEventListener('click', handleSubmit);

addList('input');
addList('reference');

//TODO: alert, 2 datasets with same title