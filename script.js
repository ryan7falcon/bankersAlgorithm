// script.js
// -----------------------------------------------------------------------------------------
//
// Demo app for Banker's Algorithm (resource allocation and deadlock avoidance)
// Author: Ryan Galimova
// License: MIT
// Date: March 2017
//
// -----------------------------------------------------------------------------------------
// DATA
// -----------------------------------------------------------------------------------------
let bankersApp = {
  numProcesses: 5,
  processPrefix: 'P',
  resources: ['A', 'B', 'C'],
  available: [10, 5, 7],
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
  request: [2, 4, 4],
  status: 'Success',
  error: '',

}

// -----------------------------------------------------------------------------------------
// templates (pure functions)
// -----------------------------------------------------------------------------------------
// returns html for resoures in the log
function resourceWrapper(heading, valuesArr, resourcesArr) {
  let str = ''

  for (let i = 0; i < resourcesArr.length; i++) {
    str += `<div class="resource">
      <span>${resourcesArr[i]}</span><span>${valuesArr[i]}</span>
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

// returns html for log rows
function logRow(processName, status, error, requestArr, allocationArr, availableArr, resourcesArr) {
  return `
    <div class="logRow">
      <div class="status">
        <span class="processName">${processName}</span>
        <span class="success">${status}</span>
        <span class="error">${error}</span>
      </div>
      <div class="logDetails">
        ${resourceWrapper('Request', requestArr, resourcesArr)}
        ${resourceWrapper('New Allocation', allocationArr, resourcesArr)}
        ${resourceWrapper('New Available', availableArr, resourcesArr)}
      </div>
    </div>
  `
}

// returns html for one row for the table with allocation and max
function processRow(processId, processName, allocationArr, maxArr, resourcesArr) {
  let allocationStr = ''
  let maxStr = ''

  for (let i = 0; i < resourcesArr.length; i++) {
    allocationStr += `<span>${allocationArr[i]}</span>`
    maxStr += `<span>${maxArr[i]}</span>`
  }

  return `
    <tr class="processRow" data-process="${processId}">
      <td class="processCell">${processName}</td>
      <td><div>
        ${allocationStr}
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
      <span>${resourcesArr[i]}</span><span>${availableArr[i]}</span>
    </div>`
  }
  return availableStr
}

// returns the inside of the table
function table(numProcesses, processPrefix, allocationArr, maxArr, resourcesArr) {
  let tableRows = ''
  for (let i = 0; i < numProcesses; i++) {
    tableRows += processRow(i, `${processPrefix}${i}`, allocationArr[i], maxArr[i], resourcesArr)
  }

  let resourcesStr = ''
  resourcesArr.forEach((resource) => {
    resourcesStr += `<span>${resource}</span>`
  })

  return `
    <tr class="headerRow">
    <td></td>

      <td>
        <div class="header">Allocation</div>
      </td>
      <td>
        <div class="header">Max</div>
      </td>
    </tr>
    <tr class="resoursesHeaderRow">
      <td></td>
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
function renderTable(numProcesses, processPrefix, allocationArr, maxArr, resourcesArr) {
  document.querySelector('#table').innerHTML = table(numProcesses, processPrefix, allocationArr, maxArr, resourcesArr)
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

// render current state - available and table
function render(app) {
  renderAvailable(app.available, app.resources)
  renderTable(app.numProcesses, app.processPrefix, app.allocation, app.max, app.resources)
}

// render log entries
function renderLogEntry(processId, processPrefix, status, error,
  requestArr, allocationArr, availableArr, resourcesArr) {
  const logRowStr = logRow(`${processPrefix}${processId}`, status, error, requestArr, allocationArr, availableArr, resourcesArr)
  document.querySelector('.logContainer').insertAdjacentHTML('afterbegin', logRowStr)
}

// -----------------------------------------------------------------------------------------
// functions for mutating the app state
// -----------------------------------------------------------------------------------------
// returns the new app state based on request and render results
function sendRequest(app) {
  // new app state will be saved here
  const newApp = app

  // get requested process ID
  const processId = document.querySelector('#process>option:checked').value
  console.log(processId)

  // get requested resources from input
  app.resources.forEach((resource, i) => {
    newApp.request[i] = parseInt(document.querySelector(`#${resource}`).value, 10) || 0
  })

  // TODO: update app data
  //

  // render results
  renderLogEntry(processId, newApp.processPrefix, newApp.status, newApp.error,
    newApp.request, newApp.allocation[processId], newApp.available, newApp.resources)
  render(newApp)

  return newApp
}

// -----------------------------------------------------------------------------------------
// run the app
// -----------------------------------------------------------------------------------------

// handle button click - modify the state and render results
document.querySelector('#sendRequest').addEventListener('click', () => {
  bankersApp = sendRequest(bankersApp)
})

// initial app render
renderInputs(bankersApp.resources, bankersApp.numProcesses)
render(bankersApp)
