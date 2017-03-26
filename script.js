// script.js
// -----------------------------------------------------------------------------------------
//
// Demo app for Banker's Algorithm (resource allocation and deadlock avoidance)
// Author: Ryan Galimova
// License: MIT
// Date: March 2017
//


// -----------------------------------------------------------------------------------------
// Helper functions
// -----------------------------------------------------------------------------------------

// sum two arrays
function sumArrays(a1, a2) {
  return a1.map((el, i) => el + a2[i])
}

// subtract two arrays
function subtractArrays(a1, a2) {
  return a1.map((el, i) => el - a2[i])
}


// function scalarMultiplyArray(a, n) {
//   return a.map(el => el * n)
// }

// check if each element of the array is greater or equal the respective element in another array
function allElementsAreGreaterOrEqual(a1, a2) {
  return a1.every((el, i) => el >= a2[i])
}

// Augmenting Array.prototype for array comparison is taken from https://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript
// Warn if overriding existing method
if (Array.prototype.equals) {
  console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.")
}

// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
  if (!array) {
    return false
  }

  // compare lengths - can save a lot of time
  if (this.length !== array.length) {
    return false
  }

  for (let i = 0, l = this.length; i < l; i++) {
    // Check if we have nested arrays
    if (this[i] instanceof Array && array[i] instanceof Array) {
      // recurse into the nested arrays
      if (!this[i].equals(array[i])) {
        return false
      }
    } else if (this[i] !== array[i]) {
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false
    }
  }
  return true
}
// Hide method from for-in loops
Object.defineProperty(Array.prototype, 'equals', { enumerable: false })

// -----------------------------------------------------------------------------------------
// DATA
// -----------------------------------------------------------------------------------------
// number of processes
const n = 5

const appData = {
  numProcesses: n,
  processPrefix: 'P',
  resources: ['A', 'B', 'C'],
  available: [3, 3, 2],
  max: [
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3]],
  allocation: [
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2]],
  finished: (new Array(n)).fill(false),
  request: [], // [ A, B, C]
  processId: 0,
  sequence: [],
  status: '',
  error: '',
}

// -----------------------------------------------------------------------------------------
// Functions for mutating the app state (Banker's Algoritm is in this section)
// -----------------------------------------------------------------------------------------

const appPrototype = {
  // calculate needs array
  needs() {
    return this.max.map((m, i) => subtractArrays(m, this.allocation[i]))
  },

  // find safe sequence
  findSafeSequence() {
    // loop through all needs, execute whats possiible, free resources and move to next itearation
    // if looped though all twice without deallocating memory, its a deadlock

    // safe sequence will be stored here
    let result = []
    // create a copy of the state
    const copy = this.copy()
    // a flag to keep track of whether the iteration deallocated some memory
    let retry = false

    // try requesting needed memory
    function tryNeed(need, i) {
      // if the process is not finished
      if (!copy.finished[i]) {
        // check if it can be finished now by making a request that would satisfy the need
        copy.request = need
        copy.processId = i
        // checking available resources
        if (allElementsAreGreaterOrEqual(copy.available, need)) {
          // if there are available resource, grant the request and deallocate memory
          copy.allocate()
          // add current process to the safe sequence
          result.push(i)
          // allow next iteration
          retry = true
        }
      }
    }

    // iterate while each iteration deallocates memory
    do {
      retry = false
      copy.needs().forEach(tryNeed)
    } while (retry)

    // check if sequence contains all remaining processes
    if (result.length !== this.getNumberOfRemainingProcesses()) {
      result = []
    }

    return result
  },

  getNumberOfRemainingProcesses() {
    return this.finished.filter(x => x === false).length
  },

  // allocate memory for the process based on request, free the memory if the need is met
  allocate() {
    // allocate memory as per request
    this.allocation[this.processId] = sumArrays(this.allocation[this.processId], this.request)

    // check if allocation == max, then free the resources
    if (this.allocation[this.processId].equals(this.max[this.processId])) {
      // increase available resources
      this.available = sumArrays(this.available, this.allocation[this.processId])

      // set a fleag for the finished process
      this.finished[this.processId] = true

      // set allocation for the finished process to 0
      this.allocation[this.processId].fill(0)

      // set max for the finished process to 0
      this.max[this.processId].fill(0)
    }

    // decrease available resources
    this.available = subtractArrays(this.available, this.request)
  },

  // send request and check for safe sequence
  sendRequest() {
    const successStr = 'Success!'
    const deniedStr = 'Request denied.'

    if (!allElementsAreGreaterOrEqual(this.available, this.request)) {
      this.error = 'The request exceeds available resources'
      this.status = deniedStr
      return
    }

    if (!allElementsAreGreaterOrEqual(this.needs()[this.processId], this.request)) {
      this.error = 'The request exceeds the need (max - allocation)'
      this.status = deniedStr
      return
    }

    // check if request -> deadlock

    // create a copy of the state
    const test = this.copy()
    // satisfy the request in the copy
    test.allocate()
    // find safe sequence for the copy
    const seq = test.findSafeSequence()


    // if there is no safe sequence, record error, else satidfy the request in the original
    if (seq.length === 0 && test.getNumberOfRemainingProcesses() > 0) {
      this.error = 'The request is not safe and might lead to a deadlock'
      this.status = deniedStr
    } else {
      if (seq.length === 0) {
        this.error = 'All processes have been completed'
      } else {
        this.error = ''
      }
      this.status = successStr
      // remember safe sequence
      this.sequence = seq
      // satisfy the request for the original
      this.allocate()
    }
  },

  updateSafeSequence() {
    const seq = this.findSafeSequence()

    // if there is no safe sequence, record error, else satidfy the request in the original
    if (seq.length === 0) {
      if (this.getNumberOfRemainingProcesses() > 0) {
        this.error = 'The system is in deadlock'
      } else {
        this.error = 'All processes have been completed'
      }
    } else {
      this.error = ''
      // remember safe sequence
      this.sequence = seq
    }
  },

  // create a deep copy of the object's data while keeping the methods in the new object's prototype
  copy() {
    return Object.assign(Object.create(this), JSON.parse(JSON.stringify(this)))
  },
}


