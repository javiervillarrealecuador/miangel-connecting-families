// Script de pruebas unitarias automatizado para verificar la lógica de sugerencias de actividades
// Ejecutar con: node scratch/test_activities_logic.js

// 1. La función getWebhookUrl extraída para pruebas (con parámetro envUrl inyectable)
function getWebhookUrl(type, envUrl = "") {
  const baseUrl = envUrl;
  if (baseUrl && !baseUrl.includes("localhost") && !baseUrl.includes("127.0.0.1")) {
    const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    return type === "test" 
      ? `${cleanBase}/webhook-test/actividades-sugerir` 
      : `${cleanBase}/webhook/actividades-sugerir`;
  }
  return type === "test" 
    ? "/n8n/webhook-test/actividades-sugerir" 
    : "/n8n/webhook/actividades-sugerir";
}

// 2. La función de parseo de respuesta extraída para pruebas
function parseN8nResponse(data) {
  let rawList = [];
  if (data) {
    if (Array.isArray(data)) {
      rawList = data;
    } else if (data.recomendaciones && Array.isArray(data.recomendaciones)) {
      rawList = data.recomendaciones;
    } else if (typeof data === "object" && data !== null) {
      if (Object.keys(data).length > 0 && !data.message) {
        rawList = [data];
      }
    }
  }
  
  return rawList.map(r => {
    let desc = r.descripcion || r.respuesta || "No hay descripción disponible";
    if (Array.isArray(r.pasos) && r.pasos.length > 0) {
      desc += `\n\n📋 Pasos a seguir:\n` + r.pasos.map((p, idx) => `  ${idx + 1}. ${p}`).join("\n");
    }
    if (r.resultado_esperado) {
      desc += `\n\n🎯 Resultado esperado:\n  ${r.resultado_esperado}`;
    }

    return {
      ...r,
      id: r.id || "mock-id",
      nombre: r.nombre || "Estrategia Sugerida",
      descripcion: desc,
      isRecommended: true,
      aiReasoning: r.aiReasoning || r.razon || r.razon_personalizada || "Sugerencia personalizada basada en tu historial."
    };
  });
}

// --- RUNNING TESTS ---
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASÓ: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FALLÓ: ${message}`);
    failedTests++;
  }
}

console.log("=== INICIANDO PRUEBAS AUTOMATIZADAS DE LÓGICA DE ACTIVIDADES ===");

// --- TEST GRUPO 1: getWebhookUrl ---
console.log("\nGrupo 1: Formateo de URL del Webhook (getWebhookUrl)");

// Test 1.1: Sin variable de entorno (vacio) -> debe usar ruta relativa (proxy de Vite)
const url1 = getWebhookUrl("test", "");
assert(url1 === "/n8n/webhook-test/actividades-sugerir", "Debería retornar ruta relativa de pruebas si envUrl está vacío");

const url2 = getWebhookUrl("production", "");
assert(url2 === "/n8n/webhook/actividades-sugerir", "Debería retornar ruta relativa de producción si envUrl está vacío");

// Test 1.2: Con URL localhost -> debe usar ruta relativa para evitar bloqueos de CORS
const url3 = getWebhookUrl("test", "http://localhost:5678");
assert(url3 === "/n8n/webhook-test/actividades-sugerir", "Debería retornar ruta relativa de pruebas si envUrl es localhost (evitar CORS)");

const url4 = getWebhookUrl("production", "http://127.0.0.1:5678/");
assert(url4 === "/n8n/webhook/actividades-sugerir", "Debería retornar ruta relativa de producción si envUrl es 127.0.0.1 (evitar CORS)");

// Test 1.3: Con URL remota real -> debe usar la URL remota completa
const url5 = getWebhookUrl("test", "https://n8n.mi-angel.com");
assert(url5 === "https://n8n.mi-angel.com/webhook-test/actividades-sugerir", "Debería retornar la URL remota de pruebas completa");

const url6 = getWebhookUrl("production", "https://n8n.mi-angel.com/");
assert(url6 === "https://n8n.mi-angel.com/webhook/actividades-sugerir", "Debería retornar la URL remota de producción limpia de barras finales");


// --- TEST GRUPO 2: parseN8nResponse ---
console.log("\nGrupo 2: Parseo de Respuestas de n8n (parseN8nResponse)");

// Test 2.1: Parseo de un array directo
const mockArray = [
  { nombre: "Pintar con esponjas", descripcion: "Usa pintura dactilar y esponjas" }
];
const result1 = parseN8nResponse(mockArray);
assert(result1.length === 1, "Debería parsear un array directo de 1 elemento");
assert(result1[0].nombre === "Pintar con esponjas", "El nombre de la actividad debería coincidir");
assert(result1[0].isRecommended === true, "isRecommended debería ser asignado como true por defecto");

// Test 2.2: Parseo de formato wrapper { recomendaciones: [...] }
const mockWrapper = {
  recomendaciones: [
    { nombre: "Juego de mímica", descripcion: "Imitar animales", pasos: ["Paso A", "Paso B"] },
    { nombre: "Saltar la cuerda", descripcion: "Saltos coordinados" }
  ]
};
const result2 = parseN8nResponse(mockWrapper);
assert(result2.length === 2, "Debería extraer las recomendaciones del objeto contenedor");
assert(result2[0].nombre === "Juego de mímica", "Debería parsear el nombre correcto del primer elemento");
assert(result2[0].descripcion.includes("📋 Pasos a seguir:"), "Debería formatear e incluir la lista de pasos en la descripción");

// Test 2.3: Parseo de un objeto plano único (Fila de base de datos directa)
const mockSingleObject = {
  nombre: "Cerrar los ojos y escuchar",
  descripcion: "Concentración auditiva",
  resultado_esperado: "Tolerar ruidos suaves"
};
const result3 = parseN8nResponse(mockSingleObject);
assert(result3.length === 1, "Debería envolver el objeto único en un array");
assert(result3[0].nombre === "Cerrar los ojos y escuchar", "Debería parsear el nombre de la actividad única");
assert(result3[0].descripcion.includes("🎯 Resultado esperado:"), "Debería incluir el resultado esperado formateado en la descripción");

// Test 2.4: Manejo de datos nulos o mensajes de error vacíos
const result4 = parseN8nResponse(null);
assert(result4.length === 0, "Debería retornar un array vacío si la respuesta es nula");

const result5 = parseN8nResponse({ message: "No goals found" });
assert(result5.length === 0, "Debería retornar un array vacío si la respuesta contiene un mensaje de error/estado sin actividades");

// --- RESUMEN DE RESULTADOS ---
console.log("\n=== RESUMEN DE PRUEBAS ===");
console.log(`Pruebas Exitosas: ${passedTests}`);
console.log(`Pruebas Fallidas: ${failedTests}`);

if (failedTests === 0) {
  console.log("\n✨ ¡TODAS LAS PRUEBAS PASARON CORRECTAMENTE! ✨\n");
  process.exit(0);
} else {
  console.error("\n❌ ALGUNAS PRUEBAS FALLARON. POR FAVOR VERIFICA EL CÓDIGO. ❌\n");
  process.exit(1);
}
