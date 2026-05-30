import fs from 'fs';
import path from 'path';

const sqlPath = 'c:\\Users\\LENOVO\\OneDrive - Universidad Politécnica Estatal del Carchi\\PUBLICA\\BACK EMPRESAS\\CLASES\\4. MARKETING DIGITAL\\CURSO LABORA IA\\miangel-connecting-families\\INSERT_115_FINAL_DEFINITIVO.sql';

function parseSqlValues(valuesStr) {
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
  if (current) {
    values.push(current.trim());
  }
  return values;
}

function parseSqlArray(str) {
  if (!str) return [];
  if (str.toLowerCase() === 'null') return [];
  const match = str.match(/ARRAY\s*\[(.*)\]/i);
  if (match) {
    const itemsStr = match[1];
    const items = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < itemsStr.length; i++) {
      const char = itemsStr[i];
      if (char === "'" && (i === 0 || itemsStr[i-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        items.push(cleanVal(current));
        current = '';
      } else {
        current += char;
      }
    }
    if (current) {
      items.push(cleanVal(current));
    }
    return items.filter(x => x !== null && x !== '');
  }
  
  const cleaned = cleanVal(str);
  if (cleaned) {
    return [cleaned];
  }
  return [];
}

function cleanVal(str) {
  if (!str) return null;
  let val = str.trim();
  if (val.toLowerCase() === 'null') return null;
  if (val.startsWith("'") && val.endsWith("'")) {
    val = val.substring(1, val.length - 1);
  }
  val = val.replace(/''/g, "'");
  return val;
}

function parseBool(str) {
  const cleaned = cleanVal(str);
  if (cleaned === null) return false;
  return cleaned.toLowerCase() === 'true';
}

function parseNum(str) {
  const cleaned = cleanVal(str);
  if (cleaned === null) return null;
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

function testParse() {
  console.log("Reading SQL file...");
  const content = fs.readFileSync(sqlPath, 'utf-8');
  const lines = content.split('\n');
  
  console.log(`Total lines in file: ${lines.length}`);
  let insertStatementCount = 0;
  let parsedCount = 0;
  
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (line.trim().startsWith('INSERT INTO actividades')) {
      insertStatementCount++;
      try {
        const match = line.match(/VALUES\s*\((.*)\);?\s*$/i);
        if (!match) {
          console.warn(`Line ${idx + 1} starts with INSERT but VALUES regex did not match!`);
          continue;
        }
        
        const valuesStr = match[1];
        const rawValues = parseSqlValues(valuesStr);
        
        if (rawValues.length < 51) {
          console.error(`Line ${idx + 1} parsed only ${rawValues.length} columns instead of 51!`);
          continue;
        }
        
        parsedCount++;
      } catch (err) {
        console.error(`Exception parsing line ${idx + 1}:`, err);
      }
    }
  }
  
  console.log(`Found ${insertStatementCount} INSERT statements.`);
  console.log(`Parsed ${parsedCount} statements successfully.`);
}

testParse();
