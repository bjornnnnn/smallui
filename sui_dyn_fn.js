/**
 * sui-dyn-fn contains functionality for dynamic population of forms from data.
 * Two main cases are covered: 
 *  1) Populate e.g. dropdowns with current data allowing for referencing of existing data objects. 
 *  2) Show and hide inputs in a form based on user interactions.
 */

function getUserRefs(){return data.filter(dobj => dobj._type == 'user').map(dobj => [dobj._id, dobj.name]) }
function getResourceRefs(){return data.filter(dobj => dobj._type == 'resource').map(dobj => [dobj._id, dobj.name])}


function populateSelect(selectElem, valList){
    for([val,nm] of valList){
        let opt = document.createElement('option')
        opt.value = val
        opt.innerHTML = nm
        selectElem.appendChild(opt)
    }
}

const initfn = {
    'populateUserref' : function(){populateSelect(document.querySelector("form[id='association'] select[id='userref']"), getUserRefs())},
    'populateResourceref' : function(){populateSelect(document.querySelector("form[id='association'] select[id='resourceref']"), getResourceRefs())},
}