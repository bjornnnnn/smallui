var testdata = [
    {"_id":"1","_type":"user","name":"nubj","loginpassword":"hello123","usertype":"internal","user_status":"active","description":""},
    {"_id":"2","_type":"resource","name":"Organisation A"}
]

function loadTestdata(){
    data = testdata
    trigger_on_data_mutation()
    id_counter = 2
    console.info(`Testdata loaded.`)
}

function dumpData(){
    let outstr = `model: ${JSON.stringify(model)}
data: ${JSON.stringify(data)}`
    alert(outstr)
}