// REVISIÓN OBLIGATORIA ANTES DE PUBLICAR LA APP AGUAMIEL
// Uso:  node revisar-antes-de-publicar.js <carpeta-nueva> <carpeta-publicada>
//   <carpeta-nueva>     = archivos que se van a publicar (Codigo.gs, Index.html y demás .html)
//   <carpeta-publicada> = archivos de la versión que hoy funciona (para comparar)
// Termina con «✅ LISTO PARA PUBLICAR» o con «⛔ NO PUBLICAR» y la lista de fallas.
// Cada error nuevo que aparezca en la app se agrega aquí como una revisión más (ver «REVISIONES»).
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
let acorn;
try { acorn = require(path.join(__dirname, 'acorn.js')); } catch (e) { acorn = require('acorn'); }

const nueva = process.argv[2], base = process.argv[3];
if (!nueva || !base) { console.log('Uso: node revisar-antes-de-publicar.js <carpeta-nueva> <carpeta-publicada>'); process.exit(2); }

const fallas = [], avisos = [];
const leer = (d, f) => { const p = path.join(d, f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; };
const sha1 = t => crypto.createHash('sha1').update(Buffer.from(t, 'utf8')).digest('hex');
const linea = (txt, pos) => txt.slice(0, pos).split('\n').length;

// Bloques <script> internos de un .html (con su posición, para dar el número de línea)
function bloques(html) {
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi, out = []; let m;
  while ((m = re.exec(html))) out.push({ code: m[1].replace(/<\?[\s\S]*?\?>/g, s => '0'.padEnd(s.length, ' ')), ini: m.index + m[0].indexOf(m[1]) });
  return out;
}
// Analiza un código: errores de sintaxis + cada «//» que NO sea comentario (con su tipo)
function analizar(code) {
  const com = [], tok = [];
  let ast;
  try { ast = acorn.parse(code, { ecmaVersion: 2022, allowReturnOutsideFunction: true, allowHashBang: true, onComment: com, onToken: tok }); }
  catch (e) { return { error: e.message, pos: e.pos || 0, barras: [] }; }
  // tramos de plantillas `…` (Google no las entiende bien: un comentario «//» dentro de ${…} también rompe, caso v365)
  const plantillas = []; (function rec(n) { if (!n || typeof n.type !== 'string') return; if (n.type === 'TemplateLiteral') plantillas.push([n.start, n.end]);
    for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(rec); else if (v && typeof v.type === 'string') rec(v); } })(ast);
  const enPlantilla = p => plantillas.some(([a, b]) => p > a && p < b);
  const enCom = p => com.some(c => p >= c.start && p < c.end && !enPlantilla(c.start));   // un comentario dentro de una plantilla `…${}` también rompe
  const tipoEn = p => { for (const t of tok) if (p >= t.start && p < t.end) { const l = t.type.label; return l === 'string' ? 'texto entre comillas' : l === 'template' ? 'plantilla `…`' : l === 'regexp' ? 'expresión regular' : l; } return 'código'; };
  // «//» (v365, v367) y «/*» (v375: accept="audio/*" en una plantilla): Google los toma como comentario aunque estén dentro de un texto.
  const barras = [];
  for (const pat of ['//', '/*']) { let i = -1;
    while ((i = code.indexOf(pat, i + 1)) > -1) {
      if (enCom(i)) continue;
      const a = code.lastIndexOf('\n', i) + 1, b = code.indexOf('\n', i);
      const esCom = com.some(c => i >= c.start && i < c.end);
      barras.push({ pos: i, pat, tipo: esCom ? 'comentario dentro de una plantilla `…${}`' : tipoEn(i), txt: pat + ' ' + code.slice(a, b < 0 ? undefined : b).trim() });
      i++;
    } }
  return { error: null, barras };
}

// ---------------- REVISIONES ----------------
const ARCHIVOS_APP = ['Index.html', 'Catalogo.html', 'Menu.html', 'Utilidades.html', 'Estilos.html', 'Encuesta.html', 'Informe.html', 'Logos.html'];
const htmlNuevos = fs.readdirSync(nueva).filter(f => ARCHIVOS_APP.includes(f) || (/\.html$/i.test(f) && fs.existsSync(path.join(base, f))));
if (!leer(nueva, 'Codigo.gs')) fallas.push('Falta Codigo.gs en ' + nueva);
if (!leer(nueva, 'Index.html')) fallas.push('Falta Index.html en ' + nueva);

// 1) Sintaxis de Codigo.gs (servidor)
const gs = leer(nueva, 'Codigo.gs');
if (gs) { const r = analizar(gs); if (r.error) fallas.push(`Codigo.gs no se puede leer: ${r.error} (línea ${linea(gs, r.pos)})`); }

