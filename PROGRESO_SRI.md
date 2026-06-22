# Estado del proyecto — Facturación SRI
Última actualización: 2026-06-19

---

## ✅ RESUELTO

### 1. Deploy Vercel — TypeScript build errors
- `Dashboard.tsx` estaba truncado (línea 3070, mid-string literal)
- Causa: PowerShell `Out-File` corrompe UTF-8 al escribir archivos
- Fix: script Node.js `fix_final.js` usando `git show 46db91f:` como base limpia
- Commit: `0894ddb` → `110aa23` (en Vercel)
- **Regla permanente: NUNCA usar PowerShell para parchear archivos. Siempre Node.js con `fs.writeFileSync(..., 'utf8')`**

### 2. Tildes/ñ desaparecidos de la UI
- Misma causa: PowerShell + Out-File
- Fix: mismo script `fix_final.js`

### 3. Campo "Secuencial Desde" en configuración SRI
- Agregado en Dashboard.tsx: estado `sriSecuencialInicio`, carga desde `sri_document_sequence`, guarda vía RPC `sri_set_secuencial`
- Commit: `0894ddb`

### 4. issuerName RFC 2253 incorrecto (rompía firmas)
- Un commit anterior (`a859d3d`) revirtió el orden del issuerName e introdujo encoding hex para OIDs desconocidos → FIRMA INVALIDA
- Fix: `fix_issuername.js` — revertido al formato original
- Commit: `a17619e`
- Formato correcto: `serialNumber=...,C=EC,O=...,OU=...,CN=...` (orden del certificado, sin invertir)

---

## 🔴 PENDIENTE — Error 39 FIRMA INVALIDA

### Estado actual del diagnóstico

**Probado con .p12 del DISCO (C:\DESCARGAS NUEVAS\...):**
- test_invoice_full.js → SRI: **RECIBIDA** ✓ (firma válida)
- Autorización: ESTABLECIMIENTO CERRADO (estab 001-001 no registrado en SRI, pero firma OK)

**Probado con .p12 de SUPABASE:**
- test_sb_p12.js → SRI: **RECIBIDA** ✓ (firma válida en recepción)
- Autorización: FIRMA INVALIDA ✗
- **PERO**: el test tenía datos inconsistentes — la `invoice_auth` guardada tiene clave con estab=001-001, pero el restaurante en Supabase (por restaurant_id) tiene `sri_estab=008, sri_pto_emi=101`. El XML decía 008-101 pero la clave decía 001-001 → SRI rechaza

### Próximo paso — ejecutar al retomar

```powershell
# Forzar clave nueva (consistente con estab/pto actual del restaurante)
(Get-Content C:\RESTAURANTES\test_sb_p12.js -Raw).Replace('let clave=o.invoice_auth;','let clave=null;') | Set-Content C:\RESTAURANTES\test_sb_p12.js -NoNewline
node test_sb_p12.js
```

**Resultados posibles:**
| Resultado autorización | Conclusión |
|---|---|
| AUTORIZADO | Firma OK, problema anterior era dato inconsistente. ¡Resuelto! |
| ESTABLECIMIENTO CERRADO | Firma OK, pero el estab 008-101 no está registrado en SRI |
| FIRMA INVALIDA | El p12 de Supabase sí tiene un problema real de firma |

### Si resultado = ESTABLECIMIENTO CERRADO
- Verificar en el portal SRI qué establecimientos están habilitados para RUC 0401200241001
- Actualizar `sri_estab` y `sri_pto_emi` en Supabase con los valores correctos
- Los valores deben coincidir con lo registrado en el SRI

### Si resultado = FIRMA INVALIDA
- Comparar bytes del p12 de Supabase vs disco
- Posible corrupción al subir el archivo desde la UI
- Solución: re-subir el .p12 desde el Dashboard

---

## ⚠️ DATO IMPORTANTE — Dos registros de restaurante

Al consultar por nombre: `sri_estab=002, sri_pto_emi=002`  
Al consultar por `restaurant_id=0ba94c7b-5e69-4191-9d92-1a2a8590b87f` (el del pedido): `sri_estab=008, sri_pto_emi=101`

Puede haber dos registros del mismo restaurante en la tabla `restaurants`. Verificar cuál es el correcto.

---

## Archivos de diagnóstico en C:\RESTAURANTES

| Archivo | Qué hace |
|---|---|
| `test_cert.js` | Verifica que el certificado del .p12 de Supabase está intacto |
| `test_pwd.js` | Confirma contraseña y p12 en Supabase |
| `test_invoice_full.js` | Firma con .p12 del DISCO y envía al SRI |
| `test_sb_p12.js` | Firma con .p12 de SUPABASE y envía al SRI |
| `test_autorizar.js` | Consulta autorización de una clave de acceso específica |

---

## Commits del repo (C:\RESTAURANTES)

```
a17619e  fix: revertir issuerName a formato original que SRI acepta  ← ÚLTIMO NUESTRO
a859d3d  fix: alinear issuerName RFC 2253  ← ESTE ROMPÍA LA FIRMA
4c2b4e5  fix: normalizar unsignedXml a LF (OK, mantener)
40ddf1d  fix: normalizar fines de linea LF
110aa23  fix: campo secuencial desde en SRI, archivo completo sin truncar
07b2c19  feat: campo secuencial inicio en settings SRI
```

---

## Credenciales de referencia

- **Supabase URL**: `https://firophcgqwhmhztgcxqi.supabase.co`
- **Service role key**: `YOUR_SUPABASE_SERVICE_ROLE_KEY`
- **RUC Q' Riko!**: `0401200241001`
- **restaurant_id del pedido**: `0ba94c7b-5e69-4191-9d92-1a2a8590b87f`
- **Pedido de prueba**: `e3283e89-6e65-4a24-9c51-3de645fb0e71`
- **.p12 en disco**: `C:\DESCARGAS NUEVAS\997515524593512350360116819.p12`
- **Contraseña p12**: `Fiama97324582@@`
