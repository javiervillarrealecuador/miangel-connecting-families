import fs from 'fs';

const sqlPath = 'c:\\Users\\LENOVO\\OneDrive - Universidad Politécnica Estatal del Carchi\\PUBLICA\\BACK EMPRESAS\\CLASES\\4. MARKETING DIGITAL\\CURSO LABORA IA\\miangel-connecting-families\\INSERT_115_FINAL_DEFINITIVO.sql';

function analyzeMotor() {
  const content = fs.readFileSync(sqlPath, 'utf-8');
  const lines = content.split('\n');
  const motorActivities = [];
  
  for (const line of lines) {
    if (line.trim().startsWith('INSERT INTO actividades')) {
      const match = line.match(/VALUES\s*\((.*)\);?\s*$/i);
      if (match) {
        const valuesStr = match[1];
        const values = [];
        let current = '';
        let inQuotes = false;
        let inArray = false;
        
        for (let i = 0; i < valuesStr.length; i++) {
          const char = valuesStr[i];
          if (char === "'" && (i === 0 || valuesStr[i-1] !== '\\')) {
            inQuotes = !inQuotes;
            current += char;
          } else if (char === '[' && !inQuotes) {
            inArray = true;
            current += char;
          } else if (char === ']' && !inQuotes) {
            inArray = false;
            current += char;
          } else if (char === ',' && !inQuotes && !inArray) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        if (current) values.push(current.trim());
        
        const nombre = cleanVal(values[0]);
        const area = cleanVal(values[4]);
        
        if (area === 'Motor') {
          motorActivities.push(nombre);
        }
      }
    }
  }
  
  console.log("Motor activities in file:", motorActivities);
}

function cleanVal(str) {
  if (!str) return null;
  let val = str.trim();
  if (val.toLowerCase() === 'null') return null;
  if (val.startsWith("'") && val.endsWith("'")) {
    val = val.substring(1, val.length - 1);
  }
  return val;
}

analyzeMotor();