// app factory
const bankersAppFactory = function factory(data) {
  return Object.assign(Object.create(appPrototype), data)
}

// create an instance of the app
const bankersApp = bankersAppFactory(appData)


// -----------------------------------------------------------------------------------------
// templates (pure functions)
// -----------------------------------------------------------------------------------------
// returns html for resoures in the log
function resourceWrapper(heading, valuesArr, resourcesArr) {
  let str = ''

  for (let i = 0; i < resourcesArr.length; i++) {
    str += `<div class="resource">
      <span class="resourceName">${resourcesArr[i]}</span><span>${valuesArr[i]}</span>
    </div>`
  }

  return `
    <div class="resourcesWrapper">
      <div>${heading}</div>
      <div class="resources">
        ${str}
      </div>
    </div>
  `
}

// html for displaying safe sequence
function safeSequence(sequence, processPrefix, error) {
  let seqStr = ''

  if (error === '') {
    sequence.forEach((id, i) => {
      seqStr += processPrefix + id
      if (i < sequence.length - 1) {
        seqStr += '->'
      }
    })
  }
  return seqStr
}

// returns html for log rows
function logRow(processId, processPrefix, status, sequence, error,
  requestArr, allocationArr, availableArr, resourcesArr) {
  let seqStr = safeSequence(sequence, processPrefix, error)
  if (seqStr !== '') {
    seqStr = `Safe sequence: ${seqStr}`
  }

  const processName = `<span class="processName">${processPrefix}${processId}</span>`

  return `
    <div class="logRow panel">
      <div class="status">
        ${processName}
        <span class="success">${status}</span>
        <span class="sequence">${seqStr}</span>
        <span class="error">${error}</span>
      </div>
      <div class="logDetails">
        <div class="resourceWithProcessName">${processName}${resourceWrapper('Request', requestArr, resourcesArr)}</div>
        <div class="resourceWithProcessName">${processName}${resourceWrapper('New Allocation', allocationArr, resourcesArr)}</div>
        ${resourceWrapper('New Available', availableArr, resourcesArr)}
      </div>
    </div>
  `
}

// returns html for one row for the table with allocation and max
function processRow(processId, processName, allocationArr,
  needArr, maxArr, resourcesArr, finished) {
  let allocationStr = ''
  let needStr = ''
  let maxStr = ''

  for (let i = 0; i < resourcesArr.length; i++) {
    allocationStr += `<span>${allocationArr[i]}</span>`
    needStr += `<span>${needArr[i]}</span>`
    maxStr += `<span>${maxArr[i]}</span>`
  }

  return `
    <tr class="processRow panel ${finished[processId] ? 'finished' : ''}" data-process="${processId}">
      <td class="processCell">${processName}</td>
      <td><div>
        ${allocationStr}
      </div></td>
      <td><div>
        ${needStr}
      </div></td>
      <td><div>
        ${maxStr}
      </div></td>
    </tr>
  `
}

// returns html for currently available resources
function availableResources(availableArr, resourcesArr) {
  let availableStr = ''

  for (let i = 0; i < resourcesArr.length; i++) {
    availableStr += `<div class="resource">
      <span class="resourceName">${resourcesArr[i]}</span><span>${availableArr[i]}</span>
    </div>`
  }
  return availableStr
}