for (const f of htmlNuevos) {
  const html = leer(nueva, f), viejo = leer(base, f);
  // 2) Sintaxis de cada <script> del .html
  const barrasViejas = new Set();
  if (viejo) bloques(viejo).forEach(b => analizar(b.code).barras.forEach(x => barrasViejas.add(x.txt)));
  bloques(html).forEach(b => {
    const r = analizar(b.code);
    if (r.error) { fallas.push(`${f}: error de sintaxis en un <script>: ${r.error} (línea ${linea(html, b.ini + r.pos)})`); return; }
    // 3) «//» fuera de comentarios: Google (HtmlService) lo toma como comentario y borra el resto de la línea → «La app no pudo arrancar» (v365 y v367)
    r.barras.forEach(x => {
      const donde = `${f} línea ${linea(html, b.ini + x.pos)} (${x.tipo})`;
      if (barrasViejas.has(x.txt)) return;           // ya estaba en la versión que funciona
      fallas.push(x.pat === '/*'
        ? `BARRA-ASTERISCO «/*» nueva en ${donde}: ${x.txt.slice(3, 143)}\n      → Google lo toma como inicio de comentario y la app no arranca (v375). Para accept="audio/*" usar \${MU_ACC('audio')} o la lista de formatos.`
        : `DOBLE BARRA «//» nueva en ${donde}: ${x.txt.slice(3, 143)}\n      → Google borra desde «//» hasta el final de la línea. Usar 'https:' + String.fromCharCode(47, 47), regex [/][/], y textos sin «https://».`);
    });
  });
  // 4) Marcas <? ?> de Google: solo las que ya existían
  const marcas = h => (h.match(/<\?[\s\S]*?\?>/g) || []);
  const mv = new Set(viejo ? marcas(viejo) : []);
  marcas(html).filter(m => !mv.has(m)).forEach(m => fallas.push(`${f}: marca de Google nueva ${m.slice(0, 80)} (revisar que el archivo incluido exista)`));
  // 4b) Números escritos a mano leídos con parseFloat/Number: «1,65» se lee 1 (IMC 62.00, 7-nov). Usar aNum(…) (la coma es decimal).
  const numCrudo = h => new Set((h.match(/(?:parseFloat|Number)\(\s*[^()]*\.value\s*\)[^\n]{0,40}/g) || []).map(s => s.replace(/\s+/g, ' ')));
  const ncViejo = viejo ? numCrudo(viejo) : new Set();
  [...numCrudo(html)].filter(x => !ncViejo.has(x)).forEach(x => fallas.push(`${f}: número leído con parseFloat/Number sin la regla de la coma: ${x.slice(0, 120)}\n      → «1,65» se lee como 1. Usar aNum(campo.value) (Index.html) o agNum.`));
  // 5) Cierre </script> metido dentro de un texto corta el bloque
  if (/['"`][^'"`\n]*<\/script>/i.test(html.replace(/<script[^>]*src=[^>]*><\/script>/gi, ''))) avisos.push(`${f}: hay «</script>» dentro de un texto; escribirlo como '<\\/script>'.`);
}

// 6) Números de versión iguales en todos lados
const idx = leer(nueva, 'Index.html') || '';
const ult = (gs && (gs.match(/var\s+NOVEDADES_ULTIMA\s*=\s*(\d+)/) || [])[1]) || null;
const fal = (idx.match(/FALLAS\s*=\s*\{[^}]*version:\s*'v(\d+)'/) || [])[1] || null;
const maxV = (txt, ini) => { const k = txt.indexOf(ini); if (k < 0) return null; const tramo = txt.slice(k, k + 400000); return String(Math.max(...(tramo.match(/\{\s*v\s*:\s*(\d+)/g) || ['v:0']).map(s => +s.replace(/\D/g, '')))); };
const nIdx = maxV(idx, 'const NOVEDADES = ['), nTg = gs ? maxV(gs, 'var NOVEDADES_TG = [') : null;
const nums = { 'NOVEDADES_ULTIMA (Codigo.gs)': ult, 'FALLAS.version (Index.html)': fal, 'última novedad (Index.html)': nIdx, 'última novedad Telegram (Codigo.gs)': nTg };
const vals = [...new Set(Object.values(nums).filter(Boolean))];
if (vals.length !== 1) fallas.push('Los números de versión no coinciden: ' + JSON.stringify(nums));
const gsBase = leer(base, 'Codigo.gs');
const ultBase = gsBase && (gsBase.match(/var\s+NOVEDADES_ULTIMA\s*=\s*(\d+)/) || [])[1];
if (ult && ultBase && +ult <= +ultBase) avisos.push(`El número nuevo (${ult}) no es mayor que el publicado (${ultBase}).`);

// 7) Funciones que el navegador llama y que no existen en Codigo.gs
if (gs) {
  const llamadas = new Set([...idx.matchAll(/\bgs\(\s*'([A-Za-z0-9]+)'/g)].map(m => m[1]));
  const definidas = new Set([...gs.matchAll(/function\s+([A-Za-z0-9_]+)\s*\(/g)].map(m => m[1]));
  [...llamadas].filter(n => !definidas.has(n)).forEach(n => fallas.push(`Index.html llama gs('${n}') pero esa función no existe en Codigo.gs`));
}

// ---------------- RESULTADO ----------------
console.log('Huellas SHA1 (compararlas después de copiar a la PC):');
['Codigo.gs', ...htmlNuevos].forEach(f => { const t = leer(nueva, f); if (t) console.log('  ' + sha1(t) + '  ' + f); });
console.log('Versión: ' + (vals[0] || '¿?'));
avisos.forEach(a => console.log('⚠️  ' + a));
if (fallas.length) { console.log('\n⛔ NO PUBLICAR. Fallas encontradas: ' + fallas.length); fallas.forEach((x, k) => console.log(` ${k + 1}. ${x}`)); process.exit(1); }
console.log('\n✅ LISTO PARA PUBLICAR (revisión automática). Falta: frases de publicar y de volver atrás, y comprobar «¿Quién eres?» en la /exec.');
