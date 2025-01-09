var testdata = [
    {"_id":"1","_type":"user","name":"nubj","loginpassword":"hello123","usertype":"internal","user_status":"active","description":""},
    {"_id":"2","_type":"resource","name":"Organisation A"},
    {"_id":"3","_type":"user","name":"keema","loginpassword":"sskal","usertype":"internal","user_status":"active","description":"Some notes."},
    {"_id":"4","_type":"resource","name":"Room 32"},
    {"_id":"5","_type":"association","name":"assoc-1","userref":"1","resourceref":"2"},
    {"_id":"6","_type":"association","name":"assoc-2","userref":"3","resourceref":"2"}
]
    

function loadTestdata(){
    data = testdata
    trigger_on_data_mutation()
    id_counter = 6
    console.info(`Testdata loaded.`)
}

function dumpData(){
    let outstr = `model: ${JSON.stringify(model)}
data: ${JSON.stringify(data)}`
    alert(outstr)
}