// returns the inside of the table
function table(numProcesses, processPrefix,
  allocationArr, needArr, maxArr, resourcesArr, finished) {
  let tableRows = ''
  for (let i = 0; i < numProcesses; i++) {
    tableRows += processRow(i, `${processPrefix}${i}`, allocationArr[i], needArr[i], maxArr[i], resourcesArr, finished)
  }

  let resourcesStr = ''
  resourcesArr.forEach((resource) => {
    resourcesStr += `<span>${resource}</span>`
  })

  return `
    <tr class="headerRow">
    <td></td>

      <td>
        <div class="header headerTable">Allocation</div>
      </td>
      <td>
        <div class="header headerTable">Need</div>
      </td>
       <td>
        <div class="header headerTable">Max</div>
      </td>
    </tr>
    <tr class="resoursesHeaderRow panel">
      <td></td>
      <td>
        <div>${resourcesStr}</div>
      </td>
      <td>
        <div>${resourcesStr}</div>
      </td>
        <td>
        <div>${resourcesStr}</div>
      </td>
    </tr>
    ${tableRows}
  `
}

function inputResources(resourcesArr) {
  let str = ''
  resourcesArr.forEach((resource) => {
    str += `
      <label for="${resource}">${resource}</label>
      <input type="text" class="need" name="${resource}" id="${resource}"/>
    `
  })
  return str
}

// -----------------------------------------------------------------------------------------
// render functions (functions with side effects - updating DOM)
// -----------------------------------------------------------------------------------------
// render available resources
function renderAvailable(availableArr, resourcesArr) {
  document.querySelector('#availableResources').innerHTML = availableResources(availableArr, resourcesArr)
}

// render table rows with allocation and max
function renderTable(numProcesses, processPrefix, allocationArr,
  needArr, maxArr, resourcesArr, finished) {
  document.querySelector('#table').innerHTML = table(numProcesses, processPrefix,
   allocationArr, needArr, maxArr, resourcesArr, finished)
}

//
function renderInputs(resourcesArr, numProcesses) {
  // input resources
  document.querySelector('.inputResources').innerHTML = inputResources(resourcesArr)
  // process id select
  const processSelect = document.getElementById('process')
  for (let i = 0; i < numProcesses; i++) {
    const option = document.createElement('option')
    option.text = i
    option.value = i
    processSelect.add(option)
  }
}

function renderSafeSequence(sequence, processPrefix, error) {
  const str = safeSequence(sequence, processPrefix, error)
  document.getElementById('safeSequence').innerHTML = str === '' ? error : str
}

// render current state - available and table
function render(app) {
  renderAvailable(app.available, app.resources)
  renderTable(app.numProcesses, app.processPrefix,
    app.allocation, app.needs(), app.max, app.resources, app.finished)

  app.updateSafeSequence()
  renderSafeSequence(app.sequence, app.processPrefix, app.error)

  // remove finished process from select
  const processSelect = document.getElementById('process')
  for (let i = 0; i < processSelect.length; i++) {
    if (app.finished[processSelect[i].value]) {
      processSelect.remove(i)
    }
  }
}

// render log entries
function renderLogEntry(processId, processPrefix, status, sequence, error,
  requestArr, allocationArr, availableArr, resourcesArr) {
  const logRowStr = logRow(processId, processPrefix, status, sequence, error,
    requestArr, allocationArr, availableArr, resourcesArr)
  document.querySelector('.logContainer').insertAdjacentHTML('afterbegin', logRowStr)
}


// -----------------------------------------------------------------------------------------
// run the app
// -----------------------------------------------------------------------------------------

// initial app render
renderInputs(bankersApp.resources, bankersApp.numProcesses)
render(bankersApp) // available and table
// returns the new app state based on request and render results
function handleClick() {
  // get requested process ID from select
  bankersApp.processId = document.querySelector('#process>option:checked').value

  // get requested resources from input
  bankersApp.resources.forEach((resource, i) => {
    bankersApp.request[i] = Math.abs(parseInt(document.querySelector(`#${resource}`).value, 10)) || 0
  })

  // process the request
  bankersApp.sendRequest()

  // render results
  renderLogEntry(bankersApp.processId, bankersApp.processPrefix, bankersApp.status,
   bankersApp.sequence, bankersApp.error, bankersApp.request,
   bankersApp.allocation[bankersApp.processId], bankersApp.available, bankersApp.resources)
  render(bankersApp) // available and table
}

// handle button click - modify the state and render results
document.querySelector('#sendRequest').addEventListener('click', handleClick)
