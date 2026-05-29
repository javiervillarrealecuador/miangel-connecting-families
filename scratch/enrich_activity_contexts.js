import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Definition of the new micro-contexts and their trigger keywords
const contextRules = [
  {
    context: 'restaurante',
    keywords: ['restaurante', 'comer', 'comida', 'alimento', 'menú', 'plato', 'mesero', 'cubierto', 'sentado', 'espera']
  },
  {
    context: 'comedor',
    keywords: ['comedor', 'comer', 'almuerzo', 'desayuno', 'cena', 'comida', 'cubierto', 'nutrición']
  },
  {
    context: 'dormitorio',
    keywords: ['dormitorio', 'dormir', 'sueño', 'cama', 'vestir', 'pijama', 'despertar', 'relajación', 'nocturna', 'rutina diaria']
  },
  {
    context: 'peluquería',
    keywords: ['peluquería', 'cabello', 'corte', 'pelo', 'tijeras', 'máquina', 'peine', 'peinar']
  },
  {
    context: 'dentista',
    keywords: ['dentista', 'diente', 'cepillado', 'cepillar', 'boca', 'bucal', 'médico', 'revisión']
  },
  {
    context: 'consultorio_médico',
    keywords: ['médico', 'doctor', 'clínica', 'revisión', 'inyección', 'vacuna', 'pediatra', 'chequeo']
  },
  {
    context: 'fiesta_infantil',
    keywords: ['fiesta', 'cumpleaños', 'celebración', 'invitado', 'juego cooperativo', 'pares', 'grupo', 'amigo', 'social', 'escondidas', 'turnos', 'música', 'baile']
  },
  {
    context: 'terraza',
    keywords: ['terraza', 'patio', 'balcón', 'exterior', 'jardín', 'aire libre']
  },
  {
    context: 'patio',
    keywords: ['patio', 'jardín', 'jugar fuera', 'aire libre', 'correr', 'pelota', 'exterior']
  },
  {
    context: 'finca',
    keywords: ['finca', 'campo', 'granja', 'animal', 'tierra', 'naturaleza', 'lodo', 'arena', 'agua']
  },
  {
    context: 'campo',
    keywords: ['campo', 'bosque', 'naturaleza', 'senderismo', 'caminar', 'aire libre']
  },
  {
    context: 'automóvil',
    keywords: ['auto', 'automóvil', 'carro', 'vehículo', 'viaje', 'viajar', 'cinturón', 'vibración']
  },
  {
    context: 'transporte_público',
    keywords: ['autobús', 'bus', 'metro', 'tren', 'transporte', 'público', 'multitud', 'parada']
  },
  {
    context: 'aeropuerto',
    keywords: ['aeropuerto', 'avión', 'viaje', 'espera', 'fila', 'equipaje', 'seguridad']
  },
  {
    context: 'supermercado',
    keywords: ['supermercado', 'tienda', 'comprar', 'compra', 'carrito', 'pago', 'cajero', 'dinero', 'mall', 'centro comercial']
  },
  {
    context: 'planetario',
    keywords: ['planetario', 'proyecciones', 'domo', 'universo', 'estrella', 'constelación', 'oscuridad']
  },
  {
    context: 'parque_trampolines',
    keywords: ['trampolín', 'brincar', 'saltar', 'rebote', 'rebotar', 'gimnasio de trampolines', 'colisión']
  },
  {
    context: 'autolavado',
    keywords: ['autolavado', 'car wash', 'lavado de auto', 'rodillo', 'chorro', 'cepillo gigante']
  },
  {
    context: 'jardín_botánico',
    keywords: ['jardín botánico', 'invernadero', 'planta', 'orquídea', 'sendero', 'humedad', 'olor a planta']
  },
  {
    context: 'zoológico_contacto',
    keywords: ['zoológico de contacto', 'petting zoo', 'granja escuela', 'acariciar', 'pelaje', 'pluma', 'animal', 'establo']
  },
  {
    context: 'arcade',
    keywords: ['arcade', 'videojuego', 'salón de juego', 'maquinita', 'pantalla', 'fichas', 'consola']
  },
  {
    context: 'juguetería',
    keywords: ['juguetería', 'juguete', 'lego', 'tienda de juguete', 'estante', 'muñeca', 'carrito']
  },
  {
    context: 'heladería',
    keywords: ['heladería', 'helado', 'sabor', 'cono', 'vasito', 'chispas', 'frío', 'fresa', 'vainilla', 'chocolate']
  },
  {
    context: 'tienda_cómics',
    keywords: ['cómics', 'manga', 'juego de mesa', 'tienda de cómics', 'figuras de acción', 'cartas', 'rol']
  },
  {
    context: 'evento_formal',
    keywords: ['boda', 'bautizo', 'evento formal', 'matrimonio', 'etiqueta', 'camisa dura', 'vestido formal', 'ceremonia', 'banquete']
  },
  {
    context: 'pijama_party',
    keywords: ['pijama party', 'dormir fuera', 'pijama', 'saco de dormir', 'noche de amigos', 'conversación nocturna']
  },
  {
    context: 'campamento',
    keywords: ['campamento', 'carpa', 'tienda de campaña', 'fogata', 'bosque', 'camping', 'insectos']
  },
  {
    context: 'barco',
    keywords: ['barco', 'ferry', 'lancha', 'bote', 'mar', 'ola', 'chaleco salvavidas', 'navegación']
  },
  {
    context: 'ascensor',
    keywords: ['ascensor', 'elevador', 'subir piso', 'bajar piso', 'botón de ascensor', 'espacio cerrado', 'ingravidez']
  },
  {
    context: 'escalera_mecánica',
    keywords: ['escalera mecánica', 'escalera eléctrica', 'escalón en movimiento', 'sensor', 'coordinación visomotora']
  },
  {
    context: 'piscina_pelotas',
    keywords: ['piscina de pelotas', 'alberca de pelotas', 'pelotas de colores', 'contención táctil', 'sumergirse']
  },
  {
    context: 'huerto',
    keywords: ['huerto', 'sembrar', 'pala', 'regadera', 'semilla', 'cultivar', 'cosechar', 'tierra húmeda']
  },
  {
    context: 'pista_hielo',
    keywords: ['pista de hielo', 'patinaje sobre hielo', 'patines', 'deslizamiento', 'caídas', 'patinar']
  }
];

