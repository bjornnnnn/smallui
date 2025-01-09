//@ts-check

/**
 * SMALLUI:
 * A small UI framework for CRUD operations on data objects.
 * 
 * Convention: dobj must have a id key named '_id'. This value must never change.
 * 
 * Convention: dobj must have a type key named '_type'. 
 * The value of _type must have a corresponding form named similarily if it is to be updated by human interactions.
 * 
 * Convention: The same HTML form is used to create and update data objects. The do and form are associated via a key named '_type' in the data object.
 */


// 0: Global Data variables accessible from everywhere.

var data = []
var id_counter = 0

// Model will be populated from HTML at first use
var model = {}


// 1: Utilities

/**
 * The Initialization function that shall be run first thing after the HTML doc has loaded.
 */
function sui_init(){
    initView()
    let forms = document.querySelectorAll("form")
    for (var form of forms){
        resetForm(form.id)
        getModelFromForm(form.id)
    }
    //resetForm("user")
    //getModelFromForm("user")
    //resetForm("resource")
    //getModelFromForm("resource")
    //resetForm("association")
    //getModelFromForm("association")
}

/**
 * Hides a HTML-element by setting its style display to none.
 * @param {string} elemId 
 */
function hideElem(elemId){
    let e = document.getElementById(elemId)
    if (e == null){
        console.error(`SUI: No element with id '${elemId}' found in document.`)
    } else {
        e.setAttribute("style", "display:none")
    }
}

/**
 * Shows a HTML-element by setting its style display to block.
 * @param {string} elemId 
 */
function showElem(elemId){
    let e = document.getElementById(elemId)
    if (e == null){
        console.error(`SUI: No element with id '${elemId}' found in document.`)
    } else {
        e.setAttribute("style", "display:block")
    }}

// Test suite:
function runTests(){
    test_updateData()
}


// 2: DATA

/**
 *  Implement what happends when data is mutated
    E.g. update a view or show an updated list.
    Also the place where to implement database synchronization.
    This function is intended to be customized!
    Call it whenever the global data var is changed. 
 * @param {string=} dataType 
 */
function trigger_on_data_mutation(dataType = undefined){
    hideAllForms()
    showListing()
    showTypes()
}


/**
 * A function returning different ids' upon every call. 
 * @returns {string}
 */
function getId(){
    // This is the simplest seqential id, could be replaced by e.g. UUID or timestamp.
    //console.debug(`getId -> ${id_counter + 1}`)
    return `${++id_counter}`
}

/**
 * 
 * @param {Array<Object>} data 
 * @param {(dataMember: Object) => boolean} findFun 
 * @returns {Array<Object>}
 */
function getData(data, findFun){
    let resultList = []
    for (var e of data){
        if (findFun(e)){resultList.push(e)}
    }
    //console.debug(`getData -> ${JSON.stringify(resultList)}`)
    return resultList
}

/**
 * 
 * @param {Array<Object>} data 
 * @param {string} find_id 
 * @returns {Array<Object>}
 */
function getDataById(data, find_id){
    return (data.filter(a => a._id == find_id))
}

/**
 *  Update by copying everything present in replacementObj to obj.
 *  Thus you can make updates by only presenting changed k:v in the replacementObj.
 *  Non-mutable (returns a copy) 
 * @param {Array<Object>} data 
 * @param {Object} replacementObj 
 * @returns {Array<Object>} list of updated data
 * 
 */
function updateData(data, replacementObj){
    var ndata = JSON.parse(JSON.stringify(data))
    for (var i in ndata){
        if (ndata[i]._id == replacementObj._id){
            let keys = Object.keys(replacementObj)
            for (var k of keys){
                ndata[i][k] = replacementObj[k]
            }
        }
    }
    return ndata
}

function test_updateData(){
    let d = [{_id:"1", val: "1"},{_id:"2", val: "2"}]
    let d2 = updateData(d, {_id: "1", additional_attr: "A"})
    let d3 = updateData(d2, {_id:2, val:"4"})
    d = d3
    let dstr = JSON.stringify(d)
    let expected = '[{"_id":"1","val":"1","additional_attr":"A"},{"_id":2,"val":"4"}]'
    if(dstr == expected){
        console.info("SUI: test_updateData: PASS")
        return true
    } else {
        console.info(`SUI: test_updateData: FAIL -> expected ${expected} but got ${dstr} `)
        return false
    }
}

