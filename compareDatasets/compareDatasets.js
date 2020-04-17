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
  matches: [],
  commonFinds: []
};


// TODO api: https://rest.ensembl.org/xrefs/id/ENSG00000225510?content-type=application/json
// https://rest.ensembl.org/xrefs/id/ENSG00000153310?external_db=HGNC;content-type=application/json
// https://rest.ensembl.org/documentation/info/xref_id
// grab result from dbname: "HGNC", grab property "display_id"
// TODO copy all, separat matches and common finds. cada resultat en una fila amb titol davan


function resetData() {
  data.inputs = [];
  data.references = [];
  data.matches = [];
  data.commonFinds = [];
}

function setLists(e, options) {
  let action;
  let type;
  if(!options){
    action = this.dataset.action
    type = this.dataset.type
  } else {
    action = options.action;
    type = options.type;
  }
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
  const html = `<input data-type="title" type="text" placeholder="TITLE">
    <textarea name="list" placeholder="gene list separated by line break"></textarea>
    <input data-type="values" type="text" placeholder="COUNT" value="" tabindex="-1" readonly>
    <button data-type="clear" tabindex="-1">clear</button>`;
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

function handleShortcuts(e) {
  if(e.key === 'Enter' && e.ctrlKey) {
    handleSubmit();
  }
  if(e.key.includes('Arrow') && e.ctrlKey && e.target.parentElement.classList[0] === 'list' ) {
    const type = e.target.parentElement.dataset.type;
    if(e.key === 'ArrowDown') {
      setLists(null, {action: 'add', type: type});
    }
    if(e.key === 'ArrowUp') {
      setLists(null, {action: 'remove', type: type});
    }
  }
}

function handleInput(e) {
  const parent = e.currentTarget.parentElement.id;
  if(parent === 'inputs' || parent === 'references') {
    const title = e.currentTarget.querySelector('[data-type="title"]');
    const list = e.currentTarget.querySelector('textarea');
    const listLength = removeDuplicates(list.value.split(/\r?\n/g).filter(item => !!item)).length;
    const count = e.currentTarget.querySelector('[data-type="values"]');
    list.value ? count.value = listLength : count.value = "";
    if(e.target.dataset.type === 'clear' && e.type === 'click') {
      title.value = '';
      list.value = '';
      count.value = '';
    }
  }
   
  if(parent === 'matches') {
    if(e.target.dataset.type === 'result') {
      const title = e.currentTarget.querySelector('.result-title').textContent;
      const list = e.currentTarget.querySelector('.result-list').textContent.split(',').join(`\n`);
      copyToClipboard(`${title}\n${list}`);
    }
  }
  if(parent === 'commons') {
    if(e.target.dataset.type === 'result') {
      const title = e.currentTarget.querySelector('.result-title').textContent;
      const list = e.currentTarget.querySelector('.result-list').textContent.split(`\n`);
      const newList = list.map(item => `${title},${item}`).join(`\n`);
      copyToClipboard(newList);
    }
  }
}

function setDataFromInputs(element) {
  element.querySelectorAll('.list').forEach(input => {
    const title = input.querySelector('[data-type="title"]').value;
    const listText = input.querySelector('textarea').value;
    const listArray = removeDuplicates(listText.split(/\r?\n/g).filter(item => !!item)).map(item => item.replace(/\s/g, ''));
    if(title && listText) {
      const obj = {
        title: title,
        list: listArray
      };
      data[element.id].push(obj);
    }
  });
}

function checkDuplicateTitles() {
  const titles = [...document.querySelectorAll('[data-type="title"]')].map(el => el.value.toLowerCase());
  return titles.some((item, i, arr) => arr.indexOf(item) !== i);
}

function removeDuplicates(arr) {
  return [...new Set(arr)];
}

function findMatches() {
  data.inputs.forEach(({title: inputTitle, list: inputList}) => {
    data.references.forEach(({title: referenceTitle, list: referenceList}) => {
      const newMatch = {};
      newMatch.title = [inputTitle, referenceTitle];
      newMatch.list = referenceList.filter(referenceItem => {
        return inputList.some(inputItem => inputItem.toLowerCase() === referenceItem.toLowerCase());
      }).sort((a,b) => {
        return inputList.indexOf(a) - inputList.indexOf(b);
      });
      data.matches.push(newMatch);
    });
  });
}

function findCommonFinds() {
  data.inputs.forEach(({title: inputTitle, list: inputList}) => {
    const newCommon = {title: inputTitle}
    const commonList = {};
    inputList.forEach(inputItem => {
      const itemSearch = []
      data.references.forEach(({title: referenceTitle, list: referenceList}) => {
        if(referenceList.some(referenceItem => referenceItem.toLowerCase() === inputItem.toLowerCase())) {
          itemSearch.push(referenceTitle);
        };
      });
      if(itemSearch.length > 1) {
        commonList[inputItem] = itemSearch;
      };
      if(Object.keys(commonList).length) {
        newCommon.list = commonList;
      };
    });
    if(newCommon.list){
      data.commonFinds.push(newCommon);
    }
  });
}

function populateResults() {
  data.matches.forEach(({title: matchTitle, list: matchList}) => {
    const totalNum = data.inputs.find(ref => ref.title === matchTitle[0]).list.length;
    const newResult = document.createElement('div');
    newResult.classList.add('result');
    const resultHTML = `<p class="result-title"><strong>${matchTitle[0]}</strong>&nbsp in &nbsp<strong>${matchTitle[1]}</strong></p><textarea class="result-list" name="list">${matchList}</textarea><input data-type="values" type="text" value="${matchList.length} of ${totalNum}" readonly><button data-type="result">COPY</button>`;
    newResult.innerHTML = resultHTML;
    matchesEl.appendChild(newResult);
    newResult.addEventListener('click', handleInput);
  });

  data.commonFinds.forEach(({title: commonTitle, list: commonList}) => {
    const newResult = document.createElement('div');
    newResult.classList.add('result');
    let listHTML = [];
    Object.entries(commonList).forEach(([listTitle, list]) => {
      const listLine = `<p><strong>${listTitle}</strong>,${list.join(',')}</p>`;
      listHTML.push(listLine);
    })
    const resultHTML = `<p class="result-title">common finds in ${commonTitle}</p><div class="result-list">${listHTML.join(`\n`)}</div><input data-type="values" type="text" value="${listHTML.length}" readonly><button data-type="result">COPY</button>`;
    newResult.innerHTML = resultHTML;
    commonsEl.appendChild(newResult);
    newResult.addEventListener('click', handleInput);
  });
}

function testData() {
  const test = document.querySelector('.test');
  test.textContent = "";
  test.textContent = JSON.stringify(data, null, 1);
  test.style.height = 'inherit';
  var computed = window.getComputedStyle(test);
  var height = parseInt(computed.getPropertyValue('border-top-width'), 10)
	             + parseInt(computed.getPropertyValue('padding-top'), 10)
	             + test.scrollHeight
	             + parseInt(computed.getPropertyValue('padding-bottom'), 10)
	             + parseInt(computed.getPropertyValue('border-bottom-width'), 10);
  test.style.height = height + 'px';
}

function handleSubmit() {
  if(checkDuplicateTitles()){
    alert('You have two datasets with the same title');
    return;
  }
  resetData();
  
  setDataFromInputs(inputGroup);
  setDataFromInputs(referenceGroup);

  findMatches();
  findCommonFinds();

  resetResults();
  populateResults();

  matchesEl.scrollIntoView({behavior: 'smooth'});

  // testData();
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
window.addEventListener('keydown', handleShortcuts);

addList('input');
addList('reference');