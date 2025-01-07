//@ts-check

/**
 * SMALLUI:
 * A small UI framework for CRUD operations on different data.
 * 
 * Convention: dobj must have a id key named '_id'. This value must never change.
 * 
 * Convention: dobj must have a type key named '_type'. 
 * The value of _type must have a corresponding form named similarily if it is to be updated by human interactions.
 * 
 * Convention: create and update form is identical and identified with key named '_type' in the data object.
 */


// 0: Global Data variables accessible from everywhere.

var data = []
var id_counter = 0


// 1: Utilities

/**
 * Hides a HTML-element by setting its style display to none.
 * @param {string} elemId 
 */
function hideElem(elemId){
    let e = document.getElementById(elemId)
    if (e == null){
        console.error(`No element with id '${elemId}' found in document.`)
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
        console.error(`No element with id '${elemId}' found in document.`)
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
    showListing()
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
        console.info("test_updateData: PASS")
        return true
    } else {
        console.info(`test_updateData: FAIL -> expected ${expected} but got ${dstr} `)
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
        console.error("A new object must have an _id field which is missing here! --> " + JSON.stringify(newObject, null, 2))
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
        console.debug("Create new object")
        data = insertData(data, dobj)
    } else {
        // Existing object, update -->
        console.debug("Update object...")
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

/**
 * 
 * @param {string} formId 
 * @returns {{_id: string, _type: string } | undefined}
 */
function getDOFromFormById(formId){
    /** @type {HTMLFormElement | null} */
    let form  = document.getElementById(formId)
    if (form){
        let fd = new FormData(form)
        let dobj = Object.fromEntries(fd)
        dobj._id = dobj._id ?? -1 
        dobj._type = dobj._type ?? "notype"
        return dobj
    } else {
        console.error(`Form is null (id: ${formId})`)
    }
}

/**
 * 
 * @param {string} formId 
 */
function resetForm(formId){
    /** @type {HTMLFormElement | null} */
    let form  = document.getElementById(formId)
    form ? form.reset() : console.error(`Cannot find form to reset (id: ${formId})`)
}

/**
 * 
 * @param {string} type 
 * @param {string} name 
 * @param {string} value 
 */
function setFormInputValue(type, name, value){

    // Plain input is those that have name and value:
    // Everything but radio.
    /**
     * 
     * @param {string} name 
     * @param {string} value 
     */
    function setPlain(name, value){
        let es = document.getElementsByName(name)
        for(var e of es){
            e.setAttribute("value", value)
        }
    }

    /**
     * 
     * @param {string} name 
     * @param {string} value 
     */
    function setRadio(name, value){
        let es = document.getElementsByName(name)
        for(var e of es){
            // mark the selected option
            if (e.getAttribute("value") == value){
                e.setAttribute("checked", "true")
            } else {
                e.setAttribute("checked", "false")
            }
        }
    }

    if (type == "radio"){
        setRadio(name, value)
    } else {
        setPlain(name, value)
    }
}




/**
 * 
 * @param {string} objId 
 */
function loadForUpdateById(objId){
    // Load data with id anId into the corresponding form. 
    let dobjs = getDataById(data, objId)
    if (dobjs.length == 0){
        console.error(`You cannot load a non existing object into form. (object._id: ${objId})`)
    }
    let dobj = dobjs[0]

    //let form = document.getElementById(dobj._type)
    //form.reset()
    resetForm(dobj._type)

    let keys = Object.keys(dobj)
    for (var k of keys){
        let qInput = `form[id='${dobj._type}'] input[name='${k}']`
        console.debug(`Query for input: ${qInput}`)
        let e = document.querySelector(qInput)

        if (e == null){
            // no input found with name n, look for select as well.
            let qSelect = `form[id='${dobj._type}'] select[name='${k}']`
            console.debug(`Query for input: ${qSelect}`)
            e = document.querySelector(qSelect)

        }

        console.debug(`selected elem: ${e} -> setting ${k}.value:${dobj[k]}`)

        e ? e.setAttribute("value", dobj[k]) : console.error(`Could not find input to set. name: ${k}`)
    }
}

/**
 * 
 * @param {string} formId 
 */
function submitForm(formId){
    let formDObj = getDOFromFormById(formId)
    console.debug(`form data: ${JSON.stringify(formDObj, null, 2)}`)
    formDObj ? upsertData(formDObj) : console.error(`Could not make formDObj from form with id: '${formId}'.`)
}




// 4: OBJECT View

function viewObject(objId){
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
        tbody.appendChild(tr)
    }
}

// 5: OBJECT Listing
// Customize below -->

function showListing(){
    // Custom for site. To be run after all changes made to the model.
    let ul = document.getElementById("namelist")
    ul.innerHTML = ""
    for(var i in data){
        let li = document.createElement("li")
        li.innerHTML = `${data[i].name} is_a ${data[i]._type} <a href="javascript:viewObject('${data[i]._id}')"">View</a> <a href="javascript:loadForUpdateById('${data[i]._id}')"">Update</a> <a href="javascript:deleteById('${data[i]._id}')">Delete</a>`
        ul.appendChild(li)
    }
}