/**
 * Makes a copy of data and inserts the new object into it. 
 * Non mutable.
 * @param {Array<Object>} data 
 * @param {{_id: string, _type: string }} newObject 
 * @returns {Array<Object>}
 */
function insertData(data, newObject){
    var ndata = JSON.parse(JSON.stringify(data))
    if(newObject["_id"] == undefined){
        console.error("SUI: A new object must have an _id field which is missing here! --> " + JSON.stringify(newObject, null, 2))
    }

    if (newObject["_id"] == "0"){
        newObject["_id"] = getId()
    }

    ndata.push(newObject)
    return ndata
}

/**
 * Mutating update - insert function.
 * @param {{_id: string, _type: string}} dobj 
 */
function upsertData(dobj){
    // Convention: dobj must have an id named '_id'
    // Mutates global object data.
    let objs = getData(data, (function(a){return a._id == dobj._id}))
    if (objs.length == 0){
        // New object, insert -->
        console.debug("SUI: Create new object")
        data = insertData(data, dobj)
    } else {
        // Existing object, update -->
        console.debug("SUI: Update object...")
        data = updateData(data, dobj) 
    }

    trigger_on_data_mutation()
}

/**
 * Mutating delete function. Removes data object identified by objId from global data.
 * @param {string} objId 
 */
function deleteById(objId){
    let ndata = []
    for (var dobj of data){
        if (dobj._id != objId){
            ndata.push(dobj)
        }
    }
    data = ndata
    trigger_on_data_mutation()
}

// 3: FORMS

function getModelFromForm(formId){
    if (formId in model){
        // Do nothing, already has model
    } else {
        model[formId] = getDOFromFormById(formId)
    }
}


/**
 * Convert input in form into data object.
 * @param {string} formId 
 * @returns {{_id: string, _type: string } | undefined}
 */
function getDOFromFormById(formId){
    /** @type {HTMLFormElement | null} */
    let form  = document.getElementById(formId)
    if (form){
        let fd = new FormData(form)
        /** @type {{_id: string, _type: string}} */
        let dobj = Object.fromEntries(fd)
        dobj._id = dobj._id ?? -1 
        dobj._type = dobj._type ?? "notype"
        return dobj
    } else {
        console.error(`Cannot find form. Expecting document to contain a form with id: ${formId}.`)
    }
}

/**
 * Reset form to default state.
 * @param {string} formId 
 */
function resetForm(formId){
    if (formId in model){
        loadForm(model[formId])
    } else {
        console.error(`SUI: Cannot find expected form (id:${formId}) in model.`)
    }
}



/**
 * Load a data object into its corresponding HTML form.
 * @param {Object} dobj 
 */
function loadForm(dobj){
    initView()

    // Check all select in form, populate with dynamic data if attribute sui-init-fn is present:
    let formselects = document.querySelectorAll(`form[id='${dobj._type}'] select`)
    for (var fosel of formselects){
        if (fosel.getAttribute('sui-init-fn')){
            console.debug(`Found sui-init-fn: ${fosel.getAttribute('sui-init-fn')}`)
            fosel.innerHTML = ""
            initfn[fosel.getAttribute('sui-init-fn')]()
        }
    }

    showElem(`${dobj._type}formdiv`)
    /**
     * Special case for radio input assignment.
     * @param {string} qSelect 
     * @param {string} value 
     */
    function setRadioValue(qSelect, value){
        let radioButtons = document.querySelectorAll(qSelect)
        for(var rb of radioButtons){
            if(rb.value == value){
                rb.checked = true
            } else {
                rb.checked = false
            }
        }
    }

    let keys = Object.keys(dobj)
    for (var k of keys){
        let qInput = `form[id='${dobj._type}'] input[name='${k}']`
        let e = document.querySelector(qInput)
        if(e){
            console.debug(`Query for input: ${qInput} (input is INPUT)`)
            // this is input, but it might be a radio button or a checkbox that must be specially treated.
            if (e.getAttribute('type') == 'radio'){
                console.debug(`(input is RADIO)`)
                setRadioValue(qInput, dobj[k])

            } else if(e.getAttribute('type') == 'checkbox'){
                // Especially tricky: Not visible in submit if not checked. Update algorithm cannot handle this.
                console.debug(`(input is CHECKBOX)`)
                if (dobj[k] == 'on'){
                    e.checked = true
                } else {
                    e.checked = false
                }
            } else {
                e.setAttribute("value", dobj[k])
            }

        }

        if (e == null){
            // no input found with name n, look for select as well.
            let qSelect = `form[id='${dobj._type}'] select[name='${k}'] `
            e = document.querySelector(qSelect)
            if(e){
                console.debug(`Query for input: ${qSelect} (input is SELECT)`)
                e.value = dobj[k]
            }
        } 

        if (e == null) {
            // e is still not found. Look for textArea.
            let qTA = `form[id='${dobj._type}'] textarea[name='${k}']`
            e = document.querySelector(qTA)
            if (e){
                e.innerHTML = dobj[k]
                console.debug(`Query for input: ${qTA} (input is TEXTAREA)`)
            }
        }

        e ? console.debug(`selected elem: ${e} -> ${k}.value: ${dobj[k]}`) : console.error(`Could not find input to set!. name: ${k}`)
    }
}

