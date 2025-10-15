let contentType = '';
let fileName = '';
const formatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

// function to return CSV data

export const getCSV = (measurements: any,includeFields: any) => {
    let content = '';
    let rows = '';
    let csvrows:any=[];
    contentType = 'text/csv';
    fileName = 'measurements.csv';
    
    // Generate CSV headers
    const headers = ['SensorId', includeFields.title?'Title':null, includeFields.value?'Value':null,includeFields.unit?'Unit':null,includeFields.timestamp?'Timestamp':null];
  
    // Generate CSV rows
        measurements.map((measure:any)=>{
           measure.map((m:any)=>{
              rows = [m.sensorId,includeFields.title?m.title:null,includeFields.value?m.value:null,includeFields.unit?m.unit:null,includeFields.timestamp?formatter.format(new Date(m.time)):null].join(',')
              csvrows.push(rows);
          })
          
        })
        const utf8BOM = '\uFEFF';
        content = utf8BOM + [headers.join(','), ...csvrows].join('\n');
        return({content,fileName,contentType});
}

// function to return JSON data
export const getJSON = (measurements: any,includeFields: any) => {
    let content = '';
    contentType = 'application/json';
    fileName = 'measurements.json';
    
    // Generate JSON rows
    // Create a properly filtered JSON structure based on includeFields
    const filteredMeasurements:any = [];
    
    measurements.forEach((measureGroup: any) => {
      const groupData:any = [];
      
      measureGroup.forEach((m: any) => {
        // Create an object with only the requested fields
        const filteredItem: any = {};
        
        // Always include sensorId as it's a key identifier
        filteredItem.sensorId = m.sensorId;
        
        // Add optional fields based on user selection
        if (includeFields.title) filteredItem.title = m.title;
        if (includeFields.value) filteredItem.value = m.value;
        if (includeFields.unit) filteredItem.unit = m.unit;
        if (includeFields.timestamp) filteredItem.timestamp = formatter.format(new Date(m.time));
        
        groupData.push(filteredItem);
      });
      
      if (groupData.length > 0) {
        filteredMeasurements.push(groupData);
      }
    });
    
    // Pretty-print the JSON with 2-space indentation
    content = JSON.stringify(filteredMeasurements, null, 2);
    return({content,fileName,contentType});
}

// function to return text data

export const getTXT = (measurements: any,includeFields: any) => {
    let content = '';
    let rows = '';
    let textrows:any=[];
    fileName = 'measurements.txt';
    contentType = 'text/plain';
    measurements.map((measure:any)=>{
        measure.map((m:any)=>{
            rows = `SensorId: ${m.sensorId}\n`
            if(includeFields.title){
                rows += `Title: ${m.title}\n`
            }
            if(includeFields.value){
                rows += `Value: ${m.value}\n`
            }
            if(includeFields.unit){
                rows += `Unit: ${m.unit}\n`
            }
            if(includeFields.timestamp){
                rows += `Timestamp: ${formatter.format(new Date(m.time))}\n`
            }
            rows += `\n`
            textrows.push(rows)
        })
    })
    content = textrows.join('\n');
    return({content,fileName,contentType});
}