function analyzeTextForContexts(nombre, descripcion, existingContexts = []) {
  const text = `${nombre} ${descripcion}`.toLowerCase();
  const added = new Set(existingContexts.map(c => c.trim().toLowerCase()));

  for (const rule of contextRules) {
    for (const keyword of rule.keywords) {
      if (text.includes(keyword)) {
        added.add(rule.context);
        break; // Match found for this context, move to next context
      }
    }
  }

  return Array.from(added).sort();
}

async function enrichContexts() {
  console.log("Fetching all activities from Supabase...");
  const { data: activities, error } = await supabase
    .from('actividades')
    .select('id, nombre, descripcion, contextos_validos');

  if (error) {
    console.error("Error fetching activities:", error);
    return;
  }

  console.log(`Analyzing ${activities.length} activities...`);
  
  let updatedCount = 0;

  for (const act of activities) {
    const original = act.contextos_validos || [];
    const enriched = analyzeTextForContexts(act.nombre, act.descripcion, original);
    
    // Only update if new contexts were actually added
    if (JSON.stringify(original.sort()) !== JSON.stringify(enriched)) {
      const { error: updateError } = await supabase
        .from('actividades')
        .update({ contextos_validos: enriched })
        .eq('id', act.id);

      if (updateError) {
        console.error(`Error updating activity ID ${act.id} (${act.nombre}):`, updateError);
      } else {
        updatedCount++;
        console.log(`Enriched "${act.nombre}": [${original.join(', ')}] -> [${enriched.join(', ')}]`);
      }
    }
  }

  console.log(`\n=== ENRICHMENT COMPLETE ===`);
  console.log(`Enriched and updated ${updatedCount} activities with specific micro-contexts.`);
}

enrichContexts();