/**
 * 
 * @param {string} objId 
 */
function loadFormWithObjById(objId){
    // Load data with id anId into the corresponding form. 
    let dobjs = getDataById(data, objId)
    if (dobjs.length == 0){
        console.error(`SUI: You cannot load a non existing object into form. (object._id: ${objId})`)
    }
    let dobj = dobjs[0]
    loadForm(dobj)
}

/**
 * 
 * @param {string} formId 
 */
function submitForm(formId){
    let formDObj = getDOFromFormById(formId)
    console.debug(`SUI: form data: ${JSON.stringify(formDObj, null, 2)}`)
    formDObj ? upsertData(formDObj) : console.error(`Could not make formDObj from form with id: '${formId}'.`)
}

function showDefaultForm(formId){
    initView()
    resetForm(formId)
    showElem(`${formId}formdiv`)
}

function hideAllForms(){
    let formdivs = document.querySelectorAll(".formdiv")
    for (var f of formdivs){
        if (f != null){
            hideElem(f.id)
        }
    }
}


function initView(){
    hideAllForms()
    hideObjectView()
}

// 4: OBJECT View

function hideObjectView(){
    hideElem('objectViewDiv')
}

function viewObject(objId){
    initView()
    let tbody = document.getElementById("objectViewTBody")
    tbody ? tbody.innerHTML = "" : console.error("Could not find element with id 'objectViewTBody' in document.")
    let obj = getDataById(data, objId)[0]
    let keys = Object.keys(obj)
    for (var k of keys){
        let tr = document.createElement("tr")
        let td1 = document.createElement("td")
        td1.setAttribute("class", "tablekeycell")
        td1.innerHTML = k
        tr.appendChild(td1)
        let td2 = document.createElement("td")
        td2.setAttribute("class", "tablevaluecell")
        td2.innerHTML = obj[k]
        tr.appendChild(td2)
        tbody ? tbody.appendChild(tr) : console.error(`Cannot add node to non existent tbody.`)
    }
    showElem('objectViewDiv')
}

// 5: OBJECT Listing
// Customize below -->

/**
 * List all data objects.
 */
function showListing(){
    // Custom for site. To be run after all changes made to the model.
    let ul = document.getElementById("namelist")
    ul ? ul.innerHTML = "" : console.error(`UL is null.`)
    for(var i in data){
        let li = document.createElement("li")
        li.innerHTML = `${data[i].name} is_a ${data[i]._type} <a href="javascript:viewObject('${data[i]._id}')"">View</a> <a href="javascript:loadFormWithObjById('${data[i]._id}')"">Update</a> <a href="javascript:deleteById('${data[i]._id}')">Delete</a>`
        ul ? ul.appendChild(li) : console.error(`Cannot append child to nonexistent UL.`)
    }
}

// 6: type listing

function showTypes(){
    let ul = document.getElementById('listoftypes')
    ul ? ul.innerHTML = "" : console.error("Expected but failed to find ul with id 'listoftypes' in document!")
    let dts = Object.keys(model)
    for (var dt of dts){
        let li = document.createElement('li')
        li.innerHTML = `<a href='javascript:showDefaultForm("${dt}")'>${dt}</a>`
        ul?.appendChild(li)
    }
}






